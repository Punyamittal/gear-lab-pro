import { useMemo, useState, useEffect } from 'react';
import type { GeneticStep } from '@/lib/optimizer';
import { Activity, Dna, Zap, TrendingUp, ShieldAlert, Binary } from 'lucide-react';

interface GeneticVisualizerProps {
    steps: GeneticStep[];
}

interface BioLog {
    id: string;
    msg: string;
    type: 'mutation' | 'crossover' | 'selection' | 'elite';
    timestamp: number;
}

const GeneticVisualizer = ({ steps }: GeneticVisualizerProps) => {
    const currentStep = steps[steps.length - 1] || null;
    const prevStep = steps.length > 1 ? steps[steps.length - 2] : null;
    const [hoveredGene, setHoveredGene] = useState<number | null>(null);
    const [logs, setLogs] = useState<BioLog[]>([]);

    // Generate pseudo-random bio-logs based on steps
    useEffect(() => {
        if (!currentStep) return;

        const newLogs: BioLog[] = [];
        const gen = currentStep.generation;

        if (gen === 0) {
            newLogs.push({ id: `init-${gen}`, msg: "INITIAL POPULATION SEEDED", type: 'selection', timestamp: Date.now() });
        } else if (gen % 5 === 0) {
            newLogs.push({ id: `elite-${gen}`, msg: `CHAMPION GENES PRESERVED [GEN ${gen}]`, type: 'elite', timestamp: Date.now() });
        }

        if (currentStep.diversity > (prevStep?.diversity || 0)) {
            newLogs.push({ id: `mut-${gen}`, msg: `MUTATION BURST DETECTED (Δ Diversity: +${(currentStep.diversity - (prevStep?.diversity || 0)).toFixed(4)})`, type: 'mutation', timestamp: Date.now() });
        }

        if (currentStep.bestFitness > (prevStep?.bestFitness || 0)) {
            newLogs.push({ id: `fit-${gen}`, msg: `FITNESS ESCALATION: ${currentStep.bestFitness.toFixed(4)}`, type: 'crossover', timestamp: Date.now() });
        }

        if (newLogs.length > 0) {
            setLogs(prev => [...newLogs, ...prev].slice(0, 5));
        }
    }, [currentStep?.generation]);

    const dnaPath1 = useMemo(() => {
        let path = "M 0 50 ";
        for (let i = 0; i < 20; i++) {
            const x = i * 20;
            const y = 50 + Math.sin(x * 0.05 + (currentStep?.generation || 0) * 0.2) * 20;
            path += `L ${x} ${y} `;
        }
        return path;
    }, [currentStep?.generation]);

    const dnaPath2 = useMemo(() => {
        let path = "M 0 50 ";
        for (let i = 0; i < 20; i++) {
            const x = i * 20;
            const y = 50 + Math.sin(x * 0.05 + (currentStep?.generation || 0) * 0.2 + Math.PI) * 20;
            path += `L ${x} ${y} `;
        }
        return path;
    }, [currentStep?.generation]);

    return (
        <div className="flex flex-col gap-6 h-full">
            <div className="flex-1 glass-panel rounded-3xl overflow-hidden border border-emerald-500/20 relative bg-[#050805] p-8 group/main">
                {/* Background Grid & Scanline */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                <div className="absolute inset-0 scanline pointer-events-none opacity-20" />

                {/* Header Section */}
                <div className="flex justify-between items-start relative z-10 mb-12">
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Dna size={20} className="text-emerald-500 animate-[spin_4s_linear_infinite]" />
                                <div className="absolute inset-0 bg-emerald-500/40 blur-lg animate-pulse" />
                            </div>
                            <h3 className="font-display text-[14px] tracking-[0.5em] text-emerald-400 uppercase font-black drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                                Evolutionary Sequence Lab
                            </h3>
                        </div>
                        <p className="text-[10px] font-mono text-emerald-500/60 uppercase tracking-widest pl-8">
                            Recursive Genetic Optimization • Kern-Model 5.0
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-emerald-950/30 backdrop-blur-md px-5 py-2.5 rounded-xl border border-emerald-500/20 text-right group/stat hover:border-emerald-500/50 transition-all">
                            <div className="text-[9px] text-emerald-500/60 font-mono uppercase tracking-tighter group-hover:text-emerald-400 transition-colors flex items-center justify-end gap-1.5">
                                <Zap size={10} /> Generation
                            </div>
                            <div className="text-xl font-black font-mono text-emerald-400 leading-tight tracking-tight">
                                {String(currentStep?.generation || 0).padStart(3, '0')}
                            </div>
                        </div>
                        <div className="bg-emerald-950/30 backdrop-blur-md px-5 py-2.5 rounded-xl border border-emerald-500/20 text-right group/stat hover:border-emerald-500/50 transition-all">
                            <div className="text-[9px] text-emerald-500/60 font-mono uppercase tracking-tighter group-hover:text-emerald-400 transition-colors flex items-center justify-end gap-1.5">
                                <Activity size={10} /> Mutation Pool
                            </div>
                            <div className="text-xl font-black font-mono text-yellow-400 leading-tight tracking-tight">
                                {((currentStep?.diversity || 0) * 100).toFixed(1)}%
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main DNA Engine */}
                <div className="relative flex flex-col gap-8 h-[360px] justify-center items-center">
                    {/* SVG DNA DOUBLE HELIX */}
                    <div className="w-full absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none overflow-hidden h-40">
                        <svg width="100%" height="80" viewBox="0 0 400 100" className="overflow-visible stretch-svg">
                            <defs>
                                <linearGradient id="dnaGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="transparent" />
                                    <stop offset="50%" stopColor="#10b981" />
                                    <stop offset="100%" stopColor="transparent" />
                                </linearGradient>
                            </defs>
                            <path d={dnaPath1} stroke="url(#dnaGrad1)" strokeWidth="2" fill="none" opacity="0.6" />
                            <path d={dnaPath2} stroke="url(#dnaGrad1)" strokeWidth="2" fill="none" opacity="0.4" />
                            {Array.from({ length: 20 }).map((_, i) => {
                                const x = i * 20;
                                const y1 = 50 + Math.sin(x * 0.05 + (currentStep?.generation || 0) * 0.2) * 20;
                                const y2 = 50 + Math.sin(x * 0.05 + (currentStep?.generation || 0) * 0.2 + Math.PI) * 20;
                                return (
                                    <line key={i} x1={x} y1={y1} x2={x} y2={y2} stroke="#10b981" strokeWidth="1" opacity="0.2" />
                                );
                            })}
                        </svg>
                    </div>

                    {/* Active Gene Strand */}
                    <div className="relative z-10 flex gap-4 p-8 bg-emerald-950/10 border border-emerald-500/10 rounded-3xl backdrop-blur-sm group/strand hover:border-emerald-500/30 transition-all duration-700 shadow-[0_0_50px_rgba(16,185,129,0.05)]">
                        {currentStep?.bestGears.map((g, i) => {
                            const delta = prevStep ? g - prevStep.bestGears[i] : 0;
                            const isMutated = Math.abs(delta) > 0.001;

                            return (
                                <div
                                    key={i}
                                    className="flex flex-col items-center gap-3 relative"
                                    onMouseEnter={() => setHoveredGene(i)}
                                    onMouseLeave={() => setHoveredGene(null)}
                                >
                                    {/* Connectivity Lines */}
                                    {i < (currentStep?.bestGears.length - 1) && (
                                        <div className="absolute top-1/2 left-[calc(100%-8px)] w-8 h-[1px] bg-emerald-500/20 z-0" />
                                    )}

                                    <div className="text-[9px] font-mono text-emerald-500/40 font-black tracking-[0.2em]">GENE_{i + 1}</div>
                                    <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center relative transition-all duration-500 cursor-pointer ${hoveredGene === i ? 'bg-emerald-500/20 border-emerald-500 scale-110 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-emerald-950/40 border-emerald-500/30'
                                        } border-2 overflow-hidden`}>
                                        {isMutated && !hoveredGene && (
                                            <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping" />
                                        )}
                                        <span className={`text-[13px] font-black font-mono relative z-10 ${hoveredGene === i ? 'text-white' : 'text-emerald-400'}`}>
                                            {g.toFixed(2)}
                                        </span>
                                        <div className="text-[7px] font-mono text-emerald-500/40 mt-0.5 uppercase">Ratio</div>

                                        {/* Hover Overlay Stats */}
                                        {hoveredGene === i && (
                                            <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-black border border-emerald-500 px-3 py-2 rounded shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2">
                                                <div className="text-[8px] font-mono text-emerald-500 uppercase whitespace-nowrap">Δ Deviation</div>
                                                <div className={`text-[10px] font-bold font-mono ${delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {delta >= 0 ? '+' : ''}{delta.toFixed(4)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="h-6 w-[2px] bg-gradient-to-b from-emerald-500/40 to-transparent" />
                                </div>
                            );
                        })}
                    </div>

                    {/* Stability Indicator Bar */}
                    <div className="w-full max-w-2xl flex flex-col gap-2">
                        <div className="flex justify-between items-end px-2">
                            <div className="flex items-center gap-2">
                                <TrendingUp size={12} className="text-emerald-500" />
                                <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest font-bold">Phenotype Stability</span>
                            </div>
                            <span className="text-[10px] font-mono text-emerald-400 font-bold">{(currentStep?.bestFitness || 0).toFixed(4)} P_STB</span>
                        </div>
                        <div className="h-3 bg-emerald-950/40 rounded-full border border-emerald-500/20 overflow-hidden p-[2px]">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-200 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                style={{ width: `${Math.min(100, (currentStep?.bestFitness || 0) * 20)}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Biological Event Log & Secondary Stats */}
                <div className="mt-8 grid grid-cols-2 gap-8 relative z-10 h-32">
                    <div className="bg-emerald-950/20 rounded-2xl border border-emerald-500/10 p-5 flex flex-col gap-3 overflow-hidden group/log">
                        <div className="flex items-center justify-between">
                            <div className="text-[9px] font-mono text-emerald-500/60 uppercase tracking-widest flex items-center gap-2">
                                <Binary size={12} /> Evolutionary Records
                            </div>
                            <div className="text-[8px] font-mono text-emerald-500/30">STREAMING_LIVE</div>
                        </div>
                        <div className="flex-1 flex flex-col gap-2 overflow-hidden">
                            {logs.map(log => (
                                <div key={log.id} className="flex items-center gap-3 text-[10px] font-mono animate-in slide-in-from-left-4 fade-in duration-500 shrink-0">
                                    <span className={`w-1.5 h-1.5 rounded-full ${log.type === 'mutation' ? 'bg-yellow-500' :
                                        log.type === 'elite' ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]' :
                                            log.type === 'crossover' ? 'bg-cyan-500' : 'bg-emerald-900'
                                        }`} />
                                    <span className="text-emerald-500/20">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                                    <span className="text-emerald-100/90 tracking-tight truncate">{log.msg}</span>
                                </div>
                            ))}
                            {logs.length === 0 && <div className="text-emerald-900 font-mono text-[10px] italic">Awaiting sequence synthesis...</div>}
                        </div>

                        {/* Population Distribution Sparkline */}
                        <div className="mt-auto pt-2 border-t border-emerald-500/10 h-10 shrink-0 flex flex-col justify-end">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[7px] font-mono text-emerald-500/40 uppercase">Pool Convergence Map</span>
                                <span className="text-[7px] font-mono text-emerald-500/40">{steps.length} GENS</span>
                            </div>
                            <div className="flex items-end gap-[1px] h-4">
                                {steps.slice(-50).map((s, i) => (
                                    <div
                                        key={i}
                                        className="flex-1 bg-emerald-500/20 hover:bg-emerald-400/60 transition-colors"
                                        style={{ height: `${Math.max(15, (s.avgFitness / (currentStep?.bestFitness || 1)) * 100)}%` }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-background/40 rounded-2xl border border-emerald-500/10 p-5 flex flex-col justify-between hover:border-emerald-500/30 transition-all group/card">
                            <div className="text-[9px] font-mono text-emerald-500/60 uppercase">Convergence</div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black font-mono text-emerald-400">{(100 - (currentStep?.diversity || 0) * 100).toFixed(1)}</span>
                                <span className="text-xs font-mono text-emerald-500/40">%</span>
                            </div>
                            <div className="h-1 w-full bg-emerald-900/30 rounded-full mt-2">
                                <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${100 - (currentStep?.diversity || 0) * 100}%` }} />
                            </div>
                        </div>
                        <div className="bg-background/40 rounded-2xl border border-emerald-500/10 p-5 flex flex-col justify-between hover:border-emerald-500/30 transition-all group/card">
                            <div className="text-[9px] font-mono text-rose-500/60 uppercase flex items-center gap-1.5">
                                <ShieldAlert size={10} /> Mutation Bias
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black font-mono text-rose-400">15</span>
                                <span className="text-xs font-mono text-rose-500/40">%</span>
                            </div>
                            <div className="h-1 w-full bg-rose-900/30 rounded-full mt-2">
                                <div className="h-full bg-rose-500 transition-all duration-1000" style={{ width: `15%` }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Meta */}
                <div className="mt-8 flex justify-between items-center text-[8px] font-mono text-emerald-500/30 uppercase tracking-[0.3em] font-bold border-t border-emerald-500/10 pt-4">
                    <span>Targeting: Optimized Acceleration @ 75m</span>
                    <span>Cross-Verification: Positive</span>
                    <span>System: Encrypted_GEN_LAB</span>
                </div>
            </div>

            <style>{`
                .scanline {
                    background: linear-gradient(
                        to bottom,
                        transparent 50%,
                        rgba(16, 185, 129, 0.05) 50%
                    );
                    background-size: 100% 4px;
                }
                .stretch-svg {
                    width: 100%;
                }
                @keyframes spin-custom {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default GeneticVisualizer;
