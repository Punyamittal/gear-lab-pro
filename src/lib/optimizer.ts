// GearOpt X — Optimization Algorithms
import { simulateAcceleration, DEFAULT_TORQUE_CURVE, type DrivetrainConfig, type EnginePoint } from './physics';

export interface OptimizationResult {
  gearRatios: number[];
  fitness: number;
  accelTime: number;
  generation?: number;
}

// Fitness = inverse of 0-75m time (lower time = higher fitness)
export function evaluateFitness(
  gearRatios: number[],
  config: DrivetrainConfig,
  curve: EnginePoint[] = DEFAULT_TORQUE_CURVE
): number {
  const testConfig = { ...config, gearRatios };
  const sim = simulateAcceleration(curve, testConfig, 75);
  if (sim.length === 0) return 0;
  const finalTime = sim[sim.length - 1].time;
  if (finalTime <= 0 || finalTime > 20) return 0;
  return 1 / finalTime;
}

function getAccelTime(gearRatios: number[], config: DrivetrainConfig, curve: EnginePoint[]): number {
  const testConfig = { ...config, gearRatios };
  const sim = simulateAcceleration(curve, testConfig, 75);
  if (sim.length === 0) return 99;
  return sim[sim.length - 1].time;
}

// Random gear ratio set
function randomGears(numGears: number): number[] {
  const gears: number[] = [];
  for (let i = 0; i < numGears; i++) {
    gears.push(1.0 + Math.random() * 3.5);
  }
  return gears.sort((a, b) => b - a);
}

// ===== Classical Grid Search =====
export function classicalOptimize(
  config: DrivetrainConfig,
  curve: EnginePoint[] = DEFAULT_TORQUE_CURVE,
  iterations: number = 500
): OptimizationResult {
  let bestRatios = config.gearRatios;
  let bestFitness = evaluateFitness(bestRatios, config, curve);
  const numGears = config.gearRatios.length;

  for (let i = 0; i < iterations; i++) {
    const candidate = randomGears(numGears);
    const fitness = evaluateFitness(candidate, config, curve);
    if (fitness > bestFitness) {
      bestFitness = fitness;
      bestRatios = candidate;
    }
  }

  return {
    gearRatios: bestRatios.map(r => Math.round(r * 100) / 100),
    fitness: bestFitness,
    accelTime: getAccelTime(bestRatios, config, curve),
  };
}

// ===== Simulated Annealing (Quantum-inspired) =====
export interface AnnealingStep {
  iteration: number;
  temperature: number;
  fitness: number;
  gearRatios: number[];
  accepted: boolean;
  probability: number;
}

export function quantumAnnealingOptimize(
  config: DrivetrainConfig,
  curve: EnginePoint[] = DEFAULT_TORQUE_CURVE,
  maxIterations: number = 300,
  onStep?: (step: AnnealingStep) => void
): OptimizationResult {
  const numGears = config.gearRatios.length;
  let current = randomGears(numGears);
  let currentFitness = evaluateFitness(current, config, curve);
  let best = [...current];
  let bestFitness = currentFitness;
  let temperature = 2.0;
  const coolingRate = 0.993;

  for (let i = 0; i < maxIterations; i++) {
    // Perturb
    const neighbor = current.map(r => {
      const delta = (Math.random() - 0.5) * temperature * 0.5;
      return Math.max(1.0, Math.min(4.5, r + delta));
    }).sort((a, b) => b - a);

    const neighborFitness = evaluateFitness(neighbor, config, curve);
    const delta = neighborFitness - currentFitness;
    const prob = delta > 0 ? 1 : Math.exp(delta / (temperature * 0.1));
    const accepted = Math.random() < prob;

    if (accepted) {
      current = neighbor;
      currentFitness = neighborFitness;
    }

    if (currentFitness > bestFitness) {
      best = [...current];
      bestFitness = currentFitness;
    }

    temperature *= coolingRate;

    if (onStep) {
      onStep({
        iteration: i,
        temperature,
        fitness: currentFitness,
        gearRatios: [...current],
        accepted,
        probability: prob,
      });
    }
  }

  return {
    gearRatios: best.map(r => Math.round(r * 100) / 100),
    fitness: bestFitness,
    accelTime: getAccelTime(best, config, curve),
  };
}

// ===== Particle Swarm Optimization =====
export interface SwarmParticle {
  position: number[];
  velocity: number[];
  fitness: number;
  bestPosition: number[];
  bestFitness: number;
}

export interface SwarmStep {
  iteration: number;
  particles: { x: number; y: number; fitness: number }[];
  globalBest: number[];
  globalBestFitness: number;
}

export function swarmOptimize(
  config: DrivetrainConfig,
  curve: EnginePoint[] = DEFAULT_TORQUE_CURVE,
  numParticles: number = 50,
  maxIterations: number = 100,
  onStep?: (step: SwarmStep) => void
): OptimizationResult {
  const numGears = config.gearRatios.length;
  const w = 0.7, c1 = 1.5, c2 = 1.5;

  const particles: SwarmParticle[] = [];
  let globalBest: number[] = [];
  let globalBestFitness = 0;

  // Initialize
  for (let i = 0; i < numParticles; i++) {
    const pos = randomGears(numGears);
    const fitness = evaluateFitness(pos, config, curve);
    particles.push({
      position: pos,
      velocity: Array(numGears).fill(0).map(() => (Math.random() - 0.5) * 0.5),
      fitness,
      bestPosition: [...pos],
      bestFitness: fitness,
    });
    if (fitness > globalBestFitness) {
      globalBestFitness = fitness;
      globalBest = [...pos];
    }
  }

  for (let iter = 0; iter < maxIterations; iter++) {
    for (const p of particles) {
      for (let d = 0; d < numGears; d++) {
        const r1 = Math.random(), r2 = Math.random();
        p.velocity[d] = w * p.velocity[d]
          + c1 * r1 * (p.bestPosition[d] - p.position[d])
          + c2 * r2 * (globalBest[d] - p.position[d]);
        p.position[d] = Math.max(1.0, Math.min(4.5, p.position[d] + p.velocity[d]));
      }
      p.position.sort((a, b) => b - a);
      p.fitness = evaluateFitness(p.position, config, curve);

      if (p.fitness > p.bestFitness) {
        p.bestFitness = p.fitness;
        p.bestPosition = [...p.position];
      }
      if (p.fitness > globalBestFitness) {
        globalBestFitness = p.fitness;
        globalBest = [...p.position];
      }
    }

    if (onStep) {
      onStep({
        iteration: iter,
        particles: particles.map(p => ({
          x: p.position[0] || 0,
          y: p.position[1] || 0,
          fitness: p.fitness,
        })),
        globalBest: [...globalBest],
        globalBestFitness,
      });
    }
  }

  return {
    gearRatios: globalBest.map(r => Math.round(r * 100) / 100),
    fitness: globalBestFitness,
    accelTime: getAccelTime(globalBest, config, curve),
  };
}

// ===== Genetic Algorithm =====
export interface GeneticStep {
  generation: number;
  bestFitness: number;
  avgFitness: number;
  bestGears: number[];
  diversity: number;
}

export function geneticOptimize(
  config: DrivetrainConfig,
  curve: EnginePoint[] = DEFAULT_TORQUE_CURVE,
  popSize: number = 80,
  maxGenerations: number = 200,
  onStep?: (step: GeneticStep) => void
): OptimizationResult {
  const numGears = config.gearRatios.length;
  let population = Array.from({ length: popSize }, () => randomGears(numGears));

  let globalBest: number[] = [];
  let globalBestFitness = 0;

  for (let gen = 0; gen < maxGenerations; gen++) {
    const fitnesses = population.map(ind => evaluateFitness(ind, config, curve));
    const best = Math.max(...fitnesses);
    const bestIdx = fitnesses.indexOf(best);
    const avg = fitnesses.reduce((a, b) => a + b, 0) / fitnesses.length;

    if (best > globalBestFitness) {
      globalBestFitness = best;
      globalBest = [...population[bestIdx]];
    }

    // Diversity metric
    const diversity = Math.sqrt(
      fitnesses.reduce((s, f) => s + (f - avg) ** 2, 0) / fitnesses.length
    );

    if (onStep) {
      onStep({
        generation: gen,
        bestFitness: best,
        avgFitness: avg,
        bestGears: [...population[bestIdx]],
        diversity,
      });
    }

    // Selection (tournament)
    const newPop: number[][] = [population[bestIdx]]; // elitism
    while (newPop.length < popSize) {
      const a = Math.floor(Math.random() * popSize);
      const b = Math.floor(Math.random() * popSize);
      const parent1 = fitnesses[a] > fitnesses[b] ? population[a] : population[b];
      const c = Math.floor(Math.random() * popSize);
      const d = Math.floor(Math.random() * popSize);
      const parent2 = fitnesses[c] > fitnesses[d] ? population[c] : population[d];

      // Crossover
      const child = parent1.map((g, i) =>
        Math.random() < 0.5 ? g : parent2[i]
      );

      // Mutation
      const mutated = child.map(g => {
        if (Math.random() < 0.15) {
          return Math.max(1.0, Math.min(4.5, g + (Math.random() - 0.5) * 0.6));
        }
        return g;
      });

      newPop.push(mutated.sort((a, b) => b - a));
    }

    population = newPop;
  }

  return {
    gearRatios: globalBest.map(r => Math.round(r * 100) / 100),
    fitness: globalBestFitness,
    accelTime: getAccelTime(globalBest, config, curve),
    generation: maxGenerations,
  };
}
