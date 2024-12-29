import { Environment, EnvironmentalConditions, BallProperties, WindUtils, STANDARD_CONDITIONS } from './types';

export interface ShotAdjustments {
    distanceAdjustment: number;     // percentage
    trajectoryShift: number;        // yards
    spinAdjustment: number;         // percentage
    launchAngleAdjustment: number;  // degrees
}

export class SimplifiedShotModel {
    /**
     * Calculate adjusted distance based on environmental conditions
     * Uses core principles from our physics model but simplified for quick calculations
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
        // Calculate air density effect (simplified from our physics model)
        const tempK = (environment.temperature - 32) * 5/9 + 273.15;
        const pressurePa = environment.pressure * 100; // hPa to Pa
        const airDensity = environment.density; // Use provided density

        // Normalize density effect to reasonable range (max ±5%)
        const densityEffect = ((airDensity / STANDARD_CONDITIONS.DENSITY) - 1) * 5;

        // Temperature effect (max ±3% per 20°F difference from 70°F)
        const tempEffect = ((environment.temperature - STANDARD_CONDITIONS.TEMPERATURE) / 20) * 3;

        // Altitude effect (max +5% per 1000ft)
        const altitudeEffect = Math.min((environment.altitude / 1000) * 5, 10);

        // Total environmental effect (combine all effects)
        const totalEffect = 1 + (densityEffect + tempEffect + altitudeEffect) / 100;

        // Calculate adjusted distance
        const adjustedDistance = Math.round(targetDistance * totalEffect);

        return {
            adjustedDistance,
            environmentalEffects: {
                density: Math.round(densityEffect),
                temperature: Math.round(tempEffect),
                altitude: Math.round(altitudeEffect),
                total: Math.round((totalEffect - 1) * 100)
            }
        };
    }

    /**
     * Calculate complete shot adjustments matching UI expectations
     */
    public calculateShotAdjustments(
        targetDistance: number,
        environment: EnvironmentalConditions,
        ballProperties: BallProperties,
        shotDirection: number = 0
    ): ShotAdjustments {
        // Get base distance adjustments
        const distanceResult = this.calculateAdjustedDistance(
            targetDistance,
            environment,
            ballProperties
        );

        // Calculate wind effects
        const windEffect = this.calculateWindEffect(
            environment.windSpeed,
            environment.windDirection,
            shotDirection
        );

        // Calculate spin adjustment based on air density
        const densityRatio = environment.density / STANDARD_CONDITIONS.DENSITY;
        const spinAdjustment = (densityRatio - 1) * -50; // Less spin in thinner air

        // Calculate launch angle adjustment for wind
        const launchAngleAdjustment = windEffect.headwind * 0.1; // Slight adjustment for wind

        return {
            distanceAdjustment: distanceResult.environmentalEffects.total,
            trajectoryShift: windEffect.totalEffect,
            spinAdjustment: Math.round(spinAdjustment),
            launchAngleAdjustment: Math.round(launchAngleAdjustment * 10) / 10
        };
    }

    /**
     * Calculate wind effects using simplified aerodynamics
     * Based on our full physics model's wind calculations
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

        // Calculate components (from our aerodynamics model)
        const headwind = windSpeed * Math.cos(angleRad);
        const crosswind = windSpeed * Math.sin(angleRad);

        // Calculate total effect (simplified from our physics model)
        // Headwind: ~1.5 yards per mph
        // Crosswind: ~1 yard per mph
        const headwindEffect = headwind * 1.5;
        const crosswindEffect = Math.abs(crosswind);

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
        // Club distances based on typical player averages
        if (adjustedDistance <= 100) return { primary: 'PW', secondary: '9i' };
        if (adjustedDistance <= 120) return { primary: '9i', secondary: '8i' };
        if (adjustedDistance <= 130) return { primary: '8i', secondary: '7i' };
        if (adjustedDistance <= 140) return { primary: '7i', secondary: '6i' };
        if (adjustedDistance <= 150) return { primary: '6i', secondary: '5i' };
        if (adjustedDistance <= 160) return { primary: '5i', secondary: '4i' };
        if (adjustedDistance <= 170) return { primary: '4i', secondary: '3i' };
        if (adjustedDistance <= 180) return { primary: '3i', secondary: 'Hybrid' };
        if (adjustedDistance <= 200) return { primary: 'Hybrid', secondary: '3w' };
        if (adjustedDistance <= 230) return { primary: '3w', secondary: 'Driver' };
        return { primary: 'Driver' };
    }
}