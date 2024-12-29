import { Vector3D } from '../types';

export interface ShotParameters {
    clubSpeed: number;      // mph
    launchAngle: number;    // degrees
    spinRate: number;       // rpm
    spinAxis: Vector3D;     // normalized vector
    temperature: number;    // °F
    pressure: number;       // inHg
    altitude: number;       // feet
    humidity: number;       // 0-1
    windSpeed: number;      // mph
    windDirection: number;  // degrees (0-360)
}

export interface ShotResult {
    distance: number;       // yards
    height: number;        // yards
    landingAngle: number;  // degrees
    flightTime: number;    // seconds
    trajectory: TrajectoryPoint[];
    environmentalEffects: {
        densityEffect: number;     // percentage
        windEffect: number;        // yards
        temperatureEffect: number; // percentage
    };
}

export interface TrajectoryPoint {
    position: Vector3D;  // yards
    velocity: Vector3D;  // mph
    spinRate: number;   // rpm
    time: number;       // seconds
}

export interface InterpolationWeights {
    clubSpeed: number;
    launchAngle: number;
    spinRate: number;
    temperature: number;
    altitude: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
}

export interface ParameterRanges {
    clubSpeed: {
        min: number;
        max: number;
        step: number;
    };
    launchAngle: {
        min: number;
        max: number;
        step: number;
    };
    spinRate: {
        min: number;
        max: number;
        step: number;
    };
    temperature: {
        min: number;
        max: number;
        step: number;
    };
    altitude: {
        min: number;
        max: number;
        step: number;
    };
    humidity: {
        min: number;
        max: number;
        step: number;
    };
    windSpeed: {
        min: number;
        max: number;
        step: number;
    };
    windDirection: {
        min: number;
        max: number;
        step: number;
    };
}

export interface Point3D extends Vector3D {
    // Extends Vector3D with any additional properties needed
}

// Standard conditions
export const STANDARD_CONDITIONS = {
    TEMPERATURE: 70,      // °F
    PRESSURE: 29.92,      // inHg
    ALTITUDE: 0,          // feet
    HUMIDITY: 0.5,        // 0-1
    DENSITY: 1.225,       // kg/m³
    WIND: { x: 0, y: 0, z: 0 } as Vector3D
} as const;