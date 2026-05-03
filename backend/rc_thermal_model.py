class SeltosThermalModel:
    """
    RC Thermal Model for a Kia Seltos cabin.
    Uses an RC circuit analogy where:
    - R: Thermal Resistance (K/W)
    - C: Thermal Capacitance (J/K)
    """
    def __init__(self):
        # Approximated constants for a mid-size SUV (Kia Seltos)
        self.R = 0.005  # Thermal resistance of cabin insulation (K/W)
        self.C = 40000  # Thermal capacitance of cabin air + materials (J/K)
        
        # Power constants
        self.Q_ac_power = 14000.0   # Watts of cooling power from AC
        self.Q_solar_max = 800.0   # Max Watts from solar radiation
        self.Q_occupant = 75.0     # Watts per occupant (metabolic heat)
        
    def predict_next_state(self, current_temp, env_conditions, dt=2):
        """
        Uses Euler integration to predict the temperature after dt seconds.
        
        Args:
            current_temp (float): Current cabin temperature (°C)
            env_conditions (dict): {
                "ambient_temp": float,
                "solar_intensity": float (0-1),
                "occupants_count": int,
                "ac_status": bool
            }
            dt (int): Time step in seconds.
            
        Returns:
            float: Predicted temperature.
        """
        amb_temp = env_conditions.get("ambient_temp", 35.0)
        solar = env_conditions.get("solar_intensity", 0.0)
        occupants = env_conditions.get("occupants_count", 0)
        ac_on = env_conditions.get("ac_on", False)
        
        # Heat transfer components (Watts = Joules/Second)
        
        # 1. Conduction through shell (Newton's Law of Cooling/Heating)
        # Q_conduction = (T_amb - T) / R
        q_conduction = (amb_temp - current_temp) / self.R
        
        # 2. Solar Gain
        q_solar = solar * self.Q_solar_max
        
        # 3. Occupant Gain
        q_internal = occupants * self.Q_occupant
        
        # 4. AC Cooling (Throttle based on setpoint)
        setpoint = env_conditions.get("setpoint", 24.0)
        if ac_on:
            diff = current_temp - setpoint
            if diff > 2.0:
                # Full blast if more than 2 degrees too hot
                q_cooling = self.Q_ac_power
            elif diff > 0:
                # Modulate power as it gets close to setpoint
                q_cooling = self.Q_ac_power * (diff / 2.0)
            else:
                # Turn off compressor if we are below setpoint (idling)
                q_cooling = 0.0
        else:
            q_cooling = 0.0
        
        # Net Heat Flow (Watts)
        q_net = q_conduction + q_solar + q_internal - q_cooling
        
        # Change in Temperature: dT = (Q_net * dt) / C
        delta_t = (q_net * dt) / self.C
        
        return round(current_temp + delta_t, 3)

    def predict_ahead(self, current_temp, env_conditions, steps=30, dt=2):
        """
        Projects the temperature curve into the future.
        Useful for frontend visualizations.
        
        Returns:
            list: List of predicted temperatures.
        """
        predictions = []
        temp = current_temp
        
        for _ in range(steps):
            temp = self.predict_next_state(temp, env_conditions, dt)
            predictions.append(temp)
            
        return predictions

if __name__ == "__main__":
    # Test simulation
    model = SeltosThermalModel()
    initial_t = 38.0
    env = {
        "ambient_temp": 35.0,
        "solar_intensity": 0.8,
        "occupants_count": 2,
        "ac_status": True
    }
    
    print(f"Initial Temp: {initial_t}°C")
    print("Simulating 60 seconds of AC Cooling...")
    
    # 30 steps of 2 seconds each
    future_temps = model.predict_ahead(initial_t, env, steps=30, dt=2)
    
    for i, t in enumerate(future_temps):
        if (i+1) % 5 == 0:
            print(f"Time { (i+1)*2 }s: {t}°C")
