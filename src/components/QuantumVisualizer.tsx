import { useEffect, useRef, useState, useMemo } from 'react';
import type { AnnealingStep } from '@/lib/optimizer';

interface QuantumVisualizerProps {
  steps: AnnealingStep[];
  isRunning: boolean;
}

const QuantumVisualizer = ({ steps, isRunning }: QuantumVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const animRef = useRef<number>(0);
  const particles = useRef<Array<{ x: number, y: number, vx: number, vy: number, alpha: number }>>([]);

  useEffect(() => {
    if (isRunning) {
      setCurrentStep(0);
      particles.current = Array.from({ length: 40 }, () => ({
        x: Math.random() * 400,
        y: Math.random() * 300,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        alpha: Math.random()
      }));
    }
  }, [isRunning]);

  useEffect(() => {
    if (steps.length === 0 || currentStep >= steps.length) return;
    const timer = setTimeout(() => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1)), 25);
    return () => clearTimeout(timer);
  }, [currentStep, steps.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width, h = rect.height;
    const cx = w / 2, cy = h / 2;

    const draw = (time: number) => {
      // Trail effect
      ctx.fillStyle = 'rgba(10, 10, 15, 0.15)';
      ctx.fillRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += 30) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      const step = steps[currentStep];
      if (!step) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      const progress = currentStep / Math.max(steps.length - 1, 1);
      const tempFactor = step.temperature / 2.0;

      // Draw Oscillating Field Strings
      const numStrings = 8;
      for (let i = 0; i < numStrings; i++) {
        const offset = (i / numStrings) * Math.PI * 2;
        ctx.beginPath();
        ctx.strokeStyle = `hsla(${270 + i * 5}, 80%, 60%, ${0.1 + (1 - tempFactor) * 0.2})`;
        ctx.lineWidth = 1.5;

        for (let x = 0; x < w; x += 5) {
          const wave1 = Math.sin(x * 0.01 + time * 0.002 + offset) * 40 * tempFactor;
          const wave2 = Math.sin(x * 0.03 - time * 0.005 + offset) * 20 * tempFactor;
          const y = cy + wave1 + wave2;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Particles - "Quantum States"
      particles.current.forEach(p => {
        p.x += p.vx * tempFactor;
        p.y += p.vy * tempFactor;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        const distToCenter = Math.hypot(p.x - cx, p.y - cy);
        const pull = (1 - tempFactor) * 2;
        p.vx += (cx - p.x) * 0.001 * pull;
        p.vy += (cy - p.y) * 0.001 * pull;

        ctx.fillStyle = `hsla(185, 100%, 50%, ${p.alpha * (0.3 + (1 - tempFactor) * 0.7)})`;
        const size = (1 - tempFactor) * 3 + 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();

        if (distToCenter < 100 * (1 - tempFactor)) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = 'cyan';
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // Central Probability Density
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 120 * tempFactor + 20);
      gradient.addColorStop(0, `hsla(270, 100%, 60%, ${0.3 * (1 - progress)})`);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, 120 * tempFactor + 20, 0, Math.PI * 2);
      ctx.fill();

      // Convergence Glow
      if (progress > 0.5) {
        const glowAlpha = (progress - 0.5) * 2;
        const pulse = Math.sin(time * 0.005) * 10;
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 40 + pulse);
        glow.addColorStop(0, `hsla(155, 100%, 50%, ${glowAlpha * 0.4})`);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, 40 + pulse, 0, Math.PI * 2);
        ctx.fill();

        // Target Flare
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'hsl(155, 100%, 50%)';
        ctx.strokeStyle = `hsla(155, 100%, 50%, ${glowAlpha})`;
        ctx.strokeRect(cx - 2, cy - 2, 4, 4);
        ctx.shadowBlur = 0;
      }

      // HUD UI elements
      ctx.save();
      ctx.font = '9px "JetBrains Mono", monospace';

      // Top Left Stats
      ctx.fillStyle = 'rgba(139, 92, 246, 0.8)';
      ctx.fillText('CORE_TEMPERATURE', 20, 30);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillText(`${(step.temperature * 100).toFixed(1)} mK`, 20, 45);

      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(6, 182, 212, 0.8)';
      ctx.fillText('SYSTEM_FITNESS', 20, 70);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillText(step.fitness.toFixed(5), 20, 85);

      // Bottom Right Ratios
      const ratioText = `RATIOS: [${step.gearRatios.map(r => r.toFixed(2)).join(', ')}]`;
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      const textW = ctx.measureText(ratioText).width;
      ctx.fillText(ratioText, w - textW - 20, h - 20);

      // Scanning Line
      const scanY = (time * 0.1) % h;
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.1)';
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(w, scanY);
      ctx.stroke();

      ctx.restore();

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [currentStep, steps]);

  return (
    <div ref={containerRef} className="w-full h-full relative cursor-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />

      {/* Overlay UI */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-purple-400/70">STOCHASTIC_TUNNELING</span>
          <div className={`w-2 h-2 rounded-full ${steps[currentStep]?.accepted ? 'bg-green-500 animate-pulse' : 'bg-red-500/50'}`} />
        </div>
        <div className="text-[9px] font-mono text-white/30">ITER: {String(currentStep).padStart(3, '0')}</div>
      </div>

      <div className="absolute bottom-4 left-4 border-l-2 border-purple-500 pl-3">
        <div className="text-[10px] font-display text-purple-400 tracking-widest uppercase">Phase Convergence</div>
        <div className="text-xs font-mono text-white/50">
          {steps[currentStep]?.probability > 0.9 ? 'STABILIZED' : 'FLUCTUATING'}
        </div>
      </div>
    </div>
  );
};

export default QuantumVisualizer;
