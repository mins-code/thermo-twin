class ReadingPreprocessor:
    """
    Handles mapping of raw sensor data to logical zones and handles invalid readings.
    """
    def __init__(self):
        # Store last known good values to handle sensor failures
        self.last_values = {
            "S1": 38.0,
            "S2": 38.0,
            "S3": 38.0,
            "S4": 38.0
        }

    def preprocess_readings(self, raw_data):
        """
        Maps raw S1-S4 sensors to Z1-Z3 zones.
        Z1: Driver (S1)
        Z2: Passenger (S2)
        Z3: Rear (Average of S3 and S4)
        """
        sensor_map = {s["id"]: s for s in raw_data.get("sensors", [])}
        
        processed_values = {}
        for s_id in ["S1", "S2", "S3", "S4"]:
            sensor_info = sensor_map.get(s_id)
            
            # If sensor exists and is valid, update last known good value
            if sensor_info and sensor_info.get("valid", True):
                self.last_values[s_id] = sensor_info["value"]
            
            processed_values[s_id] = self.last_values[s_id]

        # Map to logical zones
        z1 = processed_values["S1"]
        z2 = processed_values["S2"]
        z3 = (processed_values["S3"] + processed_values["S4"]) / 2.0

        return {
            "timestamp_ms": raw_data.get("timestamp_ms"),
            "zones": {
                "Z1": round(z1, 2),
                "Z2": round(z2, 2),
                "Z3": round(z3, 2)
            }
        }
