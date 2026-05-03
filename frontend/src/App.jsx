import React, { useState, useRef, useEffect } from 'react';
import { useTwinPolling } from './hooks/useTwinPolling';
import DashboardContainer from './components/DashboardContainer';
import ThermalMapView from './components/ThermalMapView';
import ControlRibbon from './components/ControlRibbon';
import EfficiencyView from './components/EfficiencyView';
import SystemFlowView from './components/SystemFlowView';

const App = () => {
  const [activeTab, setActiveTab] = useState('Diagnostics');
  const [isSimulationStarted, setIsSimulationStarted] = useState(false);
  const { twinData, loading, error } = useTwinPolling(isSimulationStarted);

  // Dropdown state
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  // Click-outside handler
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const [notifications, setNotifications] = useState([
    { dot: '#f87171', label: 'WARN', time: '17:22:41', msg: 'Z1 residual exceeded ±2.5°C threshold' },
    { dot: '#60a5fa', label: 'INFO', time: '17:21:08', msg: 'Kalman filter re-initialised for Z3' },
    { dot: '#60a5fa', label: 'INFO', time: '17:19:55', msg: 'Duct D2 transitioned → MEDIUM (50%)' },
    { dot: '#facc15', label: 'WARN', time: '17:18:30', msg: 'Solar load HIGH — AC compressor at max' },
  ]);


  return (
    <div className="bg-background text-on-background font-body-md text-body-md min-h-screen relative overflow-x-hidden antialiased">
      {/* Ambient Animated Heat Flow Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Deep Violet Glow */}
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-primary-container/20 blur-[120px] mix-blend-screen opacity-70"></div>
        {/* Beige/Cream Glow */}
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-tertiary-container/15 blur-[150px] mix-blend-screen opacity-60"></div>
        {/* Center Core Glow */}
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] rounded-full bg-primary/5 blur-[100px] mix-blend-screen opacity-50"></div>
      </div>

      {/* TopAppBar Component */}
      <nav className="fixed w-full top-0 z-50 bg-slate-950/30 backdrop-blur-2xl border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.5)] flex justify-between items-center px-8 py-4">
        {/* Brand Logo */}
        <div
          onClick={() => setIsSimulationStarted(false)}
          className="text-2xl font-black text-white tracking-tighter drop-shadow-[0_0_10px_rgba(103,80,164,0.6)] cursor-pointer hover:drop-shadow-[0_0_18px_rgba(167,139,250,0.8)] transition-all duration-300 select-none"
        >
          ThermoTwin
        </div>
        {/* Navigation Links */}
        <ul className="hidden md:flex items-center gap-8 font-['Space_Grotesk'] tracking-widest uppercase text-xs">
          {['Diagnostics', 'Thermal Map', 'System Flow', 'Efficiency'].map((tab) => (
            <li 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${activeTab === tab ? 'text-primary-fixed glow-text font-semibold' : 'text-slate-400 hover:text-purple-300'} transition-colors duration-300 active:scale-95 ease-in-out cursor-pointer`}
            >
              {tab}
            </li>
          ))}
        </ul>
        {/* Trailing Actions */}
        <div className="flex items-center gap-6">
          <span className="hidden lg:inline-block font-['Space_Grotesk'] tracking-widest uppercase text-xs text-slate-400">
            Live Status
          </span>
          <div className="flex items-center gap-4">

            {/* ── Notifications ── */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(o => !o)}
                className="active:scale-95 duration-200 ease-in-out flex items-center justify-center"
              >
                <span className="material-symbols-outlined transition-colors duration-300"
                  style={{ color: notifOpen ? '#c4b5fd' : '#a78bfa', fontVariationSettings: "'FILL' 1" }}
                >notifications_active</span>
                {/* Unread badge — hide when cleared */}
                {notifications.length > 0 && (
                  <span style={{ position: 'absolute', top: '-3px', right: '-3px', width: '8px', height: '8px', borderRadius: '50%', background: '#f87171', border: '1.5px solid #0f0f1a' }} />
                )}
              </button>

              {notifOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 14px)', right: 0,
                  width: '340px', borderRadius: '16px', zIndex: 200,
                  background: 'rgba(15,15,26,0.92)', backdropFilter: 'blur(24px)',
                  border: '1px solid rgba(167,139,250,0.2)',
                  boxShadow: '0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(167,139,250,0.05)'
                }}>
                  <div style={{ padding: '1rem 1.25rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'Space Grotesk', fontSize: '13px', fontWeight: 600, color: '#e2e8f0', letterSpacing: '0.05em' }}>Event Log</span>
                    <span
                      onClick={() => setNotifications([])}
                      style={{ fontFamily: 'Space Grotesk', fontSize: '10px', color: '#a78bfa', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                    >Clear All</span>
                  </div>
                  <div style={{ padding: '0.5rem 0', minHeight: '2rem' }}>
                    {notifications.length === 0 ? (
                      <p style={{ fontFamily: 'Manrope', fontSize: '12px', color: '#334155', textAlign: 'center', padding: '1rem 0' }}>No events to display.</p>
                    ) : notifications.map((n, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.7rem 1.25rem', cursor: 'default', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(167,139,250,0.06)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <div style={{ marginTop: '5px', width: '7px', height: '7px', borderRadius: '50%', background: n.dot, boxShadow: `0 0 6px ${n.dot}`, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <span style={{ fontFamily: 'Space Grotesk', fontSize: '10px', fontWeight: 700, color: n.dot, letterSpacing: '0.1em' }}>{n.label}</span>
                            <span style={{ fontFamily: 'Manrope', fontSize: '10px', color: '#475569' }}>{n.time}</span>
                          </div>
                          <p style={{ fontFamily: 'Manrope', fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>{n.msg}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </nav>

      {/* Main Content Canvas */}
      <main className="relative z-10 flex flex-col items-center w-full px-md md:px-safe-area pt-[120px] pb-safe-area">
        {isSimulationStarted ? (
          activeTab === 'Diagnostics' ? (
            <DashboardContainer twinData={twinData} />
          ) : activeTab === 'Thermal Map' ? (
            <ThermalMapView twinData={twinData} />
          ) : activeTab === 'Efficiency' ? (
            <EfficiencyView twinData={twinData} />
          ) : activeTab === 'System Flow' ? (
            <SystemFlowView twinData={twinData} />
          ) : (
            <div className="w-full h-[calc(100vh-120px)] flex items-center justify-center font-h3 text-2xl text-primary-fixed-dim">
              {activeTab} Module In Development...
            </div>
          )
        ) : (
          <>
            {/* Hero Section */}
            <header className="flex flex-col items-center text-center max-w-4xl mx-auto mt-xl">
              <h1 className="font-h1 text-h1 text-on-background tracking-tight glow-text leading-[1.1]">
                ThermoTwin —<br />
                <span className="text-primary-fixed-dim">The Intelligence Behind Cabin Comfort</span>
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant mt-lg max-w-2xl mx-auto">
                Experience a living, breathing digital twin of your vehicle's thermal environment. Predict, adapt, and optimize passenger comfort with sub-degree precision through an immersive, cinematic interface.
              </p>
              {/* CTA Button */}
              <button 
                onClick={() => setIsSimulationStarted(true)}
                disabled={isSimulationStarted}
                className="mt-xl px-10 py-4 rounded-full border-[1.5px] border-primary/40 bg-transparent backdrop-blur-md shadow-[0_0_20px_rgba(207,188,255,0.15)] transition-all duration-500 ease-in-out hover:border-tertiary hover:bg-tertiary/10 hover:shadow-[0_0_30px_rgba(231,195,101,0.25)] hover:scale-[1.02] active:scale-95 group flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed">
                <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest group-hover:text-tertiary transition-colors duration-500">
                  {isSimulationStarted ? "Simulation Running..." : "Enter Simulation"}
                </span>
                <span className="material-symbols-outlined text-primary group-hover:text-tertiary transition-colors duration-500 text-sm">
                  arrow_forward
                </span>
              </button>
            </header>

            {/* Floating Dashboard Preview (Hero Image) */}
            <div className="mt-24 w-full max-w-6xl glass-panel rounded-2xl p-[2px] relative overflow-hidden group hover:shadow-[0_0_60px_rgba(103,80,164,0.3)] transition-all duration-700 ease-in-out">
              {/* Simulated glowing bezel */}
              <div className="absolute inset-0 rounded-2xl border border-white/5 pointer-events-none z-20"></div>
              <div className="relative w-full aspect-[16/9] rounded-[14px] overflow-hidden bg-surface-container-lowest">
                {/* Placeholder for Dashboard Image */}
                <img alt="ThermoTwin Live Simulation Dashboard" className="w-full h-full object-cover mix-blend-luminosity opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-[1500ms] ease-in-out" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC9eMtdDVKHbkEXI_z-qVuIvnMna1Exzq5RC-Wy-wlUU5Nl-dF_739Q_FBYo5gSMat-pstXh_En3U4wRCqPGfbA-8tEjN6WIuZThwpKVZp_rxSjdlzMoPB31t6Fl2xubhjKUKP8mYnrtGmGmZ--39QJAHJg3gxTk6hVCHSnHqtTHFzIf5VhNXMmdWH94syX-4r_0epn5l5-2zKyRlrFLyj-s9rwdYgSdk7tqxJI-bf-IROjXpPxyy63PDKWGOimuoA--0dod8zuIrBc" />
                {/* Overlay UI Elements mimicking Live System Modeling */}
                <div className="absolute bottom-6 left-6 flex gap-4 z-10">
                  <div className="px-4 py-2 rounded-lg bg-surface-container/60 backdrop-blur-md border border-primary/20 flex flex-col">
                    <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Ambient Temp</span>
                    <span className="font-h3 text-h3 text-primary-fixed mt-1">72.4°F</span>
                  </div>
                  <div className="px-4 py-2 rounded-lg bg-surface-container/60 backdrop-blur-md border border-primary/20 flex flex-col">
                    <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">System Load</span>
                    <span className="font-h3 text-h3 text-tertiary mt-1">34%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Highlights Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-panel-gap mt-xl w-full max-w-6xl pb-xl">
              {/* Feature 1 */}
              <div className="glass-panel rounded-xl p-6 flex flex-col items-start group hover:bg-surface-container-high/30 transition-colors duration-500">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 mb-md shadow-[0_0_15px_rgba(207,188,255,0.2)] group-hover:shadow-[0_0_25px_rgba(207,188,255,0.4)] transition-shadow duration-500">
                  <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>thermostat_carbon</span>
                </div>
                <h3 className="font-h3 text-lg text-on-background mb-2">Predictive Thermal Mapping</h3>
                <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
                  Utilizes deep learning to anticipate passenger discomfort before it occurs, adjusting zonal airflow dynamically based on real-time solar load and biometric feedback.
                </p>
              </div>
              {/* Feature 2 */}
              <div className="glass-panel rounded-xl p-6 flex flex-col items-start group hover:bg-surface-container-high/30 transition-colors duration-500">
                <div className="w-12 h-12 rounded-full bg-tertiary/10 flex items-center justify-center border border-tertiary/20 mb-md shadow-[0_0_15px_rgba(231,195,101,0.2)] group-hover:shadow-[0_0_25px_rgba(231,195,101,0.4)] transition-shadow duration-500">
                  <span className="material-symbols-outlined text-tertiary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>air</span>
                </div>
                <h3 className="font-h3 text-lg text-on-background mb-2">Fluid Dynamics Engine</h3>
                <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
                  A cinematic, real-time visualization of cabin airflow. Watch as intelligent vents sculpt the atmosphere, creating invisible curtains of temperate air around each occupant.
                </p>
              </div>
              {/* Feature 3 */}
              <div className="glass-panel rounded-xl p-6 flex flex-col items-start group hover:bg-surface-container-high/30 transition-colors duration-500">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 mb-md shadow-[0_0_15px_rgba(207,188,255,0.2)] group-hover:shadow-[0_0_25px_rgba(207,188,255,0.4)] transition-shadow duration-500">
                  <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>energy_savings_leaf</span>
                </div>
                <h3 className="font-h3 text-lg text-on-background mb-2">Calm Efficiency</h3>
                <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
                  Maximum comfort with minimal acoustic intrusion and energy draw. The system silently balances thermodynamic loads, extending EV range while maintaining a pristine cabin climate.
                </p>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Control Ribbon — always visible during simulation, across all tabs */}
      {isSimulationStarted && <ControlRibbon />}
    </div>
  );
};

export default App;
