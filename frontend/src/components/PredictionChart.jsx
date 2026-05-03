import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-container p-5 rounded-lg border border-primary/50 shadow-[0_0_20px_rgba(103,80,164,0.3)] backdrop-blur-xl">
        <p className="font-label-caps text-sm text-on-surface-variant mb-3 font-semibold tracking-wider">Time: {label}s</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-3 mb-2 last:mb-0">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="font-body-md text-base text-on-background font-medium">
              {entry.name}: {Number(entry.value).toFixed(2)}°C
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const PredictionChart = ({ twinData, data, setpoint = 24.0 }) => {
  console.log("Graph rendering with points:", data?.length || 0);
  
  return (
    <div className="w-full h-full font-body-md">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart key={twinData?.client_timestamp || Date.now()} data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <XAxis 
            dataKey="timestamp" 
            type="number"
            domain={['dataMin', 'dataMax']}
            tick={{ fill: '#948e9c', fontSize: 12, fontFamily: 'Manrope' }}
            axisLine={{ stroke: '#36343a' }}
            tickLine={false}
            tickFormatter={(val) => {
              const d = new Date(val);
              return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
            }}
          />
          <YAxis 
            domain={['dataMin - 1', 'dataMax + 1']}
            tick={{ fill: '#948e9c', fontSize: 12, fontFamily: 'Manrope' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} isAnimationActive={false} />
          <Legend 
            verticalAlign="top"
            align="right"
            wrapperStyle={{ fontFamily: 'Space Grotesk', fontSize: '14px', letterSpacing: '0.05em', color: '#ffffff', paddingBottom: '20px' }}
            iconType="circle"
          />
          
          {/* Setpoint Line */}
          <ReferenceLine y={setpoint} stroke="#6750a4" strokeDasharray="3 3" opacity={0.5} />
          {/* "Now" Line */}
          <ReferenceLine x={0} stroke="#948e9c" strokeOpacity={0.8} label={{ position: 'top', value: 'NOW', fill: '#948e9c', fontSize: 10, fontFamily: 'Space Grotesk' }} />

          {/* Historical Lines */}
          <Line isAnimationActive={false} type="monotone" dataKey="z1" name="Z1 Driver" stroke="#cfbcff" strokeWidth={2} dot={false} />
          <Line isAnimationActive={false} type="monotone" dataKey="z2" name="Z2 Pass" stroke="#cdc0e9" strokeWidth={2} dot={false} />
          <Line isAnimationActive={false} type="monotone" dataKey="z3" name="Z3 Rear" stroke="#e7c365" strokeWidth={2} dot={false} />

          {/* Predicted Lines */}
          <Line isAnimationActive={false} type="monotone" dataKey="z1_pred" name="Z1 Pred" stroke="#cfbcff" strokeWidth={2} strokeDasharray="5 5" dot={false} />
          <Line isAnimationActive={false} type="monotone" dataKey="z2_pred" name="Z2 Pred" stroke="#cdc0e9" strokeWidth={2} strokeDasharray="5 5" dot={false} />
          <Line isAnimationActive={false} type="monotone" dataKey="z3_pred" name="Z3 Pred" stroke="#e7c365" strokeWidth={2} strokeDasharray="5 5" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PredictionChart;
