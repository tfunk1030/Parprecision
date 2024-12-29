import { SimplifiedShotModel } from './simplified-shot-model';
import { FlightModel } from './flight-model';
import { Environment, BallProperties, Vector3D } from './types';

describe('Shot Model Comparison Tests', () => {
    const simplifiedModel = new SimplifiedShotModel();
    const physicsModel = new FlightModel();

    // Standard test conditions
    const standardBall: BallProperties = {
        mass: 0.0459,          // kg (typical golf ball)
        radius: 0.0213,        // m (1.68 inches)
        area: 0.00143,         // m² (cross-sectional)
        dragCoefficient: 0.47, // typical value
        liftCoefficient: 0.21, // typical value
        initialVelocity: 50,   // m/s (about 112 mph)
        launchAngle: 16        // degrees (mid trajectory)
    };

    describe('Distance Calculations', () => {
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

        testCases.forEach(testCase => {
            test(`Comparing models - ${testCase.name}`, () => {
                // Get simplified model result
                const simpleResult = simplifiedModel.calculateAdjustedDistance(
                    testCase.distance,
                    testCase.env,
                    standardBall
                );

                // Get physics model result
                const physicsResult = physicsModel.calculateShotDistance(
                    testCase.distance,
                    testCase.env,
                    standardBall
                );

                // Calculate difference percentage
                const difference = Math.abs(
                    (simpleResult.adjustedDistance - physicsResult.distance) / 
                    physicsResult.distance * 100
                );

                // Log results for analysis
                console.log(`${testCase.name} Results:`);
                console.log(`  Simple Model: ${simpleResult.adjustedDistance} yards`);
                console.log(`  Physics Model: ${physicsResult.distance} yards`);
                console.log(`  Difference: ${difference.toFixed(2)}%`);
                console.log(`  Environmental Effects (Simple):`);
                console.log(`    Temperature: ${simpleResult.environmentalEffects.temperature}%`);
                console.log(`    Altitude: ${simpleResult.environmentalEffects.altitude}%`);
                console.log(`    Total: ${simpleResult.environmentalEffects.total}%`);

                // Assert difference is within acceptable range
                expect(difference).toBeLessThan(5); // Expect less than 5% difference
            });
        });
    });

    describe('Wind Effect Calculations', () => {
        const windTests = [
            { speed: 10, direction: 0, name: 'Pure Headwind' },
            { speed: 10, direction: 90, name: 'Pure Crosswind' },
            { speed: 10, direction: 45, name: 'Diagonal Wind' }
        ];

        windTests.forEach(test => {
            it(`Comparing wind effects - ${test.name}`, () => {
                // Get simplified model result
                const simpleResult = simplifiedModel.calculateWindEffect(
                    test.speed,
                    test.direction,
                    0
                );

                // Get physics model result
                const physicsResult = physicsModel.calculateWindEffect(
                    test.speed,
                    test.direction,
                    0
                );

                // Calculate differences
                const headwindDiff = Math.abs(
                    (simpleResult.headwind - physicsResult.headwind) / 
                    physicsResult.headwind * 100
                );
                const crosswindDiff = Math.abs(
                    (simpleResult.crosswind - physicsResult.crosswind) / 
                    physicsResult.crosswind * 100
                );

                // Log results
                console.log(`${test.name} Results:`);
                console.log(`  Simple Model - Headwind: ${simpleResult.headwind}, Crosswind: ${simpleResult.crosswind}`);
                console.log(`  Physics Model - Headwind: ${physicsResult.headwind}, Crosswind: ${physicsResult.crosswind}`);
                console.log(`  Differences - Headwind: ${headwindDiff.toFixed(2)}%, Crosswind: ${crosswindDiff.toFixed(2)}%`);

                // Assert differences are within acceptable range
                expect(headwindDiff).toBeLessThan(10); // Expect less than 10% difference
                expect(crosswindDiff).toBeLessThan(10);
            });
        });
    });

    // Test execution time comparison
    test('Performance comparison', () => {
        const env: Environment = {
            temperature: 70,
            pressure: 29.92,
            altitude: 0,
            humidity: 50,
            wind: { x: 0, y: 0, z: 0 }
        };

        // Time simplified model
        const simpleStart = performance.now();
        for (let i = 0; i < 1000; i++) {
            simplifiedModel.calculateAdjustedDistance(150, env, standardBall);
        }
        const simpleEnd = performance.now();
        const simpleTime = simpleEnd - simpleStart;

        // Time physics model
        const physicsStart = performance.now();
        for (let i = 0; i < 1000; i++) {
            physicsModel.calculateShotDistance(150, env, standardBall);
        }
        const physicsEnd = performance.now();
        const physicsTime = physicsEnd - physicsStart;

        console.log('Performance Results (1000 calculations):');
        console.log(`  Simple Model: ${simpleTime.toFixed(2)}ms`);
        console.log(`  Physics Model: ${physicsTime.toFixed(2)}ms`);
        console.log(`  Speed Difference: ${(physicsTime/simpleTime).toFixed(1)}x`);

        // Assert simplified model meets performance target
        expect(simpleTime/1000).toBeLessThan(0.1); // Less than 0.1ms per calculation
    });
});