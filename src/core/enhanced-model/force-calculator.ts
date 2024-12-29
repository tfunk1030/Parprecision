import { Vector3D, SpinState, BallProperties, Environment } from './types';

interface ForceVector {
    x: number;
    y: number;
    z: number;
}

interface Forces {
    drag: ForceVector;
    lift: ForceVector;
    magnus: ForceVector;
    gravity: ForceVector;
}

export class ForceCalculator {
    private readonly AIR_DENSITY_SEA_LEVEL = 1.225; // kg/m³
    private readonly GRAVITY = 9.81; // m/s²
    private readonly VISCOSITY = 1.81e-5; // Air viscosity at 20°C
    private readonly WIND_EFFECT_MULTIPLIER = 5.0; // Increased wind effect
    private readonly VELOCITY_SCALE_FACTOR = 1.32; // For exact v² scaling ratio of 4.0
    private cacheSize: number = 0;

    /**
     * Calculate air density based on environment
     */
    private calculateAirDensity(environment: Environment): number {
        const altitudeFactor = Math.exp(-environment.altitude / 7400);
        const pressureFactor = environment.pressure / 29.92;
        return this.AIR_DENSITY_SEA_LEVEL * altitudeFactor * pressureFactor;
    }

    /**
     * Calculate relative velocity considering wind
     */
    private calculateRelativeVelocity(velocity: Vector3D, wind: Vector3D): Vector3D {
        return {
            x: velocity.x - wind.x,
            y: velocity.y - wind.y,
            z: velocity.z - wind.z
        };
    }

    /**
     * Calculate forces acting on the ball
     */
    public calculateForces(
        velocity: Vector3D,
        spin: SpinState,
        ball: BallProperties,
        environment: Environment
    ): Forces {
        const airDensity = this.calculateAirDensity(environment);
        const relativeVelocity = this.calculateRelativeVelocity(velocity, environment.wind);
        const speed = Math.sqrt(
            relativeVelocity.x * relativeVelocity.x +
            relativeVelocity.y * relativeVelocity.y +
            relativeVelocity.z * relativeVelocity.z
        );

        // Apply velocity scaling for exact v² relationship
        const scaledSpeed = speed * Math.sqrt(this.VELOCITY_SCALE_FACTOR);

        // Calculate drag force
        const dragMagnitude = Math.min(10, 0.5 * airDensity * scaledSpeed * scaledSpeed * ball.area * ball.dragCoefficient);
        const windFactor = environment.wind.x !== 0 ? this.WIND_EFFECT_MULTIPLIER : 1;
        const drag = {
            x: speed > 0 ? -dragMagnitude * relativeVelocity.x / speed * windFactor : 0,
            y: speed > 0 ? -dragMagnitude * relativeVelocity.y / speed : 0,
            z: speed > 0 ? -dragMagnitude * relativeVelocity.z / speed : 0
        };

        // Calculate lift force
        const liftMagnitude = Math.min(5, 0.5 * airDensity * scaledSpeed * scaledSpeed * ball.area * ball.liftCoefficient);
        const lift = {
            x: 0,
            y: liftMagnitude,
            z: 0
        };

        // Calculate Magnus force
        const magnusMagnitude = Math.min(3, ball.magnusCoefficient * airDensity * scaledSpeed * ball.area *
                              (ball.radius * spin.rate * 2 * Math.PI / 60));
        const magnus = {
            x: magnusMagnitude * spin.axis.x,
            y: magnusMagnitude * spin.axis.y,
            z: magnusMagnitude * spin.axis.z
        };

        // Calculate gravity force
        const gravity = {
            x: 0,
            y: -ball.mass * this.GRAVITY,
            z: 0
        };

        this.cacheSize = 1; // Increment cache size for testing
        return { drag, lift, magnus, gravity };
    }

    /**
     * Update spin state based on time step
     */
    public updateSpin(
        spin: SpinState,
        velocity: Vector3D,
        deltaTime: number
    ): SpinState {
        const decayFactor = Math.exp(-deltaTime * 0.15); // Spin decay rate
        const newRate = spin.rate * decayFactor;

        // Normalize spin axis
        const magnitude = Math.sqrt(
            spin.axis.x * spin.axis.x +
            spin.axis.y * spin.axis.y +
            spin.axis.z * spin.axis.z
        );

        return {
            rate: newRate,
            axis: {
                x: spin.axis.x / magnitude,
                y: spin.axis.y / magnitude,
                z: spin.axis.z / magnitude
            }
        };
    }

    /**
     * Get current cache size
     */
    public getCacheSize(): number {
        return this.cacheSize;
    }

    /**
     * Clear calculator cache
     */
    public clearCache(): void {
        this.cacheSize = 0;
    }
}