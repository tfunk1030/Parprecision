import { BallState, Environment, BallProperties, TrajectoryPoint, TrajectoryResult, ValidationCase, ValidationResult, ValidationMetrics, Vector3D, Forces, IAerodynamicsEngine, TrajectoryMetrics } from '../types';
import { AerodynamicsEngine } from './aerodynamics';


export interface IFlightIntegrator {
    simulateFlight(
        initialState: BallState,
        environment: Environment,
        properties: BallProperties
    ): Promise<TrajectoryResult>;
}

export class FlightIntegrator implements IFlightIntegrator {
    private aerodynamicsEngine: IAerodynamicsEngine;
    private readonly minDt = 0.0001; // Minimum time step in seconds
    private readonly maxDt = 0.001; // Maximum time step in seconds
    private readonly maxTime = 60; // Maximum simulation time in seconds
    private readonly groundLevel = 0; // Ground level in meters
    private readonly minPositionChange = 0.1; // Minimum position change to store point
    private readonly errorTolerance = 1e-6; // Error tolerance for adaptive stepping
    private readonly g = 9.81; // Gravitational acceleration (m/s^2)

    // Cached vectors to reduce object creation
    private readonly cachedVec1: Vector3D = { x: 0, y: 0, z: 0 };
    private readonly cachedVec2: Vector3D = { x: 0, y: 0, z: 0 };
    private readonly cachedVec3: Vector3D = { x: 0, y: 0, z: 0 };
    private readonly cachedVec4: Vector3D = { x: 0, y: 0, z: 0 };

    // Cache objects for RK4 integration
    private readonly k1State: BallState = {
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        spin: { rate: 0, axis: { x: 0, y: 0, z: 0 } },
        mass: 0
    };
    private readonly k2State: BallState = {
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        spin: { rate: 0, axis: { x: 0, y: 0, z: 0 } },
        mass: 0
    };
    private readonly k3State: BallState = {
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        spin: { rate: 0, axis: { x: 0, y: 0, z: 0 } },
        mass: 0
    };
    private readonly k4State: BallState = {
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        spin: { rate: 0, axis: { x: 0, y: 0, z: 0 } },
        mass: 0
    };

    async simulateFlight(
        initialState: BallState,
        environment: Environment,
        properties: BallProperties
    ): Promise<TrajectoryResult> {
        // Use the integrate method which has proper RK4 integration
        return this.integrate(initialState, environment, properties);
    }

    private copyVector(target: Vector3D, source: Vector3D): void {
        target.x = source.x;
        target.y = source.y;
        target.z = source.z;
    }

    private copyState(target: BallState, source: BallState): void {
        target.position.x = source.position.x;
        target.position.y = source.position.y;
        target.position.z = source.position.z;
        target.velocity.x = source.velocity.x;
        target.velocity.y = source.velocity.y;
        target.velocity.z = source.velocity.z;
        target.spin.rate = source.spin.rate;
        target.spin.axis.x = source.spin.axis.x;
        target.spin.axis.y = source.spin.axis.y;
        target.spin.axis.z = source.spin.axis.z;
        target.mass = source.mass;
    }

    private createTrajectoryPoint(
        state: BallState,
        forces: Forces,
        time: number
    ): TrajectoryPoint {
        return {
            position: { ...state.position },
            velocity: { ...state.velocity },
            spin: { ...state.spin },
            mass: state.mass,
            forces,
            time
        };
    }

    private shouldStorePoint(points: TrajectoryPoint[], state: BallState): boolean {
        if (points.length === 0) return true;
        
        const lastPoint = points[points.length - 1];
        return this.calculateDistance(state.position, lastPoint.position) > this.minPositionChange;
    }

    private estimateError(k1: any, k2: any, k3: any, k4: any): number {
        // Use difference between RK4 and RK5 as error estimate
        const error1 = Math.abs(k1.position.x - k4.position.x);
        const error2 = Math.abs(k1.position.y - k4.position.y);
        const error3 = Math.abs(k1.position.z - k4.position.z);
        return Math.max(error1, error2, error3);
    }

    private calculateWeightedDerivatives(k1: any, k2: any, k3: any, k4: any): any {
        return {
            position: {
                x: (k1.position.x + 2 * k2.position.x + 2 * k3.position.x + k4.position.x) / 6,
                y: (k1.position.y + 2 * k2.position.y + 2 * k3.position.y + k4.position.y) / 6,
                z: (k1.position.z + 2 * k2.position.z + 2 * k3.position.z + k4.position.z) / 6
            },
            velocity: {
                x: (k1.velocity.x + 2 * k2.velocity.x + 2 * k3.velocity.x + k4.velocity.x) / 6,
                y: (k1.velocity.y + 2 * k2.velocity.y + 2 * k3.velocity.y + k4.velocity.y) / 6,
                z: (k1.velocity.z + 2 * k2.velocity.z + 2 * k3.velocity.z + k4.velocity.z) / 6
            }
        };
    }

    constructor(aerodynamicsEngine: IAerodynamicsEngine) {
        this.aerodynamicsEngine = aerodynamicsEngine;
    }

    private calculateForces(
        state: BallState,
        environment: Environment,
        properties: BallProperties,
        aerodynamicsEngine: IAerodynamicsEngine = this.aerodynamicsEngine
    ): Forces {
        return aerodynamicsEngine.calculateForces(
            state.velocity,
            state.spin,
            properties,
            environment
        );
    }

    private calculateAcceleration(forces: Forces, properties: BallProperties): Vector3D {
        const g = 9.81; // m/s^2
        return {
            x: (forces.drag.x + forces.lift.x + forces.magnus.x) / properties.mass,
            y: (forces.drag.y + forces.lift.y + forces.magnus.y - properties.mass * g) / properties.mass,
            z: (forces.drag.z + forces.lift.z + forces.magnus.z) / properties.mass
        };
    }

    private calculateDerivatives(
        state: BallState,
        environment: Environment,
        properties: BallProperties
    ): { position: Vector3D; velocity: Vector3D } {
        const forces = this.calculateForces(state, environment, properties);

        // Calculate acceleration from forces
        const acceleration = this.calculateAcceleration(forces, properties);

        return {
            position: { ...state.velocity },
            velocity: acceleration
        };
    }

    private advanceState(
        state: BallState,
        derivatives: { position: Vector3D; velocity: Vector3D },
        dt: number
    ): BallState {
        return {
            position: {
                x: state.position.x + derivatives.position.x * dt,
                y: state.position.y + derivatives.position.y * dt,
                z: state.position.z + derivatives.position.z * dt
            },
            velocity: {
                x: state.velocity.x + derivatives.velocity.x * dt,
                y: state.velocity.y + derivatives.velocity.y * dt,
                z: state.velocity.z + derivatives.velocity.z * dt
            },
            spin: { ...state.spin },
            mass: state.mass
        };
    }

    private findGroundImpactTime(
        state: BallState,
        environment: Environment,
        properties: BallProperties,
        t0: number,
        t1: number,
        tolerance: number = 1e-6
    ): number {
        const maxIterations = 20;
        let a = t0;
        let b = t1;

        for (let i = 0; i < maxIterations; i++) {
            const mid = (a + b) / 2;
            const midState = this.integrateToTime(
                state,
                environment,
                properties,
                t0,
                mid
            );

            if (Math.abs(midState.position.y) < tolerance) {
                return mid;
            }

            if (midState.position.y > 0) {
                a = mid;
            } else {
                b = mid;
            }
        }

        return (a + b) / 2;
    }

    private integrateToTime(
        initialState: BallState,
        environment: Environment,
        properties: BallProperties,
        t0: number,
        t1: number
    ): BallState {
        let state = { ...initialState };
        let t = t0;
        const dt = this.maxDt;

        while (t < t1) {
            const stepSize = Math.min(dt, t1 - t);
            const k1 = this.calculateDerivatives(state, environment, properties);
            const k2 = this.calculateDerivatives(
                this.advanceState(state, k1, stepSize / 2),
                environment,
                properties
            );
            const k3 = this.calculateDerivatives(
                this.advanceState(state, k2, stepSize / 2),
                environment,
                properties
            );
            const k4 = this.calculateDerivatives(
                this.advanceState(state, k3, stepSize),
                environment,
                properties
            );

            const dState = {
                position: {
                    x: (k1.position.x + 2 * k2.position.x + 2 * k3.position.x + k4.position.x) / 6,
                    y: (k1.position.y + 2 * k2.position.y + 2 * k3.position.y + k4.position.y) / 6,
                    z: (k1.position.z + 2 * k2.position.z + 2 * k3.position.z + k4.position.z) / 6
                },
                velocity: {
                    x: (k1.velocity.x + 2 * k2.velocity.x + 2 * k3.velocity.x + k4.velocity.x) / 6,
                    y: (k1.velocity.y + 2 * k2.velocity.y + 2 * k3.velocity.y + k4.velocity.y) / 6,
                    z: (k1.velocity.z + 2 * k2.velocity.z + 2 * k3.velocity.z + k4.velocity.z) / 6
                }
            };

            state = this.advanceState(state, dState, stepSize);
            state.spin.rate *= Math.exp(-properties.spinDecayRate * stepSize);
            t += stepSize;
        }

        return state;
    }

    private calculateDistance(a: Vector3D, b: Vector3D): number {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dz = a.z - b.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    private calculateMetrics(points: TrajectoryPoint[]): TrajectoryMetrics {
        if (points.length < 2) {
            return {
                carryDistance: 0,
                totalDistance: 0,
                maxHeight: 0,
                timeOfFlight: 0,
                spinRate: points[0]?.spin.rate || 0,
                launchAngle: 0,
                launchDirection: 0,
                ballSpeed: 0
            };
        }

        const firstPoint = points[0];
        const lastPoint = points[points.length - 1];

        // Calculate carry distance (horizontal distance)
        const dx = lastPoint.position.x - firstPoint.position.x;
        const dz = lastPoint.position.z - firstPoint.position.z;
        const carryDistance = Math.sqrt(dx * dx + dz * dz);

        // Find max height
        let maxHeight = 0;
        for (const point of points) {
            maxHeight = Math.max(maxHeight, point.position.y);
        }

        // Calculate flight time
        const flightTime = lastPoint.time - firstPoint.time;

        // Calculate launch angle
        const firstVelocity = this.calculateVelocity(firstPoint, points[1]);
        const launchAngle = Math.atan2(firstVelocity.y, Math.sqrt(firstVelocity.x * firstVelocity.x + firstVelocity.z * firstVelocity.z)) * 180 / Math.PI;

        // Calculate initial ball speed
        const ballSpeed = Math.sqrt(
            Math.pow(firstPoint.velocity.x, 2) +
            Math.pow(firstPoint.velocity.y, 2) +
            Math.pow(firstPoint.velocity.z, 2)
        );

        // Calculate launch direction (angle in XZ plane)
        const launchDirection = Math.atan2(firstPoint.velocity.z, firstPoint.velocity.x) * 180 / Math.PI;

        return {
            carryDistance: carryDistance,    // Already in meters
            totalDistance: carryDistance,    // Same as carry distance for now
            maxHeight: maxHeight,            // Already in meters
            timeOfFlight: lastPoint.time - firstPoint.time,
            spinRate: firstPoint.spin.rate,
            launchAngle: Math.atan2(firstPoint.velocity.y, 
                Math.sqrt(Math.pow(firstPoint.velocity.x, 2) + Math.pow(firstPoint.velocity.z, 2))
            ) * 180 / Math.PI,
            launchDirection,
            ballSpeed
        };
    }

    private calculateVelocity(p1: TrajectoryPoint, p2: TrajectoryPoint): Vector3D {
        const speed = Math.sqrt(
            (p2.position.x - p1.position.x) * (p2.position.x - p1.position.x) +
            (p2.position.y - p1.position.y) * (p2.position.y - p1.position.y) +
            (p2.position.z - p1.position.z) * (p2.position.z - p1.position.z)
        );

        if (speed < 1e-10) {
            return { x: 0, y: 0, z: 0 };
        }

        return {
            x: (p2.position.x - p1.position.x) / (p2.time - p1.time),
            y: (p2.position.y - p1.position.y) / (p2.time - p1.time),
            z: (p2.position.z - p1.position.z) / (p2.time - p1.time)
        };
    }

    public async integrate(
        initialState: BallState,
        environment: Environment,
        properties: BallProperties
    ): Promise<TrajectoryResult> {
        const dt = 0.0001;  // 0.1ms timestep for higher accuracy
        const maxTime = 10; // 10s max simulation time
        const points: TrajectoryPoint[] = [];
        
        let currentState = { ...initialState };
        let currentTime = 0;
        let maxHeight = initialState.position.y;

        while (currentTime < maxTime && currentState.position.y >= 0) {
            // Calculate forces
            const forces = this.calculateForces(currentState, environment, properties);
            
            // RK4 for velocity
            const k1v = this.calculateAcceleration(forces, properties);
            
            const midState1 = {
                ...currentState,
                velocity: {
                    x: currentState.velocity.x + k1v.x * dt/2,
                    y: currentState.velocity.y + k1v.y * dt/2,
                    z: currentState.velocity.z + k1v.z * dt/2
                }
            };
            const midForces1 = this.calculateForces(midState1, environment, properties);
            const k2v = this.calculateAcceleration(midForces1, properties);
            
            const midState2 = {
                ...currentState,
                velocity: {
                    x: currentState.velocity.x + k2v.x * dt/2,
                    y: currentState.velocity.y + k2v.y * dt/2,
                    z: currentState.velocity.z + k2v.z * dt/2
                }
            };
            const midForces2 = this.calculateForces(midState2, environment, properties);
            const k3v = this.calculateAcceleration(midForces2, properties);
            
            const endState = {
                ...currentState,
                velocity: {
                    x: currentState.velocity.x + k3v.x * dt,
                    y: currentState.velocity.y + k3v.y * dt,
                    z: currentState.velocity.z + k3v.z * dt
                }
            };
            const endForces = this.calculateForces(endState, environment, properties);
            const k4v = this.calculateAcceleration(endForces, properties);

            // Update velocity using RK4
            currentState.velocity = {
                x: currentState.velocity.x + (k1v.x + 2*k2v.x + 2*k3v.x + k4v.x) * dt/6,
                y: currentState.velocity.y + (k1v.y + 2*k2v.y + 2*k3v.y + k4v.y) * dt/6,
                z: currentState.velocity.z + (k1v.z + 2*k2v.z + 2*k3v.z + k4v.z) * dt/6
            };
            
            // RK4 for position
            const k1p = currentState.velocity;
            const k2p = {
                x: currentState.velocity.x + k1v.x * dt/2,
                y: currentState.velocity.y + k1v.y * dt/2,
                z: currentState.velocity.z + k1v.z * dt/2
            };
            const k3p = {
                x: currentState.velocity.x + k2v.x * dt/2,
                y: currentState.velocity.y + k2v.y * dt/2,
                z: currentState.velocity.z + k2v.z * dt/2
            };
            const k4p = {
                x: currentState.velocity.x + k3v.x * dt,
                y: currentState.velocity.y + k3v.y * dt,
                z: currentState.velocity.z + k3v.z * dt
            };

            currentState.position = {
                x: currentState.position.x + (k1p.x + 2*k2p.x + 2*k3p.x + k4p.x) * dt/6,
                y: currentState.position.y + (k1p.y + 2*k2p.y + 2*k3p.y + k4p.y) * dt/6,
                z: currentState.position.z + (k1p.z + 2*k2p.z + 2*k3p.z + k4p.z) * dt/6
            };
            
            // Update spin (decay)
            // Exponential spin decay
            currentState.spin.rate *= Math.exp(-properties.spinDecayRate * dt);
            
            // Record point
            points.push(this.createTrajectoryPoint(currentState, forces, currentTime));
            
            // Update max height
            maxHeight = Math.max(maxHeight, currentState.position.y);
            
            currentTime += dt;
        }

        const finalPoint = points[points.length - 1];
        const firstPoint = points[0];

        // Calculate metrics
        const carryDistance = Math.sqrt(
            Math.pow(finalPoint.position.x - firstPoint.position.x, 2) +
            Math.pow(finalPoint.position.z - firstPoint.position.z, 2)
        );

        const ballSpeed = Math.sqrt(
            Math.pow(firstPoint.velocity.x, 2) +
            Math.pow(firstPoint.velocity.y, 2) +
            Math.pow(firstPoint.velocity.z, 2)
        );

        const launchDirection = Math.atan2(firstPoint.velocity.z, firstPoint.velocity.x) * 180 / Math.PI;

        return {
            points,
            metrics: {
                carryDistance: carryDistance,
                totalDistance: carryDistance,
                maxHeight: maxHeight,
                timeOfFlight: currentTime,
                spinRate: firstPoint.spin.rate,
                launchAngle: Math.atan2(firstPoint.velocity.y,
                    Math.sqrt(Math.pow(firstPoint.velocity.x, 2) + Math.pow(firstPoint.velocity.z, 2))
                ) * 180 / Math.PI,
                launchDirection,
                ballSpeed
            },
            finalState: finalPoint
        };
    }

    private validateTrajectoryResult(trajectory: TrajectoryResult, validationCase: ValidationCase): ValidationResult {
        if (!validationCase.expectedMetrics) {
            return {
                isValid: true,
                errors: [],
                trajectory
            };
        }

        const errors: string[] = [];
        const tolerance = 0.1;  // 10% tolerance

        // Compare metrics
        const expected = validationCase.expectedMetrics;
        const actual = trajectory.metrics;

        if (!actual) {
            return {
                isValid: false,
                errors: ['Failed to calculate trajectory metrics'],
                trajectory
            };
        }

        // Check each metric with tolerance
        if (Math.abs(actual.carryDistance - expected.carryDistance) / expected.carryDistance > tolerance) {
            errors.push(`Carry distance error: ${actual.carryDistance} vs ${expected.carryDistance}`);
        }

        if (Math.abs(actual.maxHeight - expected.maxHeight) / expected.maxHeight > tolerance) {
            errors.push(`Max height error: ${actual.maxHeight} vs ${expected.maxHeight}`);
        }

        if (Math.abs(actual.timeOfFlight - expected.timeOfFlight) / expected.timeOfFlight > tolerance) {
            errors.push(`Flight time error: ${actual.timeOfFlight} vs ${expected.timeOfFlight}`);
        }

        if (Math.abs(actual.launchAngle - expected.launchAngle) / expected.launchAngle > tolerance) {
            errors.push(`Launch angle error: ${actual.launchAngle} vs ${expected.launchAngle}`);
        }

        if (Math.abs(actual.spinRate - expected.spinRate) / expected.spinRate > tolerance) {
            errors.push(`Spin rate error: ${actual.spinRate} vs ${expected.spinRate}`);
        }

        return {
            isValid: errors.length === 0,
            errors,
            trajectory
        };
    }

    public async validateTrajectory(validationCase: ValidationCase): Promise<ValidationResult> {
        const originalEngine = this.aerodynamicsEngine;
        try {
            // Use provided aerodynamicsEngine if available
            if (validationCase.aerodynamicsEngine) {
                this.aerodynamicsEngine = validationCase.aerodynamicsEngine;
            }
            
            const trajectory = await this.simulateFlight(
                validationCase.initialState,
                validationCase.environment,
                validationCase.properties
            );
            return this.validateTrajectoryResult(trajectory, validationCase);
        } finally {
            // Restore original engine
            this.aerodynamicsEngine = originalEngine;
        }
    }

    public async validateBatch(cases: ValidationCase[]): Promise<ValidationResult[]> {
        return Promise.all(cases.map(testCase => this.validateTrajectory(testCase)));
    }
}
