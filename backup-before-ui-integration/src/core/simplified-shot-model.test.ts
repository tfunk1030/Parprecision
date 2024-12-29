import { SimplifiedShotModel } from './simplified-shot-model';
import { Environment, BallProperties } from './types';

describe('SimplifiedShotModel', () => {
    const model = new SimplifiedShotModel();

    // Standard ball properties
    const standardBall: BallProperties = {
        mass: 0.0459,          // kg (typical golf ball)
        radius: 0.0213,        // m (1.68 inches)
        area: 0.00143,         // m² (cross-sectional)
        dragCoefficient: 0.47, // typical value
        liftCoefficient: 0.21, // typical value
        spinRate: 2500,        // rpm (mid iron)
        initialVelocity: 50,   // m/s (about 112 mph)
        launchAngle: 16        // degrees (mid trajectory)
    };

    describe('calculateAdjustedDistance', () => {
        // Test standard conditions (baseline)
        test('standard conditions should have minimal adjustment', () => {
            const env: Environment = {
                temperature: 70,    // 70°F (standard temp)
                pressure: 29.92,    // Standard pressure (inHg)
                altitude: 0,        // Sea level
                humidity: 50,       // 50% humidity
                wind: {
                    speed: 0,
                    direction: 0
                }
            };
            
            const result = model.calculateAdjustedDistance(150, env, standardBall);
            expect(result.adjustedDistance).toBe(150); // Should be minimal change
            expect(result.environmentalEffects.total).toBe(0); // No effect
        });

        // Test hot conditions
        test('hot conditions should decrease distance', () => {
            const env: Environment = {
                temperature: 90,    // Hot day
                pressure: 29.92,
                altitude: 0,
                humidity: 50,
                wind: {
                    speed: 0,
                    direction: 0
                }
            };
            
            const result = model.calculateAdjustedDistance(150, env, standardBall);
            // Expect ~3% change per 20°F from 70°F
            expect(result.environmentalEffects.temperature).toBe(3);
        });

        // Test high altitude
        test('high altitude should increase distance', () => {
            const env: Environment = {
                temperature: 70,
                pressure: 29.92,
                altitude: 2000,     // 2000ft elevation
                humidity: 50,
                wind: {
                    speed: 0,
                    direction: 0
                }
            };
            
            const result = model.calculateAdjustedDistance(150, env, standardBall);
            // Expect ~10% increase (5% per 1000ft)
            expect(result.environmentalEffects.altitude).toBe(10);
        });
    });

    describe('calculateWindEffect', () => {
        // Test pure headwind
        test('pure headwind should reduce distance', () => {
            const result = model.calculateWindEffect(10, 0, 0);
            expect(result.headwind).toBe(10);
            expect(result.crosswind).toBe(0);
            expect(result.totalEffect).toBe(15); // 1.5 yards per mph
        });

        // Test pure crosswind
        test('pure crosswind should affect less than headwind', () => {
            const result = model.calculateWindEffect(10, 90, 0);
            expect(Math.abs(result.headwind)).toBeLessThan(0.1);
            expect(Math.abs(result.crosswind)).toBe(10);
            expect(result.totalEffect).toBe(10); // 1 yard per mph
        });

        // Test diagonal wind
        test('45-degree wind should have equal head and cross components', () => {
            const result = model.calculateWindEffect(10, 45, 0);
            expect(Math.abs(result.headwind)).toBeCloseTo(7.1, 1);
            expect(Math.abs(result.crosswind)).toBeCloseTo(7.1, 1);
            // Total effect: (7.1 * 1.5) + 7.1 ≈ 17.75
            expect(result.totalEffect).toBeCloseTo(18, 0);
        });
    });

    describe('getClubRecommendations', () => {
        test('short distance should recommend wedge', () => {
            const result = model.getClubRecommendations(90);
            expect(result.primary).toBe('PW');
            expect(result.secondary).toBe('9i');
        });

        test('medium distance should recommend mid iron', () => {
            const result = model.getClubRecommendations(150);
            expect(result.primary).toBe('6i');
            expect(result.secondary).toBe('5i');
        });

        test('long distance should recommend driver', () => {
            const result = model.getClubRecommendations(250);
            expect(result.primary).toBe('Driver');
            expect(result.secondary).toBeUndefined();
        });
    });

    // Test combined effects
    test('combined environmental and wind effects', () => {
        const env: Environment = {
            temperature: 90,   // Hot (+3%)
            pressure: 29.92,
            altitude: 1000,    // +5% effect
            humidity: 50,
            wind: {
                speed: 0,
                direction: 0
            }
        };
        
        // First calculate environmental adjustment
        const envResult = model.calculateAdjustedDistance(150, env, standardBall);
        
        // Then calculate wind effect
        const windResult = model.calculateWindEffect(10, 45, 0);
        
        // Verify combined effects are reasonable
        expect(envResult.environmentalEffects.total).toBeGreaterThan(0);
        expect(windResult.totalEffect).toBeGreaterThan(0);
        
        // Log results for analysis
        console.log('Environmental adjustment:', envResult);
        console.log('Wind effect:', windResult);
    });
});