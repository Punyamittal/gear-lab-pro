import { useState, useEffect, useRef, useMemo } from 'react';
import type { SwarmStep } from '@/lib/optimizer';

interface SwarmCanvasProps {
  steps: SwarmStep[];
  isRunning: boolean;
}

const SwarmCanvas = ({ steps, isRunning }: SwarmCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const particleTrails = useRef<Map<number, { x: number, y: number }[]>>(new Map());
  const animRef = useRef<number>(0);

  const step = useMemo(() => steps[currentStepIdx] || null, [steps, currentStepIdx]);

  useEffect(() => {
    if (steps.length === 0) return;
    if (isRunning) {
      setCurrentStepIdx(0);
      particleTrails.current.clear();
    }
  }, [steps.length, isRunning]);

  useEffect(() => {
    if (steps.length === 0 || currentStepIdx >= steps.length) return;

    const timer = setTimeout(() => {
      setCurrentStepIdx(prev => Math.min(prev + 1, steps.length - 1));
    }, 40);

    return () => clearTimeout(timer);
  }, [currentStepIdx, steps.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set resolution to match container
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    const draw = () => {
      // Clear with slight persistence for trails
      ctx.fillStyle = 'rgba(8, 8, 8, 0.15)';
      ctx.fillRect(0, 0, w, h);

      // Racing surface Grid
      ctx.strokeStyle = 'rgba(220, 38, 38, 0.05)';
      ctx.lineWidth = 1;

      const gridSize = 40;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      if (step) {
        const maxFitness = Math.max(...step.particles.map(p => p.fitness), 0.01);

        // Update and draw trails
        step.particles.forEach((p, i) => {
          const px = ((p.position[0] - 1) / 3.5) * (w - 100) + 50;
          const py = ((p.position[1] - 1) / 3.5) * (h - 100) + 50;

          const trail = particleTrails.current.get(i) || [];
          trail.push({ x: px, y: py });
          if (trail.length > 10) trail.shift();
          particleTrails.current.set(i, trail);

          // Draw Trail Line
          if (trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(trail[0].x, trail[0].y);
            const intensity = p.fitness / maxFitness;
            ctx.strokeStyle = `rgba(220, 38, 38, ${0.1 + intensity * 0.3})`;
            ctx.lineWidth = 1 + intensity * 2;
            for (let j = 1; j < trail.length; j++) {
              ctx.lineTo(trail[j].x, trail[j].y);
            }
            ctx.stroke();
          }

          // Force Glow Effect
          const intensity = p.fitness / maxFitness;
          const radial = ctx.createRadialGradient(px, py, 0, px, py, 6 + intensity * 15);
          radial.addColorStop(0, `hsla(0, 85%, 50%, ${0.4 + intensity * 0.6})`);
          radial.addColorStop(1, 'transparent');

          ctx.fillStyle = radial;
          ctx.beginPath();
          ctx.arc(px, py, 6 + intensity * 15, 0, Math.PI * 2);
          ctx.fill();

          // Performance Node
          ctx.fillStyle = `hsla(45, 90%, 55%, ${0.8 + intensity * 0.2})`;
          ctx.beginPath();
          ctx.arc(px, py, 1.5 + intensity * 2, 0, Math.PI * 2);
          ctx.fill();

          // Particle ID for top performers
          if (intensity > 0.8) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.font = '7px monospace';
            ctx.fillText(`AGENT_${i}`, px + 8, py - 8);
          }
        });

        // Scan Sweep Effect
        const sweepAngle = (Date.now() / 1500) % (Math.PI * 2);
        const sweepX = w / 2 + Math.cos(sweepAngle) * (w + h);
        const sweepY = h / 2 + Math.sin(sweepAngle) * (w + h);

        const sweepGrad = ctx.createLinearGradient(w / 2, h / 2, sweepX, sweepY);
        sweepGrad.addColorStop(0, 'transparent');
        sweepGrad.addColorStop(1, 'rgba(220, 38, 38, 0.03)');
        ctx.fillStyle = sweepGrad;
        ctx.beginPath();
        ctx.moveTo(w / 2, h / 2);
        ctx.arc(w / 2, h / 2, Math.max(w, h) * 1.5, sweepAngle - 0.2, sweepAngle + 0.2);
        ctx.fill();

        // Global Best Marker - Scanning Effect
        const bx = ((step.globalBest[0] - 1) / 3.5) * (w - 100) + 50;
        const by = ((step.globalBest[1] - 1) / 3.5) * (h - 100) + 50;

        const time = Date.now() / 1000;
        const scanRadius = 20 + Math.sin(time * 4) * 5;

        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(bx, by, scanRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(bx, by, scanRadius + 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Target Crosshair
        ctx.beginPath();
        ctx.moveTo(bx - scanRadius - 10, by);
        ctx.lineTo(bx + scanRadius + 10, by);
        ctx.moveTo(bx, by - scanRadius - 10);
        ctx.lineTo(bx, by + scanRadius + 10);
        ctx.stroke();

        ctx.fillStyle = '#eab308';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('OPTIMAL_LINE_LOCK', bx + scanRadius + 15, by - 5);
        ctx.fillText(`P_COEFF: ${step.globalBestFitness.toFixed(2)}`, bx + scanRadius + 15, by + 10);
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [step]);

  return (
    <div className="relative w-full h-full flex flex-col gap-4">
      <div className="flex-1 glass-panel rounded-2xl overflow-hidden border border-panel/50 relative bg-[#050510]">
        {/* Overlay HUD */}
        <div className="absolute top-6 left-6 z-10 flex flex-col gap-1 pointer-events-none">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse shadow-[0_0_10px_red]" />
            <h3 className="font-display text-[12px] tracking-[0.4em] text-f1-red uppercase font-black">Strategy Synthesis Monitor</h3>
          </div>
          <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest opacity-60">Collective Particle Optimization • v2.6</p>
        </div>

        <div className="absolute top-6 right-6 z-10 flex gap-4 pointer-events-none">
          <div className="bg-background/80 backdrop-blur-md px-4 py-2 rounded-lg border border-panel text-right">
            <div className="text-[8px] text-muted-foreground font-mono uppercase">Lap Cycle</div>
            <div className="text-sm font-black font-mono text-red-500">{step?.iteration || 0}<span className="text-[10px] text-muted-foreground ml-1">/{steps.length}</span></div>
          </div>
          <div className="bg-background/80 backdrop-blur-md px-4 py-2 rounded-lg border border-panel text-right">
            <div className="text-[8px] text-muted-foreground font-mono uppercase">Setup Confidence</div>
            <div className="text-sm font-black font-mono text-yellow-500">
              {step ? (100 - (100 / (1 + step.globalBestFitness * 0.1))).toFixed(1) : '0.0'}%
            </div>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          className="w-full h-full"
        />

        <div className="absolute bottom-6 left-6 z-10 flex flex-col gap-2 pointer-events-none">
          <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground/80">
            <div className="w-2 h-2 rounded-full bg-red-600/50" /> Virtual Race Agents: {step?.particles.length || 0}
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground/80">
            <div className="w-2 h-2 rounded-full bg-yellow-500/50" /> Telemetry Fidelity: High
          </div>
        </div>
      </div>

      {/* Auxiliary Statistics Row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'SEARCH SPACE', val: '4-DIMENSIONAL', sub: 'Non-Linear' },
          { label: 'COGNITIVE COEFF', val: '1.50', sub: 'Individual Best' },
          { label: 'SOCIAL COEFF', val: '1.50', sub: 'Global Comm' },
          { label: 'INERTIA WEIGHT', val: '0.70', sub: 'Exploration' }
        ].map((m, i) => (
          <div key={i} className="glass-panel p-4 rounded-xl border border-panel/30">
            <div className="text-[8px] text-muted-foreground font-mono uppercase mb-1">{m.label}</div>
            <div className="text-xs font-black font-mono text-foreground uppercase">{m.val}</div>
            <div className="text-[8px] text-muted-foreground font-mono italic mt-1">{m.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SwarmCanvas;
