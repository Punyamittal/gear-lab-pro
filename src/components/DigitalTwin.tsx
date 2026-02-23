import { useMemo } from 'react';
import { type SimPoint } from '@/lib/physics';

interface DigitalTwinProps {
    simData: SimPoint[];
    progress: number; // 0 to 100
    isRunning: boolean;
}

export const DigitalTwin = ({ simData, progress, isRunning }: DigitalTwinProps) => {
    const currentPoint = useMemo(() => {
        if (simData.length === 0) return null;
        const index = Math.floor((progress / 100) * (simData.length - 1));
        return simData[index];
    }, [simData, progress]);

    return (
        <div className="relative w-full h-[850px] glass-panel rounded-2xl overflow-hidden bg-background/40 border border-panel/50 group flex flex-col">
            {/* Header Overlay */}
            <div className="absolute top-6 left-6 z-20 pointer-events-none">
                <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_12px_rgba(6,182,212,0.5)]" />
                    <h3 className="font-display text-[14px] tracking-[0.4em] text-cyan-400 uppercase font-black">Digital Twin Stream</h3>
                </div>
                <p className="text-[10px] font-mono text-muted-foreground mt-1 uppercase tracking-widest opacity-60">High-Fidelity Virtual Representation • Aston Martin AMR23</p>
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
                <iframe
                    title="Aston Martin F1 AMR23 2023"
                    allow="autoplay; fullscreen; xr-spatial-tracking"
                    src="https://sketchfab.com/models/f6ba825a43b146a9b669934a4e1fd529/embed?autostart=1&camera=0&preload=1&transparent=1&ui_hint=0&ui_theme=dark"
                    className="w-full h-full border-0"
                />
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
                                className="h-full bg-gradient-to-r from-primary to-cyan-400 transition-all duration-300 ease-out"
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
