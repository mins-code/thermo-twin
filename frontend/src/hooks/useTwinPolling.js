import { useState, useEffect, useCallback } from 'react';
import { getTwinState } from '../api/twinApi';

export const useTwinPolling = (isSimulationStarted, intervalMs = 2000) => {
  const [twinData, setTwinData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTwinData = useCallback(async () => {
    if (!isSimulationStarted) return;
    
    try {
      setLoading(true);
      const data = await getTwinState();
      setTwinData(prev => {
        const newPoint = {
          timestamp: data.timestamp,
          z1: data.digital_twin.zones.Z1.current_temp,
          z2: data.digital_twin.zones.Z2.current_temp,
          z3: data.digital_twin.zones.Z3.current_temp,
          z1_pred: data.digital_twin.predictions?.Z1?.['60s'] || null,
          z2_pred: data.digital_twin.predictions?.Z2?.['60s'] || null,
          z3_pred: data.digital_twin.predictions?.Z3?.['60s'] || null,
        };
        const history = prev?.history ? [...prev.history, newPoint] : [newPoint];
        if (history.length > 30) history.shift();

        return { ...data, history, client_timestamp: Date.now() };
      });
      setError(null);
      console.log("UI State Updated:", data?.digital_twin?.zones?.Z1?.current_temp);
    } catch (err) {
      setError(err);
      console.error("Twin Polling Error:", err);
    } finally {
      setLoading(false);
    }
  }, [isSimulationStarted]);

  useEffect(() => {
    let intervalId;

    if (isSimulationStarted) {
      // Fetch immediately upon starting
      fetchTwinData();
      // Then set up polling
      intervalId = setInterval(fetchTwinData, intervalMs);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isSimulationStarted, fetchTwinData, intervalMs]);

  return { twinData, loading, error };
};
