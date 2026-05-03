import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const MAX_HISTORY = 40;

// ─── Helpers ────────────────────────────────────────────────────────────────
const calcEfficiency = (avgTemp, setpoint, acOn) => {
  if (!acOn) return Math.max(0, 100 - Math.abs(avgTemp - setpoint) * 8);
  const delta = Math.abs(avgTemp - setpoint);
  return Math.max(0, Math.min(100, 100 - (delta / 5) * 100));
};

const fmtTime = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`;
};

// ─── Custom Tooltip ──────────────────────────────────────────────────────────
const EffTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(20,18,24,0.9)', border: '1px solid rgba(207,188,255,0.2)', borderRadius: '8px', padding: '8px 12px' }}>
      <p style={{ fontFamily: 'Manrope', fontSize: '13px', color: '#cfbcff' }}>{payload[0]?.value?.toFixed(1)}%</p>
    </div>
  );
};

const BarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(20,18,24,0.9)', border: '1px solid rgba(207,188,255,0.2)', borderRadius: '8px', padding: '8px 12px' }}>
      <p style={{ fontFamily: 'Space Grotesk', fontSize: '11px', color: '#948e9c', marginBottom: '4px' }}>{label}</p>
      <p style={{ fontFamily: 'Manrope', fontSize: '13px', color: '#cfbcff' }}>{payload[0]?.value?.toFixed(2)} kW</p>
    </div>
  );
};

// ─── Subsystem Row ───────────────────────────────────────────────────────────
const SubsystemRow = ({ icon, name, status, active }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.9rem', borderRadius: '10px', background: 'rgba(33,31,36,0.5)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '0.5rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '18px', color: active ? '#cfbcff' : '#948e9c', fontVariationSettings: "'FILL' 1", transition: 'color 0.5s' }}>{icon}</span>
      <span style={{ fontFamily: 'Space Grotesk', fontSize: '13px', color: '#e6e0e9' }}>{name}</span>
    </div>
    <span style={{ fontFamily: 'Manrope', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', padding: '2px 10px', borderRadius: '99px', background: active ? 'rgba(74,222,128,0.1)' : 'rgba(148,142,156,0.1)', color: active ? '#4ade80' : '#948e9c', border: `1px solid ${active ? 'rgba(74,222,128,0.3)' : 'rgba(148,142,156,0.2)'}`, transition: 'all 0.5s' }}>
      {status}
    </span>
  </div>
);

// ─── Thermal Snapshot ────────────────────────────────────────────────────────
const ThermalSnapshot = ({ zones, setpoint }) => {
  const getColor = (temp) => {
    if (!temp) return 'rgba(103,80,164,0.3)';
    const delta = temp - setpoint;
    if (delta > 2) return `rgba(239,68,68,${Math.min(0.6, 0.2 + delta * 0.06)})`;
    if (delta < -2) return `rgba(60,130,246,${Math.min(0.6, 0.2 + Math.abs(delta) * 0.06)})`;
    return 'rgba(103,80,164,0.35)';
  };

  return (
    <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Car silhouette outline */}
      <div style={{ position: 'relative', width: '120px', height: '220px' }}>
        {/* Z1 — Driver */}
        <div style={{ position: 'absolute', top: '12%', left: '5%', width: '42%', height: '30%', borderRadius: '50%', background: getColor(zones?.Z1?.current_temp), border: '1px solid rgba(207,188,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.8s' }}>
          <span style={{ fontFamily: 'Space Grotesk', fontSize: '10px', color: '#e6e0e9', fontWeight: 600 }}>{zones?.Z1?.current_temp?.toFixed(1)}°</span>
        </div>
        {/* Z2 — Passenger */}
        <div style={{ position: 'absolute', top: '12%', right: '5%', width: '42%', height: '30%', borderRadius: '50%', background: getColor(zones?.Z2?.current_temp), border: '1px solid rgba(207,188,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.8s' }}>
          <span style={{ fontFamily: 'Space Grotesk', fontSize: '10px', color: '#e6e0e9', fontWeight: 600 }}>{zones?.Z2?.current_temp?.toFixed(1)}°</span>
        </div>
        {/* Z3 — Rear */}
        <div style={{ position: 'absolute', bottom: '18%', left: '10%', right: '10%', height: '25%', borderRadius: '12px', background: getColor(zones?.Z3?.current_temp), border: '1px solid rgba(207,188,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.8s' }}>
          <span style={{ fontFamily: 'Space Grotesk', fontSize: '10px', color: '#e6e0e9', fontWeight: 600 }}>{zones?.Z3?.current_temp?.toFixed(1)}°</span>
        </div>
        {/* Center divider */}
        <div style={{ position: 'absolute', top: '46%', left: '10%', right: '10%', height: '1px', background: 'rgba(207,188,255,0.1)' }} />
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const EfficiencyView = ({ twinData }) => {
  const [effHistory, setEffHistory] = useState([]);

  useEffect(() => {
    if (!twinData?.digital_twin?.zones) return;
    const zones = twinData.digital_twin.zones;
    const setpoint = twinData.active_controls?.setpoint || 24.0;
    const acOn = twinData.active_controls?.ac_on || false;
    const avgTemp = (zones.Z1.current_temp + zones.Z2.current_temp + zones.Z3.current_temp) / 3;
    const eff = calcEfficiency(avgTemp, setpoint, acOn);

    setEffHistory(prev => {
      const point = { time: fmtTime(twinData.timestamp), efficiency: parseFloat(eff.toFixed(1)), ts: twinData.timestamp };
      const next = [...prev, point];
      return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next;
    });
  }, [twinData?.timestamp]);

  if (!twinData?.digital_twin) {
    return (
      <div className="w-full flex items-center justify-center" style={{ minHeight: '80vh' }}>
        <p style={{ fontFamily: 'Space Grotesk', fontSize: '20px', color: '#cfbcff' }} className="animate-pulse">Connecting to Twin...</p>
      </div>
    );
  }

  const zones = twinData.digital_twin.zones;
  const setpoint = twinData.active_controls?.setpoint || 24.0;
  const acOn = twinData.active_controls?.ac_on || false;
  const avgTemp = (zones.Z1.current_temp + zones.Z2.current_temp + zones.Z3.current_temp) / 3;
  const currentEff = calcEfficiency(avgTemp, setpoint, acOn);
  const isDiverged = twinData.digital_twin.system_status === 'DIVERGED';

  // Duct data
  const ducts = twinData.hvac_control?.ducts || {};
  const d1 = ducts.D1?.percentage ?? 0;
  const d2 = ducts.D2?.percentage ?? 0;
  const d3 = ducts.D3?.percentage ?? 0;
  const d4 = ducts.D4?.percentage ?? 0;
  const d5 = ducts.D5?.percentage ?? 0;
  const anyDuctOpen = (d1 + d2 + d3 + d4 + d5) > 0;
  const strategy = twinData.hvac_control?.overall_strategy || 'STANDBY';

  // Per-zone energy draw (proportional to duct openings, max 14kW total when AC on)
  const totalDuctPct = d1 + d2 + d3 + d4 + d5 || 1;
  const hvacPower = acOn ? 14.0 : 0.1;
  const zoneEnergy = [
    { zone: 'Driver', kw: parseFloat(((d1 + d2) / totalDuctPct * hvacPower).toFixed(2)), color: '#cfbcff' },
    { zone: 'Passenger', kw: parseFloat(((d3 + d4) / totalDuctPct * hvacPower).toFixed(2)), color: '#a78bfa' },
    { zone: 'Rear', kw: parseFloat((d5 / totalDuctPct * hvacPower).toFixed(2)), color: '#818cf8' },
  ];

  // Trend for colour gradient
  const trendUp = (twinData.ml_insights?.trend_rate || 0) > 0;

  return (
    <div className="w-full px-6 pb-36 pt-6" style={{ maxWidth: '1600px', margin: '0 auto' }}>
      <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '28px', fontWeight: 600, color: '#cfbcff', marginBottom: '1.5rem' }}>
        Efficiency Analysis
      </h2>

      {/* ── Bento Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gridTemplateRows: 'auto auto', gap: '1.25rem' }}>

        {/* ── HERO: Efficiency Score Area Chart ── */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '20px', gridColumn: '1', gridRow: '1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <p style={{ fontFamily: 'Space Grotesk', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#948e9c' }}>Efficiency Score</p>
              <p style={{ fontFamily: 'Space Grotesk', fontSize: '48px', fontWeight: 700, color: currentEff > 70 ? '#4ade80' : currentEff > 40 ? '#e7c365' : '#f87171', lineHeight: 1, marginTop: '0.25rem', transition: 'color 0.6s' }}>
                {currentEff.toFixed(1)}<span style={{ fontSize: '22px', color: '#948e9c', marginLeft: '4px' }}>%</span>
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontFamily: 'Space Grotesk', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#948e9c' }}>Strategy</p>
              <p style={{ fontFamily: 'Space Grotesk', fontSize: '14px', fontWeight: 600, color: '#cfbcff', marginTop: '4px' }}>{strategy.replace('_', ' ')}</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={effHistory} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="effGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#cfbcff" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#cfbcff" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" tick={{ fontFamily: 'Manrope', fontSize: 9, fill: '#948e9c' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis domain={[0, 100]} tick={{ fontFamily: 'Manrope', fontSize: 9, fill: '#948e9c' }} tickLine={false} axisLine={false} />
              <Tooltip content={<EffTooltip />} />
              <Area type="monotone" dataKey="efficiency" stroke="#cfbcff" strokeWidth={2} fill="url(#effGrad)" dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ── ANOMALY PANEL ── */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '20px', gridColumn: '2', gridRow: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
          {isDiverged ? (
            <>
              {/* Pulse glow effect */}
              <div style={{ position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%)', animation: 'pulse 1.5s ease-in-out infinite' }} />
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#f87171', fontVariationSettings: "'FILL' 1", marginBottom: '1rem', position: 'relative', zIndex: 1 }}>warning</span>
              <p style={{ fontFamily: 'Space Grotesk', fontSize: '16px', fontWeight: 600, color: '#f87171', textAlign: 'center', position: 'relative', zIndex: 1 }}>Thermal Inefficiency Detected</p>
              <p style={{ fontFamily: 'Manrope', fontSize: '12px', color: '#948e9c', textAlign: 'center', marginTop: '0.5rem', position: 'relative', zIndex: 1 }}>Kalman residuals exceed threshold</p>
              <div style={{ marginTop: '1rem', padding: '0.4rem 1rem', borderRadius: '99px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', position: 'relative', zIndex: 1 }}>
                <span style={{ fontFamily: 'Space Grotesk', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#f87171' }}>System Diverged</span>
              </div>
            </>
          ) : (
            <>
              <div style={{ position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(74,222,128,0.1) 0%, transparent 70%)' }} />
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#4ade80', fontVariationSettings: "'FILL' 1", marginBottom: '1rem', position: 'relative', zIndex: 1 }}>verified</span>
              <p style={{ fontFamily: 'Space Grotesk', fontSize: '16px', fontWeight: 600, color: '#4ade80', textAlign: 'center', position: 'relative', zIndex: 1 }}>System Optimal</p>
              <p style={{ fontFamily: 'Manrope', fontSize: '12px', color: '#948e9c', textAlign: 'center', marginTop: '0.5rem', position: 'relative', zIndex: 1 }}>All zones within acceptable bounds</p>
              <div style={{ marginTop: '1rem', padding: '0.4rem 1rem', borderRadius: '99px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)', position: 'relative', zIndex: 1 }}>
                <span style={{ fontFamily: 'Space Grotesk', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4ade80' }}>Stable</span>
              </div>
            </>
          )}
        </div>

        {/* ── ENERGY DRAW BAR CHART ── */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '20px', gridColumn: '1', gridRow: '2', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          {/* Bar chart */}
          <div style={{ gridColumn: '1 / 3' }}>
            <p style={{ fontFamily: 'Space Grotesk', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#948e9c', marginBottom: '0.75rem' }}>Zone Energy Draw</p>
            <p style={{ fontFamily: 'Space Grotesk', fontSize: '28px', fontWeight: 600, color: '#cfbcff', marginBottom: '0.75rem' }}>
              {hvacPower.toFixed(1)}<span style={{ fontSize: '14px', color: '#948e9c', marginLeft: '6px' }}>kW total</span>
            </p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={zoneEnergy} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="zone" tick={{ fontFamily: 'Space Grotesk', fontSize: 10, fill: '#948e9c' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontFamily: 'Manrope', fontSize: 9, fill: '#948e9c' }} tickLine={false} axisLine={false} />
                <Tooltip content={<BarTooltip />} />
                <Bar dataKey="kw" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                  {zoneEnergy.map((entry, i) => (
                    <Cell key={i} fill={entry.color} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Zone temp breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.6rem' }}>
            {[
              { label: 'Driver', temp: zones.Z1.current_temp, residual: zones.Z1.residual },
              { label: 'Passenger', temp: zones.Z2.current_temp, residual: zones.Z2.residual },
              { label: 'Rear', temp: zones.Z3.current_temp, residual: zones.Z3.residual },
            ].map(({ label, temp, residual }) => (
              <div key={label} style={{ padding: '0.6rem 0.8rem', borderRadius: '10px', background: 'rgba(33,31,36,0.6)', border: '1px solid rgba(207,188,255,0.08)' }}>
                <p style={{ fontFamily: 'Space Grotesk', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#948e9c' }}>{label}</p>
                <p style={{ fontFamily: 'Manrope', fontSize: '18px', fontWeight: 600, color: '#e6e0e9', marginTop: '2px' }}>{temp?.toFixed(1)}°</p>
                <p style={{ fontFamily: 'Manrope', fontSize: '10px', color: residual > 0 ? '#f87171' : '#60a5fa', marginTop: '1px' }}>
                  {residual > 0 ? '+' : ''}{residual?.toFixed(2)}° residual
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT COLUMN: Subsystems + Topography ── */}
        <div style={{ gridColumn: '2', gridRow: '2', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Subsystems List */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '20px', flex: 1 }}>
            <p style={{ fontFamily: 'Space Grotesk', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#948e9c', marginBottom: '1rem' }}>Subsystems</p>
            <SubsystemRow icon="mode_fan" name="Intake Fans" status={anyDuctOpen && acOn ? 'ACTIVE' : 'IDLE'} active={anyDuctOpen && acOn} />
            <SubsystemRow icon="ac_unit" name="Compressor" status={acOn && anyDuctOpen ? 'ACTIVE' : 'OFF'} active={acOn && anyDuctOpen} />
            <SubsystemRow icon="heat" name="Condenser" status={acOn ? 'RUNNING' : 'STANDBY'} active={acOn} />
            <SubsystemRow icon="filter_alt" name="Cabin Filter" status={acOn ? 'FILTERING' : 'IDLE'} active={acOn} />
            <SubsystemRow icon="sensors" name="Kalman Filter" status="ACTIVE" active={true} />
          </div>

          {/* Cabin Topography */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '20px', display: 'flex', flexDirection: 'column', minHeight: '200px' }}>
            <p style={{ fontFamily: 'Space Grotesk', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#948e9c', marginBottom: '0.5rem' }}>Cabin Topography</p>
            <ThermalSnapshot zones={zones} setpoint={setpoint} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem' }}>
              {[{ label: 'Hot', color: 'rgba(239,68,68,0.7)' }, { label: 'Nominal', color: 'rgba(103,80,164,0.7)' }, { label: 'Cool', color: 'rgba(60,130,246,0.7)' }].map(({ label, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }} />
                  <span style={{ fontFamily: 'Manrope', fontSize: '10px', color: '#948e9c' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EfficiencyView;
