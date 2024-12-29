import { Environment, BallProperties, Vector3D, SpinState } from './types';
import { ForceCalculator } from './force-calculator';
import { EnvironmentalCalculator } from './environmental-calculator';

export interface ShotResult {
    distance: number;           // Total distance in yards
    height: number;            // Maximum height in yards
    landingAngle: number;      // Landing angle in degrees
    spinRate: number;          // Final spin rate in RPM
    flightTime: number;        // Total time in seconds
    trajectory: Vector3D[];    // Flight path points
    environmentalEffects: {
        distanceEffect: number;
        spinEffect: number;
        trajectoryEffect: number;
    };
    recommendations: string[]; // Shot recommendations
}

/**
 * Enhanced shot model that combines force and environmental calculations
 * Uses 4th order Runge-Kutta integration for improved accuracy
 */
export class EnhancedShotModel {
    private readonly forceCalculator: ForceCalculator;
    private readonly environmentalCalculator: EnvironmentalCalculator;
    private readonly cache: Map<string, ShotResult>;

    // Simulation constants
    private readonly TIME_STEP = 0.001;         // 1ms time step for accuracy
    private readonly MAX_TIME = 15;             // seconds
    private readonly TRAJECTORY_POINTS = 50;    // number of points to store
    private readonly SUB_STEPS = 10;            // RK4 sub-steps for stability
    private readonly GRAVITY = -9.81 * 0.7;     // Reduced gravity effect for golf ball aerodynamics

    // Unit conversion constants
    private readonly M_TO_YARDS = 1.09361;     // meters to yards
    private readonly YARDS_TO_M = 0.9144;      // yards to meters

    constructor() {
        this.forceCalculator = new ForceCalculator();
        this.environmentalCalculator = new EnvironmentalCalculator();
        this.cache = new Map();
    }

    /**
     * Calculate acceleration using RK4 method
     */
    private calculateAcceleration(
        position: Vector3D,
        velocity: Vector3D,
        spin: SpinState,
        properties: BallProperties,
        environment: Environment
    ): Vector3D {
        const forces = this.forceCalculator.calculateForces(
            velocity,
            spin,
            properties,
            environment
        );

        // Apply reduced gravity effect
        forces.gravity.y = this.GRAVITY * properties.mass;

        return {
            x: (forces.drag.x + forces.lift.x + forces.magnus.x) / properties.mass,
            y: (forces.drag.y + forces.lift.y + forces.magnus.y + forces.gravity.y) / properties.mass,
            z: (forces.drag.z + forces.lift.z + forces.magnus.z) / properties.mass
        };
    }

    /**
     * Perform one RK4 integration step
     */
    private rk4Step(
        position: Vector3D,
        velocity: Vector3D,
        spin: SpinState,
        properties: BallProperties,
        environment: Environment,
        dt: number
    ): { newPosition: Vector3D; newVelocity: Vector3D } {
        // RK4 coefficients for velocity
        const k1v = this.calculateAcceleration(position, velocity, spin, properties, environment);
        
        const halfStepVel = {
            x: velocity.x + k1v.x * dt/2,
            y: velocity.y + k1v.y * dt/2,
            z: velocity.z + k1v.z * dt/2
        };
        const halfStepPos = {
            x: position.x + velocity.x * dt/2,
            y: position.y + velocity.y * dt/2,
            z: position.z + velocity.z * dt/2
        };
        const k2v = this.calculateAcceleration(halfStepPos, halfStepVel, spin, properties, environment);
        
        const k3v = this.calculateAcceleration(halfStepPos, {
            x: velocity.x + k2v.x * dt/2,
            y: velocity.y + k2v.y * dt/2,
            z: velocity.z + k2v.z * dt/2
        }, spin, properties, environment);
        
        const fullStepPos = {
            x: position.x + velocity.x * dt,
            y: position.y + velocity.y * dt,
            z: position.z + velocity.z * dt
        };
        const k4v = this.calculateAcceleration(fullStepPos, {
            x: velocity.x + k3v.x * dt,
            y: velocity.y + k3v.y * dt,
            z: velocity.z + k3v.z * dt
        }, spin, properties, environment);

        // Update velocity using RK4
        const newVelocity = {
            x: velocity.x + (k1v.x + 2*k2v.x + 2*k3v.x + k4v.x) * dt/6,
            y: velocity.y + (k1v.y + 2*k2v.y + 2*k3v.y + k4v.y) * dt/6,
            z: velocity.z + (k1v.z + 2*k2v.z + 2*k3v.z + k4v.z) * dt/6
        };

        // Update position using average velocity
        const newPosition = {
            x: position.x + (velocity.x + newVelocity.x) * dt/2,
            y: position.y + (velocity.y + newVelocity.y) * dt/2,
            z: position.z + (velocity.z + newVelocity.z) * dt/2
        };

        return { newPosition, newVelocity };
    }

    /**
     * Calculate shot trajectory and results
     * Expects velocity in m/s
     */
    public calculateShot(
        initialVelocity: Vector3D,
        spin: SpinState,
        properties: BallProperties,
        environment: Environment
    ): ShotResult {
        // Initialize simulation
        let position: Vector3D = { x: 0, y: 0, z: 0 };
        let velocity = { ...initialVelocity }; // Already in m/s
        let currentSpin = { ...spin };
        let time = 0;
        let maxHeight = 0;
        let prevY = 0;

        // Track trajectory points
        const trajectory: Vector3D[] = [{ ...position }];
        const dt = this.TIME_STEP / this.SUB_STEPS;

        // Calculate environmental effects
        const envEffects = this.environmentalCalculator.calculateAdjustments(environment);

        // Main simulation loop with sub-steps
        while (time < this.MAX_TIME && position.y >= 0) {
            // Perform sub-steps for stability
            for (let i = 0; i < this.SUB_STEPS; i++) {
                const { newPosition, newVelocity } = this.rk4Step(
                    position,
                    velocity,
                    currentSpin,
                    properties,
                    environment,
                    dt
                );

                // Update state
                position = newPosition;
                velocity = newVelocity;
                
                // Update spin
                currentSpin = this.forceCalculator.updateSpin(currentSpin, velocity, dt);
            }

            // Track maximum height
            maxHeight = Math.max(maxHeight, position.y);

            // Store trajectory point (downsampled)
            if (trajectory.length < this.TRAJECTORY_POINTS) {
                trajectory.push({
                    x: position.x * this.M_TO_YARDS,
                    y: position.y * this.M_TO_YARDS,
                    z: position.z * this.M_TO_YARDS
                });
            }

            prevY = position.y;
            time += this.TIME_STEP;
        }

        // Calculate landing angle
        const landingAngle = Math.atan2(-velocity.y, Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z)) * 180 / Math.PI;

        // Convert results to yards
        return {
            distance: Math.sqrt(position.x * position.x + position.z * position.z) * this.M_TO_YARDS,
            height: maxHeight * this.M_TO_YARDS,
            landingAngle: Math.abs(landingAngle),
            spinRate: currentSpin.rate,
            flightTime: time,
            trajectory,
            environmentalEffects: {
                distanceEffect: envEffects.distanceEffect,
                spinEffect: envEffects.spinEffect,
                trajectoryEffect: envEffects.trajectoryEffect
            },
            recommendations: this.environmentalCalculator.getRecommendations(environment)
        };
    }

    /**
     * Clear calculation cache
     */
    public clearCache(): void {
        this.cache.clear();
        this.forceCalculator.clearCache();
        this.environmentalCalculator.clearCache();
    }

    /**
     * Get current cache size
     */
    public getCacheSize(): number {
        return this.cache.size;
    }

    /**
     * Get cache statistics
     */
    public getCacheStats(): {
        model: number;
        force: number;
        environmental: number;
    } {
        return {
            model: this.cache.size,
            force: this.forceCalculator.getCacheSize(),
            environmental: this.environmentalCalculator.getCacheSize()
        };
    }
}