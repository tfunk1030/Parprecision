import { HybridShotModel } from './src/core/hybrid-shot-model';
import { EnvironmentalConditions, BallProperties } from './src/core/types';

const model = new HybridShotModel();

function runTest(name: string, environment: EnvironmentalConditions, ballProperties: BallProperties, shotDirection: number = 0) {
    console.log(`\n=== ${name} ===`);
    
    const result = model.calculateAdjustedDistance(200, environment, ballProperties);
    const adjustments = model.calculateShotAdjustments(200, environment, ballProperties, shotDirection);
    const clubRecommendations = model.getClubRecommendations(result.adjustedDistance, environment);

    console.log('Results:');
    console.log(`- Adjusted Distance: ${result.adjustedDistance} yards`);
    console.log('\nEnvironmental Effects:');
    console.log(`- Temperature Effect: ${result.environmentalEffects.temperature}%`);
    console.log(`- Trajectory Shift: ${adjustments.trajectoryShift} yards`);
    console.log(`- Spin Adjustment: ${adjustments.spinAdjustment}%`);
    console.log(`- Launch Angle Adjustment: ${adjustments.launchAngleAdjustment}°`);

    console.log('\nClub Recommendations:');
    console.log(`- Primary: ${clubRecommendations.primary}`);
    if (clubRecommendations.secondary) {
        console.log(`- Secondary: ${clubRecommendations.secondary}`);
    }
}

// Test 1: Hot Temperature (92°F)
runTest("Hot Temperature Test", {
    temperature: 92,
    pressure: 1013.25,
    altitude: 0,
    humidity: 0.65,
    density: 1.225,
    windSpeed: 0,
    windDirection: 0,
    wind: { speed: 0, direction: 0 }
}, {
    mass: 0.0459,
    radius: 0.0213,
    area: Math.PI * 0.0213 * 0.0213,
    dragCoefficient: 0.24,
    liftCoefficient: 0.15,
    magnusCoefficient: 0.35,
    spinDecayRate: 0.15,
    club: "5-iron",
    construction: "5-piece",
    spinRate: 5000,
    initialVelocity: 60.35,
    launchAngle: 12
});

// Test 2: Cold Temperature (50°F)
runTest("Cold Temperature Test", {
    temperature: 50,
    pressure: 1013.25,
    altitude: 0,
    humidity: 0.65,
    density: 1.225,
    windSpeed: 0,
    windDirection: 0,
    wind: { speed: 0, direction: 0 }
}, {
    mass: 0.0459,
    radius: 0.0213,
    area: Math.PI * 0.0213 * 0.0213,
    dragCoefficient: 0.24,
    liftCoefficient: 0.15,
    magnusCoefficient: 0.35,
    spinDecayRate: 0.15,
    club: "5-iron",
    construction: "5-piece",
    spinRate: 4000,
    initialVelocity: 60.35,
    launchAngle: 14
});

// Test 3: High Altitude (5000 feet)
runTest("High Altitude Test", {
    temperature: 72,
    pressure: 1013.25,
    altitude: 5000,
    humidity: 0.65,
    density: 1.225,
    windSpeed: 0,
    windDirection: 0,
    wind: { speed: 0, direction: 0 }
}, {
    mass: 0.0459,
    radius: 0.0213,
    area: Math.PI * 0.0213 * 0.0213,
    dragCoefficient: 0.24,
    liftCoefficient: 0.15,
    magnusCoefficient: 0.35,
    spinDecayRate: 0.15,
    club: "5-iron",
    construction: "5-piece",
    spinRate: 4000,
    initialVelocity: 60.35,
    launchAngle: 14
});

// Test 4: Headwind (10 mph)
runTest("Headwind Test", {
    temperature: 72,
    pressure: 1013.25,
    altitude: 0,
    humidity: 0.65,
    density: 1.225,
    windSpeed: 10,
    windDirection: 0,
    wind: { speed: 10, direction: 0 }
}, {
    mass: 0.0459,
    radius: 0.0213,
    area: Math.PI * 0.0213 * 0.0213,
    dragCoefficient: 0.24,
    liftCoefficient: 0.15,
    magnusCoefficient: 0.35,
    spinDecayRate: 0.15,
    club: "5-iron",
    construction: "5-piece",
    spinRate: 4000,
    initialVelocity: 60.35,
    launchAngle: 14
});

// Test 5: Angled Wind (45°)
runTest("Angled Wind Test", {
    temperature: 72,
    pressure: 1013.25,
    altitude: 0,
    humidity: 0.65,
    density: 1.225,
    windSpeed: 10,
    windDirection: 45,
    wind: { speed: 10, direction: 45 }
}, {
    mass: 0.0459,
    radius: 0.0213,
    area: Math.PI * 0.0213 * 0.0213,
    dragCoefficient: 0.24,
    liftCoefficient: 0.15,
    magnusCoefficient: 0.35,
    spinDecayRate: 0.15,
    club: "5-iron",
    construction: "5-piece",
    spinRate: 4000,
    initialVelocity: 60.35,
    launchAngle: 14
});

// Test 6: Combined Hot/Altitude/Crosswind
runTest("Combined Conditions Test", {
    temperature: 90,
    pressure: 1013.25,
    altitude: 500,
    humidity: 0.10,
    density: 1.225,
    windSpeed: 10,
    windDirection: 270,
    wind: { speed: 10, direction: 270 }
}, {
    mass: 0.0459,
    radius: 0.0213,
    area: Math.PI * 0.0213 * 0.0213,
    dragCoefficient: 0.24,
    liftCoefficient: 0.15,
    magnusCoefficient: 0.35,
    spinDecayRate: 0.15,
    club: "5-iron",
    construction: "5-piece",
    spinRate: 4000,
    initialVelocity: 60.35,
    launchAngle: 14
});