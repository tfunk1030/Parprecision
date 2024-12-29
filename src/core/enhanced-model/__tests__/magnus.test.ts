import { MagnusCalculator } from '../magnus-calculator';
import { Vector3D, SpinState } from '../types';

describe('Magnus Effect Calculations', () => {
    let magnus: MagnusCalculator;

    // Standard test conditions
    const standardVelocity: Vector3D = { x: 44.7, y: 0, z: 0 }; // 100mph
    const standardSpin: SpinState = {
        rate: 2500,
        axis: { x: 0, y: 1, z: 0 }
    };
    const standardAirDensity = 1.225; // kg/m³
    const standardArea = Math.PI * 0.0214 * 0.0214; // m²
    const standardRadius = 0.0214; // m

    beforeEach(() => {
        magnus = new MagnusCalculator();
    });

    test('should calculate correct Magnus force direction', () => {
        const force = magnus.calculateMagnusForce(
            standardVelocity,
            standardSpin,
            standardAirDensity,
            standardArea,
            standardRadius
        );

        // With backspin (y-axis), force should be primarily upward
        expect(Math.abs(force.x)).toBeLessThan(Math.abs(force.y));
        expect(force.y).toBeGreaterThan(0);
        expect(Math.abs(force.z)).toBeLessThan(Math.abs(force.y));
    });

    test('should handle zero velocity case', () => {
        const force = magnus.calculateMagnusForce(
            { x: 0, y: 0, z: 0 },
            standardSpin,
            standardAirDensity,
            standardArea,
            standardRadius
        );

        expect(force.x).toBe(0);
        expect(force.y).toBe(0);
        expect(force.z).toBe(0);
    });

    test('should scale with spin rate', () => {
        const baseForce = magnus.calculateMagnusForce(
            standardVelocity,
            standardSpin,
            standardAirDensity,
            standardArea,
            standardRadius
        );

        const doubleSpin: SpinState = {
            rate: standardSpin.rate * 2,
            axis: standardSpin.axis
        };

        const doubleForce = magnus.calculateMagnusForce(
            standardVelocity,
            doubleSpin,
            standardAirDensity,
            standardArea,
            standardRadius
        );

        // Force should scale with spin rate (but not necessarily linearly due to saturation)
        expect(Math.abs(doubleForce.y)).toBeGreaterThan(Math.abs(baseForce.y));
    });

    test('should calculate correct spin decay', () => {
        const initialSpin = 2500;
        const time = 1.0; // 1 second
        const speed = 44.7; // 100mph

        const decayedSpin = magnus.calculateSpinDecay(initialSpin, time, speed);

        // Spin should decrease
        expect(decayedSpin).toBeLessThan(initialSpin);
        // But not too much in just 1 second
        expect(decayedSpin).toBeGreaterThan(initialSpin * 0.7);
    });

    test('should update spin axis correctly', () => {
        const initialAxis: Vector3D = { x: 1, y: 0, z: 0 };
        const deltaTime = 0.5; // 0.5 seconds
        const speed = 44.7; // 100mph

        const newAxis = magnus.updateSpinAxis(initialAxis, deltaTime, speed);

        // Axis should remain normalized
        const magnitude = Math.sqrt(
            newAxis.x * newAxis.x +
            newAxis.y * newAxis.y +
            newAxis.z * newAxis.z
        );
        expect(magnitude).toBeCloseTo(1, 5);

        // Should have some vertical component due to bias
        expect(newAxis.y).toBeGreaterThan(0);
    });

    test('should respect maximum spin effect', () => {
        const highSpin: SpinState = {
            rate: 10000, // Very high spin rate
            axis: standardSpin.axis
        };

        const force = magnus.calculateMagnusForce(
            standardVelocity,
            highSpin,
            standardAirDensity,
            standardArea,
            standardRadius
        );

        const normalForce = magnus.calculateMagnusForce(
            standardVelocity,
            standardSpin,
            standardAirDensity,
            standardArea,
            standardRadius
        );

        // Force should be higher but not proportionally (due to saturation)
        expect(Math.abs(force.y)).toBeGreaterThan(Math.abs(normalForce.y));
        expect(Math.abs(force.y)).toBeLessThan(Math.abs(normalForce.y) * 4);
    });
});