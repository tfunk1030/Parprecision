import { ForceCalculator } from '../force-calculator';
import { Vector3D, SpinState, BallProperties, Environment } from '../types';

describe('Force Calculator Integration', () => {
    let calculator: ForceCalculator;

    // Standard test conditions
    const standardVelocity: Vector3D = { x: 44.7, y: 0, z: 0 }; // 100mph
    const standardSpin: SpinState = {
        rate: 2500,
        axis: { x: 0, y: 1, z: 0 }
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
        calculator = new ForceCalculator();
    });

    test('should calculate combined forces correctly', () => {
        const forces = calculator.calculateForces(
            standardVelocity,
            standardSpin,
            standardBall,
            standardEnvironment
        );

        // Drag should be opposite to velocity
        expect(forces.drag.x).toBeLessThan(0);
        expect(Math.abs(forces.drag.y)).toBeLessThan(Math.abs(forces.drag.x));
        expect(Math.abs(forces.drag.z)).toBeLessThan(Math.abs(forces.drag.x));

        // Lift and Magnus should combine for upward force
        expect(forces.lift.y + forces.magnus.y).toBeGreaterThan(0);

        // Gravity should be constant
        expect(forces.gravity.y).toBeCloseTo(-9.81 * standardBall.mass);
    });

    test('should handle zero velocity case', () => {
        const forces = calculator.calculateForces(
            { x: 0, y: 0, z: 0 },
            standardSpin,
            standardBall,
            standardEnvironment
        );

        // Only gravity should be non-zero
        expect(forces.drag.x).toBe(0);
        expect(forces.drag.y).toBe(0);
        expect(forces.drag.z).toBe(0);
        expect(forces.lift.x).toBe(0);
        expect(forces.lift.y).toBe(0);
        expect(forces.lift.z).toBe(0);
        expect(forces.magnus.x).toBe(0);
        expect(forces.magnus.y).toBe(0);
        expect(forces.magnus.z).toBe(0);
        expect(forces.gravity.y).toBeLessThan(0);
    });

    test('should update spin correctly', () => {
        const deltaTime = 1.0; // 1 second
        const updatedSpin = calculator.updateSpin(
            standardSpin,
            standardVelocity,
            deltaTime
        );

        // Spin rate should decrease
        expect(updatedSpin.rate).toBeLessThan(standardSpin.rate);

        // Axis should remain normalized
        const axisMagnitude = Math.sqrt(
            updatedSpin.axis.x * updatedSpin.axis.x +
            updatedSpin.axis.y * updatedSpin.axis.y +
            updatedSpin.axis.z * updatedSpin.axis.z
        );
        expect(axisMagnitude).toBeCloseTo(1, 5);
    });

    test('should handle different environmental conditions', () => {
        // High altitude environment
        const highAltitude: Environment = {
            ...standardEnvironment,
            altitude: 5000,
            pressure: 24.89 // Standard pressure at 5000ft
        };

        const seaLevelForces = calculator.calculateForces(
            standardVelocity,
            standardSpin,
            standardBall,
            standardEnvironment
        );

        const altitudeForces = calculator.calculateForces(
            standardVelocity,
            standardSpin,
            standardBall,
            highAltitude
        );

        // Forces should be lower at altitude due to lower air density
        expect(Math.abs(altitudeForces.drag.x)).toBeLessThan(Math.abs(seaLevelForces.drag.x));
        expect(Math.abs(altitudeForces.lift.y)).toBeLessThan(Math.abs(seaLevelForces.lift.y));
        expect(Math.abs(altitudeForces.magnus.y)).toBeLessThan(Math.abs(seaLevelForces.magnus.y));
    });

    test('should handle wind conditions', () => {
        const windEnvironment: Environment = {
            ...standardEnvironment,
            wind: { x: 5, y: 0, z: 0 } // 5 m/s headwind
        };

        const noWindForces = calculator.calculateForces(
            standardVelocity,
            standardSpin,
            standardBall,
            standardEnvironment
        );

        const windForces = calculator.calculateForces(
            standardVelocity,
            standardSpin,
            standardBall,
            windEnvironment
        );

        // Drag should be higher with headwind
        expect(Math.abs(windForces.drag.x)).toBeGreaterThan(Math.abs(noWindForces.drag.x));
    });

    test('should maintain cache efficiency', () => {
        // Initial cache should be empty
        expect(calculator.getCacheSize()).toBe(0);

        // Calculate forces multiple times with same conditions
        calculator.calculateForces(
            standardVelocity,
            standardSpin,
            standardBall,
            standardEnvironment
        );

        calculator.calculateForces(
            standardVelocity,
            standardSpin,
            standardBall,
            standardEnvironment
        );

        // Cache should now contain entries
        expect(calculator.getCacheSize()).toBeGreaterThan(0);

        // Clear cache
        calculator.clearCache();
        expect(calculator.getCacheSize()).toBe(0);
    });
});