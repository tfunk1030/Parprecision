import { EnvironmentalConditions, BallProperties } from './types';
import { ShotAdjustments } from './legacy/simplified-shot-model';

const DEFAULT_BALL_PROPERTIES = {
    spinRate: 5000,
    initialVelocity: 60.35,
    launchAngle: 12
};

/**
 * HybridShotModel combines accurate physics with performance optimization
 * using pre-calculated lookup tables and smart caching.
 */
export class HybridShotModel {
    // Density lookup table (altitude in feet -> density ratio)
    private readonly densityTable = new Map([
        [0, 1.000],
        [1000, 0.971],
        [2000, 0.942],
        [3000, 0.915],
        [4000, 0.888],
        [5000, 0.862],
        [6000, 0.837]
    ]);

    // Temperature effects lookup (°F -> adjustment ratio)
    private readonly temperatureTable = new Map([
        [40, 1.06],
        [50, 1.04],
        [60, 1.02],
        [70, 1.00],
        [80, 0.98],
        [90, 0.96],
        [100, 0.94]
    ]);

    // Ball compression effects (°F -> compression factor)
    private readonly compressionTable = new Map([
        [40, 0.95],
        [50, 0.97],
        [60, 0.99],
        [70, 1.00],
        [80, 1.01],
        [90, 1.02],
        [100, 1.03]
    ]);

    /**
     * Calculate air density ratio using proper physics formulas
     */
    private calculateDensityRatio(altitude: number, temperature: number): number {
        // Get base density ratio from altitude
        const baseRatio = this.interpolateTable(this.densityTable, altitude);
        
        // Temperature correction (simplified ideal gas law)
        const tempRatio = this.interpolateTable(this.temperatureTable, temperature);
        
        return baseRatio * tempRatio;
    }

    /**
     * Calculate Magnus effect for spin adjustments
     */
    private calculateMagnusEffect(
        spinRate: number,
        velocity: number,
        density: number
    ): number {
        // Simplified Magnus force calculation
        const magnusCoefficient = 0.35; // Typical value for golf balls
        const liftForce = magnusCoefficient * spinRate * velocity * density;
        return liftForce / 100; // Normalize to percentage effect
    }

    /**
     * Optimize launch angle based on conditions
     */
    private optimizeLaunchAngle(
        baseAngle: number,
        density: number,
        windSpeed: number
    ): number {
        // Increase launch angle in thinner air
        const densityAdjustment = (1 - density) * 2;
        
        // Adjust for headwind/tailwind
        const windAdjustment = windSpeed * 0.1;
        
        return baseAngle + densityAdjustment + windAdjustment;
    }

    /**
     * Interpolate values from lookup tables
     */
    private interpolateTable(table: Map<number, number>, value: number): number {
        const entries = Array.from(table.entries()).sort((a, b) => a[0] - b[0]);
        
        // Find bracketing entries
        let lower = entries[0];
        let upper = entries[entries.length - 1];
        
        for (let i = 0; i < entries.length - 1; i++) {
            if (entries[i][0] <= value && entries[i + 1][0] >= value) {
                lower = entries[i];
                upper = entries[i + 1];
                break;
            }
        }
        
        // Linear interpolation
        const ratio = (value - lower[0]) / (upper[0] - lower[0]);
        return lower[1] + ratio * (upper[1] - lower[1]);
    }

    /**
     * Calculate adjusted distance based on environmental conditions
     */
    public calculateAdjustedDistance(
        targetDistance: number,
        environment: EnvironmentalConditions,
        ballProperties: BallProperties
    ): {
        adjustedDistance: number;
        environmentalEffects: {
            density: number;
            temperature: number;
            altitude: number;
            total: number;
        };
    } {
        // Calculate density effects
        const densityRatio = this.calculateDensityRatio(
            environment.altitude,
            environment.temperature
        );
        
        // Calculate ball compression effects
        const compressionFactor = this.interpolateTable(
            this.compressionTable,
            environment.temperature
        );
        
        // Calculate total environmental effect
        const densityEffect = -((1 - densityRatio) * 100);
        const tempEffect = ((compressionFactor - 1) * 100);
        const altitudeEffect = densityEffect * 0.8; // 80% of density effect is from altitude
        
        const totalEffect = (densityEffect + tempEffect) / 100;
        
        return {
            adjustedDistance: Math.round(targetDistance * (1 + totalEffect)),
            environmentalEffects: {
                density: Math.round(densityEffect),
                temperature: Math.round(tempEffect),
                altitude: Math.round(altitudeEffect),
                total: Math.round(totalEffect * 100)
            }
        };
    }

    /**
     * Calculate complete shot adjustments
     */
    public calculateShotAdjustments(
        targetDistance: number,
        environment: EnvironmentalConditions,
        ballProperties: BallProperties,
        shotDirection: number = 0
    ): ShotAdjustments {
        // Ensure required ball properties
        const spinRate = ballProperties.spinRate ?? DEFAULT_BALL_PROPERTIES.spinRate;
        const initialVelocity = ballProperties.initialVelocity ?? DEFAULT_BALL_PROPERTIES.initialVelocity;
        const launchAngle = ballProperties.launchAngle ?? DEFAULT_BALL_PROPERTIES.launchAngle;
        
        // Calculate density effects
        const densityRatio = this.calculateDensityRatio(
            environment.altitude,
            environment.temperature
        );
        
        // Calculate ball compression effects
        const compressionFactor = this.interpolateTable(
            this.compressionTable,
            environment.temperature
        );
        
        // Calculate Magnus effect
        const magnusEffect = this.calculateMagnusEffect(
            spinRate,
            initialVelocity,
            densityRatio
        );
        
        // Calculate wind effects
        const windEffect = this.calculateWindEffect(
            environment.windSpeed,
            environment.windDirection,
            shotDirection
        );
        
        // Optimize launch angle
        const launchAngleAdjustment = this.optimizeLaunchAngle(
            launchAngle,
            densityRatio,
            windEffect.headwind
        ) - launchAngle;

        // Calculate total distance effect
        const densityEffect = -((1 - densityRatio) * 100);
        const compressionEffect = ((compressionFactor - 1) * 100);
        const spinEffect = magnusEffect;
        
        const totalEffect = densityEffect + compressionEffect + spinEffect;

        return {
            distanceAdjustment: Math.round(totalEffect),
            trajectoryShift: Math.round(windEffect.totalEffect),
            spinAdjustment: Math.round(spinEffect),
            launchAngleAdjustment: Math.round(launchAngleAdjustment * 10) / 10
        };
    }

    /**
     * Calculate wind effects using vector decomposition
     */
    public calculateWindEffect(
        windSpeed: number,
        windDirection: number,
        shotDirection: number = 0
    ): {
        headwind: number;
        crosswind: number;
        totalEffect: number;
    } {
        // Convert to radians
        const angleRad = ((windDirection - shotDirection) * Math.PI) / 180;

        // Calculate components
        const headwind = windSpeed * Math.cos(angleRad);
        const crosswind = windSpeed * Math.sin(angleRad);

        // Calculate effects (based on aerodynamic analysis)
        const headwindEffect = headwind * 1.8; // Increased from 1.5 based on testing
        const crosswindEffect = Math.abs(crosswind) * 1.2; // Increased from 1.0

        return {
            headwind: Math.round(headwind * 10) / 10,
            crosswind: Math.round(crosswind * 10) / 10,
            totalEffect: Math.round(headwindEffect + crosswindEffect)
        };
    }

    /**
     * Get club recommendations based on adjusted distance
     */
    public getClubRecommendations(
        adjustedDistance: number
    ): {
        primary: string;
        secondary?: string;
    } {
        // Enhanced club distances based on statistical analysis
        if (adjustedDistance <= 100) return { primary: 'PW', secondary: '9i' };
        if (adjustedDistance <= 115) return { primary: '9i', secondary: '8i' };
        if (adjustedDistance <= 125) return { primary: '8i', secondary: '7i' };
        if (adjustedDistance <= 135) return { primary: '7i', secondary: '6i' };
        if (adjustedDistance <= 145) return { primary: '6i', secondary: '5i' };
        if (adjustedDistance <= 155) return { primary: '5i', secondary: '4i' };
        if (adjustedDistance <= 165) return { primary: '4i', secondary: '3i' };
        if (adjustedDistance <= 180) return { primary: '3i', secondary: 'Hybrid' };
        if (adjustedDistance <= 200) return { primary: 'Hybrid', secondary: '3w' };
        if (adjustedDistance <= 230) return { primary: '3w', secondary: 'Driver' };
        return { primary: 'Driver' };
    }
}