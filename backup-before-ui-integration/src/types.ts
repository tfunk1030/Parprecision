// Vector interface used for 3D coordinates and wind
export interface Vector3D {
    x: number;
    y: number;
    z: number;
}

// Base environment interface
export interface Environment {
    temperature: number;    // Fahrenheit
    pressure: number;      // hPa
    altitude: number;      // feet
    humidity: number;      // percentage
    wind: Vector3D;        // Wind vector
}

// Ball properties interface
export interface BallProperties {
    mass: number;           // kg
    radius: number;         // m
    area: number;          // m²
    dragCoefficient: number;
    liftCoefficient: number;
    magnusCoefficient: number;
    spinDecayRate: number;
    construction: "2-piece" | "3-piece" | "4-piece" | "5-piece";
}

// Trajectory data interfaces
export interface TrajectoryPoint {
    position: Vector3D;
    velocity: Vector3D;
    spin: number;
    time: number;
}

export interface ValidationResult {
    isValid: boolean;
    trajectory?: TrajectoryPoint[];
    environmentalFactors?: {
        density: number;
        temperature: number;
        altitude: number;
    };
    message?: string;
}

// Extended environment with calculated values
export interface EnvironmentalConditions extends Environment {
    windSpeed: number;     // mph
    windDirection: number; // degrees (0-360)
    density: number;       // kg/m³
}

// Standard conditions
export const StandardConditions = {
    TEMPERATURE: 70,      // °F
    PRESSURE: 1013.25,    // hPa
    ALTITUDE: 0,          // feet
    HUMIDITY: 50,         // %
    DENSITY: 1.225,       // kg/m³
    WIND: { x: 0, y: 0, z: 0 } as Vector3D
} as const;

// Re-export with uppercase name for backward compatibility
export const STANDARD_CONDITIONS = StandardConditions;

// Wind utilities
export const WindUtils = {
    calculateWindComponents(wind: Vector3D): {
        speed: number;
        direction: number;
    } {
        const speed = Math.sqrt(wind.x * wind.x + wind.z * wind.z);
        const direction = (Math.atan2(wind.z, wind.x) * 180 / Math.PI + 360) % 360;
        return { speed, direction };
    },

    createWindVector(speed: number, direction: number): Vector3D {
        const radians = direction * Math.PI / 180;
        return {
            x: speed * Math.cos(radians),
            y: 0,
            z: speed * Math.sin(radians)
        };
    }
} as const;

// Helper function to create standard environment
export function createStandardEnvironment(): Environment {
    return {
        temperature: StandardConditions.TEMPERATURE,
        pressure: StandardConditions.PRESSURE,
        altitude: StandardConditions.ALTITUDE,
        humidity: StandardConditions.HUMIDITY,
        wind: { ...StandardConditions.WIND }
    };
}
