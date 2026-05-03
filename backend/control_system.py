class SeltosDuctController:
    """
    Simulates the HVAC duct control logic for the Kia Seltos.
    Maps cabin zones to specific physical ducts (D1-D5).
    """
    def __init__(self):
        # Mapping zones to ducts
        # Z1: Driver, Z2: Passenger, Z3: Rear
        self.duct_mapping = {
            "D1": {"zone": "Z1", "label": "Driver Side Vent"},
            "D2": {"zone": "Z1", "label": "Driver Center Vent"},
            "D3": {"zone": "Z2", "label": "Passenger Center Vent"},
            "D4": {"zone": "Z2", "label": "Passenger Side Vent"},
            "D5": {"zone": "Z3", "label": "Rear Center Vent"}
        }

    def compute_instructions(self, zone_temps, setpoint):
        """
        Calculates opening percentages and states for each duct.
        
        Args:
            zone_temps (dict): { "Z1": temp, "Z2": temp, "Z3": temp }
            setpoint (float): Targeted cabin temperature.
            
        Returns:
            dict: Instructions for all ducts.
        """
        instructions = {}
        
        for duct_id, config in self.duct_mapping.items():
            zone = config["zone"]
            current_temp = zone_temps.get(zone, setpoint)
            
            # Calculate difference (assuming cooling mode)
            diff = current_temp - setpoint
            
            # Simple threshold logic
            if diff <= 0.5:
                state = "CLOSED"
                percentage = 0
                action = f"Close {config['label']}"
            elif diff <= 2.0:
                state = "LOW"
                percentage = 25
                action = f"Slightly open {config['label']}"
            elif diff <= 4.0:
                state = "MEDIUM"
                percentage = 50
                action = f"Moderately open {config['label']}"
            elif diff <= 7.0:
                state = "HIGH"
                percentage = 75
                action = f"Wide open {config['label']}"
            else:
                state = "FULL"
                percentage = 100
                action = f"Maximum airflow for {config['label']}"
                
            instructions[duct_id] = {
                "id": duct_id,
                "label": config["label"],
                "zone": zone,
                "state": state,
                "percentage": percentage,
                "action_desc": action
            }
            
        return {
            "ducts": instructions,
            "overall_strategy": "PRIORITY_Z1" # Documentation of the logic used
        }

if __name__ == "__main__":
    # Test case
    controller = SeltosDuctController()
    temps = {
        "Z1": 32.0, # Hot (+8 from 24)
        "Z2": 26.5, # Warm (+2.5 from 24)
        "Z3": 24.2  # Cool (+0.2 from 24)
    }
    
    result = controller.compute_instructions(temps, 24.0)
    
    print("Duct Control Logic Test:")
    for d_id, data in result["ducts"].items():
        print(f"{d_id} ({data['zone']}): {data['state']} ({data['percentage']}%) - {data['action_desc']}")
