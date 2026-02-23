import { useState, useCallback, useEffect, useMemo } from 'react';
import { Zap, Brain, Flag, Gauge, Timer, Flame, Volume2, VolumeX, Menu, Activity, Settings as SettingsIcon, ChevronRight, Globe } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { engineAudio } from '@/lib/audio-engine';
import { hapticEngine } from '@/lib/haptic-engine';
import { saveSession } from '@/lib/session-history';
import { useVoiceControl } from '@/lib/voice-control';
import SolverRace from '@/components/SolverRace';
import SessionHistoryPanel from '@/components/SessionHistoryPanel';
import TelemetryConsole from '@/components/TelemetryConsole';
import ThreeSwarmVisualizer from '@/components/ThreeSwarmVisualizer';
import SwarmCanvas from '@/components/SwarmCanvas';
import QuantumVisualizer from '@/components/QuantumVisualizer';
import GeneticVisualizer from '@/components/GeneticVisualizer';
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
  cyan: 'hsl(0, 85%, 50%)',
  green: 'hsl(145, 70%, 45%)',
  orange: 'hsl(45, 90%, 55%)',
  purple: 'hsl(280, 50%, 60%)',
  red: 'hsl(0, 85%, 50%)',
};

const GearOptDashboard = () => {
  const [dataset, setDataset] = useState<MasterDataset>({ ...MASTER_DATASET });
  const [simData, setSimData] = useState<SimPoint[]>([]);
  const [eventResults, setEventResults] = useState<{ accel: number; skidpad: number; autocross: number }>({ accel: 0, skidpad: 0, autocross: 0 });
  const [optimizedResult, setOptimizedResult] = useState<OptimizationResult | null>(null);
  const [activeTab, setActiveTab] = useState<'sim' | 'quantum' | 'swarm' | 'dna' | 'analytics' | 'twin' | 'strategy'>('sim');
  const [logs, setLogs] = useState<string[]>(['[SYSTEM] GearOpt X initialized.', '[SYSTEM] Master Dataset Loaded.']);
  const [isRunning, setIsRunning] = useState(false);
  const [replayProgress, setReplayProgress] = useState(0);
  const [useLaunchControl, setUseLaunchControl] = useState(true);
  const [activeAero, setActiveAero] = useState(false);

  // Optimization data
  const [annealingSteps, setAnnealingSteps] = useState<AnnealingStep[]>([]);
  const [swarmSteps, setSwarmSteps] = useState<SwarmStep[]>([]);
  const [geneticSteps, setGeneticSteps] = useState<GeneticStep[]>([]);
  const [baselineSimData, setBaselineSimData] = useState<SimPoint[]>([]);
  const [showGhost, setShowGhost] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gearopt_muted') === 'true';
    }
    return false;
  });

  useEffect(() => {
    engineAudio.setMuted(isMuted);
    localStorage.setItem('gearopt_muted', String(isMuted));
  }, [isMuted]);

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
      const finalPoint = data[data.length - 1];
      addLog(`SIM: Accel ${finalPoint.time.toFixed(3)}s | Skidpad ${skidpad.toFixed(3)}s | AutoX ${autocross.toFixed(2)}s`);

      // Save to Session History (IndexedDB)
      saveSession({
        accelTime: finalPoint.time,
        skidpadTime: skidpad,
        autocrossTime: autocross,
        gears: dataset.gearbox.gears,
        peakVelocity: finalPoint.velocity * 3.6,
        peakG: Math.max(...data.map(d => d.acceleration_long / 9.81)),
        mass: dataset.vehicle.mass_kg,
        grip: dataset.tire.mu_longitudinal,
        fitness: null,
        optimizer: 'manual'
      });

      // Start replay animation + Audio + Haptics
      engineAudio.start();
      setReplayProgress(0);
      let p = 0;
      let lastGear = 1;

      const interval = setInterval(() => {
        p += 2;
        if (p > 100) {
          setReplayProgress(100);
          engineAudio.setRPM(dataset.engine.idle_rpm, 0); // Back to idle
          clearInterval(interval);
        } else {
          setReplayProgress(p);
          const currentPoint = data[Math.floor((p / 100) * (data.length - 1))];
          if (currentPoint) {
            // Live Audio RPM scaling
            engineAudio.setRPM(currentPoint.rpm, currentPoint.throttle);

            // Gear shift detection & haptics
            if (currentPoint.gear !== lastGear) {
              engineAudio.triggerShift();
              hapticEngine.shiftPulse();
              lastGear = currentPoint.gear;
            }

            // G-Force haptics
            hapticEngine.pulseForG(currentPoint.acceleration_long / 9.81);

            // Redline warning
            if (currentPoint.rpm > dataset.engine.redline_rpm * 0.98) {
              engineAudio.triggerRedline();
            }
          }
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

  // Voice Command Integration
  const voiceCommands = useMemo(() => [
    { phrase: 'run simulation', aliases: ['start sim', 'simulate'], action: () => runSim() },
    { phrase: 'run classical', aliases: ['search'], action: () => runClassical() },
    { phrase: 'run quantum', aliases: ['quantum'], action: () => runQuantum() },
    { phrase: 'run swarm', aliases: ['swarm'], action: () => runSwarm() },
    { phrase: 'run genetic', aliases: ['evolve', 'dna'], action: () => runGenetic() },
    {
      phrase: 'lock baseline', aliases: ['set baseline'], action: () => {
        setBaselineSimData(simData);
        setShowGhost(true);
        addLog('VOICE: Baseline reference locked.');
      }
    },
    { phrase: 'switch to strategy', aliases: ['show strategy', 'report'], action: () => setActiveTab('strategy') },
    { phrase: 'switch to simulation', aliases: ['show sim'], action: () => setActiveTab('sim') },
  ], [runSim, runClassical, runQuantum, runSwarm, runGenetic, simData, addLog]);

  const { toggleListening, isListening, lastCommand, supported: voiceSupported } = useVoiceControl(voiceCommands);

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

  const SidebarLeftContent = useMemo(() => (
    <>
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
        <SliderRow label="Tire Friction (μ)" value={dataset.tire.mu_longitudinal} min={0.5} max={2.0} step={0.01}
          onChange={(v) => setDataset({ ...dataset, tire: { ...dataset.tire, mu_longitudinal: v, mu_lateral: v * 0.95 } })} />
        <SliderRow label="Drag Coeff" value={dataset.aero.drag_coefficient} min={0.5} max={1.5} step={0.05}
          onChange={(v) => setDataset({ ...dataset, aero: { ...dataset.aero, drag_coefficient: v } })} />
        <div className="flex-1 bg-background/20 rounded-xl p-3 border border-panel/50">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Torque Map</span>
            <Globe size={10} className="text-primary/40" />
          </div>
          <div className="flex items-end gap-[2px] h-12">
            {[0.4, 0.6, 0.8, 1, 0.9, 0.7].map((scale, i) => (
              <div key={i}
                className="flex-1 bg-primary/20 hover:bg-primary/40 transition-all rounded-t-sm cursor-pointer border-x border-t border-primary/10"
                style={{ height: `${scale * 50}%` }}
                onClick={() => {
                  const newCurve = dataset.engine.torque_curve.map(p => ({ ...p, torque_nm: p.torque_nm * scale }));
                  setDataset({ ...dataset, engine: { ...dataset.engine, torque_curve: newCurve } });
                  addLog(`TORQUE: Powerband scaled by ${scale}x`);
                }}
              />
            ))}
          </div>
          <p className="text-[7px] font-mono text-muted-foreground uppercase text-center mt-1">RPM Range Profile Selection</p>
        </div>
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

      <Section title="SOLVER RACE">
        <SolverRace
          onComplete={(winner, gears) => {
            setDataset(prev => ({ ...prev, gearbox: { ...prev.gearbox, gears } }));
            addLog(`RACE: ${winner} won the Solver Race and solution applied.`);
            saveSession({
              accelTime: 0, // Calculated on next sim
              skidpadTime: 0,
              autocrossTime: 0,
              gears,
              peakVelocity: 0,
              peakG: 0,
              mass: dataset.vehicle.mass_kg,
              grip: dataset.tire.mu_longitudinal,
              fitness: null,
              optimizer: winner.toLowerCase() as any
            });
          }}
          runQuantumFn={() => {
            const steps: AnnealingStep[] = [];
            quantumAnnealingOptimize(dataset, 100, (s) => steps.push(s));
            const best = steps.reduce((a, b) => a.fitness > b.fitness ? a : b);
            return { fitness: best.fitness * 100, gearRatios: best.gearRatios };
          }}
          runSwarmFn={() => {
            const result = swarmOptimize(dataset, 30, 50);
            return { fitness: result.fitness, gearRatios: result.gearRatios };
          }}
          runGeneticFn={() => {
            const result = geneticOptimize(dataset, 40, 50);
            return { fitness: result.fitness, gearRatios: result.gearRatios };
          }}
        />
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
    </>
  ), [dataset, isRunning, useLaunchControl, activeAero, runSim, runClassical, runQuantum, runSwarm, runGenetic, addLog]);

  const SidebarRightContent = useMemo(() => (
    <>
      {/* Checkered flag accent */}
      <div className="absolute top-0 left-0 right-0 checkered-strip lg:block hidden" />
      <Section title="EVENT TELEMETRY">
        <MetricRow label="Accel (75m)" value={eventResults.accel > 0 ? `${eventResults.accel.toFixed(3)}s` : '—'} color="cyan" />
        <MetricRow label="Skidpad (2 Laps)" value={eventResults.skidpad > 0 ? `${eventResults.skidpad.toFixed(3)}s` : '—'} color="green" />
        <MetricRow label="Autocross" value={eventResults.autocross > 0 ? `${eventResults.autocross.toFixed(2)}s` : '—'} color="orange" />
        <div className="h-[1px] bg-panel my-2" />
        <MetricRow label="Course Velocity" value={simData.length > 0 ? `${(simData[simData.length - 1].velocity * 3.6).toFixed(1)} km/h` : '—'} color="cyan" />
        <MetricRow label="Peak Long G" value={simData.length > 0 ? `${Math.max(...simData.map(d => d.acceleration_long / 9.81)).toFixed(2)}G` : '—'} color="orange" />
        <MetricRow label="Total Downforce" value={simData.length > 0 ? `${simData[simData.length - 1].downforce.toFixed(0)} N` : '—'} color="purple" />
      </Section>

      <SessionHistoryPanel />

      <Section title="GEARBOX MAPPING">
        <div className="space-y-2">
          {dataset.gearbox.gears.map((r, i) => (
            <div key={i} className="flex justify-between items-center text-[10px] font-mono bg-background/50 p-2 rounded border border-panel group/gear hover:border-red-900/40 transition-colors">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 text-[7px] font-black rounded bg-red-950 text-red-400 flex items-center justify-center">{i + 1}</span>
                GEAR {i + 1}
              </span>
              <span className="neon-text-cyan font-bold">{r.toFixed(2)}</span>
              <span className="text-[9px] text-muted-foreground opacity-50">{(r * dataset.gearbox.final_drive_ratio).toFixed(2)} TOTAL</span>
            </div>
          ))}
        </div>
      </Section>

      {optimizedResult && (
        <div className="bg-red-950/15 border border-primary/20 rounded-lg p-3 space-y-3">
          <h3 className="font-display text-[10px] tracking-widest text-primary uppercase flex items-center gap-2"><Flame size={12} /> Optimized Setup</h3>
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
          <div className="flex flex-col gap-3">
            <PremiumButton
              onClick={() => {
                setDataset({ ...dataset, gearbox: { ...dataset.gearbox, gears: optimizedResult.gearRatios } });
                addLog('System converged to optimized gearset.');
              }}
              className="w-full"
            >
              Apply Solution
            </PremiumButton>
            <PremiumButton
              onClick={() => {
                setBaselineSimData(simData);
                setShowGhost(true);
                addLog('BASELINE: Reference sim locked.');
              }}
              className="w-full opacity-80"
            >
              Lock Baseline
            </PremiumButton>
          </div>
        </div>
      )}
    </>
  ), [eventResults, simData, dataset, optimizedResult, showGhost, addLog]);

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
    <div className="flex flex-col h-screen bg-[#050505] text-foreground overflow-hidden font-sans selection:bg-red-500/30">
      {/* BACKGROUND TEXTURE */}
      <div className="fixed inset-0 pointer-events-none opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: '250px 250px'
      }} />

      {/* HEADER — Mobile Optimized */}
      <header className="h-16 lg:h-20 border-b border-panel bg-panel/95 backdrop-blur-md flex items-center justify-between px-4 lg:px-8 shrink-0 z-50 relative">
        <div className="flex items-center gap-2 lg:gap-6">
          {/* Mobile Menu Trigger */}
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <button className="p-2 hover:bg-white/5 rounded-lg border border-white/10 text-muted-foreground mr-1">
                  <Menu size={20} />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 bg-panel border-r border-panel p-0 pt-10">
                <div className="h-full overflow-y-auto p-4 custom-scrollbar racing-stripe flex flex-col gap-6">
                  <h2 className="font-display text-primary text-xs tracking-widest uppercase mb-2 border-b border-white/10 pb-2">Vehicle Configuration</h2>
                  {SidebarLeftContent}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-primary rounded shadow-[0_0_20px_rgba(239,68,68,0.3)] flex items-center justify-center rotate-3 hover:rotate-0 transition-transform duration-300">
              <Zap className="text-white" size={20} fill="white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-display text-base lg:text-xl tracking-[0.2em] font-black italic">GEAR_LAB</span>
                <span className="bg-primary px-1.5 py-0.5 rounded text-[8px] lg:text-[10px] text-white font-black tracking-widest hidden sm:block">PRO_V2</span>
              </div>
            </div>
          </div>

          <div className="h-8 w-[1px] bg-panel mx-2 hidden sm:block" />

          <div className="hidden lg:flex items-center gap-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                {voiceSupported && (
                  <button
                    onClick={toggleListening}
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[8px] font-mono uppercase transition-all ${isListening ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse' : 'bg-panel border-panel-border text-muted-foreground hover:text-primary'
                      }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${isListening ? 'bg-red-500' : 'bg-muted-foreground'}`} />
                    {isListening ? 'Listening' : 'Voice Command'}
                  </button>
                )}
                {lastCommand && isListening && (
                  <span className="text-[9px] font-mono text-primary animate-in fade-in slide-in-from-left-2 duration-300 italic opacity-80">
                    "{lastCommand}"
                  </span>
                )}
              </div>
            </div>
            <div className="h-6 w-[1px] bg-panel mx-2" />
            <span className="text-muted-foreground text-[10px] font-mono border border-red-900/40 px-2 py-0.5 rounded-md bg-red-950/20">
              <Flag size={10} className="inline mr-1 text-red-500" />FIA-SPEC • R2.6
            </span>
            {replayProgress > 0 && replayProgress < 100 && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 drs-active">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span className="text-[9px] font-mono font-bold text-green-400 uppercase tracking-widest">DRS Active</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-3">
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-[7px] lg:text-[9px] font-mono text-muted-foreground uppercase opacity-40">Pit Radio Latency</span>
            <span className="text-[8px] lg:text-[10px] font-mono text-f1-gold font-bold">0.24ms</span>
          </div>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`flex items-center gap-2 px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg border transition-all duration-300 ${isMuted
              ? 'bg-red-500/10 border-red-500/30 text-red-500'
              : 'bg-panel border-panel-border text-f1-gold shadow-[0_0_10px_rgba(234,179,8,0.1)]'
              }`}
            title={isMuted ? "Unmute Pit Wall" : "Mute Pit Wall"}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={12} className="lg:w-3.5 lg:h-3.5" />}
            <span className="text-[8px] lg:text-[9px] font-mono font-bold uppercase tracking-wider hidden xs:block">
              {isMuted ? 'Muted' : 'Audio On'}
            </span>
          </button>

          <PremiumButton
            onClick={runDemo}
            disabled={isRunning}
            className="min-w-[120px] lg:min-w-[200px] text-[10px] lg:text-xs py-1.5 lg:py-2"
          >
            ▶ <span className="hidden sm:inline">Lights Out & Away We Go</span>
            <span className="sm:hidden">Start Run</span>
          </PremiumButton>

          {/* Mobile Telemetry Trigger */}
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <button className="p-2 hover:bg-white/5 rounded-lg border border-white/10 text-muted-foreground ml-1">
                  <Activity size={20} />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-panel border-l border-panel p-0 pt-10">
                <div className="h-full overflow-y-auto p-4 custom-scrollbar flex flex-col gap-6">
                  <h2 className="font-display text-primary text-xs tracking-widest uppercase mb-2 border-b border-white/10 pb-2">Race Telemetry</h2>
                  {SidebarRightContent}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden z-10 flex-col lg:flex-row">
        {/* LEFT — Inputs (Desktop) */}
        <aside className="hidden lg:flex w-80 border-r border-panel bg-panel overflow-y-auto p-4 flex-col gap-4 relative z-20 racing-stripe custom-scrollbar">
          {SidebarLeftContent}
        </aside>

        {/* CENTER — Visualization */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex border-b border-panel bg-panel/80 relative overflow-x-auto custom-scrollbar scrollbar-hide shrink-0 snap-x">
            {/* Checkered strip on top of tabs */}
            <div className="absolute top-0 left-0 right-0 checkered-strip" />
            {(['sim', 'twin', 'quantum', 'swarm', 'dna', 'strategy', 'analytics'] as const).map((tab, idx) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 lg:px-6 py-3 lg:py-3.5 text-[9px] lg:text-[10px] font-display tracking-[.2em] uppercase transition-all border-b-2 relative group/tab shrink-0 snap-start border-panel-border ${activeTab === tab
                  ? 'border-primary text-primary bg-red-950/10'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-red-950/5'
                  }`}
              >
                {/* Sector number badge */}
                <span className={`inline-flex items-center justify-center w-3 h-3 lg:w-4 lg:h-4 text-[6px] lg:text-[7px] font-mono font-black rounded mr-1 lg:mr-1.5 ${activeTab === tab ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                  {idx + 1}
                </span>
                <span className="whitespace-nowrap">
                  {tab === 'sim' ? 'Track Data' : tab === 'twin' ? 'Digital Twin' : tab === 'quantum' ? 'Quantum' : tab === 'swarm' ? 'Swarm' : tab === 'dna' ? 'DNA Lab' : tab === 'analytics' ? 'Telemetry' : 'Pit Wall AI'}
                </span>
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3 lg:p-6 custom-scrollbar relative bg-[#0a0a0a]">
            {activeTab === 'twin' && (
              <div className="flex flex-col gap-6 h-full">
                <DigitalTwin
                  simData={simData}
                  progress={replayProgress}
                  isRunning={isRunning}
                  isMuted={isMuted}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <div className="flex flex-col gap-6 lg:min-h-[950px]">
                {/* Dynamic Track Replay - High Fidelity Sequential Monitor */}
                <div className="glass-panel p-4 lg:p-8 relative overflow-hidden min-h-[180px] lg:h-56 flex flex-col justify-center rounded-2xl group transition-all duration-500 hover:shadow-primary/5 bg-[#080808] kerb-stripe-top">
                  {/* Asphalt background texture */}
                  <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                    backgroundSize: '200px 200px'
                  }} />
                  {/* Racing line gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-red-950/20 via-transparent to-red-950/10 pointer-events-none" />

                  <div className="flex justify-between items-center mb-6 relative z-10">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <Gauge size={14} className="text-primary animate-pulse" />
                        <h3 className="font-display text-[12px] tracking-[0.4em] text-primary uppercase font-black">Grand Prix Track</h3>
                        <span className="text-[8px] font-mono text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">LIVE</span>
                      </div>
                      <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest opacity-60">Sector 1 • DRS Detection Zone Active</p>
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

                  <div className="relative h-56 bg-[#0d0d0d] rounded-xl border-y-[6px] border-[#1a1a1a] shadow-2xl flex items-center px-4 overflow-visible group/track">
                    {/* Asphalt Grain Texture */}
                    <div className="absolute inset-0 opacity-30 pointer-events-none" style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                      backgroundSize: '150px 150px'
                    }} />

                    {/* Aero Flux Heatmap Overlay */}
                    <div
                      className="absolute inset-x-0 h-full opacity-0 group-hover/track:opacity-20 transition-opacity duration-500 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle at ${replayProgress}% 50%, ${CHART_COLORS.cyan} 0%, transparent 60%)`,
                        filter: `blur(${Math.max(10, (simData[Math.floor((replayProgress / 100) * (simData.length - 1))]?.downforce || 0) / 100)}px)`
                      }}
                    />

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
                      className="absolute h-1 left-4 bg-gradient-to-r from-red-600/20 via-red-500 to-yellow-400 rounded-full transition-all duration-300 ease-out z-10"
                      style={{ width: `calc(${replayProgress}% - 32px)`, opacity: 0.5 }}
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

                    {/* Baseline Ghost Car */}
                    {showGhost && baselineSimData.length > 0 && (
                      <div
                        className="absolute transition-all duration-300 ease-out z-20 flex flex-col items-center opacity-30 scale-95 grayscale"
                        style={{ left: `calc(${replayProgress}% - 144px)` }}
                      >
                        <img
                          src="/f1.png"
                          alt="Ghost Car"
                          className="w-72 h-36 object-contain opacity-40 grayscale"
                        />
                        <div className="absolute -bottom-2 inset-x-1 h-1.5 bg-black/40 blur-sm rounded-full" />
                      </div>
                    )}

                    {/* Vehicle Indicator - High Performance Render */}
                    <div
                      className="absolute transition-all duration-300 ease-out z-30 flex flex-col items-center"
                      style={{ left: `calc(${replayProgress}% - 144px)` }}
                    >
                      {/* G-Force Vector Visualization */}
                      <div className="absolute -top-24 flex flex-col items-center gap-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded border border-panel text-[8px] font-mono font-bold text-accent shadow-xl">
                          LOAD: {((simData[Math.floor((replayProgress / 100) * (simData.length - 1))]?.acceleration_long || 0) / 9.81).toFixed(2)}G
                        </div>
                        <div className="w-1.5 bg-accent rounded-full shadow-[0_0_10px_#10b981]" style={{ height: `${Math.min(30, (simData[Math.floor((replayProgress / 100) * (simData.length - 1))]?.acceleration_long || 0) * 3)}px` }} />
                      </div>

                      <div className="w-72 h-36 relative group/vehicle drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
                        {/* Dynamic Heat Haze / Exhaust */}
                        {simData[Math.floor((replayProgress / 100) * (simData.length - 1))]?.throttle > 85 && (
                          <div className="absolute -left-12 top-1/2 -translate-y-1/2 w-20 h-10 bg-orange-500/30 blur-xl rounded-full animate-pulse scale-y-50" />
                        )}
                        {/* Vehicle Body (F1 Car) */}
                        <img
                          src="/f1.png"
                          alt="F1 Car"
                          className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-transform duration-300"
                          style={{
                            transform: `rotate(${(simData[Math.floor((replayProgress / 100) * (simData.length - 1))]?.acceleration_long || 0) * -0.5}deg)`
                          }}
                        />
                      </div>
                      <div className="absolute -bottom-4 inset-x-8 h-3 bg-black/60 blur-md rounded-full" />
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
                      <Flag size={12} className="text-red-500 flag-indicator" />
                      <span className="text-[9px] font-mono text-red-500 font-bold tracking-widest">🏁 FINISH: 75M</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 flex-1">
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
                      <h2 className="font-display text-lg tracking-[0.4em] neon-text-purple uppercase">Quantum Strategy Engine</h2>
                      <p className="text-muted-foreground text-[10px] font-mono mt-2">Probability density annealing for optimal race configuration</p>
                    </div>
                    <div className="relative w-full h-[600px] lg:h-[850px] glass-panel rounded-2xl overflow-hidden bg-background/40 border border-panel/50 group flex flex-col">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />
                      <QuantumVisualizer steps={annealingSteps} isRunning={isRunning} />
                    </div>
                  </div>

                  <div className="flex flex-col gap-6">
                    <ChartPanel title="ENERGY CONVERGENCE" subtitle="System fitness over annealing schedule" className="h-64">
                      <AreaChart data={annealingSteps} width={400} height={200} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="quantumGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(270, 55%, 75%)" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="hsl(270, 55%, 75%)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" vertical={false} />
                        <XAxis dataKey="iteration" stroke="hsl(215, 15%, 45%)" tick={{ fontSize: 9 }} hide />
                        <YAxis stroke="hsl(215, 15%, 45%)" tick={{ fontSize: 9 }} domain={['auto', 'auto']} />
                        <Tooltip
                          contentStyle={{ background: 'hsl(230, 20%, 8%)', border: '1px solid hsl(270, 40%, 40%)', fontSize: 10 }}
                          itemStyle={{ color: 'hsl(270, 55%, 75%)' }}
                        />
                        <Area type="monotone" dataKey="fitness" stroke="hsl(270, 55%, 75%)" fill="url(#quantumGrad)" strokeWidth={2} isAnimationActive={false} />
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
                  <ThreeSwarmVisualizer step={swarmSteps[swarmSteps.length - 1] || null} />
                </div>

                <ChartPanel title="CONVERGENCE TELEMETRY" subtitle="Global Best Fitness Trend" className="h-64">
                  <AreaChart data={swarmSteps} width={800} height={200} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="swarmGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(25, 70%, 72%)" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="hsl(25, 70%, 72%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" vertical={false} />
                    <XAxis dataKey="iteration" hide />
                    <YAxis stroke="hsl(215, 15%, 45%)" tick={{ fontSize: 9 }} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(230, 20%, 8%)', border: '1px solid hsl(25, 50%, 40%)', fontSize: 10 }}
                    />
                    <Area type="monotone" dataKey="globalBestFitness" stroke="hsl(25, 70%, 72%)" fill="url(#swarmGrad)" strokeWidth={2} isAnimationActive={false} />
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
                        <stop offset="5%" stopColor="hsl(155, 55%, 68%)" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="hsl(155, 55%, 68%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" vertical={false} />
                    <XAxis dataKey="generation" stroke="hsl(215, 15%, 45%)" tick={{ fontSize: 9 }} />
                    <YAxis stroke="hsl(215, 15%, 45%)" tick={{ fontSize: 9 }} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(230, 20%, 8%)', border: '1px solid hsl(155, 40%, 40%)', fontSize: 10 }}
                    />
                    <Area type="stepAfter" dataKey="bestFitness" stroke={CHART_COLORS.green} fill="url(#dnaGrad)" strokeWidth={2} dot={false} isAnimationActive={false} />
                  </AreaChart>
                </ChartPanel>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="grid grid-cols-2 gap-6 min-h-[950px]">
                <ChartPanel title="FORCE VECTOR DISTRIBUTION" subtitle="Normalized multi-axis race performance">
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

                <ChartPanel title="STRATEGY HIERARCHY" subtitle="Sub-system complexity and load distribution">
                  <div className="flex-1 flex items-center justify-center bg-background/20 rounded-xl overflow-hidden p-4 border border-panel/30">
                    <TreemapChart width={400} height={400} />
                  </div>
                </ChartPanel>

                <ChartPanel title="PIT WALL STRATEGY STREAM" subtitle="Live race logic telemetry over time" className="col-span-2">
                  <div className="flex-1 flex items-center justify-center bg-background/20 rounded-xl overflow-hidden p-4 border border-panel/30">
                    <StackedAreasChart width={850} height={400} />
                  </div>
                </ChartPanel>
              </div>
            )}

            {activeTab === 'strategy' && (
              <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-20">
                {/* Pit Wall Command Brief */}
                <div className="glass-panel p-10 rounded-3xl border border-primary/20 relative overflow-hidden kerb-stripe-top">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Flag size={200} className="text-primary" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-10">
                      <div>
                        <h1 className="font-display text-3xl tracking-[0.5em] text-primary font-black uppercase mb-2">Pit Wall Brief</h1>
                        <div className="flex gap-4 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                          <span>🏎️ FIA Formula Championship 2026</span>
                          <span>•</span>
                          <span>Ref: F1-GEAR-STRAT-01</span>
                        </div>
                      </div>
                      <PremiumButton onClick={() => window.print()} className="min-w-[150px]">Export PDF</PremiumButton>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8 mb-10">
                      <div className="p-6 bg-background/40 rounded-2xl border border-panel/50">
                        <span className="text-[10px] font-mono text-primary uppercase tracking-[0.2em] font-bold block mb-4">Core Telemetry</span>
                        <div className="space-y-4">
                          <MetricRow label="Opt Accel (75m)" value={`${eventResults.accel.toFixed(3)}s`} color="cyan" />
                          <MetricRow label="Baseline Sync" value={showGhost ? "Reference Active" : "No Baseline"} color={showGhost ? "green" : "red"} />
                          <MetricRow label="Peak G-Force" value={`${Math.max(...simData.map(d => d.acceleration_long / 9.81), 0).toFixed(2)}G`} color="orange" />
                        </div>
                      </div>
                      <div className="p-6 bg-background/40 rounded-2xl border border-panel/50">
                        <span className="text-[10px] font-mono text-primary uppercase tracking-[0.2em] font-bold block mb-4">Genetic Algorithm Synthesis</span>
                        <div className="space-y-4">
                          <MetricRow label="Pop Size" value="80 Solvers" color="purple" />
                          <MetricRow label="Generations" value={`${geneticSteps.length}`} color="green" />
                          <MetricRow label="Convergence" value="Stable" color="cyan" />
                        </div>
                      </div>
                      <div className="p-6 bg-background/40 rounded-2xl border border-panel/50">
                        <span className="text-[10px] font-mono text-primary uppercase tracking-[0.2em] font-bold block mb-4">Aero Configuration</span>
                        <div className="space-y-4">
                          <MetricRow label="Drag Coeff" value={`${dataset.aero.drag_coefficient.toFixed(2)}`} color="red" />
                          <MetricRow label="Flux Peak" value={`${Math.max(...simData.map(d => d.downforce), 0).toFixed(0)}N`} color="cyan" />
                          <MetricRow label="Balance (F)" value={`${(dataset.aero.aero_balance_front * 100).toFixed(1)}%`} color="orange" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-red-950/20 p-8 rounded-2xl border border-primary/20 mb-0">
                      <h2 className="font-display text-sm tracking-[0.3em] text-primary uppercase font-black mb-4 flex items-center gap-3">
                        <Brain size={18} /> Pit Wall Strategic Analysis
                      </h2>
                      <p className="text-sm font-sans leading-relaxed text-foreground/80">
                        Based on the high-fidelity {geneticSteps.length > 0 ? 'genetic evolution' : 'simulation'} telemetry, the system has identified a critical bottleneck in the {dataset.gearbox.gears[0] > 3 ? 'low-end torque delivery phase' : 'mid-range gear transition'}.
                        Current configuration [{dataset.gearbox.gears.join(', ')}] yields a theoretical 75m sprint of {eventResults.accel.toFixed(3)}s.
                        <span className="text-primary font-bold"> Race Engineer recommends:</span> Optimize 2nd→3rd gear crossover to minimize traction loss while maximizing DRS-zone acceleration potential.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pit Wall AI — Live Strategic Core */}
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

        {/* RIGHT — Race Standings Panel (Desktop) */}
        <aside className="hidden lg:flex w-72 border-l border-panel bg-panel overflow-y-auto p-4 flex-col gap-4 relative custom-scrollbar shrink-0">
          {SidebarRightContent}
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
      <div className="h-[1px] flex-1 bg-gradient-to-r from-red-900/40 to-transparent" />
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
    cyan: 'text-cyan-300 bg-cyan-400/10 border-cyan-400/20',
    green: 'text-green-300 bg-green-400/10 border-green-400/20',
    orange: 'text-orange-300 bg-orange-400/10 border-orange-400/20',
    purple: 'text-purple-300 bg-purple-400/10 border-purple-400/20',
    red: 'text-red-300 bg-red-400/10 border-red-400/20',
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
  <div className={`glass-panel p-6 flex flex-col transition-all duration-300 hover:shadow-red-500/5 hover:border-red-900/30 rounded-2xl group ${className}`}>
    <div className="flex justify-between items-baseline mb-6">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-1.5 bg-primary rounded-full group-hover:animate-pulse shadow-glow shadow-red-500/50" />
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

