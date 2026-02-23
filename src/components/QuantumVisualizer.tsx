import { useEffect, useRef, useState } from 'react';
import type { AnnealingStep } from '@/lib/optimizer';

interface QuantumVisualizerProps {
  steps: AnnealingStep[];
  isRunning: boolean;
}

const QuantumVisualizer = ({ steps, isRunning }: QuantumVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const animRef = useRef<number>(0);

  useEffect(() => {
    if (isRunning) setCurrentStep(0);
  }, [isRunning]);

  useEffect(() => {
    if (steps.length === 0 || currentStep >= steps.length) return;
    const timer = setTimeout(() => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1)), 15);
    return () => clearTimeout(timer);
  }, [currentStep, steps.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    const cx = w / 2, cy = h / 2;

    const draw = () => {
      ctx.fillStyle = 'hsl(230, 25%, 4%)';
      ctx.fillRect(0, 0, w, h);

      if (currentStep >= steps.length) return;
      const step = steps[currentStep];
      const progress = currentStep / Math.max(steps.length - 1, 1);

      // Probability cloud — concentric rings that collapse
      const numRings = 12;
      for (let i = numRings; i >= 0; i--) {
        const spread = (1 - progress * 0.8) * 120;
        const radius = (i / numRings) * spread + 10;
        const opacity = (1 - progress) * 0.15 * (1 - i / numRings);

        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        gradient.addColorStop(0, `hsla(270, 100%, 65%, ${opacity * 2})`);
        gradient.addColorStop(0.5, `hsla(185, 100%, 50%, ${opacity})`);
        gradient.addColorStop(1, `hsla(185, 100%, 50%, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Floating gear ratio candidates (superposition)
      const numCandidates = Math.max(2, Math.floor((1 - progress) * 20));
      ctx.font = '10px "JetBrains Mono", monospace';
      for (let i = 0; i < numCandidates; i++) {
        const angle = (i / numCandidates) * Math.PI * 2 + currentStep * 0.02;
        const dist = (1 - progress) * 80 + 20;
        const x = cx + Math.cos(angle) * dist + Math.sin(currentStep * 0.1 + i) * 10;
        const y = cy + Math.sin(angle) * dist + Math.cos(currentStep * 0.1 + i) * 10;
        const alpha = (1 - progress) * 0.6 + 0.1;

        ctx.fillStyle = `hsla(185, 100%, 50%, ${alpha})`;
        ctx.fillText(
          step.gearRatios.map(r => r.toFixed(1)).join('/'),
          x - 20, y
        );
      }

      // Central collapsed value
      if (progress > 0.3) {
        const collapseAlpha = Math.min(1, (progress - 0.3) * 1.5);
        ctx.fillStyle = `hsla(155, 100%, 50%, ${collapseAlpha})`;
        ctx.font = 'bold 14px "JetBrains Mono", monospace';
        const text = step.gearRatios.map(r => r.toFixed(2)).join(' / ');
        const metrics = ctx.measureText(text);
        ctx.fillText(text, cx - metrics.width / 2, cy + 5);

        // Glow around final
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30);
        glow.addColorStop(0, `hsla(155, 100%, 50%, ${collapseAlpha * 0.3})`);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, 30, 0, Math.PI * 2);
        ctx.fill();
      }

      // Temperature bar
      const barH = h - 40;
      const tempH = (step.temperature / 2) * barH;
      ctx.fillStyle = 'hsla(220, 15%, 18%, 0.5)';
      ctx.fillRect(w - 25, 20, 10, barH);
      const tempGrad = ctx.createLinearGradient(0, 20 + barH - tempH, 0, 20 + barH);
      tempGrad.addColorStop(0, 'hsl(0, 100%, 60%)');
      tempGrad.addColorStop(1, 'hsl(185, 100%, 50%)');
      ctx.fillStyle = tempGrad;
      ctx.fillRect(w - 25, 20 + barH - tempH, 10, tempH);

      // HUD
      ctx.fillStyle = 'hsl(185, 100%, 50%)';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText(`T: ${step.temperature.toFixed(3)}`, 8, 16);
      ctx.fillText(`FIT: ${step.fitness.toFixed(4)}`, 8, 30);
      ctx.fillText(`${step.accepted ? '✓ ACCEPTED' : '✗ REJECTED'}`, 8, 44);

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [currentStep, steps]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={280}
      className="w-full h-full rounded border border-panel"
    />
  );
};

export default QuantumVisualizer;
