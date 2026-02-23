import { useState, useCallback } from 'react';
import { generateAIInsight } from '@/lib/ollama';
import { Loader2, Brain, Zap, Target, AlertTriangle, Cpu } from 'lucide-react';
import { PremiumButton } from '@/components/ui/PremiumButton';

interface AIAdvisorProps {
    vehicleData: any;
    results: { accel: number; skidpad: number; autocross: number };
    gears: number[];
}

const AIAdvisor = ({ vehicleData, results, gears }: AIAdvisorProps) => {
    const [insight, setInsight] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const getInsights = useCallback(async () => {
        setLoading(true);
        setInsight(null);

        const prompt = `
      You are a world-class Formula SAE racing engineer. Analyze the following vehicle setup and provide a concise, high-impact strategic report.
      
      VEHICLE SETUP:
      - Mass: ${vehicleData.mass_kg}kg
      - Grip (mu): ${vehicleData.mu}
      - Gear Ratios: [${gears.join(', ')}]
      
      CURRENT PERFORMANCE:
      - 75m Acceleration: ${results.accel.toFixed(3)}s
      - Skidpad: ${results.skidpad.toFixed(3)}s
      - Autocross: ${results.autocross.toFixed(2)}s
      
      ADDITIONAL DATA:
      - Digital Twin Telemetry: High-Fidelity Aston Martin AMR23 3D Sync active.
      
      INSTRUCTIONS:
      1. Identify the biggest performance bottleneck.
      2. Suggest one specific gear ratio adjustment.
      3. Comment on the balance between acceleration and top speed.
      4. Incorporate observations from the High-Fidelity Digital Twin if applicable.
      5. Keep the tone professional, technical, and concise (under 150 words).
      6. Use technical racing terminology.
    `;

        const response = await generateAIInsight(prompt);
        setInsight(response);
        setLoading(false);
    }, [vehicleData, results, gears]);

    return (
        <div className="flex flex-col gap-6">
            <div className="glass-panel p-8 rounded-2xl border border-primary/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Brain size={80} className="text-primary" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/30 shadow-[0_0_15px_hsl(var(--primary)/0.2)]">
                            <Cpu className="text-primary" size={24} />
                        </div>
                        <div>
                            <h2 className="font-display text-lg tracking-[0.3em] uppercase text-primary font-black">AI Strategic Core</h2>
                            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Llama 3.2:3B • Neural Engineering Synthesis</p>
                        </div>
                    </div>

                    {!insight && !loading && (
                        <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                            <p className="text-muted-foreground text-sm max-w-md font-medium italic opacity-80">
                                "The Strategic Core is standby. Ready to synthesize telemetry into actionable engineering directives."
                            </p>
                            <PremiumButton
                                onClick={getInsights}
                                className="min-w-[240px]"
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <Zap size={16} fill="white" />
                                    Generate Deep Analysis
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
                                <InsightCard icon={<Target className="text-cyan-400" size={16} />} title="Focus Area" content="Gear Shift Points" />
                                <InsightCard icon={<Zap className="text-orange-400" size={16} />} title="Potential" content="+12.4% Efficiency" />
                                <InsightCard icon={<AlertTriangle className="text-red-400" size={16} />} title="Risk factor" content="Wheel Spin (1st Gear)" />
                            </div>

                            <div className="p-6 rounded-xl bg-background/40 border border-panel/50 font-sans leading-relaxed text-sm text-foreground/90 relative">
                                <div className="absolute -top-3 left-6 px-3 py-1 bg-panel border border-panel rounded-full text-[9px] font-mono text-primary uppercase tracking-widest font-bold">
                                    Engineering Directive
                                </div>
                                <div className="whitespace-pre-wrap">
                                    {insight}
                                </div>
                            </div>

                            <button
                                onClick={getInsights}
                                className="text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest flex items-center gap-2"
                            >
                                <Zap size={10} /> Re-synthesize Data
                            </button>
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
