import { simulateAcceleration, simulateSkidpad, simulateAutocross } from './physics';
import { MASTER_DATASET, type MasterDataset } from './master-dataset';

export interface OptimizationResult {
  gearRatios: number[];
  fitness: number;
  accelTime: number;
  skidpadTime?: number;
  autocrossTime?: number;
  generation?: number;
}

// Multi-objective Fitness based on dataset weights
export function evaluateFitness(
  gearRatios: number[],
  dataset: MasterDataset = MASTER_DATASET
): number {
  const testDataset = {
    ...dataset,
    gearbox: { ...dataset.gearbox, gears: gearRatios }
  };

  const weights = dataset.fitness_weights;

  // Acceleration part
  const accelSim = simulateAcceleration(testDataset, 75);
  const accelTime = accelSim.length > 0 ? accelSim[accelSim.length - 1].time : 20;

  // Skidpad part
  const skidpadTime = simulateSkidpad(testDataset);

  // Autocross part
  const autocrossTime = simulateAutocross(testDataset);

  // Normalize and combine (smaller time is better, so use inverse or negative)
  // Using 1/time approach
  const fitness = (weights.acceleration * (1 / accelTime)) +
    (weights.skidpad * (1 / skidpadTime)) +
    (weights.autocross * (1 / autocrossTime));

  return fitness * 10; // Scale for better visibility
}

function getAccelTime(gearRatios: number[], dataset: MasterDataset): number {
  const testDataset = {
    ...dataset,
    gearbox: { ...dataset.gearbox, gears: gearRatios }
  };
  const sim = simulateAcceleration(testDataset, 75);
  if (sim.length === 0) return 99;
  return sim[sim.length - 1].time;
}

// Random gear ratio set based on constraints
function randomGears(dataset: MasterDataset): number[] {
  const { constraints, max_gears } = dataset.gearbox;
  const gears: number[] = [];
  for (let i = 0; i < max_gears; i++) {
    gears.push(constraints.min_ratio + Math.random() * (constraints.max_ratio - constraints.min_ratio));
  }
  return gears.sort((a, b) => b - a);
}

// ===== Classical Grid Search =====
export function classicalOptimize(
  dataset: MasterDataset = MASTER_DATASET,
  iterations: number = 500
): OptimizationResult {
  let bestRatios = dataset.gearbox.gears;
  let bestFitness = evaluateFitness(bestRatios, dataset);

  for (let i = 0; i < iterations; i++) {
    const candidate = randomGears(dataset);
    const fitness = evaluateFitness(candidate, dataset);
    if (fitness > bestFitness) {
      bestFitness = fitness;
      bestRatios = candidate;
    }
  }

  return {
    gearRatios: bestRatios.map(r => Math.round(r * 100) / 100),
    fitness: bestFitness,
    accelTime: getAccelTime(bestRatios, dataset),
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
  dataset: MasterDataset = MASTER_DATASET,
  maxIterations: number = 500, // Increased for stability
  onStep?: (step: AnnealingStep) => void
): OptimizationResult {
  const { constraints } = dataset.gearbox;
  let current = randomGears(dataset);
  let currentFitness = evaluateFitness(current, dataset);
  let best = [...current];
  let bestFitness = currentFitness;

  let temperature = 4.0; // Higher starting temp for broader search
  const coolingRate = 0.985; // Slightly slower cooling
  const minFitnessDelta = 0.0001;
  let stalledIterations = 0;

  for (let i = 0; i < maxIterations; i++) {
    // Perturb: Use Adaptive Cauchy-style distribution for "Quantum Tunneling"
    // Occasional long jumps (tunneling) while mostly doing local searches
    const neighbor = current.map(r => {
      const isTunneling = Math.random() < 0.05; // 5% tunneling probability
      const scale = isTunneling ? 1.0 : temperature * 0.25;

      // Cauchy-like "Quantum" perturbation
      const delta = (Math.tan(Math.PI * (Math.random() - 0.5))) * scale * 0.1;

      const newVal = r + delta;
      return Math.max(constraints.min_ratio, Math.min(constraints.max_ratio, newVal));
    }).sort((a, b) => b - a);

    const neighborFitness = evaluateFitness(neighbor, dataset);
    const delta = neighborFitness - currentFitness;

    // Normalized Boltzman probability
    // Scale delta relative to typical fitness ranges
    const prob = delta > 0 ? 1 : Math.exp(delta / (temperature * 0.05));
    const accepted = Math.random() < prob;

    if (accepted) {
      if (Math.abs(neighborFitness - currentFitness) < minFitnessDelta) {
        stalledIterations++;
      } else {
        stalledIterations = 0;
      }
      current = neighbor;
      currentFitness = neighborFitness;
    } else {
      stalledIterations++;
    }

    if (currentFitness > bestFitness) {
      best = [...current];
      bestFitness = currentFitness;
      stalledIterations = 0;
    }

    // Dynamic Reheating: If stuck too long, slight burst in temperature
    if (stalledIterations > 40 && temperature < 0.5) {
      temperature += 0.5;
      stalledIterations = 0;
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

    // Early exit if cooled and converged
    if (temperature < 0.001 && stalledIterations > 50) break;
  }

  return {
    gearRatios: best.map(r => Math.round(r * 100) / 100),
    fitness: bestFitness,
    accelTime: getAccelTime(best, dataset),
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
  particles: { position: number[]; fitness: number }[];
  globalBest: number[];
  globalBestFitness: number;
}

export function swarmOptimize(
  dataset: MasterDataset = MASTER_DATASET,
  numParticles: number = 50,
  maxIterations: number = 100,
  onStep?: (step: SwarmStep) => void
): OptimizationResult {
  const numGears = dataset.gearbox.max_gears;
  const w = 0.7, c1 = 1.5, c2 = 1.5;

  const particles: SwarmParticle[] = [];
  let globalBest: number[] = [];
  let globalBestFitness = 0;

  // Initialize
  for (let i = 0; i < numParticles; i++) {
    const pos = randomGears(dataset);
    const fitness = evaluateFitness(pos, dataset);
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
        p.position[d] = Math.max(dataset.gearbox.constraints.min_ratio, Math.min(dataset.gearbox.constraints.max_ratio, p.position[d] + p.velocity[d]));
      }
      p.position.sort((a, b) => b - a);
      p.fitness = evaluateFitness(p.position, dataset);

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
          position: [...p.position],
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
    accelTime: getAccelTime(globalBest, dataset),
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
  dataset: MasterDataset = MASTER_DATASET,
  popSize: number = 80,
  maxGenerations: number = 200,
  onStep?: (step: GeneticStep) => void
): OptimizationResult {
  const numGears = dataset.gearbox.max_gears;
  let population = Array.from({ length: popSize }, () => randomGears(dataset));

  let globalBest: number[] = [];
  let globalBestFitness = 0;

  for (let gen = 0; gen < maxGenerations; gen++) {
    const fitnesses = population.map(ind => evaluateFitness(ind, dataset));
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
          const delta = (Math.random() - 0.5) * 0.6;
          return Math.max(dataset.gearbox.constraints.min_ratio, Math.min(dataset.gearbox.constraints.max_ratio, g + delta));
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
    accelTime: getAccelTime(globalBest, dataset),
    generation: maxGenerations,
  };
}

