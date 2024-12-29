import { Environment, EnvironmentalConditions, BallProperties, Wind } from './types';

export interface ShotAdjustments {
    distanceAdjustment: number;     // percentage
    trajectoryShift: number;        // yards
    spinAdjustment: number;         // percentage
    launchAngleAdjustment: number;  // degrees
}

interface ClubData {
    minDistance: number;
    maxDistance: number;
    altitudeCompensation: number;
}

const CLUB_DATA: { [key: string]: ClubData } = {
    'Driver': { minDistance: 230, maxDistance: 320, altitudeCompensation: 0.85 },
    '3w': { minDistance: 215, maxDistance: 280, altitudeCompensation: 0.88 },
    '5w': { minDistance: 200, maxDistance: 260, altitudeCompensation: 0.89 },
    '3i': { minDistance: 180, maxDistance: 240, altitudeCompensation: 0.92 },
    '4i': { minDistance: 170, maxDistance: 230, altitudeCompensation: 0.93 },
    '5i': { minDistance: 160, maxDistance: 220, altitudeCompensation: 0.94 },
    '6i': { minDistance: 150, maxDistance: 210, altitudeCompensation: 0.95 },
    '7i': { minDistance: 140, maxDistance: 200, altitudeCompensation: 0.96 },
    '8i': { minDistance: 130, maxDistance: 190, altitudeCompensation: 0.97 },
    '9i': { minDistance: 110, maxDistance: 150, altitudeCompensation: 0.98 },
    'PW': { minDistance: 80, maxDistance: 130, altitudeCompensation: 0.99 }
};

// Club progression for secondary recommendations
const CLUB_ORDER = ['PW', '9i', '8i', '7i', '6i', '5i', '4i', '3i', '5w', '3w', 'Driver'];

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
        // Get club-specific compensation
        const clubCompensation = ballProperties.club ? 
            this.getClubAltitudeCompensation(ballProperties.club) : 1.0;
        
        // Calculate temperature effect (negative in hot conditions)
        const standardTemp = 70; // °F
        const tempDiff = environment.temperature - standardTemp;
        const tempEffect = -(tempDiff / 20) * 2; // 2% per 20°F, negative in heat
        
        // Calculate altitude effect using exponential decay
        const altRatio = this.getAltitudeRatio(environment.altitude);
        const altitudeEffect = ((1 - altRatio) * 50) * clubCompensation; // Scale down by half
        
        // Calculate density effect using actual air density
        const standardDensity = 1.225; // kg/m³ at sea level
        const standardTempK = 293.15; // 20°C in Kelvin
        const tempK = (environment.temperature - 32) * 5/9 + 273.15; // °F to Kelvin
        
        // Calculate actual air density with temperature and altitude
        const densityRatio = (environment.density / standardDensity) * (standardTempK / tempK) * altRatio;
        const densityEffect = ((1 - densityRatio) * 25) * clubCompensation; // Scale down to 25%

        // Total environmental effect with club-specific scaling
        const totalEffect = (tempEffect + altitudeEffect + densityEffect);

        // Calculate adjusted distance
        const adjustedDistance = Math.round(targetDistance * (1 + totalEffect / 100));

        return {
            adjustedDistance,
            environmentalEffects: {
                density: Math.round(densityEffect),
                temperature: Math.round(tempEffect),
                altitude: Math.round(altitudeEffect),
                total: Math.round(totalEffect)
            }
        };
    }

    private getAltitudeRatio(alt: number): number {
        // Exponential decay based on atmospheric physics
        // 8500m is scale height of atmosphere, convert feet to meters
        const altMeters = alt * 0.3048;
        return Math.exp(-altMeters / 8500);
    }

    private getClubAltitudeCompensation(club: string): number {
        const clubKey = club.toUpperCase().replace(/iron/i, 'i');
        return CLUB_DATA[clubKey]?.altitudeCompensation ?? 1.0;
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
            totalEffect: Math.round(Math.abs(headwindEffect + crosswindEffect))
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
        const densityRatio = environment.density / 1.225;
        const spinAdjustment = (densityRatio - 1) * -25; // Scale down spin effect

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
     * Get club recommendations based on adjusted distance
     */
    public getClubRecommendations(
        adjustedDistance: number
    ): {
        primary: string;
        secondary?: string;
    } {
        // Special case for very long distances
        if (adjustedDistance >= 250) {
            return { primary: 'Driver' };
        }

        // Special case for very short distances
        if (adjustedDistance <= 90) {
            return { primary: 'PW', secondary: '9i' };
        }

        // Find the best fitting club
        const primaryClub = Object.entries(CLUB_DATA)
            .find(([_, data]) => 
                adjustedDistance >= data.minDistance && 
                adjustedDistance <= data.maxDistance
            );

        if (!primaryClub) {
            return adjustedDistance > 200 ? 
                { primary: 'Driver' } : 
                { primary: 'PW', secondary: '9i' };
        }

        // Find secondary club based on club progression
        const primaryIndex = CLUB_ORDER.indexOf(primaryClub[0]);
        const secondaryClub = primaryIndex < CLUB_ORDER.length - 1 ? 
            CLUB_ORDER[primaryIndex + 1] : undefined;

        return {
            primary: primaryClub[0],
            secondary: secondaryClub
        };
    }
}