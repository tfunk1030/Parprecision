import {
    LaunchConditions,
    Environment,
    BallProperties,
    TrajectoryResult as MainTrajectoryResult,
    IAerodynamicsEngine,
    TrajectoryMetrics,
    TrajectoryPoint,
    Forces,
    Vector3D,
    SpinState,
    BallState
} from '../types';
import { TrajectoryResult as CoreTrajectoryResult, ValidationMetrics } from './types';

// Define the base point type
interface BasePoint {
    position: Vector3D;
    velocity: Vector3D;
    spin: SpinState;
    time: number;
}

// Define the default forces
const DEFAULT_FORCES: Forces = {
    drag: { x: 0, y: 0, z: 0 },
    lift: { x: 0, y: 0, z: 0 },
    magnus: { x: 0, y: 0, z: 0 },
    gravity: { x: 0, y: -9.81, z: 0 }
};
import { FlightIntegrator } from './flight-integrator';
import { CacheManager } from './cache-manager';

// Combined metrics type that satisfies both interfaces
export type CombinedMetrics = TrajectoryMetrics & ValidationMetrics;

// Extended trajectory result type
export interface ExtendedTrajectoryResult extends MainTrajectoryResult {
    metrics: CombinedMetrics;
    finalState: TrajectoryPoint;
}

interface OptimizationResult {
    trajectory: ExtendedTrajectoryResult;
    metric: number;
    conditions: LaunchConditions;
}

interface PSOConfig {
    numParticles?: number;
    iterations?: number;
}

interface SAConfig {
    initialTemp?: number;
    coolingRate?: number;
    iterations?: number;
}

interface DEConfig {
    populationSize?: number;
    generations?: number;
    F?: number;  // Mutation factor
    CR?: number; // Crossover rate
}

interface TrialVectorParams {
    a: LaunchConditions;
    b: LaunchConditions;
    c: LaunchConditions;
    target: LaunchConditions;
    F: number;
    CR: number;
}

export class OptimizationAlgorithms {
    private readonly integrator: FlightIntegrator;
    private readonly cache: CacheManager;
    private readonly aero: IAerodynamicsEngine;

    constructor(aero: IAerodynamicsEngine) {
        this.integrator = new FlightIntegrator(aero);
        this.cache = CacheManager.getInstance();
        this.aero = aero;
    }

    /**
     * Particle Swarm Optimization (PSO)
     */
    public async particleSwarmOptimization(
        baseConditions: LaunchConditions,
        environment: Environment,
        properties: BallProperties,
        metricFn: (t: ExtendedTrajectoryResult) => number,
        config: PSOConfig = {}
    ): Promise<OptimizationResult> {
        const { numParticles = 20, iterations = 50 } = config;
        const particles = this.initializeParticles(baseConditions, numParticles);
        const velocities = new Array(numParticles).fill(null).map(() => ({
            angle: (Math.random() - 0.5) * 2,
            spin: (Math.random() - 0.5) * 500
        }));

        let globalBest: OptimizationResult | null = null;
        const personalBests: OptimizationResult[] = new Array(numParticles).fill(null);

        for (let iter = 0; iter < iterations; iter++) {
            await Promise.all(particles.map(async (particle, i) => {
                const trajectory = await this.evaluateConditions(
                    particle,
                    environment,
                    properties
                );

                const metric = metricFn(trajectory);
                const result: OptimizationResult = {
                    trajectory,
                    metric,
                    conditions: { ...particle }
                };

                if (!personalBests[i] || metric > personalBests[i].metric) {
                    personalBests[i] = result;
                }

                if (!globalBest || metric > globalBest.metric) {
                    globalBest = result;
                }
            }));

            // Update particle velocities and positions
            particles.forEach((particle, i) => {
                const w = 0.7; // Inertia weight
                const c1 = 1.5; // Cognitive parameter
                const c2 = 1.5; // Social parameter

                const r1 = Math.random();
                const r2 = Math.random();

                velocities[i].angle = w * velocities[i].angle +
                    c1 * r1 * (personalBests[i].conditions.launchAngle - particle.launchAngle) +
                    c2 * r2 * (globalBest!.conditions.launchAngle - particle.launchAngle);

                velocities[i].spin = w * velocities[i].spin +
                    c1 * r1 * (personalBests[i].conditions.spinRate - particle.spinRate) +
                    c2 * r2 * (globalBest!.conditions.spinRate - particle.spinRate);

                // Update positions with bounds checking
                particle.launchAngle = this.clamp(
                    particle.launchAngle + velocities[i].angle,
                    0,
                    45
                );

                particle.spinRate = this.clamp(
                    particle.spinRate + velocities[i].spin,
                    1000,
                    5000
                );
            });
        }

        return globalBest!;
    }

    /**
     * Simulated Annealing
     */
    public async simulatedAnnealing(
        baseConditions: LaunchConditions,
        environment: Environment,
        properties: BallProperties,
        metricFn: (t: ExtendedTrajectoryResult) => number,
        config: SAConfig = {}
    ): Promise<OptimizationResult> {
        const { 
            initialTemp = 100, 
            coolingRate = 0.95, 
            iterations = 100 
        } = config;
        let current = { ...baseConditions };
        let currentTrajectory = await this.evaluateConditions(
            current,
            environment,
            properties
        );
        let currentMetric = metricFn(currentTrajectory);

        let best: OptimizationResult = {
            trajectory: currentTrajectory,
            metric: currentMetric,
            conditions: { ...current }
        };

        let temp = initialTemp;

        for (let i = 0; i < iterations && temp > 0.1; i++) {
            const neighbor = this.getNeighbor(current);
            const neighborTrajectory = await this.evaluateConditions(
                neighbor,
                environment,
                properties
            );
            const neighborMetric = metricFn(neighborTrajectory);

            const delta = neighborMetric - currentMetric;

            if (delta > 0 || Math.random() < Math.exp(delta / temp)) {
                current = neighbor;
                currentTrajectory = neighborTrajectory;
                currentMetric = neighborMetric;

                if (currentMetric > best.metric) {
                    best = {
                        trajectory: currentTrajectory,
                        metric: currentMetric,
                        conditions: { ...current }
                    };
                }
            }

            temp *= coolingRate;
        }

        return best;
    }

    /**
     * Differential Evolution
     */
    public async differentialEvolution(
        baseConditions: LaunchConditions,
        environment: Environment,
        properties: BallProperties,
        metricFn: (t: ExtendedTrajectoryResult) => number,
        config: DEConfig = {}
    ): Promise<OptimizationResult> {
        const {
            populationSize = 20,
            generations = 50,
            F = 0.8,
            CR = 0.9
        } = config;
        let population = this.initializePopulation(baseConditions, populationSize);
        let fitness = await Promise.all(
            population.map(async p => {
                const trajectory = await this.evaluateConditions(p, environment, properties);
                return metricFn(trajectory);
            })
        );

        let bestIndex = fitness.indexOf(Math.max(...fitness));
        let best: OptimizationResult = {
            trajectory: await this.evaluateConditions(
                population[bestIndex],
                environment,
                properties
            ),
            metric: fitness[bestIndex],
            conditions: { ...population[bestIndex] }
        };

        for (let gen = 0; gen < generations; gen++) {
            await Promise.all(population.map(async (individual, i) => {
                // Select three random individuals
                const [a, b, c] = this.selectRandomIndividuals(population, i);

                // Create trial vector
                const trial = this.createTrialVector({
                    a, b, c,
                    target: individual,
                    F, CR
                });

                // Evaluate trial vector
                const trialTrajectory = await this.evaluateConditions(
                    trial,
                    environment,
                    properties
                );
                const trialFitness = metricFn(trialTrajectory);

                // Selection
                if (trialFitness > fitness[i]) {
                    population[i] = trial;
                    fitness[i] = trialFitness;

                    if (trialFitness > best.metric) {
                        best = {
                            trajectory: trialTrajectory,
                            metric: trialFitness,
                            conditions: { ...trial }
                        };
                    }
                }
            }));
        }

        return best;
    }

    private async evaluateConditions(
        conditions: LaunchConditions,
        environment: Environment,
        properties: BallProperties
    ): Promise<ExtendedTrajectoryResult> {
        const cacheKey = JSON.stringify({
            conditions,
            environment,
            properties
        });
        const cached = this.cache.get(cacheKey, 'optimization') as ExtendedTrajectoryResult | null;

        if (cached) {
            // Ensure cached result has required properties
            if (!cached.finalState) {
                cached.finalState = cached.points[cached.points.length - 1];
            }
            return this.adaptTrajectoryResult(cached);
        }

        const rawTrajectory = await this.integrator.simulateFlight(
            this.convertToInitialState(conditions, properties),
            environment,
            properties
        );

        // Ensure trajectory has required properties
        if (!rawTrajectory.finalState) {
            rawTrajectory.finalState = rawTrajectory.points[rawTrajectory.points.length - 1];
        }

        // Adapt the trajectory with validation metrics
        const adaptedTrajectory = this.adaptTrajectoryResult(rawTrajectory);
        this.cache.set(cacheKey, adaptedTrajectory);
        return adaptedTrajectory;
    }

    private adaptTrajectoryResult(trajectory: CoreTrajectoryResult | MainTrajectoryResult): ExtendedTrajectoryResult {
        // Ensure trajectory has metrics
        if (!trajectory.metrics) {
            throw new Error('Trajectory missing metrics');
        }

        const adaptedPoints = this.adaptPoints(trajectory.points);
        const adaptedMetrics = this.adaptMetrics(trajectory);
        const finalState = this.createFinalState(trajectory.points[trajectory.points.length - 1]);

        return {
            points: adaptedPoints,
            metrics: adaptedMetrics,
            finalState
        } as ExtendedTrajectoryResult;
    }

    private adaptPoints(points: TrajectoryPoint[]): TrajectoryPoint[] {
        return points.map(point => ({
            ...point as BasePoint,
            mass: 'mass' in point ? point.mass : 0,
            forces: 'forces' in point ? point.forces : DEFAULT_FORCES
        }));
    }

    private adaptMetrics(trajectory: CoreTrajectoryResult | MainTrajectoryResult): CombinedMetrics {
        const firstPoint = trajectory.points[0];
        const lastPoint = trajectory.points[trajectory.points.length - 1];
        const timeOfFlight = lastPoint.time - firstPoint.time;
        const landingVelocity = lastPoint.velocity;
        const landingAngle = this.calculateLandingAngle(landingVelocity);

        // Create base metrics with defaults
        const rawMetrics = trajectory.metrics || {};
        const metrics = rawMetrics as TrajectoryMetrics & ValidationMetrics;

        return {
            carryDistance: metrics.carryDistance || 0,
            maxHeight: metrics.maxHeight || 0,
            timeOfFlight: timeOfFlight,
            launchAngle: metrics.launchAngle || 0,
            landingAngle: landingAngle,
            spinRate: metrics.spinRate || 0,
            totalDistance: metrics.totalDistance || metrics.carryDistance || 0,
            launchDirection: metrics.launchDirection || 0,
            ballSpeed: metrics.ballSpeed || 0
        };
    }

    private calculateLandingAngle(landingVelocity: Vector3D): number {
        return Math.atan2(
            landingVelocity.y,
            Math.sqrt(landingVelocity.x * landingVelocity.x + landingVelocity.z * landingVelocity.z)
        ) * 180 / Math.PI;
    }

    private createFinalState(lastPoint: TrajectoryPoint): TrajectoryPoint {
        return {
            ...lastPoint as BasePoint,
            mass: 'mass' in lastPoint ? lastPoint.mass : 0,
            forces: 'forces' in lastPoint ? lastPoint.forces : DEFAULT_FORCES
        };
    }

    private initializeParticles(base: LaunchConditions, count: number): LaunchConditions[] {
        return new Array(count).fill(null).map(() => ({
            ...base,
            launchAngle: this.clamp(base.launchAngle + (Math.random() - 0.5) * 20, 0, 45),
            spinRate: this.clamp(base.spinRate + (Math.random() - 0.5) * 1000, 1000, 5000)
        }));
    }

    private initializePopulation(base: LaunchConditions, size: number): LaunchConditions[] {
        return new Array(size).fill(null).map(() => ({
            ...base,
            launchAngle: this.clamp(base.launchAngle + (Math.random() - 0.5) * 20, 0, 45),
            spinRate: this.clamp(base.spinRate + (Math.random() - 0.5) * 1000, 1000, 5000)
        }));
    }

    private getNeighbor(current: LaunchConditions): LaunchConditions {
        return {
            ...current,
            launchAngle: this.clamp(
                current.launchAngle + (Math.random() - 0.5) * 5,
                0,
                45
            ),
            spinRate: this.clamp(
                current.spinRate + (Math.random() - 0.5) * 500,
                1000,
                5000
            )
        };
    }

    private selectRandomIndividuals(
        population: LaunchConditions[],
        exclude: number
    ): [LaunchConditions, LaunchConditions, LaunchConditions] {
        const available = population
            .map((_, i) => i)
            .filter(i => i !== exclude);

        const indices = new Set<number>();
        while (indices.size < 3) {
            indices.add(available[Math.floor(Math.random() * available.length)]);
        }

        const [a, b, c] = Array.from(indices);
        return [population[a], population[b], population[c]];
    }

    private createTrialVector(params: TrialVectorParams): LaunchConditions {
        const { a, b, c, target, F, CR } = params;
        const trial = { ...target };

        if (Math.random() < CR) {
            trial.launchAngle = this.clamp(
                a.launchAngle + F * (b.launchAngle - c.launchAngle),
                0,
                45
            );
        }

        if (Math.random() < CR) {
            trial.spinRate = this.clamp(
                a.spinRate + F * (b.spinRate - c.spinRate),
                1000,
                5000
            );
        }

        return trial;
    }

    private convertToInitialState(
        conditions: LaunchConditions,
        properties: BallProperties
    ): BallState {
        const speed = conditions.ballSpeed;
        const angle = conditions.launchAngle * Math.PI / 180;
        const direction = conditions.launchDirection * Math.PI / 180;

        return {
            position: { x: 0, y: 0, z: 0 },
            velocity: {
                x: speed * Math.cos(angle) * Math.cos(direction),
                y: speed * Math.sin(angle),
                z: speed * Math.cos(angle) * Math.sin(direction)
            },
            spin: {
                rate: conditions.spinRate,
                axis: conditions.spinAxis
            },
            mass: properties.mass
        };
    }

    private clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, value));
    }
}
