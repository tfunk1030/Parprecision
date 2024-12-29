const { HybridShotModel } = require('./dist/core/hybrid-shot-model');
const { SimplifiedShotModel } = require('./dist/core/legacy/simplified-shot-model');

// Test specific conditions
const testConditions = {
    temperature: 90,
    pressure: 29.92, // standard pressure
    altitude: 5000,
    humidity: 0.5,   // 50%
    density: 1.225,  // standard density
    windSpeed: 0,
    windDirection: 0
};

const standardBall = {
    mass: 0.0459,
    radius: 0.0213,
    area: Math.PI * 0.0213 * 0.0213,
    dragCoefficient: 0.24,
    liftCoefficient: 0.15,
    magnusCoefficient: 0.35,
    spinDecayRate: 0.15,
    construction: "5-piece",
    spinRate: 5000,
    initialVelocity: 60.35,
    launchAngle: 12,
    club: '5-iron'
};

// Initialize both models
const legacyModel = new SimplifiedShotModel();
const hybridModel = new HybridShotModel();

// Test distance: 200 yards
const targetDistance = 200;

// Calculate with legacy model
console.log('\nLegacy Model Results:');
console.log('====================');
const legacyResult = legacyModel.calculateAdjustedDistance(
    targetDistance,
    testConditions,
    standardBall
);
const legacyAdjustments = legacyModel.calculateShotAdjustments(
    targetDistance,
    testConditions,
    standardBall
);

console.log('\nEnvironmental Effects:');
console.log(`- Temperature Effect: ${legacyResult.environmentalEffects.temperature}%`);
console.log(`- Altitude Effect: ${legacyResult.environmentalEffects.altitude}%`);
console.log(`- Total Effect: ${legacyResult.environmentalEffects.total}%`);
console.log(`\nAdjusted Distance: ${legacyResult.adjustedDistance} yards`);
console.log(`Launch Angle Adjustment: ${legacyAdjustments.launchAngleAdjustment}°`);
console.log(`Spin Adjustment: ${legacyAdjustments.spinAdjustment}%`);

// Calculate with hybrid model
console.log('\nHybrid Model Results:');
console.log('====================');
const hybridResult = hybridModel.calculateAdjustedDistance(
    targetDistance,
    testConditions,
    standardBall
);
const hybridAdjustments = hybridModel.calculateShotAdjustments(
    targetDistance,
    testConditions,
    standardBall
);

console.log('\nEnvironmental Effects:');
console.log(`- Temperature Effect: ${hybridResult.environmentalEffects.temperature}%`);
console.log(`- Altitude Effect: ${hybridResult.environmentalEffects.altitude}%`);
console.log(`- Total Effect: ${hybridResult.environmentalEffects.total}%`);
console.log(`\nAdjusted Distance: ${hybridResult.adjustedDistance} yards`);
console.log(`Launch Angle Adjustment: ${hybridAdjustments.launchAngleAdjustment}°`);
console.log(`Spin Adjustment: ${hybridAdjustments.spinAdjustment}%`);

// Compare differences
console.log('\nModel Comparison:');
console.log('================');
console.log(`Distance Difference: ${Math.abs(hybridResult.adjustedDistance - legacyResult.adjustedDistance)} yards`);
console.log(`Total Effect Difference: ${Math.abs(hybridResult.environmentalEffects.total - legacyResult.environmentalEffects.total)}%`);
console.log(`Launch Angle Difference: ${Math.abs(hybridAdjustments.launchAngleAdjustment - legacyAdjustments.launchAngleAdjustment)}°`);
console.log(`Spin Adjustment Difference: ${Math.abs(hybridAdjustments.spinAdjustment - legacyAdjustments.spinAdjustment)}%`);