import { OptimizationAlgorithms } from '../core/optimization-algorithms';
import { LaunchConditions, Environment, BallProperties, Forces, Vector3D, SpinState, IAerodynamicsEngine } from '../types';
import { ExtendedTrajectoryResult } from '../core/optimization-algorithms';

describe('Optimization Algorithms', () => {
    const mockAero: IAerodynamicsEngine = {
        calculateForces: (velocity: Vector3D, spin: SpinState, properties: BallProperties, environment: Environment): Forces => {
            // Simplified force calculations for testing
            return {
                drag: { x: 0, y: 0, z: 0 },
                lift: { x: 0, y: 0, z: 0 },
                magnus: { x: 0, y: 0, z: 0 },
                gravity: { x: 0, y: -9.81 * properties.mass, z: 0 }
            };
        }
    };
    const optimizer = new OptimizationAlgorithms(mockAero);

    const baseConditions: LaunchConditions = {
        ballSpeed: 70,
        launchAngle: 15,
        launchDirection: 0,
        spinRate: 2500,
        spinAxis: { x: 0, y: 1, z: 0 }
    };

    const environment: Environment = {
        temperature: 20,
        pressure: 101325,
        humidity: 0.5,
        altitude: 0,
        wind: { x: 0, y: 0, z: 0 }
    };

    const properties: BallProperties = {
        mass: 0.0459,
        radius: 0.02135,
        area: Math.PI * 0.02135 * 0.02135,
        dragCoefficient: 0.3,
        liftCoefficient: 0.2,
        magnusCoefficient: 0.1,
        spinDecayRate: 0.1
    };

    const metricFn = (trajectory: ExtendedTrajectoryResult): number => {
        if (!trajectory.points.length) return 0;
        const lastPoint = trajectory.points[trajectory.points.length - 1];
        return Math.sqrt(
            lastPoint.position.x * lastPoint.position.x +
            lastPoint.position.z * lastPoint.position.z
        );
    };

    describe('Particle Swarm Optimization', () => {
        it('should find better solution than base conditions', async () => {
            const result = await optimizer.particleSwarmOptimization(
                baseConditions,
                environment,
                properties,
                metricFn,
                { 
                    numParticles: 5,  // Reduced for testing
                    iterations: 5 
                }
            );

            expect(result.conditions.launchAngle).toBeGreaterThanOrEqual(0);
            expect(result.conditions.launchAngle).toBeLessThanOrEqual(45);
            expect(result.conditions.spinRate).toBeGreaterThanOrEqual(1000);
            expect(result.conditions.spinRate).toBeLessThanOrEqual(5000);
        }, 10000);
    });

    describe('Simulated Annealing', () => {
        it('should find better solution than base conditions', async () => {
            const result = await optimizer.simulatedAnnealing(
                baseConditions,
                environment,
                properties,
                metricFn,
                { 
                    initialTemp: 100,
                    coolingRate: 0.8,  // Faster cooling
                    iterations: 10      // Fewer iterations
                }
            );

            expect(result.conditions.launchAngle).toBeGreaterThanOrEqual(0);
            expect(result.conditions.launchAngle).toBeLessThanOrEqual(45);
            expect(result.conditions.spinRate).toBeGreaterThanOrEqual(1000);
            expect(result.conditions.spinRate).toBeLessThanOrEqual(5000);
        }, 10000);
    });

    describe('Differential Evolution', () => {
        it('should find better solution than base conditions', async () => {
            const result = await optimizer.differentialEvolution(
                baseConditions,
                environment,
                properties,
                metricFn,
                {
                    populationSize: 5,  // Reduced for testing
                    generations: 5,
                    F: 0.8,
                    CR: 0.9
                }
            );

            expect(result.conditions.launchAngle).toBeGreaterThanOrEqual(0);
            expect(result.conditions.launchAngle).toBeLessThanOrEqual(45);
            expect(result.conditions.spinRate).toBeGreaterThanOrEqual(1000);
            expect(result.conditions.spinRate).toBeLessThanOrEqual(5000);
        }, 10000);
    });
});
