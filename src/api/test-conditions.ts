import { Environment, Wind } from '../core/types';

export const standardConditions: Environment = {
    temperature: 70,    // °F
    pressure: 29.92,    // inHg
    altitude: 0,        // feet
    humidity: 50,       // %
    wind: {
        speed: 0,
        direction: 0
    }
};

export const hotConditions: Environment = {
    ...standardConditions,
    temperature: 90     // Hot day
};

export const highAltitudeConditions: Environment = {
    ...standardConditions,
    altitude: 5000      // High altitude
};

export const windyConditions: Environment = {
    ...standardConditions,
    wind: {
        speed: 15,      // mph
        direction: 45   // degrees (NE wind)
    }
};

export const extremeConditions: Environment = {
    temperature: 100,   // Very hot
    pressure: 28.5,     // Low pressure
    altitude: 7000,     // Very high
    humidity: 90,       // Very humid
    wind: {
        speed: 25,      // Strong wind
        direction: 180  // Headwind
    }
};

export function createTestWind(speed: number, direction: number): Wind {
    return { speed, direction };
}

export function createTestEnvironment(
    temperature: number = 70,
    altitude: number = 0,
    windSpeed: number = 0,
    windDirection: number = 0
): Environment {
    return {
        temperature,
        pressure: 29.92,
        altitude,
        humidity: 50,
        wind: createTestWind(windSpeed, windDirection)
    };
}