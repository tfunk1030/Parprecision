// Local test version of environmental calculations
class EnvironmentalCalculator {
  static calculateAirDensity(conditions) {
    // Convert temperature to Kelvin
    const tempK = (conditions.temperature - 32) * 5/9 + 273.15;
    const pressurePa = conditions.pressure * 100; // hPa to Pa
    
    // Calculate density using ideal gas law
    const density = pressurePa / (287.058 * tempK);
    
    // Apply altitude correction
    const altitudeEffect = Math.max(0, 1 - (conditions.altitude / 1000) * 0.03);
    
    return density * altitudeEffect;
  }

  static calculateWindEffect(windSpeed, windDirection, shotDirection) {
    // Convert to radians
    const angleRad = ((windDirection - shotDirection) * Math.PI) / 180;

    // Calculate components
    const headwind = windSpeed * Math.cos(angleRad);
    const crosswind = windSpeed * Math.sin(angleRad);

    return {
      headwind: Math.round(headwind * 10) / 10,
      crosswind: Math.round(crosswind * 10) / 10
    };
  }

  static calculateShotAdjustments(conditions, shotDirection = 0) {
    const STANDARD_DENSITY = 1.225;  // kg/m³
    const STANDARD_TEMP = 70;    // °F
    
    // Calculate density effect (max ±5%)
    const densityEffect = ((conditions.density / STANDARD_DENSITY) - 1) * 5;
    
    // Temperature effect (max ±3% per 20°F difference from standard)
    const tempEffect = ((conditions.temperature - STANDARD_TEMP) / 20) * 3;
    
    // Altitude effect (max +5% per 1000ft)
    const altitudeEffect = Math.min((conditions.altitude / 1000) * 5, 10);
    
    // Calculate wind effects
    const wind = this.calculateWindEffect(
      conditions.windSpeed,
      conditions.windDirection,
      shotDirection
    );
    
    // Calculate total distance adjustment
    const distanceAdjustment = densityEffect + tempEffect + altitudeEffect;
    
    // Calculate trajectory shift
    const trajectoryShift = wind.crosswind * 2; // ~2 yards per mph crosswind
    
    // Calculate spin adjustment based on air density
    const densityRatio = conditions.density / STANDARD_DENSITY;
    const spinAdjustment = (densityRatio - 1) * -50; // Less spin in thinner air
    
    // Calculate launch angle adjustment
    const launchAngleAdjustment = wind.headwind * 0.1; // Slight adjustment for wind

    return {
      distanceAdjustment,
      trajectoryShift,
      spinAdjustment,
      launchAngleAdjustment
    };
  }

  static calculateAltitudeEffect(altitude) {
    // Simplified altitude effect
    return Math.min((altitude / 1000) * 5, 10); // Max 10% increase
  }
}

// Test function
function testConditions(conditions) {
  console.log('\n=== Testing Conditions ===');
  console.log('Input:', JSON.stringify(conditions, null, 2));

  // Test air density calculation
  const density = EnvironmentalCalculator.calculateAirDensity(conditions);
  console.log('\nAir Density:', density.toFixed(3), 'kg/m³');

  // Test wind effects
  const windEffect = EnvironmentalCalculator.calculateWindEffect(
    conditions.windSpeed,
    conditions.windDirection,
    0 // shot direction
  );
  console.log('\nWind Effects:');
  console.log('- Headwind:', windEffect.headwind.toFixed(1), 'mph');
  console.log('- Crosswind:', windEffect.crosswind.toFixed(1), 'mph');

  // Test shot adjustments
  const adjustments = EnvironmentalCalculator.calculateShotAdjustments(conditions);
  console.log('\nShot Adjustments:');
  console.log('- Distance:', adjustments.distanceAdjustment.toFixed(1), '%');
  console.log('- Trajectory:', adjustments.trajectoryShift.toFixed(1), 'yards');
  console.log('- Spin:', adjustments.spinAdjustment.toFixed(1), '%');
  console.log('- Launch Angle:', adjustments.launchAngleAdjustment.toFixed(1), 'degrees');

  // Test altitude effect
  const altEffect = EnvironmentalCalculator.calculateAltitudeEffect(conditions.altitude);
  console.log('\nAltitude Effect:', altEffect.toFixed(1), '%');
}

// Test Case 1: Sea Level Standard Conditions
console.log('\n=== Test Case 1: Sea Level Standard Conditions ===');
testConditions({
  temperature: 70,    // °F
  pressure: 1013.25,  // hPa
  altitude: 0,        // feet
  humidity: 50,       // %
  windSpeed: 0,       // mph
  windDirection: 0,   // degrees
  density: 1.225      // kg/m³
});

// Test Case 2: High Altitude Conditions
console.log('\n=== Test Case 2: High Altitude Conditions ===');
testConditions({
  temperature: 60,    // °F
  pressure: 850,      // hPa
  altitude: 5000,     // feet
  humidity: 30,       // %
  windSpeed: 10,      // mph
  windDirection: 90,  // degrees
  density: 1.0        // kg/m³
});

// Test Case 3: Hot Day with Strong Wind
console.log('\n=== Test Case 3: Hot Day with Strong Wind ===');
testConditions({
  temperature: 95,    // °F
  pressure: 1013.25,  // hPa
  altitude: 100,      // feet
  humidity: 70,       // %
  windSpeed: 15,      // mph
  windDirection: 45,  // degrees
  density: 1.18       // kg/m³
});

// Run with: node test-calculations.js