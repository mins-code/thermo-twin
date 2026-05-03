import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const ZoneCard = ({ zoneName, currentTemp, setpoint, residual, trendSlope }) => {
  // Determine dynamic state
  const isHot = currentTemp > setpoint + 2;
  const isCold = currentTemp < setpoint - 2;

  // Dynamic styling based on state
  let cardStyle = "glass-panel"; // Default normal state
  let glowStyle = {};
  
  if (isHot) {
    // Faint red glow
    glowStyle = {
      borderColor: "rgba(255, 180, 171, 0.3)", // error color
      boxShadow: "inset 1px 1px 0px 0px rgba(255,180,171,0.2), 0 0 30px rgba(255,180,171,0.15)"
    };
  } else if (isCold) {
    // Faint blue glow
    glowStyle = {
      borderColor: "rgba(147, 197, 253, 0.3)", // blue-300
      boxShadow: "inset 1px 1px 0px 0px rgba(147,197,253,0.2), 0 0 30px rgba(147,197,253,0.15)"
    };
  }

  // Trend Icon Logic
  let TrendIcon = Minus;
  let trendColor = "text-on-surface-variant";
  
  if (trendSlope > 0.1) {
    TrendIcon = TrendingUp;
    trendColor = "text-error";
  } else if (trendSlope < -0.1) {
    TrendIcon = TrendingDown;
    trendColor = "text-blue-400";
  }

  return (
    <div 
      className={`rounded-2xl p-5 flex flex-col justify-between transition-all duration-700 ${cardStyle}`}
      style={glowStyle}
    >
      <div className="flex justify-between items-start">
        <span className="font-h3 text-sm text-primary-fixed-dim uppercase tracking-widest">
          {zoneName}
        </span>
        <TrendIcon className={`w-5 h-5 ${trendColor}`} strokeWidth={2} />
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div className="flex flex-col">
          <span className="font-body-md text-4xl text-on-background font-light tracking-tight transition-all duration-500 ease-in-out">
            {currentTemp.toFixed(2)}°C
          </span>
          <span className="font-label-caps text-[10px] text-on-surface-variant/70 mt-1 tracking-wider uppercase">
            Setpoint: {setpoint.toFixed(2)}°C
          </span>
        </div>

        <div className={`px-2 py-1 rounded-md bg-surface-container/50 border border-white/5 flex items-center gap-1 backdrop-blur-md`}>
          <span className="font-label-caps text-[10px] text-on-surface-variant uppercase">
            Δ
          </span>
          <span className={`font-body-md text-xs font-medium ${residual > 0 ? 'text-error' : residual < 0 ? 'text-blue-400' : 'text-on-surface-variant'}`}>
            {residual > 0 ? '+' : ''}{(residual || 0).toFixed(2)}°C
          </span>
        </div>
      </div>
    </div>
  );
};

export default ZoneCard;
