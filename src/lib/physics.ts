// GearOpt X — Core Physics Engine

export interface EnginePoint {
  rpm: number;
  torque: number; // Nm
}

export interface DrivetrainConfig {
  gearRatios: number[];
  finalDrive: number;
  efficiency: number;        // 0-1
  tireRadius: number;        // meters
  vehicleMass: number;       // kg
  frictionCoeff: number;     // μ
  dragCoeff: number;         // Cd
  frontalArea: number;       // m²
  airDensity: number;        // kg/m³
  wheelbase: number;         // m
  rearWeightPct: number;     // 0-1
}

export const DEFAULT_TORQUE_CURVE: EnginePoint[] = [
  { rpm: 3000, torque: 28 },
  { rpm: 4000, torque: 35 },
  { rpm: 5000, torque: 42 },
  { rpm: 6000, torque: 48 },
  { rpm: 7000, torque: 52 },
  { rpm: 8000, torque: 55 },
  { rpm: 9000, torque: 54 },
  { rpm: 10000, torque: 50 },
  { rpm: 11000, torque: 45 },
  { rpm: 12000, torque: 38 },
  { rpm: 13000, torque: 30 },
];

export const DEFAULT_CONFIG: DrivetrainConfig = {
  gearRatios: [3.2, 2.4, 1.8, 1.4],
  finalDrive: 3.5,
  efficiency: 0.92,
  tireRadius: 0.228,
  vehicleMass: 230,
  frictionCoeff: 1.5,
  dragCoeff: 1.2,
  frontalArea: 1.0,
  airDensity: 1.225,
  wheelbase: 1.55,
  rearWeightPct: 0.55,
};

export function interpolateTorque(curve: EnginePoint[], rpm: number): number {
  if (rpm <= curve[0].rpm) return curve[0].torque;
  if (rpm >= curve[curve.length - 1].rpm) return curve[curve.length - 1].torque;

  for (let i = 0; i < curve.length - 1; i++) {
    if (rpm >= curve[i].rpm && rpm <= curve[i + 1].rpm) {
      const t = (rpm - curve[i].rpm) / (curve[i + 1].rpm - curve[i].rpm);
      return curve[i].torque + t * (curve[i + 1].torque - curve[i].torque);
    }
  }
  return 0;
}

export function wheelTorque(
  engineTorque: number,
  gearRatio: number,
  finalDrive: number,
  efficiency: number
): number {
  return engineTorque * gearRatio * finalDrive * efficiency;
}

export function tractiveForce(wTorque: number, tireRadius: number): number {
  return wTorque / tireRadius;
}

export function tractionLimit(config: DrivetrainConfig): number {
  return config.frictionCoeff * config.vehicleMass * config.rearWeightPct * 9.81;
}

export function aeroDrag(config: DrivetrainConfig, velocity: number): number {
  return 0.5 * config.airDensity * config.dragCoeff * config.frontalArea * velocity * velocity;
}

export function rpmFromVelocity(
  velocity: number,
  gearRatio: number,
  finalDrive: number,
  tireRadius: number
): number {
  return (velocity * gearRatio * finalDrive * 60) / (2 * Math.PI * tireRadius);
}

export function velocityFromRpm(
  rpm: number,
  gearRatio: number,
  finalDrive: number,
  tireRadius: number
): number {
  return (rpm * 2 * Math.PI * tireRadius) / (gearRatio * finalDrive * 60);
}

export interface SimPoint {
  time: number;
  distance: number;
  velocity: number;
  acceleration: number;
  gear: number;
  rpm: number;
  force: number;
}

export function simulateAcceleration(
  curve: EnginePoint[],
  config: DrivetrainConfig,
  targetDistance: number = 75,
  dt: number = 0.005
): SimPoint[] {
  const points: SimPoint[] = [];
  let t = 0, v = 0.1, d = 0, gear = 0;
  const maxRpm = curve[curve.length - 1].rpm;
  const minRpm = curve[0].rpm;
  const maxTraction = tractionLimit(config);

  while (d < targetDistance && t < 20) {
    const rpm = rpmFromVelocity(v, config.gearRatios[gear], config.finalDrive, config.tireRadius);

    // Auto upshift
    if (rpm > maxRpm * 0.95 && gear < config.gearRatios.length - 1) {
      gear++;
    }

    const currentRpm = Math.max(minRpm, Math.min(maxRpm, 
      rpmFromVelocity(v, config.gearRatios[gear], config.finalDrive, config.tireRadius)));

    const eTorque = interpolateTorque(curve, currentRpm);
    const wTorque = wheelTorque(eTorque, config.gearRatios[gear], config.finalDrive, config.efficiency);
    let force = tractiveForce(wTorque, config.tireRadius);
    force = Math.min(force, maxTraction);
    const drag = aeroDrag(config, v);
    const netForce = force - drag;
    const a = netForce / config.vehicleMass;

    if (t % 0.05 < dt) {
      points.push({
        time: Math.round(t * 1000) / 1000,
        distance: Math.round(d * 100) / 100,
        velocity: Math.round(v * 100) / 100,
        acceleration: Math.round(a * 100) / 100,
        gear: gear + 1,
        rpm: Math.round(currentRpm),
        force: Math.round(netForce),
      });
    }

    v += a * dt;
    d += v * dt;
    t += dt;
  }

  return points;
}

// Generate tractive force vs speed for each gear
export interface TractivePoint {
  speed: number; // km/h
  force: number;
  gear: number;
}

export function generateTractiveCurves(
  curve: EnginePoint[],
  config: DrivetrainConfig
): TractivePoint[] {
  const points: TractivePoint[] = [];
  const maxRpm = curve[curve.length - 1].rpm;
  const minRpm = curve[0].rpm;

  for (let gi = 0; gi < config.gearRatios.length; gi++) {
    const gr = config.gearRatios[gi];
    for (let rpm = minRpm; rpm <= maxRpm; rpm += 200) {
      const v = velocityFromRpm(rpm, gr, config.finalDrive, config.tireRadius);
      const speed = v * 3.6;
      const eTorque = interpolateTorque(curve, rpm);
      const wT = wheelTorque(eTorque, gr, config.finalDrive, config.efficiency);
      const f = tractiveForce(wT, config.tireRadius);
      points.push({ speed: Math.round(speed * 10) / 10, force: Math.round(f), gear: gi + 1 });
    }
  }

  return points;
}
