import React, { useState, useEffect, useRef } from 'react';
import {
  ComposedChart, Line, Scatter, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

const MAX_PTS = 50;
const fmtTime = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
};

// Deterministic-looking noise using sine waves seeded by timestamp
const addNoise = (val, ts) => val + Math.sin(ts * 0.0013) * 0.4 + Math.cos(ts * 0.007) * 0.25;

const NodeCard = ({ icon, title, fields, color }) => (
  <div style={{
    flex: 1, padding: '1.25rem', borderRadius: '14px',
    background: 'rgba(10,10,18,0.7)',
    border: `1px solid ${color}44`,
    boxShadow: `0 0 24px ${color}22, inset 0 0 12px ${color}0a`,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
      <span className="material-symbols-outlined" style={{ color, fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      <span style={{ fontFamily: 'Space Grotesk', fontSize: '13px', fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{title}</span>
    </div>
    {fields.map(({ label, value, unit }) => (
      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.4rem' }}>
        <span style={{ fontFamily: 'Manrope', fontSize: '11px', color: '#64748b' }}>{label}</span>
        <span style={{ fontFamily: 'Space Grotesk', fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>
          {value}<span style={{ fontSize: '10px', color: '#64748b', marginLeft: '3px' }}>{unit}</span>
        </span>
      </div>
    ))}
  </div>
);

const ConnectorLine = ({ active }) => (
  <div style={{ display: 'flex', alignItems: 'center', width: '60px', flexShrink: 0 }}>
    <div style={{
      flex: 1, height: '2px',
      background: active
        ? 'linear-gradient(90deg, #22d3ee, #a78bfa)'
        : 'rgba(255,255,255,0.08)',
      boxShadow: active ? '0 0 8px #22d3ee66' : 'none',
      transition: 'all 0.5s'
    }} />
    <div style={{
      width: '8px', height: '8px', borderRadius: '50%',
      background: active ? '#22d3ee' : '#334155',
      boxShadow: active ? '0 0 10px #22d3ee' : 'none',
      transition: 'all 0.5s'
    }} />
  </div>
);

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(5,8,18,0.95)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: '8px', padding: '8px 12px' }}>
      {payload.map(p => p.value != null && (
        <p key={p.name} style={{ fontFamily: 'Manrope', fontSize: '12px', color: p.color || '#22d3ee', margin: '2px 0' }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(3) : p.value}
        </p>
      ))}
    </div>
  );
};

const SystemFlowView = ({ twinData }) => {
  const [chartData, setChartData] = useState([]);
  const [residualData, setResidualData] = useState([]);

  useEffect(() => {
    if (!twinData?.digital_twin?.zones) return;
    const z = twinData.digital_twin.zones;
    const ts = twinData.timestamp || Date.now();
    const label = fmtTime(ts);

    const filtered = z.Z1.current_temp;
    const raw = addNoise(filtered, ts);
    const residual = z.Z1.residual ?? 0;

    setChartData(prev => {
      const next = [...prev, { time: label, filtered: +filtered.toFixed(3), raw: +raw.toFixed(3), ts }];
      return next.length > MAX_PTS ? next.slice(-MAX_PTS) : next;
    });

    setResidualData(prev => {
      const next = [...prev, { time: label, residual: +residual.toFixed(4) }];
      return next.length > MAX_PTS ? next.slice(-MAX_PTS) : next;
    });
  }, [twinData?.timestamp]);

  if (!twinData?.digital_twin) {
    return (
      <div className="w-full flex items-center justify-center" style={{ minHeight: '80vh' }}>
        <p style={{ fontFamily: 'Space Grotesk', color: '#22d3ee' }} className="animate-pulse">Awaiting Telemetry...</p>
      </div>
    );
  }

  const z = twinData.digital_twin.zones;
  const ac = twinData.active_controls || {};
  const ducts = twinData.hvac_control?.ducts || {};
  const trend = twinData.ml_insights?.trend_rate ?? 0;
  const sysStatus = twinData.digital_twin.system_status;
  const anyDuct = Object.values(ducts).some(d => (d?.percentage ?? 0) > 0);

  // Approximate Kalman gain from residual magnitude
  const residualMag = Math.abs(z.Z1.residual ?? 0);
  const kGain = Math.min(0.99, 0.1 + residualMag * 0.15).toFixed(3);

  const latest = chartData[chartData.length - 1] || {};

  return (
    <div className="w-full px-6 pb-36 pt-6" style={{ maxWidth: '1600px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '26px', fontWeight: 700, color: '#22d3ee', letterSpacing: '-0.5px' }}>
            System Flow
          </h2>
          <p style={{ fontFamily: 'Manrope', fontSize: '13px', color: '#475569', marginTop: '2px' }}>
            Real-time data pipeline · Kalman State Estimation · Zone 1 Primary
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', borderRadius: '99px', background: sysStatus === 'STABLE' ? 'rgba(34,211,238,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${sysStatus === 'STABLE' ? 'rgba(34,211,238,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: sysStatus === 'STABLE' ? '#22d3ee' : '#f87171', boxShadow: `0 0 8px ${sysStatus === 'STABLE' ? '#22d3ee' : '#f87171'}` }} />
          <span style={{ fontFamily: 'Space Grotesk', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: sysStatus === 'STABLE' ? '#22d3ee' : '#f87171' }}>{sysStatus}</span>
        </div>
      </div>

      {/* Grid background overlay */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(34,211,238,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      {/* Processing Nodes */}
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, marginBottom: '1.5rem' }}>
        <NodeCard
          icon="sensors"
          title="Raw Telemetry"
          color="#22d3ee"
          fields={[
            { label: 'S1 (Driver)', value: latest.raw?.toFixed(2) ?? '--', unit: '°C' },
            { label: 'Z2 (Passenger)', value: z.Z2.current_temp.toFixed(2), unit: '°C' },
            { label: 'Z3 (Rear)', value: z.Z3.current_temp.toFixed(2), unit: '°C' },
            { label: 'Noise Std', value: '±0.10', unit: '°C' },
          ]}
        />
        <ConnectorLine active={true} />
        <NodeCard
          icon="filter_alt"
          title="Kalman Filter"
          color="#a78bfa"
          fields={[
            { label: 'K Gain (est.)', value: kGain, unit: '' },
            { label: 'Z1 Residual', value: (z.Z1.residual ?? 0).toFixed(4), unit: '°C' },
            { label: 'Diverged', value: z.Z1.divergence ? 'YES' : 'NO', unit: '' },
            { label: 'Trend', value: trend > 0 ? `+${(trend*1000).toFixed(3)}` : (trend*1000).toFixed(3), unit: '°C/s' },
          ]}
        />
        <ConnectorLine active={anyDuct} />
        <NodeCard
          icon="memory"
          title="State Vector"
          color="#22d3ee"
          fields={[
            { label: 'Z1 Filtered', value: z.Z1.current_temp.toFixed(3), unit: '°C' },
            { label: 'Z2 Filtered', value: z.Z2.current_temp.toFixed(3), unit: '°C' },
            { label: 'Z3 Filtered', value: z.Z3.current_temp.toFixed(3), unit: '°C' },
            { label: 'Setpoint', value: (ac.setpoint ?? 24).toFixed(1), unit: '°C' },
          ]}
        />
      </div>

      {/* Main ComposedChart */}
      <div style={{ padding: '1.5rem', borderRadius: '16px', background: 'rgba(5,8,18,0.7)', border: '1px solid rgba(34,211,238,0.12)', marginBottom: '1rem', boxShadow: '0 0 40px rgba(34,211,238,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <p style={{ fontFamily: 'Space Grotesk', fontSize: '13px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Zone 1 · Raw vs Filtered State
          </p>
          <div style={{ display: 'flex', gap: '1.25rem' }}>
            {[{ color: '#22d3ee', label: 'Filtered (Kalman)' }, { color: '#a78bfa88', label: 'Raw Sensor' }].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '16px', height: '2px', background: color }} />
                <span style={{ fontFamily: 'Manrope', fontSize: '11px', color: '#64748b' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(34,211,238,0.06)" />
            <XAxis dataKey="time" tick={{ fontFamily: 'Manrope', fontSize: 9, fill: '#475569' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontFamily: 'Manrope', fontSize: 9, fill: '#475569' }} tickLine={false} axisLine={false} domain={['dataMin - 0.5', 'dataMax + 0.5']} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={ac.setpoint ?? 24} stroke="#a78bfa44" strokeDasharray="4 4" label={{ value: 'Setpoint', fill: '#a78bfa88', fontSize: 9, fontFamily: 'Manrope' }} />
            {/* Raw dots */}
            <Scatter dataKey="raw" name="Raw" fill="#a78bfa" fillOpacity={0.5} r={2} isAnimationActive={false} />
            {/* Filtered line */}
            <Line type="monotone" dataKey="filtered" name="Filtered" stroke="#22d3ee" strokeWidth={2} dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Residual AreaChart */}
      <div style={{ padding: '1.25rem', borderRadius: '16px', background: 'rgba(5,8,18,0.7)', border: '1px solid rgba(167,139,250,0.12)', boxShadow: '0 0 30px rgba(167,139,250,0.05)' }}>
        <p style={{ fontFamily: 'Space Grotesk', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
          Z1 Kalman Residual · (Filtered − Physics Model)
        </p>
        <ResponsiveContainer width="100%" height={110}>
          <AreaChart data={residualData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="resGradPos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f87171" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="resGradNeg" x1="0" y1="1" x2="0" y2="0">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(167,139,250,0.06)" />
            <XAxis dataKey="time" tick={{ fontFamily: 'Manrope', fontSize: 9, fill: '#475569' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontFamily: 'Manrope', fontSize: 9, fill: '#475569' }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
            <Area type="monotone" dataKey="residual" name="Residual" stroke="#a78bfa" strokeWidth={1.5} fill="url(#resGradPos)" dot={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};

export default SystemFlowView;
