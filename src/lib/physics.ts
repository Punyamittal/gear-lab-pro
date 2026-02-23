import { MASTER_DATASET, type MasterDataset } from './master-dataset';

export interface SimPoint {
  time: number;
  distance: number;
  velocity: number;
  acceleration_long: number;
  acceleration_lat: number;
  gear: number;
  rpm: number;
  force_long: number;
  throttle: number;
  brake: number;
  weight_transfer_front: number;
  weight_transfer_rear: number;
  drag: number;
  downforce: number;
}

export function interpolate2D(
  map: Array<{ rpm: number;[key: string]: number }>,
  rpm: number,
  throttle: number
): number {
  if (rpm <= map[0].rpm) rpm = map[0].rpm;
  if (rpm >= map[map.length - 1].rpm) rpm = map[map.length - 1].rpm;

  let throttleKey = 't100';
  if (throttle <= 20) throttleKey = 't20';
  else if (throttle <= 40) throttleKey = 't40';
  else if (throttle <= 60) throttleKey = 't60';
  else if (throttle <= 80) throttleKey = 't80';

  for (let i = 0; i < map.length - 1; i++) {
    if (rpm >= map[i].rpm && rpm <= map[i + 1].rpm) {
      const t = (rpm - map[i].rpm) / (map[i + 1].rpm - map[i].rpm);
      const low = map[i][throttleKey] || 0;
      const high = map[i + 1][throttleKey] || 0;
      return low + t * (high - low);
    }
  }
  return 0;
}

export function interpolatePiecewise(
  curve: Array<{ rpm: number; torque_nm: number; power_kw: number; bsfc_g_per_kwh: number }>,
  rpm: number,
  field: 'torque_nm' | 'power_kw' | 'bsfc_g_per_kwh'
): number {
  if (rpm <= curve[0].rpm) return curve[0][field];
  if (rpm >= curve[curve.length - 1].rpm) return curve[curve.length - 1][field];

  for (let i = 0; i < curve.length - 1; i++) {
    if (rpm >= curve[i].rpm && rpm <= curve[i + 1].rpm) {
      const t = (rpm - curve[i].rpm) / (curve[i + 1].rpm - curve[i].rpm);
      return curve[i][field] + t * (curve[i + 1][field] - curve[i][field]);
    }
  }
  return 0;
}

export function getAeroForces(mps: number, aero: MasterDataset['aero']) {
  const map = aero.speed_map;
  if (mps <= map[0].speed_mps) return map[0];
  if (mps >= map[map.length - 1].speed_mps) return map[map.length - 1];

  for (let i = 0; i < map.length - 1; i++) {
    if (mps >= map[i].speed_mps && mps <= map[i + 1].speed_mps) {
      const t = (mps - map[i].speed_mps) / (map[i + 1].speed_mps - map[i].speed_mps);
      return {
        drag_n: map[i].drag_n + t * (map[i + 1].drag_n - map[i].drag_n),
        df_front_n: map[i].df_front_n + t * (map[i + 1].df_front_n - map[i].df_front_n),
        df_rear_n: map[i].df_rear_n + t * (map[i + 1].df_rear_n - map[i].df_rear_n),
      };
    }
  }
  return map[0];
}

export function simulateAcceleration(
  dataset: MasterDataset,
  targetDistance: number = 75,
  dt: number = 0.005
): SimPoint[] {
  const points: SimPoint[] = [];
  const { engine, gearbox, vehicle, tire, aero, driver } = dataset;
  const g = 9.81;

  let t = 0, v = 0.1, d = 0, gearIdx = 0;

  // Initial velocity based on launch RPM
  const initialRatio = gearbox.gears[0] * gearbox.final_drive_ratio * gearbox.primary_ratio;
  v = (driver.launch_rpm * 2 * Math.PI * tire.wheel_radius_m) / (initialRatio * 60);

  while (d < targetDistance && t < 20) {
    const currentGearRatio = gearbox.gears[gearIdx];
    const totalRatio = currentGearRatio * gearbox.final_drive_ratio * gearbox.primary_ratio;

    // Calculate RPM from velocity
    let rpm = (v * totalRatio * 60) / (2 * Math.PI * tire.wheel_radius_m);

    // Shift point based on driver model
    if (rpm > driver.shift_rpm && gearIdx < gearbox.gears.length - 1) {
      gearIdx++;
      t += engine.gear_shift_time_s;
      continue;
    }

    rpm = Math.max(engine.idle_rpm, Math.min(engine.redline_rpm, rpm));

    // Dynamic Forces based on driver aggression
    const throttle = driver.throttle_aggression * 100;
    const eTorque = interpolate2D(engine.throttle_map, rpm, throttle);

    // Driveline losses per gear
    const eff = gearbox.constraints.efficiency_per_gear[gearIdx + 1] || 0.92;
    const wTorque = eTorque * totalRatio * eff;
    let force_long = wTorque / tire.wheel_radius_m;

    // Aero
    const aeroForces = getAeroForces(v, aero);
    const drag = aeroForces.drag_n;
    const downforce = aeroForces.df_front_n + aeroForces.df_rear_n;

    // Traction Limit with Dynamic Weight Transfer
    const staticWeightFront = vehicle.mass_kg * g * vehicle.weight_distribution_front;
    const staticWeightRear = vehicle.mass_kg * g * (1 - vehicle.weight_distribution_front);

    // Simplified longitudinal weight transfer: ΔF = (m * a * h) / L
    // We need 'a' from previous step or estimate it
    const prevA = points.length > 0 ? points[points.length - 1].acceleration_long : 0;
    const weightTransfer = (vehicle.mass_kg * prevA * vehicle.cg_height_m) / vehicle.wheelbase_m;

    const dynamicWeightRear = staticWeightRear + weightTransfer + aeroForces.df_rear_n;
    const currentGrip = tire.mu_longitudinal; // Could be slip-based for more WOW
    const maxTraction = dynamicWeightRear * currentGrip;

    force_long = Math.min(force_long, maxTraction);

    const netForce = force_long - drag;
    const accel = netForce / (vehicle.mass_kg * vehicle.rotational_inertia_factor);

    if (t % 0.05 < dt) {
      points.push({
        time: t,
        distance: d,
        velocity: v,
        acceleration_long: accel,
        acceleration_lat: 0,
        gear: gearIdx + 1,
        rpm: rpm,
        force_long: netForce,
        throttle: throttle,
        brake: 0,
        weight_transfer_front: staticWeightFront - weightTransfer,
        weight_transfer_rear: dynamicWeightRear,
        drag: drag,
        downforce: downforce
      });
    }

    v += accel * dt;
    d += v * dt;
    t += dt;
  }

  return points;
}

export function generateTractiveCurves(dataset: MasterDataset) {
  const { engine, gearbox, tire } = dataset;
  const points: any[] = [];

  gearbox.gears.forEach((gr, idx) => {
    const totalRatio = gr * gearbox.final_drive_ratio * gearbox.primary_ratio;
    const eff = gearbox.constraints.efficiency_per_gear[idx + 1] || 0.92;

    for (let rpm = engine.idle_rpm; rpm <= engine.redline_rpm; rpm += 200) {
      const v = (rpm * 2 * Math.PI * tire.wheel_radius_m) / (totalRatio * 60);
      const eTorque = interpolatePiecewise(engine.torque_curve, rpm, 'torque_nm');
      const force = (eTorque * totalRatio * eff) / tire.wheel_radius_m;

      points.push({
        speed: v * 3.6, // km/h
        force,
        gear: idx + 1
      });
    }
  });

  return points;
}

export function simulateSkidpad(dataset: MasterDataset): number {
  const { vehicle, tire, aero } = dataset;
  const radius = 8.0; // Standard Skidpad radius
  const g = 9.81;
  const m = vehicle.mass_kg;
  const mu = tire.mu_lateral;
  const C_df = 0.5 * aero.air_density * aero.downforce_coefficient * aero.frontal_area_m2;

  // Steady-state lateral velocity: v^2 = (m * g * mu) / (m/radius - C_df * mu)
  const v_sq = (m * g * mu) / (m / radius - C_df * mu);
  const v = Math.sqrt(Math.max(0, v_sq));

  const circumference = 2 * Math.PI * radius;
  // Two laps for Skidpad event
  return (circumference / v) * 2;
}

export function simulateAutocross(dataset: MasterDataset): number {
  const segments = [
    { type: 'straight', length: 60 },
    { type: 'corner', radius: 15, angle: 90 },
    { type: 'straight', length: 40 },
    { type: 'corner', radius: 10, angle: 120 },
    { type: 'straight', length: 70 }
  ];

  let totalTime = 0;
  segments.forEach(seg => {
    if (seg.type === 'straight') {
      const sim = simulateAcceleration(dataset, seg.length, 0.01);
      totalTime += sim[sim.length - 1].time;
    } else {
      const radius = seg.radius || 10;
      const angle_rad = ((seg.angle || 90) * Math.PI) / 180;
      const mu = dataset.tire.mu_lateral;
      const g = 9.81;
      const v = Math.sqrt(mu * g * radius);
      const length = radius * angle_rad;
      totalTime += length / v;
    }
  });

  return totalTime;
}
