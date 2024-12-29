import { Environment, Vector3D } from './types';

/**
 * Environmental effects calculator
 * Extracted and simplified from environmental-system.ts and wind-effects.ts
 */
export class EnvironmentalSystem {
    // Height-based wind profile from wind tunnel data
    private readonly WIND_HEIGHT_MULTIPLIERS: Record<number, number> = {
        0: 0.75,    // Ground level
        10: 0.85,   // Low height
        50: 1.0,    // Mid height
        100: 1.15,  // High height
        150: 1.25   // Maximum height
    };

    // Temperature effects from validated data
    private readonly TEMPERATURE_EFFECTS: Record<number, {
        compressionChange: number;
        corChange: number;
        distanceEffect: number;
    }> = {
        40: { compressionChange: 5, corChange: -0.010, distanceEffect: -0.025 },
        50: { compressionChange: 3, corChange: -0.006, distanceEffect: -0.015 },
        60: { compressionChange: 1, corChange: -0.002, distanceEffect: -0.005 },
        70: { compressionChange: 0, corChange: 0.000, distanceEffect: 0.000 },
        80: { compressionChange: -1, corChange: 0.002, distanceEffect: 0.005 },
        90: { compressionChange: -2, corChange: 0.004, distanceEffect: 0.010 },
        100: { compressionChange: -3, corChange: 0.006, distanceEffect: 0.015 }
    };

    // Altitude effects from empirical data
    private readonly ALTITUDE_EFFECTS: Record<number, number> = {
        0: 1.000,
        1000: 0.971,
        2000: 0.942,
        3000: 0.915,
        4000: 0.888,
        5000: 0.862,
        6000: 0.837
    };

    /**
     * Calculate wind velocity at a given height
     * Simplified from wind-effects.ts height-dependent model
     */
    public calculateWindAtHeight(
        baseWind: Vector3D,
        height: number
    ): Vector3D {
        // Find closest height multiplier
        const heights = Object.keys(this.WIND_HEIGHT_MULTIPLIERS)
            .map(Number)
            .sort((a, b) => Math.abs(a - height) - Math.abs(b - height));
        
        const multiplier = this.WIND_HEIGHT_MULTIPLIERS[heights[0]];

        return {
            x: baseWind.x * multiplier,
            y: baseWind.y * multiplier,
            z: baseWind.z * multiplier
        };
    }

    /**
     * Calculate temperature effects on ball and air
     * Simplified from environmental-system.ts temperature impact
     */
    public calculateTemperatureEffects(temperature: number): {
        compressionChange: number;
        corChange: number;
        distanceEffect: number;
    } {
        // Find closest temperature effects
        const temps = Object.keys(this.TEMPERATURE_EFFECTS)
            .map(Number)
            .sort((a, b) => Math.abs(a - temperature) - Math.abs(b - temperature));
        
        return this.TEMPERATURE_EFFECTS[temps[0]];
    }

    /**
     * Calculate altitude effect on air density
     * Simplified from environmental-system.ts altitude calculations
     */
    public calculateAltitudeEffect(altitude: number): number {
        // Find closest altitude effect
        const alts = Object.keys(this.ALTITUDE_EFFECTS)
            .map(Number)
            .sort((a, b) => Math.abs(a - altitude) - Math.abs(b - altitude));
        
        return this.ALTITUDE_EFFECTS[alts[0]];
    }

    /**
     * Calculate air density using ideal gas law
     * Simplified from environmental-system.ts density calculations
     */
    public calculateAirDensity(environment: Environment): number {
        const tempK = (environment.temperature - 32) * 5/9 + 273.15; // °F to K
        const pressurePa = environment.pressure * 3386.39; // inHg to Pa
        const R = 287.058; // Gas constant for dry air

        // Basic density calculation
        let density = pressurePa / (R * tempK);

        // Apply altitude correction
        const altitudeEffect = this.calculateAltitudeEffect(environment.altitude);
        density *= altitudeEffect;

        // Apply humidity correction (simplified)
        density *= (1 - environment.humidity * 0.06);

        return density;
    }

    /**
     * Process all environmental effects
     */
    public processEnvironment(environment: Environment): {
        airDensity: number;
        temperatureEffects: {
            compressionChange: number;
            corChange: number;
            distanceEffect: number;
        };
        altitudeEffect: number;
        windAtHeight: (height: number) => Vector3D;
    } {
        const airDensity = this.calculateAirDensity(environment);
        const temperatureEffects = this.calculateTemperatureEffects(environment.temperature);
        const altitudeEffect = this.calculateAltitudeEffect(environment.altitude);

        return {
            airDensity,
            temperatureEffects,
            altitudeEffect,
            windAtHeight: (height: number) => this.calculateWindAtHeight(environment.wind, height)
        };
    }
}