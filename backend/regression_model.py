import joblib
import numpy as np
import os

class SeltosRegressionModel:
    """
    ML-based temperature prediction model for the Kia Seltos.
    Uses a pre-trained regression model to predict the next state.
    """
    def __init__(self, model_path="regression_model.joblib"):
        self.model_path = model_path
        self.model = None
        
        if os.path.exists(self.model_path):
            try:
                self.model = joblib.load(self.model_path)
            except Exception as e:
                print(f"Warning: Could not load ML model: {e}")
        else:
            print(f"Warning: Model file {self.model_path} not found. Using fallback logic.")

    def predict_temperature(self, temp_history, ac_on, solar):
        """
        Predicts the next temperature reading based on history and controls.
        
        Args:
            temp_history (list): List of last 15 temperature readings.
            ac_on (bool): AC status.
            solar (float): Solar intensity (0.0 to 1.0).
            
        Returns:
            float: Predicted temperature.
        """
        # Fallback if window is not full or model is missing
        if len(temp_history) < 15 or self.model is None:
            return temp_history[-1] if temp_history else 38.0
            
        # Prepare feature vector: [hist1, hist2, ..., hist15, ac_on, solar]
        # Assuming the model expects 17 features
        features = np.array(temp_history[-15:] + [float(ac_on), float(solar)]).reshape(1, -1)
        
        try:
            prediction = self.model.predict(features)
            return round(float(prediction[0]), 2)
        except Exception as e:
            print(f"Prediction error: {e}")
            return temp_history[-1]

    def calculate_trend(self, temp_history):
        """
        Calculates the temperature trend (°C/s).
        Assumes 2-second intervals between samples.
        """
        if len(temp_history) < 2:
            return 0.0
            
        # Simple linear approximation: (latest - oldest) / time_elapsed
        dt = 2.0  # seconds per sample
        total_time = (len(temp_history) - 1) * dt
        delta_temp = temp_history[-1] - temp_history[0]
        
        trend = delta_temp / total_time
        return round(trend, 4)

if __name__ == "__main__":
    # Test with dummy model creation (for demonstration)
    from sklearn.linear_model import LinearRegression
    
    # Create and save a dummy model if it doesn't exist for testing
    if not os.path.exists("regression_model.joblib"):
        print("Creating dummy model for testing...")
        dummy_model = LinearRegression()
        X_dummy = np.random.rand(10, 17)
        y_dummy = np.random.rand(10)
        dummy_model.fit(X_dummy, y_dummy)
        joblib.dump(dummy_model, "regression_model.joblib")
        
    predictor = SeltosRegressionModel()
    
    # Simulate history
    history = [38.0 - (i * 0.1) for i in range(15)]
    pred = predictor.predict_temperature(history, ac_on=True, solar=0.5)
    trend = predictor.calculate_trend(history)
    
    print(f"History End: {history[-1]}")
    print(f"ML Prediction: {pred}")
    print(f"Calculated Trend: {trend} °C/s")
