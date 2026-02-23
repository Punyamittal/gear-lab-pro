import { useState, useCallback, useRef, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import {
  DEFAULT_TORQUE_CURVE, DEFAULT_CONFIG, simulateAcceleration,
  generateTractiveCurves, type DrivetrainConfig, type EnginePoint, type SimPoint,
} from '@/lib/physics';
import {
  classicalOptimize, quantumAnnealingOptimize, swarmOptimize, geneticOptimize,
  type OptimizationResult, type AnnealingStep, type SwarmStep, type GeneticStep,
} from '@/lib/optimizer';
import SwarmCanvas from '@/components/SwarmCanvas';
import QuantumVisualizer from '@/components/QuantumVisualizer';
import TelemetryConsole from '@/components/TelemetryConsole';

const CHART_COLORS = {
  cyan: 'hsl(185, 100%, 50%)',
  green: 'hsl(155, 100%, 50%)',
  orange: 'hsl(30, 100%, 55%)',
  purple: 'hsl(270, 100%, 65%)',
  red: 'hsl(0, 100%, 60%)',
};

const GearOptDashboard = () => {
  const [config, setConfig] = useState<DrivetrainConfig>({ ...DEFAULT_CONFIG });
  const [curve] = useState<EnginePoint[]>(DEFAULT_TORQUE_CURVE);
  const [simData, setSimData] = useState<SimPoint[]>([]);
  const [optimizedResult, setOptimizedResult] = useState<OptimizationResult | null>(null);
  const [activeTab, setActiveTab] = useState<'sim' | 'quantum' | 'swarm' | 'dna'>('sim');
  const [logs, setLogs] = useState<string[]>(['[SYSTEM] GearOpt X initialized.', '[SYSTEM] Awaiting input...']);
  const [isRunning, setIsRunning] = useState(false);

  // Optimization data
  const [annealingSteps, setAnnealingSteps] = useState<AnnealingStep[]>([]);
  const [swarmSteps, setSwarmSteps] = useState<SwarmStep[]>([]);
  const [geneticSteps, setGeneticSteps] = useState<GeneticStep[]>([]);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [...prev.slice(-50), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  // Run simulation
  const runSim = useCallback(() => {
    const data = simulateAcceleration(curve, config, 75);
    setSimData(data);
    if (data.length > 0) {
      const last = data[data.length - 1];
      addLog(`SIM: 0-75m in ${last.time.toFixed(3)}s | Peak ${Math.max(...data.map(d => d.velocity)).toFixed(1)} m/s`);
    }
  }, [curve, config, addLog]);

  useEffect(() => { runSim(); }, []);

  const runClassical = useCallback(() => {
    setIsRunning(true);
    addLog('CLASSICAL: Starting grid search (500 iterations)...');
    setTimeout(() => {
      const result = classicalOptimize(config, curve, 500);
      setOptimizedResult(result);
      addLog(`CLASSICAL: Optimal ratios [${result.gearRatios.join(', ')}] | ${result.accelTime.toFixed(3)}s`);
      setIsRunning(false);
    }, 100);
  }, [config, curve, addLog]);

  const runQuantum = useCallback(() => {
    setIsRunning(true);
    setActiveTab('quantum');
    addLog('QUANTUM: Initializing simulated annealing...');
    const steps: AnnealingStep[] = [];
    setTimeout(() => {
      quantumAnnealingOptimize(config, curve, 300, (step) => { steps.push(step); });
      setAnnealingSteps([...steps]);
      const best = steps.reduce((a, b) => a.fitness > b.fitness ? a : b);
      addLog(`QUANTUM: Collapsed to [${best.gearRatios.map(r => r.toFixed(2)).join(', ')}] | Fitness ${best.fitness.toFixed(4)}`);
      setIsRunning(false);
    }, 100);
  }, [config, curve, addLog]);

  const runSwarm = useCallback(() => {
    setIsRunning(true);
    setActiveTab('swarm');
    addLog('SWARM: Deploying 50 particles...');
    const steps: SwarmStep[] = [];
    setTimeout(() => {
      const result = swarmOptimize(config, curve, 50, 100, (step) => { steps.push(step); });
      setSwarmSteps([...steps]);
      setOptimizedResult(result);
      addLog(`SWARM: Converged to [${result.gearRatios.join(', ')}] | ${result.accelTime.toFixed(3)}s`);
      setIsRunning(false);
    }, 100);
  }, [config, curve, addLog]);

  const runGenetic = useCallback(() => {
    setIsRunning(true);
    setActiveTab('dna');
    addLog('DNA: Spawning population of 80...');
    const steps: GeneticStep[] = [];
    setTimeout(() => {
      const result = geneticOptimize(config, curve, 80, 200, (step) => { steps.push(step); });
      setGeneticSteps([...steps]);
      setOptimizedResult(result);
      addLog(`DNA: Champion after 200 generations [${result.gearRatios.join(', ')}] | ${result.accelTime.toFixed(3)}s`);
      setIsRunning(false);
    }, 100);
  }, [config, curve, addLog]);

  // Demo mode
  const runDemo = useCallback(async () => {
    addLog('═══ JUDGE DEMO MODE ACTIVATED ═══');
    runSim();
    await new Promise(r => setTimeout(r, 800));
    runClassical();
    await new Promise(r => setTimeout(r, 1500));
    runQuantum();
    await new Promise(r => setTimeout(r, 2500));
    runSwarm();
    await new Promise(r => setTimeout(r, 2500));
    runGenetic();
    await new Promise(r => setTimeout(r, 2000));

    // Haptic
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 200]);
      addLog('HAPTIC: Shift feedback triggered ✓');
    }
    addLog('═══ DEMO COMPLETE ═══');
  }, [runSim, runClassical, runQuantum, runSwarm, runGenetic, addLog]);

  const updateGear = (idx: number, val: number) => {
    const newRatios = [...config.gearRatios];
    newRatios[idx] = val;
    setConfig({ ...config, gearRatios: newRatios });
  };

  const tractiveCurves = generateTractiveCurves(curve, config);
  const gear1Data = tractiveCurves.filter(p => p.gear === 1);
  const gear2Data = tractiveCurves.filter(p => p.gear === 2);
  const gear3Data = tractiveCurves.filter(p => p.gear === 3);
  const gear4Data = tractiveCurves.filter(p => p.gear === 4);

  // Merge tractive data by speed
  const tractiveChartData = gear1Data.map((p, i) => ({
    speed: p.speed,
    gear1: p.force,
    gear2: gear2Data[i]?.force || 0,
    gear3: gear3Data[i]?.force || 0,
    gear4: gear4Data[i]?.force || 0,
  }));

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="h-12 flex items-center justify-between px-4 border-b border-panel bg-panel relative sweep-line overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse-neon" />
          <h1 className="font-display text-sm tracking-[0.3em] uppercase neon-text-cyan">
            GearOpt X
          </h1>
          <span className="text-muted-foreground text-xs font-mono">v1.0</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={runDemo}
            disabled={isRunning}
            className="px-4 py-1.5 text-xs font-display tracking-wider uppercase rounded
              bg-primary/10 border border-primary/30 text-primary
              hover:bg-primary/20 hover:border-primary/50 transition-all
              disabled:opacity-40 glow-cyan"
          >
            ▶ Judge Demo
          </button>
        </div>
      </header>

      {/* Main 3-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT — Inputs */}
        <aside className="w-72 border-r border-panel bg-panel overflow-y-auto p-3 flex flex-col gap-3">
          <Section title="DRIVETRAIN CONFIG">
            {config.gearRatios.map((r, i) => (
              <SliderRow
                key={i}
                label={`Gear ${i + 1}`}
                value={r}
                min={1.0}
                max={4.5}
                step={0.05}
                onChange={(v) => updateGear(i, v)}
              />
            ))}
            <SliderRow label="Final Drive" value={config.finalDrive} min={2.0} max={5.0} step={0.1}
              onChange={(v) => setConfig({ ...config, finalDrive: v })} />
            <SliderRow label="Mass (kg)" value={config.vehicleMass} min={150} max={350} step={5}
              onChange={(v) => setConfig({ ...config, vehicleMass: v })} />
            <SliderRow label="μ (friction)" value={config.frictionCoeff} min={0.8} max={2.0} step={0.05}
              onChange={(v) => setConfig({ ...config, frictionCoeff: v })} />
            <SliderRow label="Efficiency" value={config.efficiency} min={0.8} max={0.98} step={0.01}
              onChange={(v) => setConfig({ ...config, efficiency: v })} />
          </Section>

          <Section title="SIMULATION">
            <button onClick={runSim} className="w-full py-2 text-xs font-display tracking-wider uppercase rounded
              bg-secondary border border-panel hover:border-primary/30 text-foreground transition-all">
              ▶ Simulate 0-75m
            </button>
            <button onClick={runClassical} disabled={isRunning} className="w-full py-2 text-xs font-display tracking-wider uppercase rounded
              bg-secondary border border-panel hover:border-accent/30 text-foreground transition-all disabled:opacity-40">
              ⚡ Classical Optimize
            </button>
          </Section>

          <Section title="ADVANCED SOLVERS">
            <button onClick={runQuantum} disabled={isRunning} className="w-full py-2 text-xs font-display tracking-wider uppercase rounded
              bg-secondary border border-panel hover:border-neon-purple/30 text-foreground transition-all disabled:opacity-40">
              ⚛ Quantum Solver
            </button>
            <button onClick={runSwarm} disabled={isRunning} className="w-full py-2 text-xs font-display tracking-wider uppercase rounded
              bg-secondary border border-panel hover:border-accent/30 text-foreground transition-all disabled:opacity-40">
              🐝 Swarm Mode
            </button>
            <button onClick={runGenetic} disabled={isRunning} className="w-full py-2 text-xs font-display tracking-wider uppercase rounded
              bg-secondary border border-panel hover:border-neon-orange/30 text-foreground transition-all disabled:opacity-40">
              🧬 DNA Evolution
            </button>
          </Section>

          <Section title="HAPTIC SHIFT">
            <button
              onClick={() => {
                if (navigator.vibrate) {
                  navigator.vibrate([100, 30, 100]);
                  addLog('HAPTIC: Shift feedback triggered');
                } else {
                  addLog('HAPTIC: Vibration API not available');
                }
              }}
              className="w-full py-2 text-xs font-display tracking-wider uppercase rounded
                bg-secondary border border-panel hover:border-neon-orange/30 text-foreground transition-all"
            >
              📳 Shift Now
            </button>
          </Section>

          {optimizedResult && (
            <Section title="OPTIMIZED RESULT">
              <div className="space-y-1 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ratios:</span>
                  <span className="neon-text-green">{optimizedResult.gearRatios.join(' / ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">0-75m:</span>
                  <span className="neon-text-cyan">{optimizedResult.accelTime.toFixed(3)}s</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setConfig({ ...config, gearRatios: optimizedResult.gearRatios });
                  addLog('Applied optimized ratios');
                  setTimeout(runSim, 50);
                }}
                className="w-full py-1.5 mt-1 text-xs font-display tracking-wider uppercase rounded
                  border border-accent/30 text-accent hover:bg-accent/10 transition-all"
              >
                Apply Ratios
              </button>
            </Section>
          )}
        </aside>

        {/* CENTER — Visualization */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-panel bg-panel">
            {(['sim', 'quantum', 'swarm', 'dna'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-display tracking-widest uppercase transition-all border-b-2 ${
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'sim' ? '📊 Simulation' : tab === 'quantum' ? '⚛ Quantum' : tab === 'swarm' ? '🐝 Swarm' : '🧬 DNA'}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto p-4 grid-bg">
            {activeTab === 'sim' && (
              <div className="grid grid-cols-2 gap-4 h-full">
                <ChartPanel title="TORQUE CURVE" subtitle="Engine Output">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={curve}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 15%)" />
                      <XAxis dataKey="rpm" stroke="hsl(215, 15%, 40%)" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                      <YAxis stroke="hsl(215, 15%, 40%)" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                      <Tooltip contentStyle={{ background: 'hsl(230, 20%, 8%)', border: '1px solid hsl(220, 15%, 18%)', fontFamily: 'JetBrains Mono', fontSize: 11 }} />
                      <defs>
                        <linearGradient id="torqueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={CHART_COLORS.cyan} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={CHART_COLORS.cyan} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="torque" stroke={CHART_COLORS.cyan} fill="url(#torqueGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartPanel>

                <ChartPanel title="TRACTIVE FORCE" subtitle="Force vs Speed">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={tractiveChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 15%)" />
                      <XAxis dataKey="speed" stroke="hsl(215, 15%, 40%)" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                      <YAxis stroke="hsl(215, 15%, 40%)" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                      <Tooltip contentStyle={{ background: 'hsl(230, 20%, 8%)', border: '1px solid hsl(220, 15%, 18%)', fontFamily: 'JetBrains Mono', fontSize: 11 }} />
                      <Line type="monotone" dataKey="gear1" stroke={CHART_COLORS.cyan} strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="gear2" stroke={CHART_COLORS.green} strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="gear3" stroke={CHART_COLORS.orange} strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="gear4" stroke={CHART_COLORS.purple} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartPanel>

                <ChartPanel title="ACCELERATION" subtitle="0–75m Run">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={simData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 15%)" />
                      <XAxis dataKey="time" stroke="hsl(215, 15%, 40%)" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                      <YAxis stroke="hsl(215, 15%, 40%)" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                      <Tooltip contentStyle={{ background: 'hsl(230, 20%, 8%)', border: '1px solid hsl(220, 15%, 18%)', fontFamily: 'JetBrains Mono', fontSize: 11 }} />
                      <defs>
                        <linearGradient id="velGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={CHART_COLORS.green} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={CHART_COLORS.green} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="velocity" stroke={CHART_COLORS.green} fill="url(#velGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartPanel>

                <ChartPanel title="TELEMETRY" subtitle="RPM & Gear">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={simData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 15%)" />
                      <XAxis dataKey="time" stroke="hsl(215, 15%, 40%)" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                      <YAxis yAxisId="rpm" stroke="hsl(215, 15%, 40%)" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                      <YAxis yAxisId="gear" orientation="right" stroke="hsl(215, 15%, 40%)" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                      <Tooltip contentStyle={{ background: 'hsl(230, 20%, 8%)', border: '1px solid hsl(220, 15%, 18%)', fontFamily: 'JetBrains Mono', fontSize: 11 }} />
                      <Line yAxisId="rpm" type="monotone" dataKey="rpm" stroke={CHART_COLORS.orange} strokeWidth={2} dot={false} />
                      <Line yAxisId="gear" type="stepAfter" dataKey="gear" stroke={CHART_COLORS.red} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartPanel>
              </div>
            )}

            {activeTab === 'quantum' && (
              <div className="flex flex-col gap-4 h-full">
                <div className="text-center">
                  <h2 className="font-display text-lg tracking-wider neon-text-cyan">QUANTUM GEAR SOLVER</h2>
                  <p className="text-muted-foreground text-xs font-mono mt-1">Simulated annealing with probability collapse visualization</p>
                </div>
                <div className="flex-1 max-h-[400px] mx-auto w-full max-w-lg">
                  <QuantumVisualizer steps={annealingSteps} isRunning={isRunning} />
                </div>
                {annealingSteps.length > 0 && (
                  <ChartPanel title="CONVERGENCE" subtitle="Fitness over iterations" className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={annealingSteps.filter((_, i) => i % 3 === 0)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 15%)" />
                        <XAxis dataKey="iteration" stroke="hsl(215, 15%, 40%)" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                        <YAxis stroke="hsl(215, 15%, 40%)" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                        <Line type="monotone" dataKey="fitness" stroke={CHART_COLORS.purple} strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartPanel>
                )}
              </div>
            )}

            {activeTab === 'swarm' && (
              <div className="flex flex-col gap-4 h-full">
                <div className="text-center">
                  <h2 className="font-display text-lg tracking-wider neon-text-green">SWARM TRACK MODE</h2>
                  <p className="text-muted-foreground text-xs font-mono mt-1">Particle swarm optimization — 50 virtual cars converging</p>
                </div>
                <div className="flex-1 max-h-[400px] mx-auto w-full max-w-lg">
                  <SwarmCanvas steps={swarmSteps} isRunning={isRunning} />
                </div>
              </div>
            )}

            {activeTab === 'dna' && (
              <div className="flex flex-col gap-4 h-full">
                <div className="text-center">
                  <h2 className="font-display text-lg tracking-wider text-neon-orange">GENETIC TRANSMISSION LAB</h2>
                  <p className="text-muted-foreground text-xs font-mono mt-1">
                    {geneticSteps.length > 0
                      ? `"We bred this gearbox across ${geneticSteps.length} generations."`
                      : 'Awaiting evolution...'}
                  </p>
                </div>
                {geneticSteps.length > 0 && (
                  <>
                    <ChartPanel title="FITNESS EVOLUTION" subtitle="Best & Average" className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={geneticSteps.filter((_, i) => i % 2 === 0)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 15%)" />
                          <XAxis dataKey="generation" stroke="hsl(215, 15%, 40%)" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                          <YAxis stroke="hsl(215, 15%, 40%)" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                          <Tooltip contentStyle={{ background: 'hsl(230, 20%, 8%)', border: '1px solid hsl(220, 15%, 18%)', fontFamily: 'JetBrains Mono', fontSize: 11 }} />
                          <Line type="monotone" dataKey="bestFitness" stroke={CHART_COLORS.green} strokeWidth={2} dot={false} name="Best" />
                          <Line type="monotone" dataKey="avgFitness" stroke={CHART_COLORS.orange} strokeWidth={1.5} dot={false} name="Average" />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartPanel>
                    <ChartPanel title="GENETIC DIVERSITY" subtitle="Population variance" className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={geneticSteps.filter((_, i) => i % 2 === 0)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 15%)" />
                          <XAxis dataKey="generation" stroke="hsl(215, 15%, 40%)" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                          <YAxis stroke="hsl(215, 15%, 40%)" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                          <defs>
                            <linearGradient id="divGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={CHART_COLORS.purple} stopOpacity={0.3} />
                              <stop offset="100%" stopColor={CHART_COLORS.purple} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="diversity" stroke={CHART_COLORS.purple} fill="url(#divGrad)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartPanel>
                  </>
                )}
                {geneticSteps.length > 0 && (
                  <div className="bg-panel panel-glow rounded p-3">
                    <h3 className="font-display text-xs tracking-wider text-neon-green mb-2">🏆 CHAMPION GEAR SET</h3>
                    <div className="flex gap-3 items-center font-mono text-sm">
                      {geneticSteps[geneticSteps.length - 1].bestGears.map((g, i) => (
                        <div key={i} className="bg-secondary rounded px-3 py-2 text-center">
                          <div className="text-muted-foreground text-[10px]">G{i + 1}</div>
                          <div className="neon-text-cyan font-bold">{g.toFixed(2)}</div>
                        </div>
                      ))}
                      <div className="ml-auto text-right">
                        <div className="text-muted-foreground text-[10px]">0-75m TIME</div>
                        <div className="neon-text-green font-bold text-lg">
                          {optimizedResult ? `${optimizedResult.accelTime.toFixed(3)}s` : '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* RIGHT — Analytics */}
        <aside className="w-64 border-l border-panel bg-panel overflow-y-auto p-3 flex flex-col gap-3">
          <Section title="LIVE METRICS">
            <MetricRow label="0-75m Time" value={simData.length > 0 ? `${simData[simData.length - 1].time.toFixed(3)}s` : '—'} color="cyan" />
            <MetricRow label="Peak Velocity" value={simData.length > 0 ? `${Math.max(...simData.map(d => d.velocity)).toFixed(1)} m/s` : '—'} color="green" />
            <MetricRow label="Peak Force" value={simData.length > 0 ? `${Math.max(...simData.map(d => d.force))} N` : '—'} color="orange" />
            <MetricRow label="Gears Used" value={simData.length > 0 ? `${new Set(simData.map(d => d.gear)).size}` : '—'} color="purple" />
          </Section>

          <Section title="GEAR RATIOS">
            {config.gearRatios.map((r, i) => (
              <div key={i} className="flex justify-between items-center text-xs font-mono">
                <span className="text-muted-foreground">G{i + 1}</span>
                <span className="neon-text-cyan">{r.toFixed(2)}</span>
                <span className="text-muted-foreground">
                  ×{config.finalDrive.toFixed(1)} = {(r * config.finalDrive).toFixed(2)}
                </span>
              </div>
            ))}
          </Section>

          <Section title="ENGINE CURVE">
            <div className="space-y-0.5">
              {curve.map(p => (
                <div key={p.rpm} className="flex justify-between text-[10px] font-mono text-muted-foreground">
                  <span>{p.rpm} RPM</span>
                  <span className="text-foreground">{p.torque} Nm</span>
                </div>
              ))}
            </div>
          </Section>

          {optimizedResult && (
            <Section title="OPTIMIZATION">
              <MetricRow label="Best Time" value={`${optimizedResult.accelTime.toFixed(3)}s`} color="green" />
              <MetricRow label="Fitness" value={optimizedResult.fitness.toFixed(4)} color="cyan" />
              <div className="text-[10px] font-mono text-muted-foreground mt-1">
                Ratios: {optimizedResult.gearRatios.join(' / ')}
              </div>
            </Section>
          )}
        </aside>
      </div>

      {/* Bottom — Telemetry Console */}
      <TelemetryConsole logs={logs} />
    </div>
  );
};

// ===== Sub-components =====

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <h3 className="font-display text-[10px] tracking-[0.2em] text-muted-foreground uppercase">{title}</h3>
    {children}
  </div>
);

const SliderRow = ({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void;
}) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground font-mono">{label}</span>
      <span className="font-mono neon-text-cyan">{value.toFixed(2)}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1 bg-secondary rounded-full appearance-none cursor-pointer
        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-[0_0_8px_hsl(185,100%,50%,0.5)]"
    />
  </div>
);

const MetricRow = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div className="flex justify-between items-center text-xs font-mono">
    <span className="text-muted-foreground">{label}</span>
    <span className={`neon-text-${color}`}>{value}</span>
  </div>
);

const ChartPanel = ({ title, subtitle, children, className = '' }: {
  title: string; subtitle: string; children: React.ReactNode; className?: string;
}) => (
  <div className={`bg-panel panel-glow rounded p-3 flex flex-col ${className}`}>
    <div className="flex justify-between items-baseline mb-2">
      <span className="font-display text-[10px] tracking-widest text-primary uppercase">{title}</span>
      <span className="text-[9px] text-muted-foreground font-mono">{subtitle}</span>
    </div>
    <div className="flex-1 min-h-0">{children}</div>
  </div>
);

export default GearOptDashboard;
