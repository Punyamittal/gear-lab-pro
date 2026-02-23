import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import {
  simulateAcceleration, generateTractiveCurves, simulateSkidpad, simulateAutocross, type SimPoint,
} from '@/lib/physics';
import {
  classicalOptimize, quantumAnnealingOptimize, swarmOptimize, geneticOptimize,
  type OptimizationResult, type AnnealingStep, type SwarmStep, type GeneticStep,
} from '@/lib/optimizer';
import { MASTER_DATASET, type MasterDataset } from '@/lib/master-dataset';
import SwarmCanvas from '@/components/SwarmCanvas';
import QuantumVisualizer from '@/components/QuantumVisualizer';
import GeneticVisualizer from '@/components/GeneticVisualizer';
import TelemetryConsole from '@/components/TelemetryConsole';
import PremiumLineChart from '@/components/ui/premium-line-chart';
import { LeverSlider } from '@/components/ui/LeverSlider';
import { LeverSwitch } from '@/components/ui/LeverSwitch';
import { RadarChart } from '@/components/ui/radar-chart';
import { TreemapChart } from '@/components/ui/treemap-chart';
import { StackedAreasChart } from '@/components/ui/stacked-areas';
import AIAdvisor from '@/components/AIAdvisor';
import { DigitalTwin } from '@/components/DigitalTwin';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { letterFrequency } from '@visx/mock-data';

const CHART_COLORS = {
  cyan: 'hsl(185, 100%, 50%)',
  green: 'hsl(155, 100%, 50%)',
  orange: 'hsl(30, 100%, 55%)',
  purple: 'hsl(270, 100%, 65%)',
  red: 'hsl(0, 100%, 60%)',
};

const GearOptDashboard = () => {
  const [dataset, setDataset] = useState<MasterDataset>({ ...MASTER_DATASET });
  const [simData, setSimData] = useState<SimPoint[]>([]);
  const [eventResults, setEventResults] = useState<{ accel: number; skidpad: number; autocross: number }>({ accel: 0, skidpad: 0, autocross: 0 });
  const [optimizedResult, setOptimizedResult] = useState<OptimizationResult | null>(null);
  const [activeTab, setActiveTab] = useState<'sim' | 'quantum' | 'swarm' | 'dna' | 'analytics' | 'ai' | 'twin'>('sim');
  const [logs, setLogs] = useState<string[]>(['[SYSTEM] GearOpt X initialized.', '[SYSTEM] Master Dataset Loaded.']);
  const [isRunning, setIsRunning] = useState(false);
  const [replayProgress, setReplayProgress] = useState(0);
  const [useLaunchControl, setUseLaunchControl] = useState(true);
  const [activeAero, setActiveAero] = useState(false);

  // Optimization data
  const [annealingSteps, setAnnealingSteps] = useState<AnnealingStep[]>([]);
  const [swarmSteps, setSwarmSteps] = useState<SwarmStep[]>([]);
  const [geneticSteps, setGeneticSteps] = useState<GeneticStep[]>([]);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [...prev.slice(-50), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  const runSim = useCallback(() => {
    const data = simulateAcceleration(dataset, 75);
    const skidpad = simulateSkidpad(dataset);
    const autocross = simulateAutocross(dataset);

    setSimData(data);
    setEventResults({
      accel: data.length > 0 ? data[data.length - 1].time : 0,
      skidpad,
      autocross
    });

    if (data.length > 0) {
      addLog(`SIM: Accel ${data[data.length - 1].time.toFixed(3)}s | Skidpad ${skidpad.toFixed(3)}s | AutoX ${autocross.toFixed(2)}s`);

      // Start replay animation
      setReplayProgress(0);
      let p = 0;
      const interval = setInterval(() => {
        p += 2;
        if (p > 100) {
          setReplayProgress(100);
          clearInterval(interval);
        } else {
          setReplayProgress(p);
        }
      }, 30);
    }
  }, [dataset, addLog]);

  useEffect(() => { runSim(); }, [dataset]);

  const runClassical = useCallback(() => {
    setIsRunning(true);
    addLog('CLASSICAL: Starting grid search...');
    setTimeout(() => {
      const result = classicalOptimize(dataset, 500);
      setOptimizedResult(result);
      addLog(`CLASSICAL: Found set [${result.gearRatios.join(', ')}] | ${result.accelTime.toFixed(3)}s`);
      setIsRunning(false);
    }, 100);
  }, [dataset, addLog]);

  const runQuantum = useCallback(() => {
    setIsRunning(true);
    setActiveTab('quantum');
    setAnnealingSteps([]); // Reset
    addLog('QUANTUM: Initializing simulator...');

    setTimeout(() => {
      const steps: AnnealingStep[] = [];
      quantumAnnealingOptimize(dataset, 300, (step) => { steps.push(step); });
      setAnnealingSteps(steps);
      const best = steps.reduce((a, b) => a.fitness > b.fitness ? a : b);
      addLog(`QUANTUM: Optimization complete. Fitness ${best.fitness.toFixed(4)}`);
      setIsRunning(false);
    }, 100);
  }, [dataset, addLog]);

  const runSwarm = useCallback(() => {
    setIsRunning(true);
    setActiveTab('swarm');
    setSwarmSteps([]); // Reset
    addLog('SWARM: Spawning particles...');

    setTimeout(() => {
      const steps: SwarmStep[] = [];
      const result = swarmOptimize(dataset, 50, 100, (step) => { steps.push(step); });
      setSwarmSteps(steps);
      setOptimizedResult(result);
      addLog(`SWARM: Global best found at ${result.accelTime.toFixed(3)}s`);
      setIsRunning(false);
    }, 100);
  }, [dataset, addLog]);

  const runGenetic = useCallback(() => {
    setIsRunning(true);
    setActiveTab('dna');
    setGeneticSteps([]); // Reset
    addLog('DNA: Evolution started...');

    setTimeout(() => {
      const steps: GeneticStep[] = [];
      const result = geneticOptimize(dataset, 80, 200, (step) => { steps.push(step); });
      setGeneticSteps(steps);
      setOptimizedResult(result);
      addLog(`DNA: Champion evolved in 200 gens: ${result.accelTime.toFixed(3)}s`);
      setIsRunning(false);
    }, 100);
  }, [dataset, addLog]);

  const runDemo = useCallback(async () => {
    addLog('═══ RACING SYSTEMS DEMO ═══');
    runSim();
    await new Promise(r => setTimeout(r, 800));
    runClassical();
    await new Promise(r => setTimeout(r, 1500));
    runQuantum();
    await new Promise(r => setTimeout(r, 2500));
    runSwarm();
    await new Promise(r => setTimeout(r, 2500));
    runGenetic();
  }, [runSim, runClassical, runQuantum, runSwarm, runGenetic, addLog]);

  const updateGear = (idx: number, val: number) => {
    const newGears = [...dataset.gearbox.gears];
    newGears[idx] = val;
    setDataset({ ...dataset, gearbox: { ...dataset.gearbox, gears: newGears } });
  };

  const tractiveCurves = generateTractiveCurves(dataset);
  const gearCharts = [1, 2, 3, 4, 5, 6].map(g => tractiveCurves.filter(p => p.gear === g));

  // Merge tractive data by speed for chart
  const tractiveChartData = gearCharts[0].map((p, i) => ({
    speed: p.speed,
    gear1: p.force,
    gear2: gearCharts[1][i]?.force || 0,
    gear3: gearCharts[2][i]?.force || 0,
    gear4: gearCharts[3][i]?.force || 0,
    gear5: gearCharts[4][i]?.force || 0,
    gear6: gearCharts[5][i]?.force || 0,
  }));

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden font-sans select-none relative">
      <div className="ambient-drift" />
      <header className="h-14 flex items-center justify-between px-6 border-b border-panel bg-panel/30 backdrop-blur-xl relative sweep-line z-10">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse-neon shadow-[0_0_12px_hsl(var(--neon-green))]" />
            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-accent animate-ping opacity-25" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-display text-base tracking-[0.4em] uppercase neon-text-cyan leading-none font-black">
              GearOpt Pro
            </h1>
            <span className="text-[9px] text-muted-foreground font-mono tracking-widest mt-1 opacity-60 uppercase">High Fidelity Simulation Engine</span>
          </div>
          <div className="h-6 w-[1px] bg-panel mx-2" />
          <span className="text-muted-foreground text-[10px] font-mono border border-panel px-2 py-0.5 rounded-md bg-background/40">
            FSAE-SPEC • V2.5.0
          </span>
          {replayProgress > 0 && replayProgress < 100 && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 animate-pulse">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span className="text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-widest">Twin Sync Active</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end mr-4">
            <span className="text-[9px] font-mono text-muted-foreground uppercase opacity-40">System Latency</span>
            <span className="text-[10px] font-mono text-accent">0.24ms</span>
          </div>
          <PremiumButton
            onClick={runDemo}
            disabled={isRunning}
            className="min-w-[200px]"
          >
            ▶ Master Simulation
          </PremiumButton>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden z-10">
        {/* LEFT — Inputs */}
        <aside className="w-80 border-r border-panel bg-panel overflow-y-auto p-4 flex flex-col gap-4 relative z-20">
          <Section title="VEHICLE PARAMETERS">
            <SliderRow label="Mass (kg)" value={dataset.vehicle.mass_kg} min={200} max={400} step={1}
              onChange={(v) => setDataset({ ...dataset, vehicle: { ...dataset.vehicle, mass_kg: v } })} />
            <SliderRow label="Wheelbase (m)" value={dataset.vehicle.wheelbase_m} min={1.4} max={1.8} step={0.01}
              onChange={(v) => setDataset({ ...dataset, vehicle: { ...dataset.vehicle, wheelbase_m: v } })} />
            <SliderRow label="CG Height (m)" value={dataset.vehicle.cg_height_m} min={0.2} max={0.4} step={0.01}
              onChange={(v) => setDataset({ ...dataset, vehicle: { ...dataset.vehicle, cg_height_m: v } })} />
            <SliderRow label="Weight Dist (F)" value={dataset.vehicle.weight_distribution_front} min={0.3} max={0.6} step={0.01}
              onChange={(v) => setDataset({ ...dataset, vehicle: { ...dataset.vehicle, weight_distribution_front: v } })} />
          </Section>

          <Section title="DRIVETRAIN RATIOS">
            {dataset.gearbox.gears.map((r, i) => (
              <SliderRow
                key={i}
                label={`Gear ${i + 1}`}
                value={r}
                min={dataset.gearbox.constraints.min_ratio}
                max={dataset.gearbox.constraints.max_ratio}
                step={0.01}
                onChange={(v) => updateGear(i, v)}
              />
            ))}
            <SliderRow label="Final Drive" value={dataset.gearbox.final_drive_ratio} min={2.5} max={5.0} step={0.05}
              onChange={(v) => setDataset({ ...dataset, gearbox: { ...dataset.gearbox, final_drive_ratio: v } })} />
          </Section>

          <Section title="ENVIRONMENT & TIRES">
            <SliderRow label="Grip (μ)" value={dataset.tire.mu_longitudinal} min={0.8} max={2.2} step={0.05}
              onChange={(v) => setDataset({ ...dataset, tire: { ...dataset.tire, mu_longitudinal: v } })} />
            <SliderRow label="Drag Coeff" value={dataset.aero.drag_coefficient} min={0.5} max={1.5} step={0.05}
              onChange={(v) => setDataset({ ...dataset, aero: { ...dataset.aero, drag_coefficient: v } })} />
            <SliderRow label="Track Temp (C)" value={dataset.environment.track_temp_c} min={10} max={60} step={1}
              onChange={(v) => setDataset({ ...dataset, environment: { ...dataset.environment, track_temp_c: v } })} />
          </Section>

          <Section title="ADVANCED CONTROLS">
            <div className="flex justify-around items-center py-4 bg-background/20 rounded-xl border border-panel/50">
              <div className="flex flex-col items-center gap-3">
                <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest text-center">Launch<br />Control</span>
                <LeverSwitch
                  checked={useLaunchControl}
                  onCheckedChange={setUseLaunchControl}
                />
              </div>
              <div className="w-[1px] h-12 bg-panel" />
              <div className="flex flex-col items-center gap-3">
                <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest text-center">Active<br />Aero</span>
                <LeverSwitch
                  checked={activeAero}
                  onCheckedChange={setActiveAero}
                />
              </div>
            </div>
          </Section>

          <Section title="SOLVER CONTROL">
            <div className="grid grid-cols-2 gap-3">
              <PremiumButton onClick={runSim}>Sim</PremiumButton>
              <PremiumButton onClick={runClassical} disabled={isRunning}>Classical</PremiumButton>
              <PremiumButton onClick={runQuantum} disabled={isRunning}>Quantum</PremiumButton>
              <PremiumButton onClick={runSwarm} disabled={isRunning}>Swarm</PremiumButton>
              <div className="col-span-2">
                <PremiumButton onClick={runGenetic} disabled={isRunning} className="w-full">DNA Evolution</PremiumButton>
              </div>
            </div>
          </Section>
        </aside>

        {/* CENTER — Visualization */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex border-b border-panel bg-panel">
            {(['sim', 'twin', 'quantum', 'swarm', 'dna', 'analytics', 'ai'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-[10px] font-display tracking-[.2em] uppercase transition-all border-b-2 ${activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
              >
                {tab === 'sim' ? 'Simulation Data' : tab === 'twin' ? 'Digital Twin' : tab === 'quantum' ? 'Quantum Annealing' : tab === 'swarm' ? 'Swarm Intelligence' : tab === 'dna' ? 'Genetic Lab' : tab === 'analytics' ? 'Advanced Analytics' : 'AI Strategic Advisor'}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto p-6 grid-bg custom-scrollbar space-y-6">
            {activeTab === 'twin' && (
              <div className="flex flex-col gap-6 h-full min-h-[850px]">
                <DigitalTwin
                  simData={simData}
                  progress={replayProgress}
                  isRunning={isRunning}
                />

                <div className="grid grid-cols-2 gap-6">
                  <ChartPanel title="TWIN TELEMETRY" subtitle="Synchronized Feed">
                    <PremiumLineChart
                      data={simData.slice(0, Math.floor((replayProgress / 100) * simData.length))}
                      xKey="time"
                      yKeys={['rpm']}
                      colors={[CHART_COLORS.orange]}
                    />
                  </ChartPanel>
                  <ChartPanel title="AERO STABILITY" subtitle="Real-time CFD Proxy">
                    <PremiumLineChart
                      data={simData.slice(0, Math.floor((replayProgress / 100) * simData.length))}
                      xKey="time"
                      yKeys={['downforce']}
                      colors={[CHART_COLORS.cyan]}
                    />
                  </ChartPanel>
                </div>
              </div>
            )}

            {activeTab === 'sim' && (
              <div className="flex flex-col gap-6 h-full min-h-[950px]">
                {/* Dynamic Track Replay - High Fidelity Sequential Monitor */}
                <div className="glass-panel p-8 relative overflow-hidden h-56 flex flex-col justify-center rounded-2xl group transition-all duration-500 hover:shadow-primary/5 bg-[#05080a]">
                  {/* Background Grid Accent */}
                  <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                    backgroundImage: 'linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                  }} />

                  <div className="flex justify-between items-center mb-6 relative z-10">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_cyan]" />
                        <h3 className="font-display text-[12px] tracking-[0.4em] text-primary uppercase font-black">Dynamic Track Replay</h3>
                      </div>
                      <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest opacity-60">High-Frequency Telemetry Stream • Sector 1</p>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex flex-col items-end">
                        <span className="text-[8px] font-mono text-muted-foreground uppercase">Live Velocity</span>
                        <span className="text-sm font-black font-mono text-primary">
                          {replayProgress < 100 ? `${(simData[Math.floor((replayProgress / 100) * (simData.length - 1))]?.velocity * 3.6 || 0).toFixed(1)}` : '0.0'}
                          <span className="text-[10px] ml-1 opacity-50">km/h</span>
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[8px] font-mono text-muted-foreground uppercase">Distance</span>
                        <span className="text-sm font-black font-mono text-accent">
                          {replayProgress < 100 ? `${(simData[Math.floor((replayProgress / 100) * (simData.length - 1))]?.distance || 0).toFixed(1)}` : '75.0'}
                          <span className="text-[10px] ml-1 opacity-50">m</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="relative h-24 bg-[#111115] rounded-xl border-y-[6px] border-[#1e293b] shadow-2xl flex items-center px-4 overflow-visible group/track">
                    {/* Asphalt Grain Texture */}
                    <div className="absolute inset-0 opacity-30 pointer-events-none" style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                      backgroundSize: '150px 150px'
                    }} />

                    {/* Corner Curbs (Top) */}
                    <div className="absolute -top-[6px] left-0 right-0 h-[6px] flex">
                      {Array.from({ length: 40 }).map((_, i) => (
                        <div key={i} className={`flex-1 h-full ${i % 2 === 0 ? 'bg-red-600' : 'bg-slate-100'} shadow-inner`} />
                      ))}
                    </div>

                    {/* Corner Curbs (Bottom) */}
                    <div className="absolute -bottom-[6px] left-0 right-0 h-[6px] flex">
                      {Array.from({ length: 40 }).map((_, i) => (
                        <div key={i} className={`flex-1 h-full ${i % 2 === 0 ? 'bg-red-600' : 'bg-slate-100'} shadow-inner`} />
                      ))}
                    </div>

                    {/* Track Racing Line / Tire Marks */}
                    <div className="absolute inset-x-8 h-8 top-1/2 -translate-y-1/2 bg-black/20 blur-xl rounded-full pointer-events-none" />

                    {/* Progress Indicator (Heat Map style) */}
                    <div
                      className="absolute h-1 left-4 bg-gradient-to-r from-cyan-500/20 via-cyan-400 to-white rounded-full transition-all duration-300 ease-out z-10"
                      style={{ width: `calc(${replayProgress}% - 32px)`, opacity: 0.4 }}
                    />

                    {/* Start Grid Slots */}
                    <div className="absolute left-8 h-full w-16 border-l-4 border-white/20 flex flex-col justify-around py-4 opacity-40">
                      <div className="h-5 w-10 border-2 border-white/40 rounded-sm ml-2" />
                      <div className="h-5 w-10 border-2 border-white/40 rounded-sm ml-6" />
                    </div>

                    {/* Sequential Distance Ticks */}
                    {[0, 25, 50].map((dist) => (
                      <div key={dist} className="absolute flex flex-col items-center opacity-30" style={{ left: `calc(${(dist / 75) * 100}% )` }}>
                        <div className="h-20 w-[2px] bg-white/20" />
                        <span className="text-[10px] font-black font-mono text-white/60 -mt-2">{dist}M</span>
                      </div>
                    ))}

                    {/* Checkered Finish Line */}
                    <div className="absolute right-0 h-full w-4 flex flex-wrap shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                      {Array.from({ length: 16 }).map((_, i) => (
                        <div key={i} className={`w-2 h-3 ${((Math.floor(i / 2) + i) % 2 === 0) ? 'bg-white' : 'bg-black'}`} />
                      ))}
                    </div>

                    {/* Vehicle Indicator - High Performance Render */}
                    <div
                      className="absolute transition-all duration-300 ease-out z-30 flex flex-col items-center"
                      style={{ left: `calc(${replayProgress}% - 24px)` }}
                    >
                      {/* G-Force Vector Visualization */}
                      <div className="absolute -top-16 flex flex-col items-center gap-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded border border-panel text-[8px] font-mono font-bold text-accent shadow-xl">
                          LOAD: {((simData[Math.floor((replayProgress / 100) * (simData.length - 1))]?.acceleration_long || 0) / 9.81).toFixed(2)}G
                        </div>
                        <div className="w-1.5 bg-accent rounded-full shadow-[0_0_10px_#10b981]" style={{ height: `${Math.min(30, (simData[Math.floor((replayProgress / 100) * (simData.length - 1))]?.acceleration_long || 0) * 3)}px` }} />
                      </div>

                      <div className="w-12 h-7 relative group/vehicle drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
                        {/* Dynamic Heat Haze / Exhaust */}
                        {simData[Math.floor((replayProgress / 100) * (simData.length - 1))]?.throttle > 85 && (
                          <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-8 h-4 bg-orange-500/30 blur-md rounded-full animate-pulse scale-y-50" />
                        )}
                        {/* Vehicle Body (Aston Martin AMR23 Silhouette) */}
                        <div className="w-full h-full bg-[#00352f] border-2 border-[#00ff9f] rounded-sm shadow-[0_0_25px_rgba(0,255,159,0.4)] flex items-center justify-center overflow-hidden relative">
                          <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/20" />
                          <span className="text-[8px] font-black text-[#00ff9f] italic tracking-tighter relative z-10">AMR23</span>
                          {/* Front Wing Wings */}
                          <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#00ff9f]/40" />
                        </div>
                        {/* Realistic Shadows */}
                        <div className="absolute -bottom-2 inset-x-1 h-1.5 bg-black/60 blur-sm rounded-full" />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between mt-6 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="text-[7px] font-mono text-muted-foreground uppercase opacity-40">Current Gear</span>
                        <span className="text-xs font-black font-mono text-foreground leading-none">
                          GEAR_{simData[Math.floor((replayProgress / 100) * (simData.length - 1))]?.gear || 1}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[7px] font-mono text-muted-foreground uppercase opacity-40">Engine RPM</span>
                        <span className="text-xs font-black font-mono text-foreground leading-none">
                          {(simData[Math.floor((replayProgress / 100) * (simData.length - 1))]?.rpm || 0).toFixed(0)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[9px] font-mono text-red-500 font-bold tracking-widest">FINISH_LINE: 75M</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 flex-1">
                  <ChartPanel title="ENGINE PERFORMANCE" subtitle="Torque (Nm) vs RPM">
                    <PremiumLineChart
                      data={dataset.engine.torque_curve}
                      xKey="rpm"
                      yKeys={['torque_nm']}
                      colors={[CHART_COLORS.cyan]}
                    />
                  </ChartPanel>

                  <ChartPanel title="TRACTIVE FORCE MAP" subtitle="Force (N) vs Speed (km/h)">
                    <PremiumLineChart
                      data={tractiveChartData}
                      xKey="speed"
                      yKeys={['gear1', 'gear2', 'gear3', 'gear4', 'gear5']}
                      colors={[CHART_COLORS.cyan, CHART_COLORS.green, CHART_COLORS.orange, CHART_COLORS.purple, CHART_COLORS.red]}
                      showArea={false}
                    />
                  </ChartPanel>

                  <ChartPanel title="LONGITUDINAL ACCELERATION" subtitle="G-Force over 75m">
                    <PremiumLineChart
                      data={simData}
                      xKey="time"
                      yKeys={['acceleration_long']}
                      colors={[CHART_COLORS.green]}
                    />
                  </ChartPanel>

                  <ChartPanel title="DYNAMIC WEIGHT TRANSFER" subtitle="Rear Axle Load (N)">
                    <PremiumLineChart
                      data={simData}
                      xKey="time"
                      yKeys={['weight_transfer_rear', 'weight_transfer_front']}
                      colors={[CHART_COLORS.orange, CHART_COLORS.cyan]}
                      showArea={false}
                    />
                  </ChartPanel>
                </div>
              </div>
            )}

            {activeTab === 'quantum' && (
              <div className="flex flex-col gap-6 h-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
                  <div className="flex flex-col gap-4">
                    <div className="text-center lg:text-left py-2">
                      <h2 className="font-display text-lg tracking-[0.4em] neon-text-purple uppercase">Neural-Quantum Annealer</h2>
                      <p className="text-muted-foreground text-[10px] font-mono mt-2">Iterative probability density collapse for ratio optimization</p>
                    </div>
                    <div className="flex-1 min-h-[400px] bg-panel/50 backdrop-blur rounded-2xl border border-panel overflow-hidden relative group">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />
                      <QuantumVisualizer steps={annealingSteps} isRunning={isRunning} />
                    </div>
                  </div>

                  <div className="flex flex-col gap-6">
                    <ChartPanel title="ENERGY CONVERGENCE" subtitle="System fitness over annealing schedule" className="h-64">
                      <AreaChart data={annealingSteps} width={400} height={200} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="quantumGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(270, 100%, 65%)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(270, 100%, 65%)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 15%)" vertical={false} />
                        <XAxis dataKey="iteration" stroke="hsl(215, 15%, 40%)" tick={{ fontSize: 9 }} hide />
                        <YAxis stroke="hsl(215, 15%, 40%)" tick={{ fontSize: 9 }} domain={['auto', 'auto']} />
                        <Tooltip
                          contentStyle={{ background: 'hsl(230, 20%, 8%)', border: '1px solid hsl(270, 50%, 30%)', fontSize: 10 }}
                          itemStyle={{ color: 'hsl(270, 100%, 65%)' }}
                        />
                        <Area type="monotone" dataKey="fitness" stroke="hsl(270, 100%, 65%)" fill="url(#quantumGrad)" strokeWidth={2} isAnimationActive={false} />
                      </AreaChart>
                    </ChartPanel>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="glass-panel p-4 rounded-xl border border-panel bg-panel/20">
                        <span className="text-[9px] font-mono text-muted-foreground uppercase block mb-1">Peak Fitness</span>
                        <span className="text-xl font-display neon-text-purple">
                          {annealingSteps.length > 0 ? Math.max(...annealingSteps.map(s => s.fitness)).toFixed(3) : '0.000'}
                        </span>
                      </div>
                      <div className="glass-panel p-4 rounded-xl border border-panel bg-panel/20">
                        <span className="text-[9px] font-mono text-muted-foreground uppercase block mb-1">Final Temp</span>
                        <span className="text-xl font-display text-accent">
                          {annealingSteps.length > 0 ? annealingSteps[annealingSteps.length - 1].temperature.toFixed(4) : '2.000'}
                        </span>
                      </div>
                    </div>

                    <Section title="ANNEALING PARAMETERS">
                      <div className="space-y-3 opacity-60 pointer-events-none">
                        <MetricRow label="Initial Temperature" value="2.00" color="purple" />
                        <MetricRow label="Cooling Schedule" value="Exponential (0.993)" color="purple" />
                        <MetricRow label="State Perturbation" value="Gaussian Noise" color="purple" />
                      </div>
                    </Section>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'swarm' && (
              <div className="flex flex-col gap-6">
                <div className="h-[600px] w-full">
                  <SwarmCanvas steps={swarmSteps} isRunning={isRunning} />
                </div>

                <ChartPanel title="CONVERGENCE TELEMETRY" subtitle="Global Best Fitness Trend" className="h-64">
                  <AreaChart data={swarmSteps} width={800} height={200} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="swarmGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(30, 100%, 55%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(30, 100%, 55%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 15%)" vertical={false} />
                    <XAxis dataKey="iteration" hide />
                    <YAxis stroke="hsl(215, 15%, 40%)" tick={{ fontSize: 9 }} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(230, 20%, 8%)', border: '1px solid hsl(30, 50%, 30%)', fontSize: 10 }}
                    />
                    <Area type="monotone" dataKey="globalBestFitness" stroke="hsl(30, 100%, 55%)" fill="url(#swarmGrad)" strokeWidth={2} isAnimationActive={false} />
                  </AreaChart>
                </ChartPanel>
              </div>
            )}
            {activeTab === 'dna' && (
              <div className="flex flex-col gap-6">
                <div className="h-[600px] w-full">
                  <GeneticVisualizer steps={geneticSteps} />
                </div>

                <ChartPanel title="FITNESS PROGRESSION" subtitle="Genetic Evolution Convergence" className="h-64">
                  <AreaChart data={geneticSteps} width={800} height={200} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dnaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(155, 100%, 50%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(155, 100%, 50%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 15%)" vertical={false} />
                    <XAxis dataKey="generation" stroke="hsl(215, 15%, 40%)" tick={{ fontSize: 9 }} />
                    <YAxis stroke="hsl(215, 15%, 40%)" tick={{ fontSize: 9 }} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(230, 20%, 8%)', border: '1px solid hsl(155, 50%, 30%)', fontSize: 10 }}
                    />
                    <Area type="stepAfter" dataKey="bestFitness" stroke={CHART_COLORS.green} fill="url(#dnaGrad)" strokeWidth={2} dot={false} isAnimationActive={false} />
                  </AreaChart>
                </ChartPanel>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="grid grid-cols-2 gap-6 min-h-[950px]">
                <ChartPanel title="Force Vector Distribution" subtitle="Normalized multi-axis performance distribution">
                  <div className="flex-1 flex items-center justify-center bg-background/20 rounded-xl overflow-hidden border border-panel/30">
                    <RadarChart
                      width={400}
                      height={400}
                      data={[
                        { letter: 'ACC', frequency: eventResults.accel > 0 ? 1 / eventResults.accel : 0 },
                        { letter: 'SKID', frequency: eventResults.skidpad > 0 ? 1 / eventResults.skidpad : 0 },
                        { letter: 'AUTO', frequency: eventResults.autocross > 0 ? 10 / eventResults.autocross : 0 },
                        { letter: 'VEL', frequency: simData.length > 0 ? simData[simData.length - 1].velocity / 30 : 0 },
                        { letter: 'A_LG', frequency: simData.length > 0 ? Math.max(...simData.map(d => d.acceleration_long)) / 20 : 0 },
                        { letter: 'DOWN', frequency: simData.length > 0 ? simData[simData.length - 1].downforce / 1000 : 0 },
                      ] as any}
                      getValue={(d: any) => d.frequency * 50}
                    />
                  </div>
                </ChartPanel>

                <ChartPanel title="System Hierarchy" subtitle="Sub-system complexity and load distribution">
                  <div className="flex-1 flex items-center justify-center bg-background/20 rounded-xl overflow-hidden p-4 border border-panel/30">
                    <TreemapChart width={400} height={400} />
                  </div>
                </ChartPanel>

                <ChartPanel title="Temporal Resource Flow" subtitle="Cross-system telemetry over time" className="col-span-2">
                  <div className="flex-1 flex items-center justify-center bg-background/20 rounded-xl overflow-hidden p-4 border border-panel/30">
                    <StackedAreasChart width={850} height={400} />
                  </div>
                </ChartPanel>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="max-w-4xl mx-auto w-full animate-in fade-in duration-700">
                <AIAdvisor
                  vehicleData={{
                    mass_kg: dataset.vehicle.mass_kg,
                    mu: dataset.tire.mu_longitudinal
                  }}
                  results={eventResults}
                  gears={dataset.gearbox.gears}
                />
              </div>
            )}
          </div>
        </main>

        {/* RIGHT — Analytics */}
        <aside className="w-72 border-l border-panel bg-panel overflow-y-auto p-4 flex flex-col gap-4">
          <Section title="EVENT TELEMETRY">
            <MetricRow label="Accel (75m)" value={eventResults.accel > 0 ? `${eventResults.accel.toFixed(3)}s` : '—'} color="cyan" />
            <MetricRow label="Skidpad (2 Laps)" value={eventResults.skidpad > 0 ? `${eventResults.skidpad.toFixed(3)}s` : '—'} color="green" />
            <MetricRow label="Autocross" value={eventResults.autocross > 0 ? `${eventResults.autocross.toFixed(2)}s` : '—'} color="orange" />
            <div className="h-[1px] bg-panel my-2" />
            <MetricRow label="Course Velocity" value={simData.length > 0 ? `${(simData[simData.length - 1].velocity * 3.6).toFixed(1)} km/h` : '—'} color="cyan" />
            <MetricRow label="Peak Long G" value={simData.length > 0 ? `${Math.max(...simData.map(d => d.acceleration_long / 9.81)).toFixed(2)}G` : '—'} color="orange" />
            <MetricRow label="Total Downforce" value={simData.length > 0 ? `${simData[simData.length - 1].downforce.toFixed(0)} N` : '—'} color="purple" />
          </Section>

          <Section title="GEARBOX STATUS">
            <div className="space-y-2">
              {dataset.gearbox.gears.map((r, i) => (
                <div key={i} className="flex justify-between items-center text-[10px] font-mono bg-background/50 p-2 rounded border border-panel">
                  <span className="text-muted-foreground">GEAR {i + 1}</span>
                  <span className="neon-text-cyan font-bold">{r.toFixed(2)}</span>
                  <span className="text-[9px] text-muted-foreground opacity-50">{(r * dataset.gearbox.final_drive_ratio).toFixed(2)} TOTAL</span>
                </div>
              ))}
            </div>
          </Section>

          {optimizedResult && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-3">
              <h3 className="font-display text-[10px] tracking-widest text-primary uppercase">Optimized Solution</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center bg-background/50 rounded py-2">
                  <div className="text-[9px] text-muted-foreground">TIME</div>
                  <div className="text-sm font-bold neon-text-green">{optimizedResult.accelTime.toFixed(3)}s</div>
                </div>
                <div className="text-center bg-background/50 rounded py-2">
                  <div className="text-[9px] text-muted-foreground">FITNESS</div>
                  <div className="text-sm font-bold neon-text-cyan">{optimizedResult.fitness.toFixed(1)}</div>
                </div>
              </div>
              <PremiumButton
                onClick={() => {
                  setDataset({ ...dataset, gearbox: { ...dataset.gearbox, gears: optimizedResult.gearRatios } });
                  addLog('System converged to optimized gearset.');
                }}
                className="w-full"
              >
                Apply Solution
              </PremiumButton>
            </div>
          )}
        </aside>
      </div>

      <TelemetryConsole logs={logs} />
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-3">
      <h3 className="font-display text-[10px] tracking-[0.3em] text-primary/70 uppercase font-black">{title}</h3>
      <div className="h-[1px] flex-1 bg-gradient-to-r from-panel to-transparent" />
    </div>
    <div className="px-1 space-y-3">
      {children}
    </div>
  </div>
);

const SliderRow = ({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void;
}) => (
  <div className="space-y-1 group py-1">
    <div className="flex justify-between text-[10px] font-mono uppercase tracking-tight">
      <span className="text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">{label}</span>
      <span className="neon-text-cyan font-bold tracking-wider">{value.toFixed(2)}</span>
    </div>
    <LeverSlider
      min={min}
      max={max}
      step={step}
      value={[value]}
      onValueChange={(v) => onChange(v[0])}
      className="py-1"
    />
  </div>
);

const MetricRow = ({ label, value, color }: { label: string; value: string; color: string }) => {
  const colorMap: Record<string, string> = {
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    green: 'text-green-400 bg-green-500/10 border-green-500/20',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
  };

  return (
    <div className="flex justify-between items-center text-[11px] font-mono py-2 group">
      <span className="text-muted-foreground/60 uppercase group-hover:text-muted-foreground transition-colors">{label}</span>
      <span className={`font-black tracking-widest px-2 py-0.5 rounded border neon-text-${color} ${colorMap[color] || ''}`}>
        {value}
      </span>
    </div>
  );
};

const ChartPanel = ({ title, subtitle, children, className = '' }: {
  title: string; subtitle: string; children: React.ReactNode; className?: string;
}) => (
  <div className={`glass-panel p-6 flex flex-col transition-all duration-300 hover:shadow-primary/5 rounded-2xl group ${className}`}>
    <div className="flex justify-between items-baseline mb-6">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-1.5 bg-primary rounded-full group-hover:animate-pulse shadow-glow shadow-primary/50" />
        <span className="font-display text-[11px] tracking-[0.3em] text-primary uppercase font-black">{title}</span>
      </div>
      <span className="text-[9px] text-muted-foreground/40 font-mono italic uppercase tracking-widest">{subtitle}</span>
    </div>
    <div className="flex-1 min-h-0 relative">
      {children}
    </div>
  </div>
);

export default GearOptDashboard;

