import React from 'react';
import { motion } from 'framer-motion';
import ZoneCard from './ZoneCard';
import PredictionChart from './PredictionChart';
import ControlRibbon from './ControlRibbon';

// Mock data for visual layout testing
const mockChartData = [
  { time: -60, z1: 25.5, z2: 24.8, z3: 26.2 },
  { time: -45, z1: 25.2, z2: 24.6, z3: 26.0 },
  { time: -30, z1: 25.0, z2: 24.3, z3: 25.5 },
  { time: -15, z1: 24.7, z2: 24.0, z3: 25.1 },
  { time: 0, z1: 24.5, z2: 23.8, z3: 24.8, z1_pred: 24.5, z2_pred: 23.8, z3_pred: 24.8 },
  { time: 30, z1_pred: 24.0, z2_pred: 23.5, z3_pred: 24.5 },
  { time: 60, z1_pred: 23.8, z2_pred: 23.2, z3_pred: 24.0 }
];

const DashboardContainer = ({ twinData }) => {
  if (!twinData || !twinData.digital_twin) {
    return (
      <div className="w-full h-[calc(100vh-120px)] flex items-center justify-center font-h3 text-2xl text-primary-fixed-dim animate-pulse">
        Connecting to Twin...
      </div>
    );
  }

  const { zones } = twinData.digital_twin;
  const setpoint = twinData.active_controls?.setpoint || 24.0;
  const trendSlope = twinData.ml_insights?.trend_rate || 0;

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-7xl mx-auto flex gap-6 px-4 md:px-safe-area pb-safe-area mt-8 min-h-[calc(100vh-120px)]"
      >
        {/* Main Workspace - 100% */}
        <div className="w-full flex flex-col gap-6 pb-48">
          
          {/* Top Row: Zone Cards */}
          <div className="grid grid-cols-3 gap-6 h-32">
            <ZoneCard 
              zoneName="Z1 - DRIVER" 
              currentTemp={zones.Z1.current_temp} 
              setpoint={setpoint} 
              residual={zones.Z1.residual} 
              trendSlope={trendSlope} 
            />
            <ZoneCard 
              zoneName="Z2 - PASSENGER" 
              currentTemp={zones.Z2.current_temp} 
              setpoint={setpoint} 
              residual={zones.Z2.residual} 
              trendSlope={trendSlope} 
            />
            <ZoneCard 
              zoneName="Z3 - REAR" 
              currentTemp={zones.Z3.current_temp} 
              setpoint={setpoint} 
              residual={zones.Z3.residual} 
              trendSlope={trendSlope} 
            />
          </div>

          {/* Middle Row: Main Chart */}
          <div className="flex gap-6 min-h-[550px]">
            {/* Main Chart - 100% */}
            <div className="w-full glass-panel rounded-2xl p-6 flex flex-col group hover:shadow-[0_0_25px_rgba(207,188,255,0.2)] transition-shadow">
              <h2 className="font-h3 text-xl text-primary-fixed-dim border-b border-primary/20 pb-4 mb-4">
                Thermal Trajectory
              </h2>
              <div className="flex-1 w-full min-h-[450px]">
                <PredictionChart twinData={twinData} data={twinData.history || []} setpoint={setpoint} />
              </div>
            </div>
          </div>

          {/* Bottom Row: System Logs / Residuals */}
          <div className="glass-panel rounded-2xl p-4 h-20 flex items-center justify-between group hover:shadow-[0_0_20px_rgba(207,188,255,0.2)] transition-shadow">
            <h2 className="font-h3 text-sm text-primary-fixed-dim border-r border-primary/20 pr-4 mr-4 whitespace-nowrap">
              System Diagnostics
            </h2>
            <div className="flex-1 flex items-center text-on-surface-variant/70 font-mono text-sm overflow-hidden">
              <span className="truncate">Loading thermal matrix... [OK] • Stabilizing RC models... [OK]</span>
            </div>
          </div>

        </div>
      </motion.div>
      
      {/* Fixed Control Ribbon at bottom */}
      <ControlRibbon />
    </>
  );
};

export default DashboardContainer;
