/**
 * GearOpt X — Master Dataset Structure
 * Production-level input schema for FSAE Simulation
 */

export interface MasterDataset {
    vehicle: {
        mass_kg: number;
        weight_distribution_front: number;
        wheelbase_m: number;
        front_track_m: number;
        rear_track_m: number;
        cg_height_m: number;
        drivetrain_efficiency: number;
        rotational_inertia_factor: number;
    };
    engine: {
        redline_rpm: number;
        idle_rpm: number;
        max_power_kw: number;
        gear_shift_time_s: number;
        engine_braking_factor: number;
        torque_curve: Array<{ rpm: number; torque_nm: number; power_kw: number; bsfc_g_per_kwh: number }>;
        throttle_map: Array<{ rpm: number; t20: number; t40: number; t60: number; t80: number; t100: number }>;
    };
    gearbox: {
        primary_ratio: number;
        final_drive_ratio: number;
        gears: number[];
        max_gears: number;
        constraints: {
            min_ratio: number;
            max_ratio: number;
            ratio_step: number;
            max_torque_nm: number;
            max_shaft_speed_rpm: number;
            efficiency_per_gear: Record<number, number>;
        };
    };
    tire: {
        wheel_radius_m: number;
        mu_longitudinal: number;
        mu_lateral: number;
        rolling_resistance_coeff: number;
        pacejka: {
            B: number;
            C: number;
            D: number;
            E: number;
        };
        slip_curves: {
            longitudinal: Array<{ slip_ratio: number; force_coeff: number }>;
            lateral: Array<{ slip_angle_deg: number; force_coeff: number }>;
        };
    };
    aero: {
        drag_coefficient: number;
        frontal_area_m2: number;
        air_density: number;
        downforce_coefficient: number;
        aero_balance_front: number;
        speed_map: Array<{ speed_mps: number; drag_n: number; df_front_n: number; df_rear_n: number }>;
    };
    suspension: {
        front_spring_rate: number;
        rear_spring_rate: number;
        front_roll_stiffness: number;
        rear_roll_stiffness: number;
        anti_squat: number;
        anti_dive: number;
    };
    environment: {
        air_temp_c: number;
        track_temp_c: number;
        wind_speed_mps: number;
        air_density_adjustment: number;
        grip_map: Array<{ temp_c: number; mu: number }>;
    };
    limits: {
        max_rpm: number;
        max_wheel_torque_nm: number;
        max_lateral_g: number;
        max_longitudinal_g: number;
        max_chain_load_n: number;
        max_gearbox_temp_c: number;
    };
    fitness_weights: {
        acceleration: number;
        skidpad: number;
        autocross: number;
    };
    driver: {
        throttle_aggression: number;
        shift_rpm: number;
        launch_rpm: number;
    };
}

export const MASTER_DATASET: MasterDataset = {
    vehicle: {
        mass_kg: 300,
        weight_distribution_front: 0.48,
        wheelbase_m: 1.6,
        front_track_m: 1.2,
        rear_track_m: 1.15,
        cg_height_m: 0.28,
        drivetrain_efficiency: 0.92,
        rotational_inertia_factor: 1.08
    },
    engine: {
        redline_rpm: 9000,
        idle_rpm: 2000,
        max_power_kw: 60,
        gear_shift_time_s: 0.18,
        engine_braking_factor: 0.08,
        torque_curve: [
            { rpm: 2000, torque_nm: 32, power_kw: 6.7, bsfc_g_per_kwh: 380 },
            { rpm: 2500, torque_nm: 38, power_kw: 9.9, bsfc_g_per_kwh: 360 },
            { rpm: 3000, torque_nm: 45, power_kw: 14.1, bsfc_g_per_kwh: 340 },
            { rpm: 3500, torque_nm: 52, power_kw: 19.1, bsfc_g_per_kwh: 320 },
            { rpm: 4000, torque_nm: 58, power_kw: 24.3, bsfc_g_per_kwh: 305 },
            { rpm: 4500, torque_nm: 63, power_kw: 29.7, bsfc_g_per_kwh: 295 },
            { rpm: 5000, torque_nm: 67, power_kw: 35.1, bsfc_g_per_kwh: 288 },
            { rpm: 5500, torque_nm: 70, power_kw: 40.3, bsfc_g_per_kwh: 282 },
            { rpm: 6000, torque_nm: 72, power_kw: 45.2, bsfc_g_per_kwh: 278 },
            { rpm: 6500, torque_nm: 71, power_kw: 48.3, bsfc_g_per_kwh: 280 },
            { rpm: 7000, torque_nm: 69, power_kw: 50.6, bsfc_g_per_kwh: 285 },
            { rpm: 7500, torque_nm: 65, power_kw: 51.0, bsfc_g_per_kwh: 295 },
            { rpm: 8000, torque_nm: 60, power_kw: 50.2, bsfc_g_per_kwh: 310 },
            { rpm: 8500, torque_nm: 52, power_kw: 46.3, bsfc_g_per_kwh: 330 },
            { rpm: 9000, torque_nm: 45, power_kw: 42.4, bsfc_g_per_kwh: 360 }
        ],
        throttle_map: [
            { rpm: 2000, t20: 10, t40: 18, t60: 25, t80: 30, t100: 32 },
            { rpm: 3000, t20: 15, t40: 28, t60: 38, t80: 44, t100: 45 },
            { rpm: 4000, t20: 22, t40: 40, t60: 50, t80: 56, t100: 58 },
            { rpm: 5000, t20: 28, t40: 50, t60: 60, t80: 65, t100: 67 },
            { rpm: 6000, t20: 32, t40: 55, t60: 65, t80: 70, t100: 72 },
            { rpm: 7000, t20: 30, t40: 52, t60: 60, t80: 66, t100: 69 },
            { rpm: 8000, t20: 25, t40: 45, t60: 52, t80: 57, t100: 60 },
            { rpm: 9000, t20: 18, t40: 32, t60: 40, t80: 43, t100: 45 }
        ]
    },
    gearbox: {
        primary_ratio: 1.9,
        final_drive_ratio: 3.8,
        gears: [3.1, 2.4, 1.9, 1.55, 1.3, 1.1],
        max_gears: 6,
        constraints: {
            min_ratio: 0.9,
            max_ratio: 3.5,
            ratio_step: 0.01,
            max_torque_nm: 80,
            max_shaft_speed_rpm: 11000,
            efficiency_per_gear: { 1: 0.90, 2: 0.91, 3: 0.92, 4: 0.93, 5: 0.94, 6: 0.94 }
        }
    },
    tire: {
        wheel_radius_m: 0.228,
        mu_longitudinal: 1.6,
        mu_lateral: 1.8,
        rolling_resistance_coeff: 0.015,
        pacejka: { B: 10, C: 1.9, D: 1.8, E: 0.97 },
        slip_curves: {
            longitudinal: [
                { slip_ratio: 0.00, force_coeff: 0.0 },
                { slip_ratio: 0.02, force_coeff: 0.8 },
                { slip_ratio: 0.05, force_coeff: 1.2 },
                { slip_ratio: 0.08, force_coeff: 1.5 },
                { slip_ratio: 0.10, force_coeff: 1.6 },
                { slip_ratio: 0.15, force_coeff: 1.5 },
                { slip_ratio: 0.20, force_coeff: 1.3 },
                { slip_ratio: 0.30, force_coeff: 1.0 }
            ],
            lateral: [
                { slip_angle_deg: 0, force_coeff: 0 },
                { slip_angle_deg: 2, force_coeff: 0.9 },
                { slip_angle_deg: 4, force_coeff: 1.4 },
                { slip_angle_deg: 6, force_coeff: 1.7 },
                { slip_angle_deg: 8, force_coeff: 1.8 },
                { slip_angle_deg: 10, force_coeff: 1.75 },
                { slip_angle_deg: 12, force_coeff: 1.6 },
                { slip_angle_deg: 15, force_coeff: 1.2 }
            ]
        }
    },
    aero: {
        drag_coefficient: 0.9,
        frontal_area_m2: 1.1,
        air_density: 1.225,
        downforce_coefficient: 2.8,
        aero_balance_front: 0.52,
        speed_map: [
            { speed_mps: 0, drag_n: 0, df_front_n: 0, df_rear_n: 0 },
            { speed_mps: 10, drag_n: 50, df_front_n: 70, df_rear_n: 80 },
            { speed_mps: 20, drag_n: 200, df_front_n: 280, df_rear_n: 320 },
            { speed_mps: 30, drag_n: 450, df_front_n: 600, df_rear_n: 700 },
            { speed_mps: 40, drag_n: 800, df_front_n: 1100, df_rear_n: 1300 },
            { speed_mps: 50, drag_n: 1250, df_front_n: 1800, df_rear_n: 2200 },
            { speed_mps: 60, drag_n: 1800, df_front_n: 2600, df_rear_n: 3100 }
        ]
    },
    suspension: {
        front_spring_rate: 28,
        rear_spring_rate: 32,
        front_roll_stiffness: 950,
        rear_roll_stiffness: 1100,
        anti_squat: 35,
        anti_dive: 20
    },
    environment: {
        air_temp_c: 32,
        track_temp_c: 45,
        wind_speed_mps: 3,
        air_density_adjustment: 0.97,
        grip_map: [
            { temp_c: 20, mu: 1.45 },
            { temp_c: 30, mu: 1.55 },
            { temp_c: 40, mu: 1.60 },
            { temp_c: 50, mu: 1.52 },
            { temp_c: 60, mu: 1.40 }
        ]
    },
    limits: {
        max_rpm: 9200,
        max_wheel_torque_nm: 1400,
        max_lateral_g: 2.2,
        max_longitudinal_g: 2.0,
        max_chain_load_n: 9000,
        max_gearbox_temp_c: 135
    },
    fitness_weights: {
        acceleration: 0.4,
        skidpad: 0.2,
        autocross: 0.4
    },
    driver: {
        throttle_aggression: 1.0,
        shift_rpm: 8800,
        launch_rpm: 4500
    }
};
