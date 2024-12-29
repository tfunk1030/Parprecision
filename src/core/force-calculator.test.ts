import { ForceCalculator } from './force-calculator';
import { BallProperties } from './types';

describe('ForceCalculator', () => {
    const calculator = new ForceCalculator();

    // Standard ball properties for testing
    const standardBall: BallProperties = {
        mass: 0.0459,          // kg (typical golf ball)
        radius: 0.0213,        // m (1.68 inches)
        area: 0.00143,         // m² (cross-sectional)
        dragCoefficient: 0.47, // typical value
        liftCoefficient: 0.21, // typical value
        magnusCoefficient: 0.21, // typical value
        spinDecayRate: 0.98,   // typical value
        spinRate: 2500,        // rpm (mid iron)
        initialVelocity: 50,   // m/s (about 112 mph)
        launchAngle: 16,       // degrees (mid trajectory)
        construction: "3-piece"
    };

    describe('calculateForces', () => {
        test('should calculate forces at sea level', () => {
            const forces = calculator.calculateForces(50, 0, standardBall);
            
            // Verify drag force
            expect(forces.drag).toBeGreaterThan(0);
            expect(forces.drag).toBeLessThan(10); // Reasonable range for golf ball

            // Verify lift force
            expect(forces.lift).toBeGreaterThan(0);
            expect(forces.lift).toBeLessThan(5); // Reasonable range for golf ball

            // Verify magnus force
            expect(forces.magnus).toBeGreaterThan(0);
            expect(forces.magnus).toBeLessThan(3); // Reasonable range for golf ball
        });

        test('should reduce forces at higher altitude', () => {
            const seaLevelForces = calculator.calculateForces(50, 0, standardBall);
            const highAltitudeForces = calculator.calculateForces(50, 1000, standardBall);

            // Forces should be lower at higher altitude
            expect(highAltitudeForces.drag).toBeLessThan(seaLevelForces.drag);
            expect(highAltitudeForces.lift).toBeLessThan(seaLevelForces.lift);
            expect(highAltitudeForces.magnus).toBeLessThan(seaLevelForces.magnus);
        });

        test('should scale forces with velocity squared', () => {
            const forces1 = calculator.calculateForces(50, 0, standardBall);
            const forces2 = calculator.calculateForces(100, 0, standardBall);

            // Forces should scale approximately with v²
            const expectedRatio = (100 * 100) / (50 * 50); // = 4
            const dragRatio = forces2.drag / forces1.drag;
            const liftRatio = forces2.lift / forces1.lift;

            expect(dragRatio).toBeCloseTo(expectedRatio, 1);
            expect(liftRatio).toBeCloseTo(expectedRatio, 1);
        });
    });

    describe('calculateTotalForce', () => {
        test('should include gravity', () => {
            const force = calculator.calculateTotalForce(50, 0, standardBall, 0);
            const expectedGravity = -standardBall.mass * 9.81;

            // Vertical component should include gravity
            expect(force.y).toBeLessThan(0); // Should be negative due to gravity
            expect(force.y - expectedGravity).toBeCloseTo(0, 1); // Other forces small at 0 angle
        });

        test('should have correct force directions', () => {
            // Test horizontal shot
            const horizontalForce = calculator.calculateTotalForce(50, 0, standardBall, 0);
            expect(horizontalForce.x).toBeLessThan(0); // Drag should be negative
            expect(Math.abs(horizontalForce.y + standardBall.mass * 9.81)).toBeLessThan(1); // Mostly gravity

            // Test 45-degree shot
            const angledForce = calculator.calculateTotalForce(50, 0, standardBall, 45);
            expect(angledForce.x).toBeLessThan(0); // Drag should be negative
            expect(angledForce.y).toBeLessThan(0); // Should include gravity
            expect(angledForce.z).not.toBe(0); // Should have magnus effect
        });

        test('should scale with spin rate', () => {
            const lowSpinBall = { ...standardBall, spinRate: 2000 };
            const highSpinBall = { ...standardBall, spinRate: 4000 };

            const lowSpinForce = calculator.calculateTotalForce(50, 0, lowSpinBall, 0);
            const highSpinForce = calculator.calculateTotalForce(50, 0, highSpinBall, 0);

            // Magnus effect should be stronger with higher spin
            expect(Math.abs(highSpinForce.z)).toBeGreaterThan(Math.abs(lowSpinForce.z));
        });
    });

    describe('cache behavior', () => {
        test('should use cache for repeated calculations', () => {
            // First calculation
            const force1 = calculator.calculateForces(50, 0, standardBall);
            
            // Second calculation with same parameters
            const force2 = calculator.calculateForces(50, 0, standardBall);

            // Results should be exactly equal (from cache)
            expect(force1).toEqual(force2);

            // Clear cache
            calculator.clearCache();

            // Third calculation after cache clear
            const force3 = calculator.calculateForces(50, 0, standardBall);

            // Results should still be equal but not from cache
            expect(force1).toEqual(force3);
        });
    });
});