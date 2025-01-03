// Environmental impact calculations for ball flight

/**
 * Calculate air density based on temperature, pressure and humidity
 * @param {number} temperature - Temperature in Fahrenheit
 * @param {number} pressure - Barometric pressure in inHg
 * @param {number} humidity - Relative humidity (0-100)
 * @returns {number} Air density in lb/ft³
 */
export function calculateAirDensity(temperature, pressure, humidity) {
    // Convert temperature to Kelvin
    const tempKelvin = (temperature + 459.67) * 5/9;
    
    // Calculate vapor pressure
    const vaporPressure = calculateVaporPressure(temperature, humidity);
    
    // Convert pressure to Pascals
    const pressurePa = pressure * 3386.39;
    
    // Gas constants
    const Rd = 287.05;  // Specific gas constant for dry air (J/(kg·K))
    const Rv = 461.495; // Specific gas constant for water vapor (J/(kg·K))
    
    // Calculate air density using the virtual temperature method
    const density = (pressurePa / (Rd * tempKelvin)) * 
                   (1 - (vaporPressure / pressurePa) * (1 - Rd/Rv));
    
    // Convert to lb/ft³
    return density * 0.0624;
}

/**
 * Calculate vapor pressure
 * @param {number} temperature - Temperature in Fahrenheit
 * @param {number} humidity - Relative humidity (0-100)
 * @returns {number} Vapor pressure in Pascals
 */
function calculateVaporPressure(temperature, humidity) {
    // Convert temperature to Celsius
    const tempCelsius = (temperature - 32) * 5/9;
    
    // Magnus formula coefficients
    const a = 6.112;
    const b = 17.67;
    const c = 243.5;
    
    // Calculate saturation vapor pressure
    const saturationVaporPressure = a * Math.exp((b * tempCelsius) / (c + tempCelsius));
    
    // Calculate actual vapor pressure
    return (humidity / 100) * saturationVaporPressure * 100;
}

/**
 * Calculate altitude effect on air density
 * @param {number} altitude - Altitude in feet
 * @param {number} baseAirDensity - Base air density at sea level
 * @returns {number} Adjusted air density
 */
export function calculateAltitudeEffect(altitude, baseAirDensity) {
    // International Standard Atmosphere model
    const lapseRate = -0.0065;  // Temperature lapse rate (K/m)
    const altitudeMeters = altitude * 0.3048;
    const temperatureRatio = 1 + (lapseRate * altitudeMeters) / 288.15;
    const pressureRatio = Math.pow(temperatureRatio, 5.2561);
    
    return baseAirDensity * pressureRatio / temperatureRatio;
}

/**
 * Calculate ball compression factor based on temperature
 * @param {number} temperature - Temperature in Fahrenheit
 * @returns {number} Compression factor (1 = standard)
 */
export function calculateBallCompression(temperature) {
    const standardTemp = 70;  // Standard temperature for ball testing
    const compressibilityFactor = 0.0008;  // Compression change per degree F
    
    return 1 + (temperature - standardTemp) * compressibilityFactor;
}

/**
 * Calculate wind effect on ball flight
 * @param {number} windSpeed - Wind speed in mph
 * @param {number} windDirection - Wind direction in degrees (0 = headwind)
 * @param {number} altitude - Altitude in feet
 * @returns {Object} Wind effects on distance and trajectory
 */
export function calculateWindEffect(windSpeed, windDirection, altitude) {
    // Calculate effective wind speed (increases with altitude)
    const altitudeFactor = 1 + (altitude / 10000) * 0.1;
    const effectiveWindSpeed = windSpeed * altitudeFactor;
    
    // Convert direction to radians
    const directionRad = windDirection * Math.PI / 180;
    
    // Calculate headwind/tailwind and crosswind components
    const headwind = effectiveWindSpeed * Math.cos(directionRad);
    const crosswind = effectiveWindSpeed * Math.sin(directionRad);
    
    // Calculate effects
    // Headwind decreases distance more than tailwind increases it
    const distanceEffect = headwind > 0 
        ? -headwind * 0.007  // Headwind
        : -headwind * 0.005; // Tailwind
        
    return {
        distanceEffect,
        crosswindEffect: crosswind * 0.005,
        effectiveWindSpeed
    };
}

/**
 * Calculate total environmental impact
 * @param {Object} conditions - Environmental conditions
 * @returns {Object} Combined effects on ball flight
 */
export function calculateEnvironmentalImpact(conditions) {
    const {
        temperature,
        pressure = 29.92,  // Standard pressure if not provided
        humidity = 50,     // Standard humidity if not provided
        altitude = 0,
        windSpeed = 0,
        windDirection = 0
    } = conditions;

    // Calculate base air density
    const baseAirDensity = calculateAirDensity(temperature, pressure, humidity);
    
    // Calculate altitude-adjusted air density
    const adjustedAirDensity = calculateAltitudeEffect(altitude, baseAirDensity);
    
    // Calculate ball compression
    const compressionFactor = calculateBallCompression(temperature);
    
    // Calculate wind effects
    const windEffects = calculateWindEffect(windSpeed, windDirection, altitude);
    
    // Calculate total carry factor
    const airDensityFactor = adjustedAirDensity / 0.0765;  // Normalized to sea level
    const carryFactor = (1 / airDensityFactor) * compressionFactor;

    return {
        airDensity: adjustedAirDensity,
        compressionFactor,
        carryFactor,
        windEffects,
        humidity: {
            effect: (humidity - 50) * 0.0005  // Small effect of humidity
        }
    };
}
