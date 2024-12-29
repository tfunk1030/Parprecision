import { Environment, Vector3D } from './types';
import { EnvironmentalSystem } from './environmental-system';

/**
 * High-level calculator for environmental effects
 * Provides simplified interface for environmental calculations
 */
export class EnvironmentalCalculator {
    private readonly system: EnvironmentalSystem;
    private readonly cache: Map<string, any>;

    constructor() {
        this.system = new EnvironmentalSystem();
        this.cache = new Map();
    }

    /**
     * Generate cache key for environmental conditions
     */
    private generateCacheKey(environment: Environment, height?: number): string {
        const key = {
            temp: Math.round(environment.temperature),
            pressure: Math.round(environment.pressure * 100) / 100,
            altitude: Math.round(environment.altitude),
            humidity: Math.round(environment.humidity * 100) / 100,
            wind: {
                x: Math.round(environment.wind.x * 10) / 10,
                y: Math.round(environment.wind.y * 10) / 10,
                z: Math.round(environment.wind.z * 10) / 10
            },
            height: height !== undefined ? Math.round(height) : undefined
        };
        return JSON.stringify(key);
    }

    /**
     * Calculate all environmental adjustments for a shot
     */
    public calculateAdjustments(environment: Environment): {
        distanceEffect: number;
        spinEffect: number;
        trajectoryEffect: number;
        airDensity: number;
    } {
        const cacheKey = this.generateCacheKey(environment);
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;

        // Process environment
        const processed = this.system.processEnvironment(environment);

        // Calculate total effects
        const result = {
            // Distance effect combines temperature and altitude
            distanceEffect: processed.temperatureEffects.distanceEffect + 
                          (1 - processed.altitudeEffect),

            // Spin effect based on air density
            spinEffect: (processed.airDensity / 1.225 - 1) * -50,

            // Trajectory effect from wind
            trajectoryEffect: Math.sqrt(
                environment.wind.x * environment.wind.x +
                environment.wind.z * environment.wind.z
            ) * 1.5,

            // Air density for force calculations
            airDensity: processed.airDensity
        };

        this.cache.set(cacheKey, result);
        return result;
    }

    /**
     * Get wind velocity at specific height
     */
    public getWindAtHeight(environment: Environment, height: number): Vector3D {
        const cacheKey = this.generateCacheKey(environment, height);
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;

        const wind = this.system.calculateWindAtHeight(environment.wind, height);
        this.cache.set(cacheKey, wind);
        return wind;
    }

    /**
     * Get recommended adjustments based on conditions
     */
    public getRecommendations(environment: Environment): string[] {
        const adjustments = this.calculateAdjustments(environment);
        const recommendations: string[] = [];

        // Distance adjustments
        if (Math.abs(adjustments.distanceEffect) > 0.05) {
            recommendations.push(
                adjustments.distanceEffect > 0
                    ? "Ball will fly further - consider clubbing down"
                    : "Ball will fly shorter - consider clubbing up"
            );
        }

        // Spin adjustments
        if (Math.abs(adjustments.spinEffect) > 5) {
            recommendations.push(
                adjustments.spinEffect > 0
                    ? "Increased spin effect - expect more shot shape"
                    : "Reduced spin effect - expect less shot shape"
            );
        }

        // Wind adjustments
        if (adjustments.trajectoryEffect > 5) {
            recommendations.push(
                "Significant wind effect - adjust aim and shot shape accordingly"
            );
        }

        // Altitude recommendations
        if (environment.altitude > 3000) {
            recommendations.push(
                "High altitude - ball will fly further and spin less"
            );
        }

        // Temperature recommendations
        if (environment.temperature < 50) {
            recommendations.push(
                "Cold conditions - ball will fly shorter and compress less"
            );
        } else if (environment.temperature > 90) {
            recommendations.push(
                "Hot conditions - ball will fly further with more spin"
            );
        }

        return recommendations;
    }

    /**
     * Clear the calculation cache
     */
    public clearCache(): void {
        this.cache.clear();
    }

    /**
     * Get current cache size
     */
    public getCacheSize(): number {
        return this.cache.size;
    }
}