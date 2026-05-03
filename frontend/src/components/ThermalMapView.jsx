import React from 'react';

// Maps a temperature deviation from setpoint to a visual intensity (0–1)
const devToIntensity = (temp, setpoint) => {
  const dev = Math.abs(temp - setpoint);
  return Math.min(dev / 6, 1); // max intensity at 6°C deviation
};

const getTempColor = (temp, setpoint) => {
  if (temp > setpoint + 2) return { text: 'text-error', rgb: '239,68,68' };
  if (temp < setpoint - 2) return { text: 'text-blue-300', rgb: '60,130,246' };
  return { text: 'text-on-surface', rgb: '207,188,255' };
};

const ThermalBlob = ({ temp, setpoint, label, style, pulseClass, hasPassenger }) => {
  const intensity = devToIntensity(temp, setpoint);
  const color = getTempColor(temp, setpoint);
  const isHot = temp > setpoint + 2;
  const isCool = temp < setpoint - 2;

  // Scale blob size based on deviation — capped tightly so blobs don't overwhelm the canvas
  const size = 140 + intensity * 20;

  const passengerBorder = hasPassenger 
    ? `2px solid rgba(74,222,128,0.8)` 
    : `1px solid rgba(${color.rgb},${0.15 + intensity * 0.3})`;
    
  const passengerGlow = hasPassenger 
    ? `0 0 20px rgba(74,222,128,0.4), inset 0 0 15px rgba(74,222,128,0.2), ` 
    : ``;

  const blobStyle = {
    width: `${size}px`,
    height: `${size * 1.15}px`,
    background: isHot
      ? `radial-gradient(circle at center, rgba(239,68,68,${0.15 + intensity * 0.25}) 0%, rgba(33,31,36,0.05) 70%)`
      : isCool
      ? `radial-gradient(circle at center, rgba(60,130,246,${0.15 + intensity * 0.25}) 0%, rgba(33,31,36,0.05) 70%)`
      : `radial-gradient(circle at center, rgba(103,80,164,${0.15 + intensity * 0.2}) 0%, rgba(33,31,36,0.05) 70%)`,
    boxShadow: `${passengerGlow}inset 0 0 ${20 + intensity * 30}px rgba(${color.rgb},${0.1 + intensity * 0.2}), 0 0 ${30 + intensity * 40}px rgba(${color.rgb},${0.15 + intensity * 0.25})`,
    border: passengerBorder,
    transition: 'all 0.6s ease-in-out',
    backdropFilter: 'blur(20px)',
    borderRadius: style?.borderRadius || '40%',
    ...style,
  };

  return (
    <div
      className={`absolute flex flex-col items-center justify-center cursor-pointer ${pulseClass}`}
      style={blobStyle}
    >
      <span className={`font-h2 text-h2 ${color.text} transition-all duration-500`}
        style={{ fontSize: `${28 + intensity * 6}px`, fontFamily: 'Space Grotesk', fontWeight: 500 }}>
        {temp.toFixed(1)}°
      </span>
      <span className="font-label-caps text-label-caps text-on-surface-variant mt-1 tracking-widest"
        style={{ fontSize: '11px', fontFamily: 'Space Grotesk' }}>
        {label}
      </span>
      {/* Deviation badge */}
      <span className={`mt-1 text-[9px] font-semibold tracking-wider ${color.text} opacity-70`}
        style={{ fontFamily: 'Manrope' }}>
        {temp > setpoint ? '+' : ''}{(temp - setpoint).toFixed(2)}°
      </span>
    </div>
  );
};

const DuctSlider = ({ label, percentage, acOn }) => {
  const pct = Math.max(0, Math.min(100, percentage));
  const fillStyle = acOn
    ? {
        background: 'linear-gradient(to top, rgba(60,130,246,0.2), rgba(60,130,246,0.9))',
        boxShadow: '0 0 15px rgba(60,130,246,0.5)',
      }
    : {
        background: 'linear-gradient(to top, rgba(103,80,164,0.2), rgba(207,188,255,0.8))',
        boxShadow: '0 0 15px rgba(207,188,255,0.4)',
      };

  return (
    <div className="flex flex-col items-center gap-2 h-full justify-end">
      <span className="font-label-caps text-on-surface-variant" style={{ fontSize: '11px', fontFamily: 'Space Grotesk', letterSpacing: '0.1em' }}>
        {label}
      </span>
      <div className="slider-track" style={{ width: '16px', height: '192px' }}>
        <div
          className="slider-fill"
          style={{ height: `${pct}%`, transition: 'height 0.6s ease', ...fillStyle }}
        />
        <div
          className="slider-thumb"
          style={{ bottom: `${pct}%`, transition: 'bottom 0.6s ease' }}
        />
      </div>
      <span style={{ fontFamily: 'Manrope', fontSize: '10px', color: acOn ? 'rgba(60,130,246,0.8)' : 'rgba(207,188,255,0.6)' }}>
        {pct}%
      </span>
    </div>
  );
};

const ThermalMapView = ({ twinData }) => {
  if (!twinData || !twinData.digital_twin) {
    return (
      <div className="fixed inset-0 top-[72px] flex items-center justify-center font-h3 text-2xl text-primary-fixed-dim animate-pulse">
        Connecting to Twin...
      </div>
    );
  }

  const { zones } = twinData.digital_twin;
  const acOn = twinData.active_controls?.ac_on || false;
  const setpoint = twinData.active_controls?.setpoint || 24.0;
  const solar = twinData.active_controls?.solar_intensity ?? 0.5;
  const occupants = twinData.active_controls?.occupants_count || 0;
  const occupancyArr = twinData.active_controls?.occupancy_array || [false, false, false, false];
  const hvacPower = acOn ? 14.0 : 0.1;
  const trendRate = twinData.ml_insights?.trend_rate || 0;
  const ts = twinData.timestamp ? new Date(twinData.timestamp) : null;
  const timeStr = ts
    ? `${ts.getHours().toString().padStart(2, '0')}:${ts.getMinutes().toString().padStart(2, '0')}:${ts.getSeconds().toString().padStart(2, '0')}`
    : '--:--:--';

  const avgResidual = (
    Math.abs(zones.Z1.residual || 0) +
    Math.abs(zones.Z2.residual || 0) +
    Math.abs(zones.Z3.residual || 0)
  ) / 3;
  const cabinQuality = Math.max(0, Math.min(100, 100 - avgResidual * 10)).toFixed(0);
  const sysStatus = twinData.digital_twin?.system_status || 'STABLE';

  // Overall cabin temperature for background glow intensity
  const avgTemp = (zones.Z1.current_temp + zones.Z2.current_temp + zones.Z3.current_temp) / 3;
  const avgIntensity = devToIntensity(avgTemp, setpoint);

  // Duct data (fixed path to include .ducts)
  const d1 = twinData.hvac_control?.ducts?.D1?.percentage ?? 0;
  const d2 = twinData.hvac_control?.ducts?.D2?.percentage ?? 0;
  const d3 = twinData.hvac_control?.ducts?.D3?.percentage ?? 0;
  const d4 = twinData.hvac_control?.ducts?.D4?.percentage ?? 0;
  const d5 = twinData.hvac_control?.ducts?.D5?.percentage ?? 0;

  // Pulse speed based on trend
  const pulseClass = trendRate > 0.05 ? 'pulse-fast' : 'pulse-slow';

  // Dynamic ambient glow color based on avg temperature
  const glowColor = avgTemp > setpoint + 2
    ? 'rgba(239,68,68,0.08)'
    : avgTemp < setpoint - 2
    ? 'rgba(60,130,246,0.08)'
    : 'rgba(103,80,164,0.08)';

  return (
    <div
      className="relative w-full"
      style={{ minHeight: 'calc(100vh - 120px)', paddingBottom: '8rem' }}
    >
      {/* Dynamic ambient background that shifts with temperature */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-1000"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${glowColor} 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(103,80,164,0.05) 0%, transparent 40%)`,
        }}
      />

      {/* ── LEFT PANEL ── */}
      <aside
        className="relative z-20 glass-panel flex flex-col mt-6 ml-6 mb-24"
        style={{ width: '22rem', padding: '1.5rem', height: 'fit-content' }}
      >
        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '20px', fontWeight: 500, color: '#cfbcff', marginBottom: '1.5rem' }}>
          System Status
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
          {/* Live clock */}
          <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(33,31,36,0.6)', border: '1px solid rgba(207,188,255,0.1)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span className="material-symbols-outlined" style={{ color: '#cfbcff', fontVariationSettings: "'FILL' 1", fontSize: '24px' }}>schedule</span>
            <div>
              <p style={{ fontFamily: 'Space Grotesk', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#948e9c' }}>Last Update</p>
              <p style={{ fontFamily: 'Manrope', fontSize: '20px', color: '#e6e0e9', marginTop: '2px' }}>{timeStr}</p>
            </div>
          </div>

          {/* Status badge */}
          <div style={{ padding: '1rem', borderRadius: '12px', background: sysStatus === 'STABLE' ? 'rgba(74,222,128,0.05)' : 'rgba(239,68,68,0.05)', border: `1px solid ${sysStatus === 'STABLE' ? 'rgba(74,222,128,0.2)' : 'rgba(239,68,68,0.2)'}`, display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span className="material-symbols-outlined" style={{ color: sysStatus === 'STABLE' ? '#4ade80' : '#f87171', fontVariationSettings: "'FILL' 1", fontSize: '24px' }}>
              {sysStatus === 'STABLE' ? 'check_circle' : 'warning'}
            </span>
            <div>
              <p style={{ fontFamily: 'Space Grotesk', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#948e9c' }}>System</p>
              <p style={{ fontFamily: 'Space Grotesk', fontSize: '18px', fontWeight: 600, color: sysStatus === 'STABLE' ? '#4ade80' : '#f87171', marginTop: '2px' }}>{sysStatus}</p>
            </div>
          </div>

          {/* HVAC Power */}
          <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(33,31,36,0.6)', border: '1px solid rgba(207,188,255,0.1)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span className="material-symbols-outlined" style={{ color: acOn ? '#cfbcff' : '#948e9c', fontVariationSettings: "'FILL' 1", fontSize: '24px', transition: 'color 0.5s' }}>battery_charging_full</span>
            <div>
              <p style={{ fontFamily: 'Space Grotesk', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#948e9c' }}>HVAC Power</p>
              <p style={{ fontFamily: 'Space Grotesk', fontSize: '26px', fontWeight: 500, color: '#e6e0e9', marginTop: '2px', transition: 'all 0.5s' }}>
                {hvacPower.toFixed(1)}<span style={{ fontSize: '16px', color: '#948e9c', marginLeft: '6px' }}>kW</span>
              </p>
            </div>
          </div>

          {/* Cabin Quality */}
          <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(33,31,36,0.6)', border: '1px solid rgba(207,188,255,0.1)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span className="material-symbols-outlined" style={{ color: '#e7c365', fontVariationSettings: "'FILL' 1", fontSize: '24px' }}>air</span>
            <div>
              <p style={{ fontFamily: 'Space Grotesk', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#948e9c' }}>Cabin Quality</p>
              <p style={{ fontFamily: 'Space Grotesk', fontSize: '26px', fontWeight: 500, color: '#e6e0e9', marginTop: '2px', transition: 'all 0.5s' }}>
                {cabinQuality}<span style={{ fontSize: '16px', color: '#948e9c', marginLeft: '6px' }}>%</span>
              </p>
            </div>
          </div>

          {/* Trend rate */}
          <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(33,31,36,0.6)', border: '1px solid rgba(207,188,255,0.1)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span className="material-symbols-outlined" style={{ color: trendRate > 0 ? '#f87171' : '#60a5fa', fontVariationSettings: "'FILL' 1", fontSize: '24px', transition: 'color 0.5s' }}>
              {trendRate > 0.01 ? 'trending_up' : trendRate < -0.01 ? 'trending_down' : 'trending_flat'}
            </span>
            <div>
              <p style={{ fontFamily: 'Space Grotesk', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#948e9c' }}>Trend</p>
              <p style={{ fontFamily: 'Manrope', fontSize: '20px', color: trendRate > 0 ? '#f87171' : '#60a5fa', marginTop: '2px', transition: 'all 0.5s' }}>
                {trendRate > 0 ? '+' : ''}{(trendRate * 1000).toFixed(3)} °C/s
              </p>
            </div>
          </div>

          {/* Environment Factors */}
          <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(33,31,36,0.6)', border: '1px solid rgba(207,188,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="material-symbols-outlined" style={{ color: '#cfbcff', fontVariationSettings: "'FILL' 1", fontSize: '20px' }}>group</span>
              <div>
                <p style={{ fontFamily: 'Space Grotesk', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#948e9c' }}>Passengers</p>
                <p style={{ fontFamily: 'Space Grotesk', fontSize: '16px', fontWeight: 600, color: '#e6e0e9' }}>{occupants}</p>
              </div>
            </div>
            <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.1)' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="material-symbols-outlined" style={{ color: '#e7c365', fontVariationSettings: "'FILL' 1", fontSize: '20px' }}>light_mode</span>
              <div>
                <p style={{ fontFamily: 'Space Grotesk', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#948e9c' }}>Solar Load</p>
                <p style={{ fontFamily: 'Space Grotesk', fontSize: '16px', fontWeight: 600, color: '#e6e0e9' }}>{solar * 100}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Setpoint display */}
        <div style={{ marginTop: '1.5rem', padding: '1.25rem', borderRadius: '12px', background: 'rgba(103,80,164,0.1)', border: '1px solid rgba(207,188,255,0.15)', textAlign: 'center' }}>
          <p style={{ fontFamily: 'Space Grotesk', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#948e9c' }}>Setpoint</p>
          <p style={{ fontFamily: 'Space Grotesk', fontSize: '36px', fontWeight: 600, color: '#cfbcff', marginTop: '0.25rem' }}>{setpoint.toFixed(1)}°C</p>
        </div>
      </aside>

      {/* ── CENTER CANVAS ── */}
      <div
        className="absolute flex items-center justify-center"
        style={{ left: '26rem', right: '26rem', top: '1.5rem', bottom: '1.5rem', minHeight: '800px' }}
      >
        {/* Car blueprint (Rotated to be vertical) */}
        <div
          className="absolute inset-0 bg-contain bg-center bg-no-repeat pointer-events-none"
          style={{
            backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAJbcm76eD4EgBsBImEyuf4lNH4sdRbwQ2rcoFj1Yxopn067nUbl38-GXOnP2krIXZwx_D5x6zIj578cCK7gWHh7nMKDVirXpz3BuinXtBCsl-fkYThdnMqANpYxKyIDPyXXL3E0AXtOcp68HBYgvJTqXZMXCja1bypgog1TU3v4015X609NCI1rTUrE2a4MJrZqk74hn16FaOWUq6tcdjUULmGfkDbaKKcd_qEIqcMflcWBpkYzShRdP8O1eAx5wnav_M_wpyoUrPl')",
            opacity: 0.45 + avgIntensity * 0.15,
            mixBlendMode: 'screen',
            transform: 'rotate(90deg) scale(1.1)',
            transition: 'opacity 1s ease',
            maskImage: 'radial-gradient(ellipse at center, black 55%, transparent 82%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 55%, transparent 82%)',
          }}
        />

        {/* Solar Intensity Glow / Night Shadow overlaying the car */}
        <div 
          className="absolute inset-0 pointer-events-none transition-all duration-1000 z-10"
          style={{
            background: solar > 0 
              ? `radial-gradient(ellipse at 50% 30%, rgba(253, 224, 71, ${solar * 0.35}) 0%, transparent 70%)`
              : `radial-gradient(ellipse at 50% 50%, rgba(0, 0, 0, 0.9) 0%, transparent 80%)`
          }}
        />

        {/* Front Left — Driver (Z1) - positioned top left for vertical car */}
        <ThermalBlob
          temp={zones.Z1.current_temp}
          setpoint={setpoint}
          label="Driver"
          pulseClass={pulseClass}
          hasPassenger={occupancyArr[0]}
          style={{ top: '25%', left: '28%', borderRadius: '40%', zIndex: 20 }}
        />

        {/* Front Right — Passenger (Z2) - positioned top right for vertical car */}
        <ThermalBlob
          temp={zones.Z2.current_temp}
          setpoint={setpoint}
          label="Passenger"
          pulseClass={pulseClass}
          hasPassenger={occupancyArr[1]}
          style={{ top: '25%', right: '28%', borderRadius: '35%', zIndex: 20 }}
        />

        {/* Rear Single Zone — Z3 - Rectangular, perfectly centered */}
        <ThermalBlob
          temp={zones.Z3.current_temp}
          setpoint={setpoint}
          label="Rear Cabin"
          pulseClass={pulseClass}
          hasPassenger={occupancyArr[2] || occupancyArr[3]}
          style={{ position: 'absolute', top: '57%', left: 'calc(50% - 150px)', width: '300px', height: '180px', borderRadius: '30px', zIndex: 20 }}
        />


      </div>

      {/* ── RIGHT PANEL — Flow Dynamics ── */}
      <aside
        className="absolute z-20 glass-panel flex flex-col"
        style={{ right: '1.5rem', top: '1.5rem', width: '22rem', padding: '1.5rem', height: 'fit-content' }}
      >
        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '20px', fontWeight: 500, color: '#cfbcff', marginBottom: '1.5rem' }}>
          Flow Dynamics
        </h2>

        {/* Strategy badge */}
        <div style={{ marginBottom: '1rem', padding: '0.5rem 0.75rem', borderRadius: '8px', background: acOn ? 'rgba(60,130,246,0.1)' : 'rgba(103,80,164,0.1)', border: `1px solid ${acOn ? 'rgba(60,130,246,0.3)' : 'rgba(207,188,255,0.2)'}`, textAlign: 'center', transition: 'all 0.5s' }}>
          <span style={{ fontFamily: 'Space Grotesk', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: acOn ? '#60a5fa' : '#cfbcff' }}>
            {twinData.hvac_control?.overall_strategy?.replace('_', ' ') || (acOn ? 'COOLING' : 'STANDBY')}
          </span>
        </div>

        {/* Duct sliders */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', paddingBottom: '1rem' }}>
          <DuctSlider label="FL" percentage={d1} acOn={acOn} />
          <DuctSlider label="FR" percentage={d3} acOn={acOn} />
          <DuctSlider label="RL" percentage={d5} acOn={acOn} />
          <DuctSlider label="RR" percentage={d5} acOn={acOn} />
        </div>

        {/* Zone residuals */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ fontFamily: 'Space Grotesk', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#948e9c', marginBottom: '0.25rem' }}>Zone Residuals</p>
          {[
            { id: 'Z1', label: 'Driver', val: zones.Z1.residual },
            { id: 'Z2', label: 'Passenger', val: zones.Z2.residual },
            { id: 'Z3', label: 'Rear', val: zones.Z3.residual },
          ].map(({ id, label, val }) => (
            <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem', borderRadius: '8px', background: 'rgba(33,31,36,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontFamily: 'Space Grotesk', fontSize: '11px', color: '#948e9c' }}>{label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: `${Math.min(Math.abs(val || 0) * 30, 60)}px`, height: '4px', borderRadius: '2px', background: val > 0 ? 'rgba(239,68,68,0.7)' : 'rgba(60,130,246,0.7)', transition: 'width 0.6s ease' }} />
                <span style={{ fontFamily: 'Manrope', fontSize: '12px', fontWeight: 600, color: val > 0 ? '#f87171' : val < 0 ? '#60a5fa' : '#948e9c', transition: 'color 0.5s', minWidth: '48px', textAlign: 'right' }}>
                  {val > 0 ? '+' : ''}{(val || 0).toFixed(2)}°
                </span>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
};

export default ThermalMapView;
