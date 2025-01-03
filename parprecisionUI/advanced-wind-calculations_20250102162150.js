/**
 * Enhanced wind effect and spin decay modeling system
 */

// Wind gradient model constants
const WIND_GRADIENT_CONSTANTS = {
    SURFACE_ROUGHNESS: 0.03,  // Typical for golf courses
    REFERENCE_HEIGHT: 6,      // feet (typical anemometer height)
    LAYER_HEIGHTS: [10, 50, 100, 250, 500], // feet
    TURBULENCE_INTENSITY: 0.15 // 15% baseline turbulence
};

/**
 * Calculate multi-layer wind effect with turbulence
 * @param {Object} params Wind parameters
 * @returns {Object} Wind effects at different heights
 */
export function calculateAdvancedWindEffect(params) {
    const {
        windSpeed,         // Ground level wind speed (mph)
        windDirection,     // Wind direction (degrees)
        altitude,         // Shot altitude (feet)
        temperature,      // Temperature (°F)
        stability = 'neutral' // Atmospheric stability
    } = params;

    // Calculate wind profile for different heights
    const windProfile = calculateWindGradient(windSpeed, altitude);
    
    // Add turbulence effects
    const turbulence = calculateTurbulence(windSpeed, stability, temperature);
    
    // Calculate directional shear
    const windShear = calculateWindShear(altitude);

    return {
        windProfile,
        effectiveSpeed: windProfile.effectiveSpeed,
        turbulence,
        shear: windShear,
        components: calculateWindComponents(windSpeed, windDirection + windShear)
    };
}

/**
 * Calculate wind speed at different heights using power law
 */
function calculateWindGradient(surfaceWindSpeed, maxHeight) {
    const { SURFACE_ROUGHNESS, REFERENCE_HEIGHT, LAYER_HEIGHTS } = WIND_GRADIENT_CONSTANTS;
    const layers = [];
    let totalEffect = 0;
    
    LAYER_HEIGHTS.forEach(height => {
        if (height <= maxHeight) {
            // Power law wind profile
            const speedRatio = Math.pow(height / REFERENCE_HEIGHT, SURFACE_ROUGHNESS);
            const layerSpeed = surfaceWindSpeed * speedRatio;
            
            layers.push({
                height,
                speed: layerSpeed,
                effect: (layerSpeed - surfaceWindSpeed) / surfaceWindSpeed
            });
            
            totalEffect += (layerSpeed - surfaceWindSpeed);
        }
    });

    const effectiveSpeed = surfaceWindSpeed + (totalEffect / layers.length);
    
    return {
        layers,
        effectiveSpeed,
        maxGradient: Math.max(...layers.map(l => l.effect))
    };
}

/**
 * Calculate turbulence intensity and gustiness
 */
function calculateTurbulence(windSpeed, stability, temperature) {
    const { TURBULENCE_INTENSITY } = WIND_GRADIENT_CONSTANTS;
    
    // Base turbulence scaled by wind speed
    let baseTurbulence = TURBULENCE_INTENSITY * (windSpeed / 10);
    
    // Adjust for atmospheric stability
    const stabilityFactors = {
        'stable': 0.7,
        'neutral': 1.0,
        'unstable': 1.3
    };
    
    baseTurbulence *= stabilityFactors[stability] || 1.0;
    
    // Temperature effects on turbulence
    const tempEffect = Math.max(0, (temperature - 60) / 100);
    
    return {
        intensity: baseTurbulence,
        gustFactor: 1 + (baseTurbulence * (1 + tempEffect)),
        temporalScale: calculateTemporalScale(windSpeed)
    };
}

/**
 * Calculate wind directional shear with height
 */
function calculateWindShear(height) {
    // Ekman spiral approximation
    const EKMAN_CONSTANT = 0.04;
    return Math.min(height * EKMAN_CONSTANT, 20); // Maximum 20° direction change
}

/**
 * Calculate headwind/crosswind components
 */
function calculateWindComponents(speed, direction) {
    const radians = direction * Math.PI / 180;
    return {
        headwind: -speed * Math.cos(radians),
        crosswind: speed * Math.sin(radians)
    };
}

/**
 * Calculate temporal scale of turbulence
 */
function calculateTemporalScale(windSpeed) {
    return Math.max(0.5, 3.0 - (windSpeed / 15));
}

/**
 * Enhanced spin decay model with environmental effects
 */
export function calculateSpinDecay(params) {
    const {
        initialSpin,      // Initial spin rate (rpm)
        airDensity,       // Air density (kg/m³)
        time,            // Time in flight (s)
        velocity,        // Ball velocity (m/s)
        temperature,     // Temperature (°F)
        altitude = 0     // Altitude (ft)
    } = params;

    // Base decay rate
    const baseDecayRate = 0.0365;  // Empirical decay constant
    
    // Air density effect
    const densityFactor = Math.pow(airDensity / 1.225, 0.5);
    
    // Temperature effect on ball coating
    const tempFactor = Math.pow(1.0 - Math.abs(temperature - 70) / 200, 0.2);
    
    // Altitude effect on air resistance
    const altitudeFactor = Math.exp(-altitude / 30000);
    
    // Velocity effect on spin decay
    const velocityFactor = Math.pow(velocity / 70, 0.3);
    
    // Combined decay rate
    const decayRate = baseDecayRate * densityFactor * tempFactor * altitudeFactor * velocityFactor;
    
    // Calculate spin at given time
    const spinRate = initialSpin * Math.exp(-decayRate * time);
    
    return {
        spinRate,
        decayRate,
        factors: {
            density: densityFactor,
            temperature: tempFactor,
            altitude: altitudeFactor,
            velocity: velocityFactor
        }
    };
}
