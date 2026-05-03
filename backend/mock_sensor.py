import time
import numpy as np

class MockSensorGenerator:
    """
    Simulates thermal readings for the ThermoTwin project.
    Models simple heating/cooling physics with Gaussian noise.
    """
    def __init__(self, initial_temp=38.0, setpoint=24.0):
        # Initialize 4 sensors at the default ambient temperature
        self.sensor_ids = ["S1", "S2", "S3", "S4"]
        self.temps = {s_id: initial_temp for s_id in self.sensor_ids}
        self.setpoint = setpoint
        
        # Physics constants
        self.heating_rate = 0.3   # °C per step when AC is off
        self.cooling_constant = 0.2  # Stronger decay so AC always wins near setpoint
        self.noise_std = 0.1   # Slightly tighter noise
        
    def generate_reading(self, controls):
        """
        Calculates the next state based on control inputs and returns JSON-formatted data.
        
        Args:
            controls (dict): {
                "ac_on": bool,
                "solar_intensity": float (0.0 to 1.0),
                "occupancy": bool
            }
        """
        ac_on = controls.get("ac_on", False)
        solar_intensity = controls.get("solar_intensity", 1.0)
        occupants_count = controls.get("occupants_count", 0)
        # Per-seat occupancy: [driver, passenger, rear-left, rear-right]
        # Falls back to first N seats occupied if array not provided
        occ_arr = controls.get("occupancy_array", None)
        if occ_arr is None:
            # Backwards compat: fill front seats first
            occ_arr = [True] * min(occupants_count, 4) + [False] * max(0, 4 - occupants_count)

        # Dynamically update setpoint from UI controls
        if "setpoint" in controls:
            self.setpoint = controls["setpoint"]

        # Sensor → seat mapping
        seat_map = {"S1": 0, "S2": 1, "S3": 2, "S4": 3}
        # Solar hits front cabin harder (windshield, dashboard radiation)
        solar_factor = {"S1": 1.0, "S2": 1.0, "S3": 0.6, "S4": 0.6}

        for s_id in self.sensor_ids:
            current_temp = self.temps[s_id]
            seat_idx = seat_map[s_id]
            is_occupied = bool(occ_arr[seat_idx]) if seat_idx < len(occ_arr) else False

            # Per-sensor heat load
            solar_heating = self.heating_rate * solar_intensity * solar_factor[s_id]
            human_heating = 0.08 if is_occupied else 0.0  # body heat only from occupied seats

            if not ac_on:
                self.temps[s_id] += solar_heating + human_heating
            else:
                diff = current_temp - self.setpoint
                if diff > 0:
                    # AC actively cools — cooling force must always beat incoming heat
                    net_cooling = diff * self.cooling_constant
                    # Solar/human add only a tiny trace when AC is blasting (3% penetration)
                    net_heat = (solar_heating + human_heating) * 0.03
                    self.temps[s_id] -= (net_cooling - net_heat)
                    # Hard clamp: never let AC overshoot below setpoint
                    self.temps[s_id] = max(self.temps[s_id], self.setpoint)
                else:
                    # At or below setpoint: AC idles, only minimal residual heat
                    self.temps[s_id] += (solar_heating + human_heating) * 0.08
                    # Soft clamp: don't drift more than 0.5°C above setpoint while idling
                    self.temps[s_id] = min(self.temps[s_id], self.setpoint + 0.5)
                
            # Add Gaussian noise for realism
            noise = np.random.normal(0, self.noise_std)
            noisy_value = self.temps[s_id] + noise
            
            # Update internal state with "clean" value (physics), 
            # but reading returns the "noisy" value.
            # In some simulations, noise is added only to the output.
            # We'll keep the internal state clean to avoid random walk drift.
            
        return {
            "timestamp_ms": int(time.time() * 1000),
            "sensors": [
                {
                    "id": s_id,
                    "value": round(self.temps[s_id] + np.random.normal(0, self.noise_std), 2),
                    "valid": True
                }
                for s_id in self.sensor_ids
            ],
            "metadata": {
                "ac_status": "ON" if ac_on else "OFF",
                "ambient_target": self.setpoint
            }
        }

if __name__ == "__main__":
    # Quick standalone test
    generator = MockSensorGenerator()
    
    print("--- AC OFF (Heating) ---")
    for _ in range(5):
        print(generator.generate_reading({"ac_on": False, "solar_intensity": 1.0}))
        
    print("\n--- AC ON (Cooling) ---")
    for _ in range(5):
        print(generator.generate_reading({"ac_on": True, "solar_intensity": 0.5}))
