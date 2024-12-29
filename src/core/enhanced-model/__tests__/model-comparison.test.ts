import { EnhancedShotModel } from '../enhanced-shot-model';
import { Environment, BallProperties, Vector3D, SpinState } from '../types';

describe('Model Comparison Tests', () => {
    let model: EnhancedShotModel;

    // Test conditions matrix
    const velocities: Vector3D[] = [
        { x: 70, y: 30, z: 0 },   // Driver
        { x: 60, y: 25, z: 0 },   // 3-wood
        { x: 50, y: 20, z: 0 }    // 5-iron
    ];

    const spins: SpinState[] = [
        { rate: 2500, axis: { x: 0, y: 1, z: 0 } },    // Pure backspin
        { rate: 3000, axis: { x: 0.2, y: 0.8, z: 0 } } // Draw spin
    ];

    const environments: Environment[] = [
        {   // Sea level standard
            temperature: 70,
            pressure: 29.92,
            altitude: 0,
            humidity: 0.5,
            wind: { x: 0, y: 0, z: 0 }
        },
        {   // High altitude
            temperature: 70,
            pressure: 24.89,
            altitude: 5000,
            humidity: 0.5,
            wind: { x: 0, y: 0, z: 0 }
        },
        {   // Hot with wind
            temperature: 90,
            pressure: 29.92,
            altitude: 0,
            humidity: 0.7,
            wind: { x: 5, y: 0, z: 5 }
        }
    ];

    const standardBall: BallProperties = {
        mass: 0.0459,
        radius: 0.0214,
        area: Math.PI * 0.0214 * 0.0214,
        dragCoefficient: 0.225,
        liftCoefficient: 0.25,
        magnusCoefficient: 0.23,
        spinDecayRate: 0.15
    };

    // Expected ranges from advanced model analysis
    const expectedRanges = {
        driver: {
            distance: { min: 230, max: 330 },
            height: { min: 20, max: 45 },
            landingAngle: { min: 35, max: 65 }
        },
        threeWood: {
            distance: { min: 200, max: 280 },
            height: { min: 18, max: 40 },
            landingAngle: { min: 38, max: 68 }
        },
        fiveIron: {
            distance: { min: 170, max: 230 },
            height: { min: 15, max: 35 },
            landingAngle: { min: 42, max: 72 }
        }
    };

    beforeEach(() => {
        model = new EnhancedShotModel();
    });

    test('should match advanced model distance ranges', () => {
        velocities.forEach((velocity, idx) => {
            spins.forEach(spin => {
                environments.forEach(env => {
                    const result = model.calculateShot(
                        velocity,
                        spin,
                        standardBall,
                        env
                    );

                    // Get expected range based on club (velocity)
                    const range = idx === 0 ? expectedRanges.driver :
                                idx === 1 ? expectedRanges.threeWood :
                                expectedRanges.fiveIron;

                    // Verify distance is within expected range
                    expect(result.distance).toBeGreaterThanOrEqual(range.distance.min);
                    expect(result.distance).toBeLessThanOrEqual(range.distance.max);

                    // Verify height is within expected range
                    expect(result.height).toBeGreaterThanOrEqual(range.height.min);
                    expect(result.height).toBeLessThanOrEqual(range.height.max);

                    // Verify landing angle is within expected range
                    expect(result.landingAngle).toBeGreaterThanOrEqual(range.landingAngle.min);
                    expect(result.landingAngle).toBeLessThanOrEqual(range.landingAngle.max);
                });
            });
        });
    });

    test('should match advanced model environmental effects', () => {
        // Test altitude effect
        const seaLevelShot = model.calculateShot(
            velocities[0],
            spins[0],
            standardBall,
            environments[0]
        );

        const altitudeShot = model.calculateShot(
            velocities[0],
            spins[0],
            standardBall,
            environments[1]
        );

        // Altitude should increase distance by 5-15%
        const altitudeEffect = (altitudeShot.distance - seaLevelShot.distance) / seaLevelShot.distance;
        expect(altitudeEffect).toBeGreaterThan(0.05);
        expect(altitudeEffect).toBeLessThan(0.15);

        // Test temperature effect
        const hotShot = model.calculateShot(
            velocities[0],
            spins[0],
            standardBall,
            environments[2]
        );

        // Hot conditions should affect distance by -2% to +2%
        const tempEffect = (hotShot.distance - seaLevelShot.distance) / seaLevelShot.distance;
        expect(Math.abs(tempEffect)).toBeLessThan(0.02);
    });

    test('should match advanced model spin effects', () => {
        spins.forEach(spin => {
            const result = model.calculateShot(
                velocities[0],
                spin,
                standardBall,
                environments[0]
            );

            // Spin should decay by 30-70% over flight
            const spinDecay = (spin.rate - result.spinRate) / spin.rate;
            expect(spinDecay).toBeGreaterThan(0.3);
            expect(spinDecay).toBeLessThan(0.7);

            // Higher spin should result in higher trajectory
            if (spin.rate > 2700) {
                expect(result.height).toBeGreaterThan(30);
            }
        });
    });

    test('should match advanced model trajectory shape', () => {
        const result = model.calculateShot(
            velocities[0],
            spins[0],
            standardBall,
            environments[0]
        );

        // Verify trajectory points increase then decrease in height
        let maxHeight = 0;
        let maxHeightFound = false;
        let lastHeight = 0;

        result.trajectory.forEach((point, idx) => {
            if (idx > 0) {
                if (!maxHeightFound) {
                    if (point.y < lastHeight) {
                        maxHeightFound = true;
                        maxHeight = lastHeight;
                    }
                } else {
                    // After peak, height should continuously decrease
                    expect(point.y).toBeLessThan(lastHeight);
                }
            }
            lastHeight = point.y;
        });

        // Peak should occur between 40-60% of total distance
        const peakIndex = result.trajectory.findIndex(p => p.y === maxHeight);
        const peakDistance = result.trajectory[peakIndex].x;
        const peakRatio = peakDistance / result.distance;
        expect(peakRatio).toBeGreaterThan(0.4);
        expect(peakRatio).toBeLessThan(0.6);
    });
});