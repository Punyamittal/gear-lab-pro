import { useMemo } from 'react';
import { type SimPoint } from '@/lib/physics';

interface DigitalTwinProps {
    simData: SimPoint[];
    progress: number; // 0 to 100
    isRunning: boolean;
    isMuted: boolean;
}

export const DigitalTwin = ({ simData, progress, isRunning, isMuted }: DigitalTwinProps) => {
    const currentPoint = useMemo(() => {
        if (simData.length === 0) return null;
        const index = Math.floor((progress / 100) * (simData.length - 1));
        return simData[index];
    }, [simData, progress]);

    return (
        <div
            className="relative w-full glass-panel rounded-3xl border border-panel/50 group flex flex-col"
            style={{ minHeight: '1000px', height: '1000px', backgroundColor: '#0a0a0a' }}
        >
            {/* Header Overlay */}
            <div className="absolute top-8 left-8 z-30 pointer-events-none">
                <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.6)]" />
                    <h3 className="font-display text-[18px] tracking-[0.5em] text-red-500 uppercase font-black">Digital Twin Stream</h3>
                </div>
                <p className="text-[12px] font-mono text-muted-foreground mt-2 uppercase tracking-widest opacity-70">High-Fidelity Virtual Representation • Aston Martin F1 AMR23</p>
            </div>

            <div className="absolute top-6 right-6 z-20 flex flex-col items-end gap-2 text-right pointer-events-none">
                <div className="bg-background/80 backdrop-blur-md px-4 py-2 rounded-lg border border-panel shrink-0">
                    <div className="text-[8px] text-muted-foreground font-mono uppercase">System Health</div>
                    <div className="text-[10px] text-green-400 font-bold font-mono">NOMINAL - 99.2%</div>
                </div>
                <div className="bg-background/80 backdrop-blur-md px-4 py-2 rounded-lg border border-panel shrink-0">
                    <div className="text-[8px] text-muted-foreground font-mono uppercase">Sync Latency</div>
                    <div className="text-[10px] text-cyan-400 font-bold font-mono">0.08ms</div>
                </div>
            </div>

            {/* Main 3D Model Viewport */}
            <div className="flex-1 relative w-full h-full bg-[#050505]">
                {/* @ts-ignore - model-viewer is a web component */}
                <model-viewer
                    src="/models/aston_martin_f1_amr23_2023.glb"
                    alt="Aston Martin F1 AMR23"
                    auto-rotate
                    rotation-per-second={isRunning ? "30deg" : "15deg"}
                    camera-controls
                    shadow-intensity="2"
                    shadow-softness="0.5"
                    environment-image="neutral"
                    exposure="2.5"
                    camera-orbit="auto 75deg auto"
                    min-camera-orbit="auto 0deg 0%"
                    max-camera-orbit="auto 180deg infinity"
                    field-of-view="auto"
                    loading="eager"
                    bounds="tight"
                    interpolation-decay="200"
                    style={{ width: '100%', height: '100%', minHeight: '800px', backgroundColor: '#0a0a0a' }}
                >
                    <div slot="poster" className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a] text-red-500 font-mono text-[14px] uppercase tracking-[0.5em]">
                        <div className="flex flex-col items-center gap-6">
                            <div className="w-12 h-12 rounded-full border-4 border-red-500/20 border-t-red-500 animate-spin" />
                            <span className="animate-pulse">Active Stream: Aston Martin F1</span>
                        </div>
                    </div>
                </model-viewer>
            </div>

            {/* Integrated Telemetry Cards (Overlaid at bottom) */}
            <div className="absolute bottom-6 left-6 right-6 z-20 grid grid-cols-4 gap-4 pointer-events-none">
                {[
                    { label: 'CHASSIS STRESS', val: ((currentPoint?.acceleration_long || 0) * 5.2).toFixed(1), unit: '%' },
                    { label: 'DRIVETRAIN TEMP', val: (82 + (currentPoint?.rpm || 0) / 450).toFixed(1), unit: '°C' },
                    { label: 'AERO LOAD', val: (currentPoint?.downforce || 0).toFixed(0), unit: 'N' },
                    { label: 'ENGINE SPEED', val: (currentPoint?.rpm || 0).toFixed(0), unit: ' RPM' }
                ].map((m, i) => (
                    <div key={i} className="bg-background/60 backdrop-blur-xl p-4 rounded-xl border border-panel/50 shadow-2xl pointer-events-auto hover:border-primary/50 transition-colors group/card">
                        <div className="flex justify-between items-start mb-1">
                            <div className="text-[9px] text-muted-foreground font-mono uppercase tracking-wider">{m.label}</div>
                            <div className="w-1.5 h-1.5 rounded-full bg-primary/20 group-hover/card:bg-primary transition-colors" />
                        </div>
                        <div className="text-lg font-black font-mono text-foreground tracking-tight leading-none uppercase">
                            {m.val}<span className="text-[10px] ml-1 opacity-50">{m.unit}</span>
                        </div>
                        <div className="w-full h-[2px] bg-panel/30 rounded-full mt-3 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-red-600 to-yellow-500 transition-all duration-300 ease-out"
                                style={{ width: `${Math.min(100, Number(m.val) / (m.label === 'ENGINE SPEED' ? 140 : 1))}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom Gradient Overlay for depth */}
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background via-background/60 to-transparent z-10 pointer-events-none" />
        </div>
    );
};
