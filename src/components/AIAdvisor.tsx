import { useState, useCallback } from 'react';
import { generateAIInsight, getRuleBasedFallback } from '@/lib/gemini';
import { Loader2, Brain, Zap, Target, AlertTriangle, Cpu, Flag, Flame, Gauge, Timer } from 'lucide-react';
import { PremiumButton } from '@/components/ui/PremiumButton';

interface AIAdvisorProps {
    vehicleData: any;
    results: { accel: number; skidpad: number; autocross: number };
    gears: number[];
}

const AIAdvisor = ({ vehicleData, results, gears }: AIAdvisorProps) => {
    const [insight, setInsight] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isFallback, setIsFallback] = useState(false);

    const getInsights = useCallback(async () => {
        setLoading(true);
        setInsight(null);
        setIsFallback(false);

        const prompt = `
      You are a world-class Formula 1 Race Engineer on the pit wall. Analyze the following vehicle setup and provide a concise, high-impact strategic briefing.
      
      VEHICLE SETUP:
      - Mass: ${vehicleData.mass_kg}kg
      - Grip (mu): ${vehicleData.mu}
      - Gear Ratios: [${gears.join(', ')}]
      
      CURRENT PERFORMANCE:
      - 75m Sprint: ${results.accel.toFixed(3)}s
      - Cornering Skidpad: ${results.skidpad.toFixed(3)}s
      - Full Lap Simulation: ${results.autocross.toFixed(2)}s
      
      ADDITIONAL DATA:
      - Digital Twin Telemetry: High-Fidelity F1 Virtual Prototype active.
      
      INSTRUCTIONS:
      1. Identify the biggest performance bottleneck.
      2. Suggest one specific gear ratio adjustment.
      3. Comment on the balance between acceleration and top speed.
      4. Incorporate observations from the High-Fidelity Digital Twin if applicable.
      5. Keep the tone professional, technical, and concise (under 150 words).
      6. Use technical racing terminology.
    `;

        try {
            const response = await generateAIInsight(prompt);
            setInsight(response);
        } catch (error) {
            console.warn("Gemini Service Unavailable, switching to Pit Wall Heuristics.");
            const fallback = getRuleBasedFallback({
                mass: vehicleData.mass_kg,
                mu: vehicleData.mu,
                gears: gears,
                results: results
            });
            setInsight(fallback);
            setIsFallback(true);
        } finally {
            setLoading(false);
        }
    }, [vehicleData, results, gears]);

    return (
        <div className="flex flex-col gap-6">
            <div className="glass-panel p-8 rounded-2xl border border-primary/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Flag size={80} className="text-primary" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-red-950/20 flex items-center justify-center border border-red-500/30 shadow-[0_0_15px_hsl(var(--f1-red)/0.2)]">
                                <Cpu className="text-f1-red" size={24} />
                            </div>
                            <div>
                                <h2 className="font-display text-lg tracking-[0.3em] uppercase text-primary font-black">Pit Wall AI Strategy</h2>
                                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                                    {isFallback ? 'Deterministic Heuristics • Safety Mode' : 'Gemini 1.5 Flash • Race Logic Synthesis'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 rounded bg-f1-red/10 border border-f1-red/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-[8px] font-mono font-bold text-red-500 tracking-widest uppercase">Live Link</span>
                        </div>
                    </div>

                    {!insight && !loading && (
                        <div className="flex flex-col items-center justify-center py-10 text-center space-y-4 relative">
                            <div className="absolute inset-0 checkered-pattern opacity-5 rounded-xl" />
                            <p className="text-muted-foreground text-sm max-w-md font-medium italic opacity-80 relative z-10">
                                "The Pit Wall Strategy Core is in standby. Awaiting telemetry synchronization for qualifying briefing."
                            </p>
                            <PremiumButton
                                onClick={getInsights}
                                className="min-w-[240px] relative z-10"
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <Flame size={16} fill="white" />
                                    Launch Strategic Analysis
                                </div>
                            </PremiumButton>
                        </div>
                    )}

                    {loading && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="relative">
                                <Loader2 className="text-primary animate-spin" size={40} />
                                <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full animate-pulse" />
                            </div>
                            <p className="text-[10px] font-mono text-primary animate-pulse tracking-[0.4em] uppercase">Processing Quantum Weights...</p>
                        </div>
                    )}

                    {insight && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="grid grid-cols-3 gap-4">
                                <InsightCard icon={<Flag className="text-red-500" size={16} />} title="Priority Sector" content="Sector 1 Acceleration" />
                                <InsightCard icon={<Gauge className="text-yellow-500" size={16} />} title="Gain Potential" content="-0.185s / Lap" />
                                <InsightCard icon={<Timer className="text-green-500" size={16} />} title="Reliability" content="Nominal / High" />
                            </div>

                            <div className="p-6 rounded-xl bg-background/40 border-l-4 border-l-red-600 border border-panel/50 font-sans leading-relaxed text-sm text-foreground/90 relative overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-1 checkers-pattern opacity-10" />
                                <div className="absolute -top-3 left-6 px-3 py-1 bg-panel border border-panel rounded-full text-[9px] font-mono text-f1-red uppercase tracking-widest font-bold z-10">
                                    Pit Wall Briefing
                                </div>
                                <div className="whitespace-pre-wrap relative z-10">
                                    {insight}
                                </div>
                            </div>

                            <button
                                onClick={getInsights}
                                className="text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest flex items-center gap-2"
                            >
                                <Zap size={10} /> Re-synthesize Data
                            </button>

                            {!isFallback && (
                                <button
                                    onClick={() => {
                                        const fallback = getRuleBasedFallback({
                                            mass: vehicleData.mass_kg,
                                            mu: vehicleData.mu,
                                            gears: gears,
                                            results: results
                                        });
                                        setInsight(fallback);
                                        setIsFallback(true);
                                    }}
                                    className="text-[9px] font-mono text-f1-red/50 hover:text-f1-red transition-colors uppercase tracking-[0.2em] mt-2 block w-max"
                                >
                                    Force Heuristic Mode (Bypass API)
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const InsightCard = ({ icon, title, content }: { icon: any, title: string, content: string }) => (
    <div className="bg-background/30 border border-panel/50 p-4 rounded-xl flex flex-col gap-2">
        <div className="flex items-center gap-2 opacity-60">
            {icon}
            <span className="text-[9px] font-mono uppercase tracking-widest font-bold text-muted-foreground">{title}</span>
        </div>
        <span className="text-xs font-semibold tracking-wide">{content}</span>
    </div>
);

export default AIAdvisor;
