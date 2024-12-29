import { AerodynamicsCalculator } from '../aerodynamics-calculator';
import { LookupSystem } from '../lookup-system';
import { Vector3D, SpinState, BallProperties } from '../types';

describe('Enhanced Model Aerodynamics', () => {
    let aerodynamics: AerodynamicsCalculator;
    let lookup: LookupSystem;

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
    const standardAirDensity = 1.225; // kg/m³

    beforeEach(() => {
        aerodynamics = new AerodynamicsCalculator();
        lookup = new LookupSystem();
    });

    test('should calculate correct drag force at standard conditions', () => {
        const forces = aerodynamics.calculateForces(
            standardVelocity,
            standardSpin,
            standardBall,
            standardAirDensity
        );

        // Drag force should be opposite to velocity
        expect(forces.drag.x).toBeLessThan(0);
        expect(Math.abs(forces.drag.y)).toBeLessThan(0.01);
        expect(Math.abs(forces.drag.z)).toBeLessThan(0.01);
    });

    test('should calculate correct lift force with spin', () => {
        const forces = aerodynamics.calculateForces(
            standardVelocity,
            standardSpin,
            standardBall,
            standardAirDensity
        );

        // Lift force should be primarily vertical with backspin
        expect(Math.abs(forces.lift.x)).toBeLessThan(Math.abs(forces.lift.y));
        expect(forces.lift.y).toBeGreaterThan(0);
        expect(Math.abs(forces.lift.z)).toBeLessThan(Math.abs(forces.lift.y));
    });

    test('should handle zero velocity case', () => {
        const zeroVelocity: Vector3D = { x: 0, y: 0, z: 0 };
        const forces = aerodynamics.calculateForces(
            zeroVelocity,
            standardSpin,
            standardBall,
            standardAirDensity
        );

        // Only gravity should be non-zero
        expect(forces.drag.x).toBe(0);
        expect(forces.drag.y).toBe(0);
        expect(forces.drag.z).toBe(0);
        expect(forces.lift.x).toBe(0);
        expect(forces.lift.y).toBe(0);
        expect(forces.lift.z).toBe(0);
        expect(forces.gravity.y).toBeLessThan(0);
    });

    test('lookup system should cache and interpolate values', () => {
        // Get coefficient twice - second should be cached
        const reynolds = 130000;
        const dragCoeff1 = lookup.getDragCoefficient(reynolds);
        const dragCoeff2 = lookup.getDragCoefficient(reynolds);

        expect(dragCoeff1).toBe(dragCoeff2);
        expect(lookup.isCached('drag', reynolds)).toBe(true);
    });

    test('lookup system should handle edge cases', () => {
        // Test very low Reynolds number
        const lowReynolds = 50000;
        const dragCoeff = lookup.getDragCoefficient(lowReynolds);
        expect(dragCoeff).toBeGreaterThan(0.2);
        expect(dragCoeff).toBeLessThan(0.3);

        // Test very high Reynolds number
        const highReynolds = 200000;
        const highDragCoeff = lookup.getDragCoefficient(highReynolds);
        expect(highDragCoeff).toBeGreaterThan(0.1);
        expect(highDragCoeff).toBeLessThan(0.25);
    });

    test('forces should scale correctly with velocity', () => {
        const baseForces = aerodynamics.calculateForces(
            standardVelocity,
            standardSpin,
            standardBall,
            standardAirDensity
        );

        const doubleVelocity: Vector3D = {
            x: standardVelocity.x * 2,
            y: standardVelocity.y * 2,
            z: standardVelocity.z * 2
        };

        const doubleForces = aerodynamics.calculateForces(
            doubleVelocity,
            standardSpin,
            standardBall,
            standardAirDensity
        );

        // Forces should scale with velocity squared
        expect(Math.abs(doubleForces.drag.x)).toBeGreaterThan(Math.abs(baseForces.drag.x) * 3.5);
        expect(Math.abs(doubleForces.drag.x)).toBeLessThan(Math.abs(baseForces.drag.x) * 4.5);
    });
});