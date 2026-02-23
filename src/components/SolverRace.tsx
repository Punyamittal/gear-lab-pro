/**
 * GearOpt X — Solver Race Component
 * Runs Quantum, Swarm, and Genetic optimizers simultaneously
 * and visualizes them racing against each other.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { Zap, Trophy, Timer } from 'lucide-react';

interface SolverProgress {
    name: string;
    color: string;
    progress: number;
    fitness: number;
    elapsed: number;
    status: 'idle' | 'running' | 'finished';
    rank: number | null;
}

interface SolverRaceProps {
    onComplete: (winner: string, gears: number[]) => void;
    runQuantumFn: () => { fitness: number; gearRatios: number[] };
    runSwarmFn: () => { fitness: number; gearRatios: number[] };
    runGeneticFn: () => { fitness: number; gearRatios: number[] };
}

const SolverRace = ({ onComplete, runQuantumFn, runSwarmFn, runGeneticFn }: SolverRaceProps) => {
    const [solvers, setSolvers] = useState<SolverProgress[]>([
        { name: 'Quantum', color: 'hsl(270, 55%, 75%)', progress: 0, fitness: 0, elapsed: 0, status: 'idle', rank: null },
        { name: 'Swarm', color: 'hsl(25, 70%, 72%)', progress: 0, fitness: 0, elapsed: 0, status: 'idle', rank: null },
        { name: 'Genetic', color: 'hsl(155, 55%, 68%)', progress: 0, fitness: 0, elapsed: 0, status: 'idle', rank: null },
    ]);
    const [isRacing, setIsRacing] = useState(false);
    const [winner, setWinner] = useState<string | null>(null);
    const finishOrder = useRef<number>(0);

    const startRace = useCallback(() => {
        setIsRacing(true);
        setWinner(null);
        finishOrder.current = 0;

        setSolvers(prev => prev.map(s => ({ ...s, progress: 0, fitness: 0, elapsed: 0, status: 'running', rank: null })));

        // Each solver runs with simulated progressive updates
        const solverConfigs = [
            { index: 0, name: 'Quantum', fn: runQuantumFn, baseDelay: 800 + Math.random() * 400 },
            { index: 1, name: 'Swarm', fn: runSwarmFn, baseDelay: 600 + Math.random() * 600 },
            { index: 2, name: 'Genetic', fn: runGeneticFn, baseDelay: 1000 + Math.random() * 500 },
        ];

        solverConfigs.forEach(({ index, name, fn, baseDelay }) => {
            // Simulate progressive updates
            const steps = 10;
            for (let step = 1; step <= steps; step++) {
                setTimeout(() => {
                    setSolvers(prev => {
                        const updated = [...prev];
                        updated[index] = {
                            ...updated[index],
                            progress: (step / steps) * 100,
                            elapsed: (baseDelay / steps) * step,
                        };
                        return updated;
                    });
                }, (baseDelay / steps) * step);
            }

            // Final result
            setTimeout(() => {
                const result = fn();
                finishOrder.current += 1;
                const rank = finishOrder.current;

                setSolvers(prev => {
                    const updated = [...prev];
                    updated[index] = {
                        ...updated[index],
                        progress: 100,
                        fitness: result.fitness,
                        status: 'finished',
                        elapsed: baseDelay,
                        rank,
                    };
                    return updated;
                });

                if (rank === 1) {
                    setWinner(name);
                    onComplete(name, result.gearRatios);
                }

                if (rank === 3) {
                    setIsRacing(false);
                }
            }, baseDelay);
        });
    }, [runQuantumFn, runSwarmFn, runGeneticFn, onComplete]);

    return (
        <div className="glass-panel p-6 rounded-2xl border border-panel/50">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <Trophy size={18} className="text-primary" />
                    <h3 className="font-display text-[12px] tracking-[0.3em] text-primary uppercase font-black">
                        Solver Race
                    </h3>
                    <span className="text-[8px] font-mono text-muted-foreground uppercase tracking-widest">
                        Multi-Threaded Competition
                    </span>
                </div>
                <PremiumButton onClick={startRace} disabled={isRacing}>
                    {isRacing ? 'Racing...' : 'Start Race'}
                </PremiumButton>
            </div>

            <div className="space-y-4">
                {solvers.map((solver, i) => (
                    <div key={i} className="relative">
                        <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ background: solver.color }} />
                                <span className="text-[10px] font-display tracking-[0.2em] uppercase font-bold" style={{ color: solver.color }}>
                                    {solver.name}
                                </span>
                                {solver.rank === 1 && (
                                    <span className="text-[8px] font-mono bg-primary/20 text-primary px-2 py-0.5 rounded-full border border-primary/30 animate-pulse">
                                        WINNER
                                    </span>
                                )}
                                {solver.rank && solver.rank > 1 && (
                                    <span className="text-[8px] font-mono text-muted-foreground px-2 py-0.5">
                                        P{solver.rank}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-4 text-[9px] font-mono text-muted-foreground">
                                {solver.status === 'finished' && (
                                    <span>Fitness: <span className="font-bold" style={{ color: solver.color }}>{solver.fitness.toFixed(1)}</span></span>
                                )}
                                <span>{solver.elapsed.toFixed(0)}ms</span>
                            </div>
                        </div>

                        {/* Progress Bar Track */}
                        <div className="h-3 bg-background/60 rounded-full border border-panel/50 overflow-hidden relative">
                            <div
                                className="h-full rounded-full transition-all duration-200 ease-out relative"
                                style={{
                                    width: `${solver.progress}%`,
                                    background: `linear-gradient(90deg, transparent, ${solver.color})`,
                                    boxShadow: solver.rank === 1 ? `0 0 15px ${solver.color}` : 'none',
                                }}
                            >
                                {/* Animated leading edge */}
                                {solver.status === 'running' && (
                                    <div className="absolute right-0 top-0 bottom-0 w-4 animate-pulse rounded-full"
                                        style={{ background: solver.color, filter: 'blur(4px)' }}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {winner && !isRacing && (
                <div className="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/20 text-center animate-in fade-in duration-500">
                    <span className="text-[10px] font-display tracking-[0.3em] uppercase font-bold text-primary">
                        <Zap size={14} className="inline mr-2" />
                        {winner} wins the race! Solution auto-applied.
                    </span>
                </div>
            )}
        </div>
    );
};

export default SolverRace;
