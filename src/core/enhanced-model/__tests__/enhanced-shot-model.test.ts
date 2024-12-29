import { EnhancedShotModel } from '../enhanced-shot-model';
import { Environment, BallProperties, Vector3D, SpinState } from '../types';

describe('Enhanced Shot Model Integration', () => {
    let model: EnhancedShotModel;

    // Standard test conditions
    const standardVelocity: Vector3D = { x: 70, y: 30, z: 0 }; // ~160mph launch
    const standardSpin: SpinState = {
        rate: 2500,
        axis: { x: 0, y: 1, z: 0 }  // Pure backspin
    };
    const standardBall: BallProperties = {
        mass: 0.0459,
        radius: 0.0214,
        area: Math.PI * 0.0214 * 0.0214,
        dragCoefficient: 0.225,
        liftCoefficient: 0.25,
        magnusCoefficient: 0.23,
        spinDecayRate: 0.15
    };
    const standardEnvironment: Environment = {
        temperature: 70,    // °F
        pressure: 29.92,    // inHg
        altitude: 0,        // feet
        humidity: 0.5,      // 50%
        wind: { x: 0, y: 0, z: 0 }
    };

    beforeEach(() => {
        model = new EnhancedShotModel();
    });

    test('should calculate reasonable shot trajectory', () => {
        const result = model.calculateShot(
            standardVelocity,
            standardSpin,
            standardBall,
            standardEnvironment
        );

        // Distance should be reasonable for driver shot
        expect(result.distance).toBeGreaterThan(230);
        expect(result.distance).toBeLessThan(350);

        // Height should be reasonable
        expect(result.height).toBeGreaterThan(20);
        expect(result.height).toBeLessThan(150);

        // Landing angle should be reasonable
        expect(result.landingAngle).toBeGreaterThan(30);
        expect(result.landingAngle).toBeLessThan(70);

        // Flight time should be reasonable
        expect(result.flightTime).toBeGreaterThan(3);
        expect(result.flightTime).toBeLessThan(8);

        // Spin should decay
        expect(result.spinRate).toBeLessThan(standardSpin.rate);

        // Trajectory should be smooth
        expect(result.trajectory.length).toBeGreaterThan(10);
        let prevHeight = 0;
        let peakFound = false;
        result.trajectory.forEach(point => {
            if (point.y > prevHeight) {
                prevHeight = point.y;
            } else {
                peakFound = true;
            }
            if (peakFound) {
                expect(point.y).toBeLessThanOrEqual(prevHeight);
            }
        });
    });

    test('should handle environmental effects', () => {
        // Standard conditions shot
        const standardResult = model.calculateShot(
            standardVelocity,
            standardSpin,
            standardBall,
            standardEnvironment
        );

        // High altitude conditions
        const highAltitudeResult = model.calculateShot(
            standardVelocity,
            standardSpin,
            standardBall,
            {
                ...standardEnvironment,
                altitude: 5000,
                pressure: 24.89
            }
        );

        // Ball should fly further at altitude
        expect(highAltitudeResult.distance).toBeGreaterThan(standardResult.distance);
        expect(highAltitudeResult.environmentalEffects.distanceEffect).toBeLessThan(0);

        // Headwind conditions
        const headwindResult = model.calculateShot(
            standardVelocity,
            standardSpin,
            standardBall,
            {
                ...standardEnvironment,
                wind: { x: -5, y: 0, z: 0 }
            }
        );

        // Ball should fly shorter into headwind
        expect(headwindResult.distance).toBeLessThan(standardResult.distance);
        expect(headwindResult.environmentalEffects.trajectoryEffect).toBeGreaterThan(0);
    });

    test('should use cache effectively', () => {
        // Initial cache should be empty
        const initialStats = model.getCacheStats();
        expect(initialStats.model).toBe(0);

        // Calculate shot
        const result1 = model.calculateShot(
            standardVelocity,
            standardSpin,
            standardBall,
            standardEnvironment
        );

        // Cache should now have entries
        const afterFirstStats = model.getCacheStats();
        expect(afterFirstStats.model).toBeGreaterThan(0);
        expect(afterFirstStats.force).toBeGreaterThan(0);
        expect(afterFirstStats.environmental).toBeGreaterThan(0);

        // Calculate same shot again
        const result2 = model.calculateShot(
            standardVelocity,
            standardSpin,
            standardBall,
            standardEnvironment
        );

        // Results should be identical (from cache)
        expect(result2).toEqual(result1);

        // Cache stats should be unchanged
        const finalStats = model.getCacheStats();
        expect(finalStats).toEqual(afterFirstStats);

        // Clear cache
        model.clearCache();
        expect(model.getCacheStats().model).toBe(0);
    });

    test('should handle extreme conditions gracefully', () => {
        // Zero velocity
        const zeroVelocityResult = model.calculateShot(
            { x: 0, y: 0, z: 0 },
            standardSpin,
            standardBall,
            standardEnvironment
        );
        expect(zeroVelocityResult.distance).toBe(0);
        expect(zeroVelocityResult.height).toBe(0);

        // Extreme spin
        const extremeSpinResult = model.calculateShot(
            standardVelocity,
            { ...standardSpin, rate: 10000 },
            standardBall,
            standardEnvironment
        );
        expect(extremeSpinResult.height).toBeGreaterThan(standardBall.radius * 1.0936);
        expect(extremeSpinResult.spinRate).toBeLessThan(10000);

        // Strong wind
        const strongWindResult = model.calculateShot(
            standardVelocity,
            standardSpin,
            standardBall,
            {
                ...standardEnvironment,
                wind: { x: 20, y: 0, z: 20 }
            }
        );
        expect(strongWindResult.recommendations.length).toBeGreaterThan(0);
        expect(strongWindResult.environmentalEffects.trajectoryEffect).toBeGreaterThan(10);
    });
});