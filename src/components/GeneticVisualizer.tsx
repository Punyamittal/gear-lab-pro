import { useMemo } from 'react';
import type { GeneticStep } from '@/lib/optimizer';

interface GeneticVisualizerProps {
    steps: GeneticStep[];
}

const GeneticVisualizer = ({ steps }: GeneticVisualizerProps) => {
    const currentStep = steps[steps.length - 1] || null;

    return (
        <div className="flex flex-col gap-4 h-full">
            <div className="flex-1 glass-panel rounded-2xl overflow-hidden border border-panel/50 relative bg-[#051005] p-6">
                <div className="absolute top-6 left-6 z-10 flex flex-col gap-1 pointer-events-none">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_green]" />
                        <h3 className="font-display text-[12px] tracking-[0.4em] text-green-400 uppercase font-black">Evolutionary Sequence Lab</h3>
                    </div>
                    <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest opacity-60">Gene Pool Mutation Analyzer v2.0</p>
                </div>

                <div className="absolute top-6 right-6 z-10 flex gap-4 pointer-events-none">
                    <div className="bg-background/80 backdrop-blur-md px-4 py-2 rounded-lg border border-panel text-right">
                        <div className="text-[8px] text-muted-foreground font-mono uppercase">Generation</div>
                        <div className="text-sm font-black font-mono text-green-400">{currentStep?.generation || 0}</div>
                    </div>
                    <div className="bg-background/80 backdrop-blur-md px-4 py-2 rounded-lg border border-panel text-right">
                        <div className="text-[8px] text-muted-foreground font-mono uppercase">Diversity</div>
                        <div className="text-sm font-black font-mono text-cyan-400">{(currentStep?.diversity || 0).toFixed(4)}</div>
                    </div>
                </div>

                <div className="mt-20 flex flex-col gap-4">
                    {/* DNA Strand Visualization */}
                    <div className="relative h-24 w-full flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                            <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-green-500 to-transparent animate-pulse" />
                        </div>
                        <div className="flex gap-2">
                            {currentStep?.bestGears.map((g, i) => (
                                <div key={i} className="flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                                    <div className="text-[8px] font-mono text-green-400 font-bold">GENE_{i + 1}</div>
                                    <div className="w-12 h-12 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center relative group hero-node-pulse">
                                        <div className="absolute inset-0 bg-green-400/5 blur-md group-hover:bg-green-400/20 transition-colors" />
                                        <span className="text-xs font-black font-mono text-green-300 relative z-10">{g.toFixed(2)}</span>
                                    </div>
                                    <div className="h-4 w-[1px] bg-green-500/30 animate-bounce" style={{ animationDuration: '2s', animationDelay: `${i * 200}ms` }} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-4 p-4 rounded-xl bg-background/30 border border-panel/50">
                        <div className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <div className="w-1 h-1 bg-green-500 rounded-full" /> Champion Phenotype Expressed
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <div className="text-[8px] text-muted-foreground uppercase">Fitness Score</div>
                                <div className="text-lg font-black font-mono text-foreground leading-none">{(currentStep?.bestFitness || 0).toFixed(4)}</div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-[8px] text-muted-foreground uppercase">Stability Rating</div>
                                <div className="text-lg font-black font-mono text-cyan-400 leading-none">{(100 - (currentStep?.diversity || 0) * 100).toFixed(1)}%</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end pointer-events-none">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-[9px] font-mono text-green-500/80">
                            CROSSOVER RATE: 50%
                        </div>
                        <div className="flex items-center gap-2 text-[9px] font-mono text-orange-500/80">
                            MUTATION FREQ: 15%
                        </div>
                    </div>
                    <div className="text-[8px] font-mono text-muted-foreground text-right italic">
                        * Natural selection algorithm active
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GeneticVisualizer;
