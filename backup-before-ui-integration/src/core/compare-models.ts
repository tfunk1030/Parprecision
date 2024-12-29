import { SimplifiedShotModel } from './simplified-shot-model';
import { Environment, BallProperties } from './types';

// Create test cases
const testCases = [
    {
        name: 'Standard Conditions',
        env: {
            temperature: 70,    // 70°F
            pressure: 29.92,    // Standard pressure
            altitude: 0,        // Sea level
            humidity: 50,       // 50%
            wind: { x: 0, y: 0, z: 0 }
        },
        distance: 150
    },
    {
        name: 'Hot Day',
        env: {
            temperature: 90,    // Hot
            pressure: 29.92,
            altitude: 0,
            humidity: 50,
            wind: { x: 0, y: 0, z: 0 }
        },
        distance: 150
    },
    {
        name: 'High Altitude',
        env: {
            temperature: 70,
            pressure: 29.92,
            altitude: 2000,     // 2000ft
            humidity: 50,
            wind: { x: 0, y: 0, z: 0 }
        },
        distance: 150
    }
];

// Standard ball properties
const standardBall: BallProperties = {
    mass: 0.0459,          // kg (typical golf ball)
    radius: 0.0213,        // m (1.68 inches)
    area: 0.00143,         // m² (cross-sectional)
    dragCoefficient: 0.47, // typical value
    liftCoefficient: 0.21, // typical value
    magnusCoefficient: 0.35, // typical value
    spinDecayRate: 0.98,   // typical value
    construction: "3-piece"  // standard golf ball
};

// Initialize simplified model
const simplifiedModel = new SimplifiedShotModel();

console.log('Simplified Model Analysis\n');
console.log('=========================\n');

// Run tests
testCases.forEach(test => {
    console.log(`\nTest Case: ${test.name}`);
    console.log('-------------------------');

    // Calculate adjusted distance
    const result = simplifiedModel.calculateAdjustedDistance(
        test.distance,
        test.env,
        standardBall
    );

    // Log results
    console.log('\nDistance Results:');
    console.log(`  Base Distance: ${test.distance} yards`);
    console.log(`  Adjusted Distance: ${result.adjustedDistance} yards`);
    
    console.log('\nEnvironmental Effects:');
    console.log(`  Temperature Effect: ${result.environmentalEffects.temperature}%`);
    console.log(`  Altitude Effect: ${result.environmentalEffects.altitude}%`);
    console.log(`  Density Effect: ${result.environmentalEffects.density}%`);
    console.log(`  Total Effect: ${result.environmentalEffects.total}%`);
});

// Wind effect analysis
const windTests = [
    { speed: 10, direction: 0, name: 'Pure Headwind' },
    { speed: 10, direction: 90, name: 'Pure Crosswind' },
    { speed: 10, direction: 45, name: 'Diagonal Wind' }
];

console.log('\nWind Effect Analysis\n');
console.log('=========================\n');

windTests.forEach(test => {
    console.log(`\nTest Case: ${test.name}`);
    console.log('-------------------------');

    const result = simplifiedModel.calculateWindEffect(
        test.speed,
        test.direction,
        0
    );

    console.log('\nWind Components:');
    console.log(`  Headwind: ${result.headwind.toFixed(1)} mph`);
    console.log(`  Crosswind: ${result.crosswind.toFixed(1)} mph`);
    console.log(`  Total Effect: ${result.totalEffect.toFixed(1)} yards`);

    // Calculate component percentages
    const totalWind = Math.abs(result.headwind) + Math.abs(result.crosswind);
    const headwindPercent = (Math.abs(result.headwind) / totalWind * 100).toFixed(1);
    const crosswindPercent = (Math.abs(result.crosswind) / totalWind * 100).toFixed(1);

    console.log('\nComponent Analysis:');
    console.log(`  Headwind Component: ${headwindPercent}%`);
    console.log(`  Crosswind Component: ${crosswindPercent}%`);
    console.log(`  Effect per mph: ${(result.totalEffect / test.speed).toFixed(2)} yards`);
});

// Performance test
console.log('\nPerformance Analysis\n');
console.log('=========================\n');

const iterations = 1000;
const start = performance.now();

for (let i = 0; i < iterations; i++) {
    simplifiedModel.calculateAdjustedDistance(150, testCases[0].env, standardBall);
    simplifiedModel.calculateWindEffect(10, 45, 0);
}

const end = performance.now();
const totalTime = end - start;
const averageTime = totalTime / (iterations * 2);

console.log(`Executed ${iterations} iterations of each calculation`);
console.log(`Total Time: ${totalTime.toFixed(2)}ms`);
console.log(`Average Time per Calculation: ${averageTime.toFixed(3)}ms`);

// This will help us understand the simplified model's behavior
// before comparing with the physics model