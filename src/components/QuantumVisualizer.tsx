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
      // Trail effect with adaptive decay
      const step = steps[currentStep];
      const nextStep = steps[currentStep + 1] || step;
      const progress = currentStep / Math.max(steps.length - 1, 1);
      const tempFactor = step?.temperature / 2.0 || 0;

      ctx.fillStyle = `rgba(8, 8, 8, ${0.15 + tempFactor * 0.1})`;
      ctx.fillRect(0, 0, w, h);

      // Racing Surface Grid - Stabilizes as it cools
      const gridOpacity = 0.04 + (1 - tempFactor) * 0.06;
      ctx.strokeStyle = `rgba(239, 68, 68, ${gridOpacity})`;
      ctx.lineWidth = 1;
      const gridOffset = (time * 0.02) % 30;
      for (let x = -gridOffset; x < w; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = -gridOffset; y < h; y += 30) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      if (!step) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      // Draw Oscillating Field Strings - Quantum Field
      const numStrings = 12;
      for (let i = 0; i < numStrings; i++) {
        const offset = (i / numStrings) * Math.PI * 2;
        ctx.beginPath();
        const hue = 260 + i * 10;
        ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${0.05 + (1 - tempFactor) * 0.15})`;
        ctx.lineWidth = 1 + (1 - tempFactor);

        ctx.moveTo(0, cy);
        for (let x = 0; x < w; x += 10) {
          const wave1 = Math.sin(x * 0.01 + time * 0.002 + offset) * 50 * tempFactor;
          const wave2 = Math.cos(x * 0.02 - time * 0.003 + offset) * 25 * tempFactor;
          const noise = (Math.random() - 0.5) * 5 * tempFactor; // High energy noise
          const y = cy + wave1 + wave2 + noise;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Particles - "Quantum States" with Damping
      particles.current.forEach(p => {
        // Apply forces
        const dx = cx - p.x;
        const dy = cy - p.y;
        const dist = Math.hypot(dx, dy);

        // Quantum Tunneling Effect: Nudge towards center
        const force = (1 - tempFactor) * 0.005;
        p.vx += dx * force;
        p.vy += dy * force;

        // Friction/Damping
        p.vx *= 0.98;
        p.vy *= 0.98;

        p.x += p.vx * (0.5 + tempFactor);
        p.y += p.vy * (0.5 + tempFactor);

        if (p.x < 0 || p.x > w) p.vx *= -0.8;
        if (p.y < 0 || p.y > h) p.vy *= -0.8;

        const size = Math.abs(Math.max(0, (1 - tempFactor) * 4 + 1));
        const opacity = p.alpha * (0.2 + (1 - tempFactor) * 0.8);

        ctx.fillStyle = `hsla(${tempFactor * 360}, 90%, 60%, ${opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();

        if (dist < 120 * (1 - tempFactor)) {
          ctx.shadowBlur = Math.abs(Math.max(0, 15 * (1 - tempFactor)));
          ctx.shadowColor = 'rgba(239, 68, 68, 0.5)';
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // Central Probability Density - The "Quantum Eye"
      const eyeRadius = Math.abs(Math.max(0, 60 * tempFactor + 40));
      const eyeGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, eyeRadius);
      eyeGradient.addColorStop(0, `hsla(280, 100%, 70%, ${0.4 * (1 - progress)})`);
      eyeGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = eyeGradient;
      ctx.beginPath();
      ctx.arc(cx, cy, eyeRadius, 0, Math.PI * 2);
      ctx.fill();

      // Final Convergence Flare
      if (progress > 0.8) {
        const flareAlpha = (progress - 0.8) * 5;
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'white';
        ctx.strokeStyle = `rgba(255, 255, 255, ${flareAlpha})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(cx - 5, cy - 5, 10, 10);
        ctx.shadowBlur = 0;
      }

      // HUD UI - Precision Stabilized
      ctx.save();
      ctx.font = '10px "JetBrains Mono", monospace';

      // Data Stream
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillText(`FIELD_STABILITY: ${(100 - tempFactor * 100).toFixed(2)}%`, 20, 30);

      ctx.fillStyle = step.accepted ? '#22c55e' : '#ef4444';
      ctx.fillText(`SYSTEM_STATE: ${step.accepted ? 'STABLE' : 'FLUCTUATING'}`, 20, 45);

      // Current Best Tracking
      ctx.fillStyle = 'white';
      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.fillText(`ΔT -${step.fitness.toFixed(4)}s`, 20, 70);

      // Ratio Visualizer Grid
      const boxW = 40;
      ctx.translate(w - 260, h - 50);
      step.gearRatios.forEach((r, i) => {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.strokeRect(i * (boxW + 5), 0, boxW, 20);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.fillText(r.toFixed(2), i * (boxW + 5) + 5, 13);
      });
      ctx.restore();

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
          <span className="text-[10px] font-mono text-f1-red opacity-80 uppercase tracking-widest">Quantum Simulation</span>
          <div className={`w-2 h-2 rounded-full ${steps[currentStep]?.accepted ? 'bg-green-500 animate-pulse' : 'bg-red-500/50'}`} />
        </div>
        <div className="text-[9px] font-mono text-white/30">CYCLE: {String(currentStep).padStart(3, '0')}</div>
      </div>

      <div className="absolute bottom-4 left-4 border-l-2 border-red-600 pl-3">
        <div className="text-[10px] font-display text-red-500 tracking-widest uppercase">Phase Convergence</div>
        <div className="text-xs font-mono text-white/50">
          {steps[currentStep]?.probability > 0.9 ? 'STABILIZED' : 'ANALYZING'}
        </div>
      </div>
    </div>
  );
};

export default QuantumVisualizer;
