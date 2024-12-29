/**
 * Types for enhanced physics model
 * Extracted and simplified from advanced model
 */

export interface Vector3D {
    x: number;
    y: number;
    z: number;
}

export interface Environment {
    temperature: number;    // Fahrenheit
    pressure: number;       // inHg
    altitude: number;       // feet
    humidity: number;       // 0-1
    wind: Vector3D;        // m/s
}

export interface BallProperties {
    mass: number;          // kg
    radius: number;        // m
    area: number;          // m²
    dragCoefficient: number;
    liftCoefficient: number;
    magnusCoefficient: number;
    spinDecayRate: number;
}

export interface Forces {
    drag: Vector3D;
    lift: Vector3D;
    magnus: Vector3D;
    gravity: Vector3D;
}

export interface SpinState {
    rate: number;          // RPM
    axis: Vector3D;        // Normalized vector
}

// Pre-computed lookup tables from wind tunnel data
export const DRAG_COEFFICIENTS: Record<number, number> = {
    110000: 0.235,
    120000: 0.230,
    130000: 0.225,
    140000: 0.220,
    150000: 0.215,
    160000: 0.210,
    170000: 0.205
} as const;

export const LIFT_COEFFICIENTS: Record<number, number> = {
    2000: 0.21,
    2500: 0.25,
    3000: 0.29,
    3500: 0.32,
    4000: 0.35
} as const;

// Standard conditions
export const STANDARD_CONDITIONS = {
    TEMPERATURE: 70,    // °F
    PRESSURE: 29.92,    // inHg
    ALTITUDE: 0,        // feet
    HUMIDITY: 0.5,      // 50%
    DENSITY: 1.225      // kg/m³
} as const;