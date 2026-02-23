import { useState, useEffect, useRef } from 'react';
import type { SwarmStep } from '@/lib/optimizer';

interface SwarmCanvasProps {
  steps: SwarmStep[];
  isRunning: boolean;
}

const SwarmCanvas = ({ steps, isRunning }: SwarmCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const animRef = useRef<number>(0);

  useEffect(() => {
    if (steps.length === 0) return;
    if (isRunning) {
      setCurrentStep(0);
    }
  }, [steps.length, isRunning]);

  useEffect(() => {
    if (steps.length === 0 || currentStep >= steps.length) return;

    const timer = setTimeout(() => {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }, 30);

    return () => clearTimeout(timer);
  }, [currentStep, steps.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    const draw = () => {
      ctx.fillStyle = 'hsl(230, 25%, 5%)';
      ctx.fillRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = 'hsla(185, 100%, 50%, 0.06)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      if (currentStep < steps.length) {
        const step = steps[currentStep];
        const maxFitness = Math.max(...step.particles.map(p => p.fitness), 0.01);

        // Draw particles
        for (const p of step.particles) {
          const px = ((p.x - 1) / 3.5) * (w - 40) + 20;
          const py = ((p.y - 1) / 3.5) * (h - 40) + 20;
          const intensity = p.fitness / maxFitness;

          // Glow
          const gradient = ctx.createRadialGradient(px, py, 0, px, py, 8 + intensity * 10);
          gradient.addColorStop(0, `hsla(${155 + intensity * 30}, 100%, 50%, ${0.6 + intensity * 0.4})`);
          gradient.addColorStop(1, `hsla(${155 + intensity * 30}, 100%, 50%, 0)`);
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(px, py, 8 + intensity * 10, 0, Math.PI * 2);
          ctx.fill();

          // Core
          ctx.fillStyle = `hsla(${155 + intensity * 30}, 100%, ${50 + intensity * 20}%, 1)`;
          ctx.beginPath();
          ctx.arc(px, py, 2 + intensity * 2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Global best marker
        const bx = ((step.globalBest[0] - 1) / 3.5) * (w - 40) + 20;
        const by = ((step.globalBest[1] - 1) / 3.5) * (h - 40) + 20;
        ctx.strokeStyle = 'hsl(185, 100%, 50%)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(bx, by, 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(bx - 6, by);
        ctx.lineTo(bx + 6, by);
        ctx.moveTo(bx, by - 6);
        ctx.lineTo(bx, by + 6);
        ctx.stroke();

        // HUD
        ctx.fillStyle = 'hsl(185, 100%, 50%)';
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.fillText(`ITER ${step.iteration}/${steps.length}`, 10, 18);
        ctx.fillText(`BEST: ${(1 / step.globalBestFitness).toFixed(3)}s`, 10, 34);
        ctx.fillText(`PARTICLES: ${step.particles.length}`, w - 120, 18);
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [currentStep, steps]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={300}
      className="w-full h-full rounded border border-panel"
      style={{ imageRendering: 'auto' }}
    />
  );
};

export default SwarmCanvas;
