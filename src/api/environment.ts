import { Environment, EnvironmentalConditions, Wind } from '../core/types';

export function calculateEnvironmentalConditions(env: Environment): EnvironmentalConditions {
    // Calculate air density based on altitude and temperature
    const standardDensity = 1.225; // kg/m³ at sea level
    const altitudeFactor = Math.exp(-env.altitude / 7400); // Scale height of 7.4km
    const temperatureFactor = 288.15 / (env.temperature + 459.67); // Convert °F to K
    const density = standardDensity * altitudeFactor * temperatureFactor;

    // Extract wind components
    const { speed, direction } = env.wind;

    return {
        ...env,
        windSpeed: speed,
        windDirection: direction,
        density
    };
}

export function createEnvironment(
    temperature: number = 70,
    altitude: number = 0,
    windSpeed: number = 0,
    windDirection: number = 0
): Environment {
    return {
        temperature,
        pressure: 29.92, // Standard pressure
        altitude,
        humidity: 50,    // Standard humidity
        wind: {
            speed: windSpeed,
            direction: windDirection
        }
    };
}

export function combineWinds(wind1: Wind, wind2: Wind): Wind {
    // Convert to radians
    const dir1 = wind1.direction * Math.PI / 180;
    const dir2 = wind2.direction * Math.PI / 180;

    // Convert to components
    const x1 = wind1.speed * Math.cos(dir1);
    const y1 = wind1.speed * Math.sin(dir1);
    const x2 = wind2.speed * Math.cos(dir2);
    const y2 = wind2.speed * Math.sin(dir2);

    // Combine components
    const x = x1 + x2;
    const y = y1 + y2;

    // Convert back to polar
    const speed = Math.sqrt(x * x + y * y);
    const direction = ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;

    return { speed, direction };
}

export function adjustWindForAltitude(wind: Wind, altitude: number): Wind {
    // Wind speed typically increases with altitude
    // Using a simple linear model: ~2% increase per 1000ft
    const altitudeFactor = 1 + (altitude / 1000) * 0.02;
    return {
        speed: wind.speed * altitudeFactor,
        direction: wind.direction
    };
}