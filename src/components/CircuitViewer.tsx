import { useState } from 'react';

interface CircuitViewerProps {
    isMuted: boolean;
}

export const CircuitViewer = ({ isMuted }: CircuitViewerProps) => {
    return (
        <div className="relative w-full min-h-[500px] h-[850px] glass-panel rounded-2xl overflow-hidden bg-[#050505] border border-panel/50 flex flex-col">
            {/* Header Overlay */}
            <div className="absolute top-6 left-6 z-20 pointer-events-none">
                <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.5)]" />
                    <h3 className="font-display text-[14px] tracking-[0.4em] text-amber-500 uppercase font-black">Circuit Map</h3>
                </div>
                <p className="text-[10px] font-mono text-muted-foreground mt-1 uppercase tracking-widest opacity-60">
                    F1 Bahrain International Circuit • 3D Low-Poly Model
                </p>
            </div>

            {/* 3D Circuit Viewport */}
            <div className="flex-1 relative w-full h-full bg-[#050505]">
                <iframe
                    title="F1 Bahrain lowpoly circuit"
                    src="https://sketchfab.com/models/62181151f9f44d71af3819ec8c63fde2/embed"
                    width="100%"
                    height="100%"
                    className="border-0"
                    allow="autoplay; fullscreen; xr-spatial-tracking"
                />
            </div>

            {/* Bottom Gradient Overlay for depth */}
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#050505] to-transparent z-10 pointer-events-none" />
        </div>
    );
};
