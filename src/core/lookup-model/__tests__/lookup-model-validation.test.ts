import { LookupShotModel } from '../lookup-shot-model';
import { ShotParameters } from '../types';
import { CLUB_DATA } from '../club-data';

describe('Lookup Shot Model Validation', () => {
    let model: LookupShotModel;

    beforeEach(() => {
        model = new LookupShotModel();
    });

    describe('Accuracy Tests', () => {
        const testCases: { name: string; params: ShotParameters & { club: string } }[] = [
            {
                name: 'Driver - Standard Conditions',
                params: {
                    club: 'driver',
                    clubSpeed: 110,
                    launchAngle: 15,
                    spinRate: 2700,
                    spinAxis: { x: 0, y: 1, z: 0 },
                    temperature: 70,
                    pressure: 29.92,
                    altitude: 0,
                    humidity: 0.5,
                    windSpeed: 0,
                    windDirection: 0
                }
            },
            {
                name: 'Driver - High Altitude',
                params: {
                    club: 'driver',
                    clubSpeed: 110,
                    launchAngle: 15,
                    spinRate: 2700,
                    spinAxis: { x: 0, y: 1, z: 0 },
                    temperature: 70,
                    pressure: 24.89,
                    altitude: 5000,
                    humidity: 0.5,
                    windSpeed: 0,
                    windDirection: 0
                }
            },
            {
                name: '7-Iron - Standard Conditions',
                params: {
                    club: '7-iron',
                    clubSpeed: 85,
                    launchAngle: 20,
                    spinRate: 6500,
                    spinAxis: { x: 0, y: 1, z: 0 },
                    temperature: 70,
                    pressure: 29.92,
                    altitude: 0,
                    humidity: 0.5,
                    windSpeed: 0,
                    windDirection: 0
                }
            }
        ];

        test.each(testCases)('$name accuracy test', ({ params }) => {
            const result = model.calculateShot(params);
            const clubData = CLUB_DATA[params.club];

            // Distance should be within expected ranges
            if (params.club === 'driver') {
                expect(result.distance).toBeGreaterThan(250);
                expect(result.distance).toBeLessThan(320);
            } else if (params.club === '7-iron') {
                expect(result.distance).toBeGreaterThan(150);
                expect(result.distance).toBeLessThan(180);
            }

            // Height should be proportional to distance
            const expectedHeight = result.distance * clubData.heightRatio;
            expect(Math.abs(result.height - expectedHeight)).toBeLessThan(expectedHeight * 0.1);

            // Landing angle should be reasonable
            expect(result.landingAngle).toBeGreaterThan(clubData.launchAngle);
            expect(result.landingAngle).toBeLessThan(clubData.launchAngle * 1.5);

            // Flight time should be reasonable
            const expectedTime = result.distance / 50; // Rough estimate
            expect(Math.abs(result.flightTime - expectedTime)).toBeLessThan(expectedTime * 0.2);

            // Environmental effects should be present and reasonable
            expect(result.environmentalEffects).toBeDefined();
            if (params.altitude > 0) {
                const expectedDensityEffect = -2 * (params.altitude / 1000);
                expect(Math.abs(result.environmentalEffects.densityEffect - expectedDensityEffect))
                    .toBeLessThan(1);
            }
            if (params.temperature !== 70) {
                const expectedTempEffect = (params.temperature - 70) / 10;
                expect(Math.abs(result.environmentalEffects.temperatureEffect - expectedTempEffect))
                    .toBeLessThan(0.5);
            }
            if (params.windSpeed > 0) {
                expect(Math.abs(result.environmentalEffects.windEffect))
                    .toBeGreaterThan(0);
            }

            // Trajectory should be present and valid
            expect(result.trajectory.length).toBeGreaterThan(0);
            result.trajectory.forEach(point => {
                expect(point.position).toBeDefined();
                expect(point.velocity).toBeDefined();
                expect(point.spinRate).toBeDefined();
                expect(point.time).toBeDefined();

                // Spin should decay over time
                const initialSpin = result.trajectory[0].spinRate;
                expect(point.spinRate).toBeLessThanOrEqual(initialSpin);
            });
        });
    });

    describe('Performance Tests', () => {
        test('Calculation time should be sub-millisecond', () => {
            const params: ShotParameters & { club: string } = {
                club: 'driver',
                clubSpeed: 110,
                launchAngle: 15,
                spinRate: 2700,
                spinAxis: { x: 0, y: 1, z: 0 },
                temperature: 70,
                pressure: 29.92,
                altitude: 0,
                humidity: 0.5,
                windSpeed: 0,
                windDirection: 0
            };

            const iterations = 1000;
            const start = process.hrtime();

            for (let i = 0; i < iterations; i++) {
                model.calculateShot(params);
            }

            const [seconds, nanoseconds] = process.hrtime(start);
            const avgMs = (seconds * 1000 + nanoseconds / 1e6) / iterations;

            expect(avgMs).toBeLessThan(1); // Less than 1ms per calculation
        });

        test('Memory usage should be reasonable', () => {
            const stats = model.getStats();
            expect(stats.memoryUsage).toBeLessThan(50); // Less than 50MB
        });

        test('Cache should work effectively', () => {
            const params: ShotParameters & { club: string } = {
                club: 'driver',
                clubSpeed: 110,
                launchAngle: 15,
                spinRate: 2700,
                spinAxis: { x: 0, y: 1, z: 0 },
                temperature: 70,
                pressure: 29.92,
                altitude: 0,
                humidity: 0.5,
                windSpeed: 0,
                windDirection: 0
            };

            // First call should cache
            model.calculateShot(params);
            const stats1 = model.getStats();

            // Second call should use cache
            model.calculateShot(params);
            const stats2 = model.getStats();

            expect(stats2.cacheSize).toBe(stats1.cacheSize);
        });
    });

    describe('Edge Cases', () => {
        test('Should handle extreme conditions', () => {
            const params: ShotParameters & { club: string } = {
                club: 'driver',
                clubSpeed: 120, // Very fast
                launchAngle: 25, // High launch
                spinRate: 7000, // High spin
                spinAxis: { x: 0, y: 1, z: 0 },
                temperature: 100, // Very hot
                pressure: 24.89,
                altitude: 6000, // Very high
                humidity: 0.9, // Very humid
                windSpeed: 20, // Strong wind
                windDirection: 45
            };

            const result = model.calculateShot(params);
            expect(result).toBeDefined();
            expect(result.distance).toBeGreaterThan(0);
            expect(result.height).toBeGreaterThan(0);
            expect(Math.abs(result.environmentalEffects.densityEffect)).toBeGreaterThan(10);
            expect(Math.abs(result.environmentalEffects.temperatureEffect)).toBeGreaterThan(2);
            expect(Math.abs(result.environmentalEffects.windEffect)).toBeGreaterThan(20);
        });

        test('Should handle minimum values', () => {
            const params: ShotParameters & { club: string } = {
                club: '9-iron',
                clubSpeed: 60, // Very slow
                launchAngle: 5, // Low launch
                spinRate: 2000, // Low spin
                spinAxis: { x: 0, y: 1, z: 0 },
                temperature: 40, // Cold
                pressure: 29.92,
                altitude: 0,
                humidity: 0.1,
                windSpeed: 0,
                windDirection: 0
            };

            const result = model.calculateShot(params);
            expect(result).toBeDefined();
            expect(result.distance).toBeGreaterThan(0);
            expect(result.height).toBeGreaterThan(0);
            expect(result.environmentalEffects.temperatureEffect).toBeLessThan(0);
        });
    });
});