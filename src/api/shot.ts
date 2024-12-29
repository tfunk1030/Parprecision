import { BallProperties, Environment, EnvironmentalConditions, Wind } from '../core/types';
import { calculateEnvironmentalConditions } from './environment';

export interface ShotParameters {
    distance: number;      // yards
    club: string;         // e.g., "driver", "7i"
    environment: Environment;
}

const defaultBallProperties: BallProperties = {
    mass: 0.0459,          // kg (typical golf ball)
    radius: 0.0213,        // m (1.68 inches)
    area: 0.00143,         // m² (cross-sectional)
    dragCoefficient: 0.47, // typical value
    liftCoefficient: 0.21, // typical value
    magnusCoefficient: 0.21, // typical value
    spinDecayRate: 0.98,   // typical value
    spinRate: 2500,        // rpm (mid iron)
    initialVelocity: 50,   // m/s (about 112 mph)
    launchAngle: 16,       // degrees (mid trajectory)
    construction: "3-piece"
};

export function calculateShotAdjustments(params: ShotParameters) {
    // Convert Environment to EnvironmentalConditions
    const conditions = calculateEnvironmentalConditions(params.environment);
    
    // Calculate adjustments based on conditions
    const tempEffect = calculateTemperatureEffect(conditions.temperature);
    const altEffect = calculateAltitudeEffect(conditions.altitude);
    const windEffect = calculateWindEffect(conditions.wind);
    
    return {
        distanceAdjustment: tempEffect + altEffect,
        windAdjustment: windEffect,
        totalAdjustment: tempEffect + altEffect + windEffect
    };
}

function calculateTemperatureEffect(temperature: number): number {
    // Base temperature is 70°F
    // Approximately 2% change per 10°F difference
    const tempDiff = temperature - 70;
    return -(tempDiff / 10) * 2;
}

function calculateAltitudeEffect(altitude: number): number {
    // Approximately 2% increase per 1000ft
    return (altitude / 1000) * 2;
}

function calculateWindEffect(wind: Wind): number {
    const { speed, direction } = wind;
    
    // Convert direction to radians
    const radians = direction * Math.PI / 180;
    
    // Calculate headwind component
    const headwind = speed * Math.cos(radians);
    
    // Calculate crosswind component
    const crosswind = speed * Math.sin(radians);
    
    // Headwind has more effect than crosswind
    return -(headwind * 1.5 + Math.abs(crosswind));
}

export function getBallProperties(club: string): BallProperties {
    // Adjust ball properties based on club
    switch (club.toLowerCase()) {
        case 'driver':
            return {
                ...defaultBallProperties,
                spinRate: 2700,
                initialVelocity: 75,
                launchAngle: 10.5
            };
        case '3w':
            return {
                ...defaultBallProperties,
                spinRate: 3000,
                initialVelocity: 70,
                launchAngle: 12
            };
        case '5i':
            return {
                ...defaultBallProperties,
                spinRate: 5000,
                initialVelocity: 55,
                launchAngle: 18
            };
        case '7i':
            return {
                ...defaultBallProperties,
                spinRate: 6000,
                initialVelocity: 50,
                launchAngle: 20
            };
        case '9i':
            return {
                ...defaultBallProperties,
                spinRate: 7000,
                initialVelocity: 45,
                launchAngle: 24
            };
        case 'pw':
            return {
                ...defaultBallProperties,
                spinRate: 8000,
                initialVelocity: 40,
                launchAngle: 28
            };
        default:
            return defaultBallProperties;
    }
}