from data_preprocessor import ReadingPreprocessor
from kalman_filter_module import ThermodynamicFilter
from rc_thermal_model import SeltosThermalModel

class DigitalTwin:
    """
    Core engine of the ThermoTwin system.
    Integrates real-time sensor data, Kalman filtering, and RC thermal physics.
    """
    def __init__(self):
        self.preprocessor = ReadingPreprocessor()
        self.physics_model = SeltosThermalModel()
        
        # 3 Kalman Filters for the 3 zones
        self.filters = {
            "Z1": ThermodynamicFilter(),
            "Z2": ThermodynamicFilter(),
            "Z3": ThermodynamicFilter()
        }
        
        # Internal state tracking
        self.current_state = {}
        self.last_env = {
            "ambient_temp": 35.0,
            "solar_intensity": 0.5,
            "occupants_count": 1,
            "ac_status": False
        }

    def run_step(self, raw_sensor_data, user_controls):
        """
        Executes one iteration of the Digital Twin loop.
        """
        # 1. Preprocess raw S1-S4 data into Z1-Z3 zones
        processed = self.preprocessor.preprocess_readings(raw_sensor_data)
        timestamp = processed["timestamp_ms"]
        self.last_env.update(user_controls)
        
        zones_data = {}
        predictions_data = {}
        divergence_detected = False
        
        for zone_id, sensor_value in processed["zones"].items():
            # 2. Get Physics Prediction (Expected state)
            # We use the previous filtered temperature as the starting point for physics
            prev_temp = self.current_state.get(zone_id, {}).get("current_temp", sensor_value)
            physics_prediction = self.physics_model.predict_next_state(
                prev_temp, self.last_env, dt=2
            )
            
            # 3. Get Kalman Estimate (Smoothed reality)
            kalman_result = self.filters[zone_id].predict_and_update(sensor_value)
            filtered_temp = kalman_result["temp"]
            
            # 4. Calculate Residual and Divergence
            residual = round(filtered_temp - physics_prediction, 2)
            divergence = abs(residual) > 3.0
            if divergence:
                divergence_detected = True
            
            # 5. Future Projections (30s, 60s, 120s)
            # steps = seconds / dt
            future_temps = self.physics_model.predict_ahead(
                filtered_temp, self.last_env, steps=60, dt=2
            )
            
            zones_data[zone_id] = {
                "current_temp": filtered_temp,
                "residual": residual,
                "divergence": divergence
            }
            
            predictions_data[zone_id] = {
                "30s": future_temps[14],  # 15th step at 2s/step
                "60s": future_temps[29],  # 30th step
                "120s": future_temps[59]  # 60th step
            }
            
        self.current_state = {
            "timestamp_ms": timestamp,
            "zones": zones_data,
            "predictions": predictions_data,
            "system_status": "DIVERGED" if divergence_detected else "STABLE"
        }
        
        return self.current_state

    def get_full_state(self):
        """
        Returns the latest calculated state of the Digital Twin.
        """
        return self.current_state

if __name__ == "__main__":
    # Integration Test
    twin = DigitalTwin()
    
    # Mock data stream
    from mock_sensor import MockSensorGenerator
    generator = MockSensorGenerator()
    
    controls = {"ac_on": True, "solar_intensity": 0.8, "occupants_count": 2, "ambient_temp": 38.0}
    
    print("Running Digital Twin Integration Test...")
    for i in range(10):
        raw = generator.generate_reading(controls)
        state = twin.run_step(raw, controls)
        
        if i % 3 == 0:
            print(f"\nStep {i} State:")
            print(f"Status: {state['system_status']}")
            print(f"Z1 Temp: {state['zones']['Z1']['current_temp']} (Residual: {state['zones']['Z1']['residual']})")
            print(f"Z1 Prediction (120s): {state['predictions']['Z1']['120s']}")
