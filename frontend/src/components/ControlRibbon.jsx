import React, { useState, useEffect } from 'react';
import { updateControls } from '../api/twinApi';
import { Power, Sun, User } from 'lucide-react';

const ControlRibbon = () => {
  const [acOn, setAcOn] = useState(false);
  const [setpoint, setSetpoint] = useState(24.0);
  const [solarIntensity, setSolarIntensity] = useState('Medium');
  const [occupancy, setOccupancy] = useState([true, false, false, false]); // 4 seats

  const handleUpdate = async (newControls) => {
    try {
      await updateControls(newControls);
    } catch (err) {
      console.error("Failed to update controls:", err);
    }
  };

  const toggleAc = () => {
    const newVal = !acOn;
    setAcOn(newVal);
    handleUpdate({ ac_on: newVal, setpoint, solar_intensity: solarIntensity, occupants_count: occupancy.filter(Boolean).length, occupancy_array: occupancy });
  };

  const changeSetpoint = (val) => {
    const newVal = parseFloat(val);
    setSetpoint(newVal);
    handleUpdate({ ac_on: acOn, setpoint: newVal, solar_intensity: solarIntensity, occupants_count: occupancy.filter(Boolean).length, occupancy_array: occupancy });
  };

  const changeSolar = (val) => {
    setSolarIntensity(val);
    handleUpdate({ ac_on: acOn, setpoint, solar_intensity: val, occupants_count: occupancy.filter(Boolean).length, occupancy_array: occupancy });
  };

  const toggleSeat = (index) => {
    const newOcc = [...occupancy];
    newOcc[index] = !newOcc[index];
    setOccupancy(newOcc);
    handleUpdate({ ac_on: acOn, setpoint, solar_intensity: solarIntensity, occupants_count: newOcc.filter(Boolean).length, occupancy_array: newOcc });
  };

  return (
    <div className="fixed bottom-0 left-0 w-full glass-panel border-t border-white/10 z-50 px-6 py-4 flex items-center justify-between gap-8 backdrop-blur-2xl">
      
      {/* AC Toggle */}
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleAc}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${acOn ? 'bg-secondary-container shadow-[0_0_20px_rgba(205,192,233,0.3)]' : 'bg-surface-container-high border border-white/5'}`}
        >
          <Power className={`w-6 h-6 ${acOn ? 'text-primary-fixed glow-text' : 'text-on-surface-variant'}`} />
        </button>
        <div className="flex flex-col">
          <span className="font-label-caps text-xs text-on-surface-variant tracking-widest uppercase">System</span>
          <span className={`font-h3 text-lg ${acOn ? 'text-primary-fixed' : 'text-on-surface-variant'}`}>
            {acOn ? 'ACTIVE' : 'STANDBY'}
          </span>
        </div>
      </div>

      {/* Setpoint Slider */}
      <div className="flex-1 max-w-md flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span className="font-label-caps text-xs text-on-surface-variant tracking-widest uppercase">Target Temp</span>
          <span className="font-h3 text-xl text-primary-fixed">{setpoint.toFixed(1)}°C</span>
        </div>
        <input 
          type="range" 
          min="16" max="30" step="0.5" 
          value={setpoint}
          onChange={(e) => changeSetpoint(e.target.value)}
          className="w-full accent-primary-fixed-dim h-2 bg-surface-container-highest rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Solar Intensity */}
      <div className="flex flex-col gap-2">
        <span className="font-label-caps text-xs text-on-surface-variant tracking-widest uppercase flex items-center gap-1">
          <Sun className="w-3 h-3" /> Solar Load
        </span>
        <div className="flex gap-2 p-1 rounded-lg bg-surface-container-highest border border-white/5">
          {['None', 'Low', 'Medium', 'High'].map((level) => (
            <button 
              key={level}
              onClick={() => changeSolar(level)}
              className={`px-4 py-1.5 rounded-md font-label-caps text-[10px] uppercase tracking-wider transition-all ${solarIntensity === level ? 'bg-secondary-container text-primary-fixed glow-text' : 'text-on-surface-variant hover:text-white'}`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Occupancy */}
      <div className="flex flex-col gap-2">
        <span className="font-label-caps text-xs text-on-surface-variant tracking-widest uppercase">
          Occupancy
        </span>
        <div className="flex gap-3">
          {occupancy.map((isOccupied, idx) => (
            <button 
              key={idx}
              onClick={() => toggleSeat(idx)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${isOccupied ? 'bg-secondary-container shadow-[0_0_15px_rgba(205,192,233,0.2)]' : 'bg-surface-container-highest border border-white/5'}`}
            >
              <User className={`w-5 h-5 ${isOccupied ? 'text-primary-fixed' : 'text-on-surface-variant/50'}`} />
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};

export default ControlRibbon;
