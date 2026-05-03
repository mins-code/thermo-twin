from flask import Flask, request, jsonify
from flask_cors import CORS
import time

# Import custom modules
from mock_sensor import MockSensorGenerator
from digital_twin import DigitalTwin
from control_system import SeltosDuctController
from regression_model import SeltosRegressionModel

app = Flask(__name__)
CORS(app) # Allow cross-origin requests from React

# Initialize System Components
generator = MockSensorGenerator()
twin = DigitalTwin()
controller = SeltosDuctController()
ml_model = SeltosRegressionModel()

# Global State
current_controls = {
    "ac_on": False,
    "solar_intensity": 0.5,
    "occupants_count": 1,
    "setpoint": 24.0,
    "ambient_temp": 35.0
}

# Buffer for ML history (Z1 only for this demo)
history_buffer = []

@app.route('/api/state', methods=['GET'])
def get_state():
    global history_buffer
    
    # 1. Generate Raw Data from Sensors
    raw_data = generator.generate_reading(current_controls)
    
    # 2. Process through Digital Twin (Preprocessing -> Kalman -> RC Physics)
    twin_state = twin.run_step(raw_data, current_controls)
    
    # 3. Update History Buffer for ML
    z1_temp = twin_state["zones"]["Z1"]["current_temp"]
    history_buffer.append(z1_temp)
    if len(history_buffer) > 20:
        history_buffer.pop(0)
    
    # 4. Get ML-based Prediction and Trend
    ml_prediction = ml_model.predict_temperature(
        history_buffer, 
        current_controls["ac_on"], 
        current_controls["solar_intensity"]
    )
    trend = ml_model.calculate_trend(history_buffer)
    
    # 5. Get HVAC Control Instructions
    zone_temps = {z_id: data["current_temp"] for z_id, data in twin_state["zones"].items()}
    duct_instructions = controller.compute_instructions(zone_temps, current_controls["setpoint"])
    
    # 6. Build Final Response
    response = {
        "timestamp": twin_state["timestamp_ms"],
        "digital_twin": twin_state,
        "ml_insights": {
            "next_value_prediction": ml_prediction,
            "trend_rate": trend,
            "history_count": len(history_buffer)
        },
        "hvac_control": duct_instructions,
        "active_controls": current_controls
    }
    
    print(f"[{time.strftime('%H:%M:%S')}] Twin Update: Z1={z1_temp}°C | Status={twin_state['system_status']} | Trend={trend}°C/s")
    
    return jsonify(response)

@app.route('/api/controls', methods=['POST'])
def update_controls():
    global current_controls
    data = request.json
    
    # Handle string solar_intensity from frontend
    if "solar_intensity" in data and isinstance(data["solar_intensity"], str):
        solar_map = {"None": 0.0, "Low": 0.3, "Medium": 0.6, "High": 1.0}
        data["solar_intensity"] = solar_map.get(data["solar_intensity"], 0.5)
        
    # Merge new controls into current state
    current_controls.update(data)
    
    print(f"[{time.strftime('%H:%M:%S')}] Controls Updated: {current_controls}")
    return jsonify({"status": "success", "updated_controls": current_controls})

if __name__ == "__main__":
    print("--- ThermoTwin Backend Engine Starting ---")
    print("Port: 5050")
    print("Components: MockSensor, DigitalTwin, KalmanFilter, RCModel, MLPredictor, DuctController")
    app.run(host="0.0.0.0", port=5050, debug=True)
