// Test script for environmental calculations
const { EnvironmentalCalculator } = require('../perfect-ui/parprecisionUI/lib/environmental-calculations');

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

// Run with: node test-env.js