import { SimplifiedShotModel, ShotAdjustments } from './simplified-shot-model';
import { 
    Environment, 
    EnvironmentalConditions, 
    BallProperties, 
    WindUtils,
    STANDARD_CONDITIONS,
    createStandardEnvironment
} from './types';

// Standard ball properties for calculations
const standardBall: BallProperties = {
    mass: 0.0459,          // kg (typical golf ball)
    radius: 0.0213,        // m (1.68 inches)
    area: 0.00143,         // m² (cross-sectional)
    dragCoefficient: 0.47, // typical value
    liftCoefficient: 0.21, // typical value
    magnusCoefficient: 0.35, // typical value
    spinDecayRate: 0.98,   // typical value
    construction: "3-piece"  // standard golf ball
};

export class EnvironmentalCalculator {
    private static readonly model = new SimplifiedShotModel();

    /**
     * Convert Environment to EnvironmentalConditions
     */
    private static enrichEnvironment(env: Environment): EnvironmentalConditions {
        const { speed, direction } = WindUtils.calculateWindComponents(env.wind);
        const tempK = (env.temperature - 32) * 5/9 + 273.15;
        const pressurePa = env.pressure * 100; // hPa to Pa
        const density = (pressurePa * 0.0289644) / (287.058 * tempK);

        return {
            ...env,
            windSpeed: speed,
            windDirection: direction,
            density
        };
    }

    /**
     * Calculate air density based on environmental conditions
     */
    static calculateAirDensity(env: Environment): number {
        const conditions = this.enrichEnvironment(env);
        return conditions.density;
    }

    /**
     * Calculate wind effect on shot
     */
    static calculateWindEffect(
        windSpeed: number,
        windDirection: number,
        shotDirection: number
    ): { headwind: number; crosswind: number } {
        const result = this.model.calculateWindEffect(
            windSpeed,
            windDirection,
            shotDirection
        );
        return {
            headwind: result.headwind,
            crosswind: result.crosswind
        };
    }

    /**
     * Calculate complete shot adjustments
     */
    static calculateShotAdjustments(
        env: Environment,
        shotDirection: number = 0
    ): ShotAdjustments {
        const conditions = this.enrichEnvironment(env);
        return this.model.calculateShotAdjustments(
            150, // Base distance for calculating adjustments
            conditions,
            standardBall,
            shotDirection
        );
    }

    /**
     * Calculate altitude effect on shot
     */
    static calculateAltitudeEffect(altitude: number): number {
        const baseConditions = createStandardEnvironment();
        const altitudeConditions: Environment = {
            ...baseConditions,
            altitude
        };

        const result = this.model.calculateAdjustedDistance(
            150,
            this.enrichEnvironment(altitudeConditions),
            standardBall
        );

        return result.environmentalEffects.altitude;
    }

    /**
     * Get flight time adjustment based on conditions
     */
    static getFlightTimeAdjustment(env: Environment): number {
        const conditions = this.enrichEnvironment(env);
        const densityRatio = conditions.density / STANDARD_CONDITIONS.DENSITY;
        return 1 + ((1 - densityRatio) * 0.1); // Flight time increases in thinner air
    }

    /**
     * Get recommended adjustments based on conditions
     */
    static getRecommendedAdjustments(env: Environment): string[] {
        const conditions = this.enrichEnvironment(env);
        const recommendations: string[] = [];
        const windEffect = this.calculateWindEffect(
            conditions.windSpeed,
            conditions.windDirection,
            0
        );

        if (Math.abs(windEffect.headwind) > 5) {
            recommendations.push(windEffect.headwind > 0
                ? "Into wind: Club up and swing easier for better control"
                : "Downwind: Club down and be aware of reduced spin/control");
        }

        if (Math.abs(windEffect.crosswind) > 5) {
            recommendations.push("Significant crosswind: Allow for shot shape into the wind");
        }

        if (conditions.temperature < 50) {
            recommendations.push("Cold conditions: Ball will fly shorter, consider clubbing up");
        }

        if (conditions.humidity > 80) {
            recommendations.push("High humidity: Ball will fly slightly shorter");
        }

        if (conditions.altitude > 3000) {
            recommendations.push("High altitude: Ball will fly further, consider clubbing down");
        }

        return recommendations;
    }

    /**
     * Get environmental summary
     */
    static getEnvironmentalSummary(env: Environment): string {
        const conditions = this.enrichEnvironment(env);
        const adjustments = this.calculateShotAdjustments(conditions);
        const altitudeEffect = this.calculateAltitudeEffect(conditions.altitude);

        return `
            Playing conditions will affect your shots as follows:
            • Distance: ${adjustments.distanceAdjustment > 0 ? 'Increase' : 'Decrease'} by ${Math.abs(adjustments.distanceAdjustment).toFixed(1)}%
            • Ball flight: ${Math.abs(adjustments.trajectoryShift).toFixed(1)} yards ${adjustments.trajectoryShift > 0 ? 'right' : 'left'}
            • Altitude effect: +${altitudeEffect.toFixed(1)}% carry distance
            • Spin rate: ${adjustments.spinAdjustment > 0 ? 'Increased' : 'Decreased'} effect
        `.trim();
    }
}