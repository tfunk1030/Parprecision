import { ShotResult, TrajectoryPoint } from './types';

/**
 * Converts advanced model results to our lookup model format
 */
export class ResultConverter {
    /**
     * Convert advanced model result to lookup model format
     */
    public static convertResult(advancedResult: any): ShotResult {
        // Extract basic metrics
        const distance = advancedResult.distance;
        const height = advancedResult.height;
        const landingAngle = advancedResult.landingAngle;
        const flightTime = advancedResult.flightTime;

        // Convert trajectory points
        const trajectory: TrajectoryPoint[] = advancedResult.trajectory.map((point: any) => ({
            position: {
                x: point.position.x,
                y: point.position.y,
                z: point.position.z
            },
            velocity: {
                x: point.velocity.x,
                y: point.velocity.y,
                z: point.velocity.z
            },
            spinRate: point.spinRate || 0,
            time: point.time
        }));

        // Calculate environmental effects
        const environmentalEffects = {
            densityEffect: this.calculateDensityEffect(advancedResult),
            windEffect: this.calculateWindEffect(advancedResult),
            temperatureEffect: this.calculateTemperatureEffect(advancedResult)
        };

        return {
            distance,
            height,
            landingAngle,
            flightTime,
            trajectory,
            environmentalEffects
        };
    }

    /**
     * Calculate density effect from advanced result
     */
    private static calculateDensityEffect(advancedResult: any): number {
        // Extract density effect from advanced result if available
        if (advancedResult.environmentalEffects?.density) {
            return advancedResult.environmentalEffects.density;
        }

        // Otherwise calculate from trajectory data
        const standardDistance = 250; // Approximate standard driver distance
        const actualDistance = advancedResult.distance;
        
        // Calculate percentage difference
        return ((actualDistance - standardDistance) / standardDistance) * 100;
    }

    /**
     * Calculate wind effect from advanced result
     */
    private static calculateWindEffect(advancedResult: any): number {
        // Extract wind effect if available
        if (advancedResult.environmentalEffects?.wind) {
            return advancedResult.environmentalEffects.wind;
        }

        // Calculate from trajectory if needed
        const trajectory = advancedResult.trajectory;
        if (!trajectory || trajectory.length < 2) return 0;

        // Calculate lateral displacement
        const start = trajectory[0];
        const end = trajectory[trajectory.length - 1];
        const lateralDisplacement = Math.sqrt(
            Math.pow(end.position.x - start.position.x, 2) +
            Math.pow(end.position.z - start.position.z, 2)
        );

        return lateralDisplacement;
    }

    /**
     * Calculate temperature effect from advanced result
     */
    private static calculateTemperatureEffect(advancedResult: any): number {
        // Extract temperature effect if available
        if (advancedResult.environmentalEffects?.temperature) {
            return advancedResult.environmentalEffects.temperature;
        }

        // Calculate based on standard conditions
        const standardTemp = 70; // °F
        const actualTemp = advancedResult.conditions?.temperature || standardTemp;
        
        // Approximate effect: 1% change per 10°F difference
        return ((actualTemp - standardTemp) / 10);
    }
}