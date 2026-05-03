import numpy as np
from filterpy.kalman import KalmanFilter

class ThermodynamicFilter:
    """
    Implements a 1D Kalman Filter to smooth temperature readings 
    and estimate the rate of change.
    """
    def __init__(self, initial_temp=38.0, dt=1.0):
        # x = [temperature, rate_of_change]^T
        self.kf = KalmanFilter(dim_x=2, dim_z=1)
        
        # State transition matrix
        self.kf.F = np.array([[1.0, dt],
                             [0.0, 1.0]])
        
        # Measurement matrix (we only measure temperature)
        self.kf.H = np.array([[1.0, 0.0]])
        
        # Initial state
        self.kf.x = np.array([[initial_temp], 
                             [0.0]])
        
        # Initial covariance matrix
        self.kf.P *= 100.0
        
        # Measurement noise matrix (as per PRD)
        self.kf.R = np.array([[4.0]])
        
        # Process noise matrix
        # Increased value to account for physics model uncertainty and trust sensor data more
        self.kf.Q = np.array([[0.1, 0.05],
                             [0.05, 0.1]])

    def predict_and_update(self, measurement):
        """
        Runs one step of the Kalman Filter.
        
        Args:
            measurement (float): The noisy temperature reading.
            
        Returns:
            dict: { "temp": float, "velocity": float }
        """
        self.kf.predict()
        self.kf.update(measurement)
        
        return {
            "temp": round(float(self.kf.x[0][0]), 2),
            "velocity": round(float(self.kf.x[1][0]), 4)
        }

if __name__ == "__main__":
    # Test with dummy noisy data
    f = ThermodynamicFilter(initial_temp=38.0)
    test_data = [38.1, 38.3, 37.9, 38.5, 39.0, 39.2]
    
    print("Kalman Filter Test (Initial 38.0):")
    for m in test_data:
        result = f.predict_and_update(m)
        print(f"Measured: {m} -> Smoothed: {result['temp']} (v: {result['velocity']})")
