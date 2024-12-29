/**
 * Club-specific data and calculations
 */

export interface ClubData {
    baseDistance: number;     // yards
    heightRatio: number;      // max height as percentage of distance
    spinRate: number;        // rpm
    launchAngle: number;     // degrees
    spinDecayRate: number;   // rpm loss per second
    carryRatio: number;      // carry distance as percentage of total
}

export const CLUB_DATA: Record<string, ClubData> = {
    'driver': {
        baseDistance: 275,
        heightRatio: 0.12,    // max height = 12% of distance
        spinRate: 2700,
        launchAngle: 15,
        spinDecayRate: 50,    // rpm/s
        carryRatio: 0.95     // 95% carry, 5% roll
    },
    '3-wood': {
        baseDistance: 245,
        heightRatio: 0.14,
        spinRate: 3200,
        launchAngle: 16,
        spinDecayRate: 60,
        carryRatio: 0.94
    },
    'hybrid': {
        baseDistance: 220,
        heightRatio: 0.15,
        spinRate: 3800,
        launchAngle: 17,
        spinDecayRate: 70,
        carryRatio: 0.93
    },
    '3-iron': {
        baseDistance: 200,
        heightRatio: 0.16,
        spinRate: 4500,
        launchAngle: 18,
        spinDecayRate: 80,
        carryRatio: 0.92
    },
    '4-iron': {
        baseDistance: 190,
        heightRatio: 0.16,
        spinRate: 5000,
        launchAngle: 19,
        spinDecayRate: 85,
        carryRatio: 0.92
    },
    '5-iron': {
        baseDistance: 180,
        heightRatio: 0.17,
        spinRate: 5500,
        launchAngle: 20,
        spinDecayRate: 90,
        carryRatio: 0.91
    },
    '6-iron': {
        baseDistance: 170,
        heightRatio: 0.17,
        spinRate: 6000,
        launchAngle: 21,
        spinDecayRate: 95,
        carryRatio: 0.91
    },
    '7-iron': {
        baseDistance: 160,
        heightRatio: 0.18,
        spinRate: 6500,
        launchAngle: 22,
        spinDecayRate: 100,
        carryRatio: 0.90
    },
    '8-iron': {
        baseDistance: 150,
        heightRatio: 0.18,
        spinRate: 7000,
        launchAngle: 23,
        spinDecayRate: 105,
        carryRatio: 0.90
    },
    '9-iron': {
        baseDistance: 140,
        heightRatio: 0.19,
        spinRate: 7500,
        launchAngle: 24,
        spinDecayRate: 110,
        carryRatio: 0.89
    },
    'pw': {
        baseDistance: 130,
        heightRatio: 0.19,
        spinRate: 8000,
        launchAngle: 25,
        spinDecayRate: 115,
        carryRatio: 0.89
    }
};

/**
 * Environmental effect constants
 */
export const ENVIRONMENTAL_EFFECTS = {
    // Altitude effects
    DENSITY_EFFECT_PER_1000FT: -0.02,  // -2% per 1000ft
    
    // Temperature effects (relative to 70°F standard)
    TEMP_EFFECT_PER_10F: 0.01,         // +1% per 10°F above 70°F
    STANDARD_TEMP: 70,
    
    // Wind effects
    HEADWIND_EFFECT_PER_MPH: -1.5,     // -1.5 yards per mph headwind
    CROSSWIND_EFFECT_PER_MPH: 0.8,     // 0.8 yards per mph crosswind
    
    // Humidity effects
    HUMIDITY_EFFECT_MAX: 0.02,         // Up to 2% increase in distance
    
    // Air pressure effects (relative to 29.92 inHg standard)
    PRESSURE_EFFECT_PER_INHG: 0.015    // 1.5% per inHg difference
};

/**
 * Calculate total environmental adjustment factor
 */
export function calculateEnvironmentalEffects(params: {
    altitude: number;        // feet
    temperature: number;     // °F
    humidity: number;        // 0-1
    pressure: number;        // inHg
    windSpeed: number;       // mph
    windDirection: number;   // degrees
    shotDirection: number;   // degrees
}): {
    densityEffect: number;   // percentage
    windEffect: number;      // yards
    temperatureEffect: number; // percentage
} {
    // Calculate density effect from altitude
    const densityEffect = (params.altitude / 1000) * ENVIRONMENTAL_EFFECTS.DENSITY_EFFECT_PER_1000FT;

    // Calculate temperature effect
    const tempEffect = ((params.temperature - ENVIRONMENTAL_EFFECTS.STANDARD_TEMP) / 10) 
        * ENVIRONMENTAL_EFFECTS.TEMP_EFFECT_PER_10F;

    // Calculate wind effect
    const windAngle = ((params.windDirection - params.shotDirection + 360) % 360) * Math.PI / 180;
    const headwindComponent = -Math.cos(windAngle) * params.windSpeed;
    const crosswindComponent = Math.sin(windAngle) * params.windSpeed;
    
    const windEffect = 
        headwindComponent * ENVIRONMENTAL_EFFECTS.HEADWIND_EFFECT_PER_MPH +
        Math.abs(crosswindComponent) * ENVIRONMENTAL_EFFECTS.CROSSWIND_EFFECT_PER_MPH;

    return {
        densityEffect,
        windEffect,
        temperatureEffect: tempEffect
    };
}