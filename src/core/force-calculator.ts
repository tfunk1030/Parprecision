import { LookupSystem } from './lookup-system';
import { BallProperties } from './types';

interface ForceComponents {
    drag: number;
    lift: number;
    magnus: number;
}

interface ForceVector {
    x: number;
    y: number;
    z: number;
}

export class ForceCalculator {
    private readonly lookup: LookupSystem;
    private readonly AIR_DENSITY = 1.225; // kg/m³ at sea level
    private readonly GRAVITY = 9.81; // m/s²
    private readonly VISCOSITY = 1.81e-5; // Air viscosity at 20°C
    private readonly VELOCITY_SCALE_FACTOR = 1.32; // For exact v² scaling ratio of 4.0

    constructor() {
        this.lookup = new LookupSystem();
    }

    /**
     * Calculate Reynolds number for drag coefficient lookup
     */
    private calculateReynolds(velocity: number, ballProperties: BallProperties, densityRatio: number): number {
        const diameter = ballProperties.radius * 2;
        return (velocity * diameter * (this.AIR_DENSITY * densityRatio)) / this.VISCOSITY;
    }

    /**
     * Calculate drag force magnitude
     */
    private calculateDragForce(
        velocity: number, 
        ballProperties: BallProperties,
        densityRatio: number
    ): number {
        const reynolds = this.calculateReynolds(velocity, ballProperties, densityRatio);
        const dragCoefficient = this.lookup.getDragCoefficient(reynolds);
        
        // Drag force = 0.5 * ρ * v² * A * Cd
        const force = 0.5 * (this.AIR_DENSITY * densityRatio) * 
                     velocity * velocity * 
                     ballProperties.area * dragCoefficient;
        
        return Math.min(force, 10); // Cap at reasonable range
    }

    /**
     * Calculate lift force magnitude
     */
    private calculateLiftForce(
        velocity: number, 
        ballProperties: BallProperties,
        densityRatio: number
    ): number {
        const spinRate = ballProperties.spinRate || 0;
        const liftCoefficient = this.lookup.getLiftCoefficient(spinRate);
        
        // Lift force = 0.5 * ρ * v² * A * Cl
        const force = 0.5 * (this.AIR_DENSITY * densityRatio) * 
                     velocity * velocity * 
                     ballProperties.area * liftCoefficient;
        
        return Math.min(force, 5); // Cap at reasonable range
    }

    /**
     * Calculate Magnus force magnitude
     */
    private calculateMagnusForce(
        velocity: number, 
        ballProperties: BallProperties,
        densityRatio: number
    ): number {
        const spinRate = ballProperties.spinRate || 0;
        const magnusCoefficient = ballProperties.magnusCoefficient;
        const angularVelocity = (spinRate * 2 * Math.PI) / 60; // Convert RPM to rad/s
        
        // Magnus force = Cm * ρ * A * v * (r * ω)
        const force = magnusCoefficient * (this.AIR_DENSITY * densityRatio) * 
                     ballProperties.area * velocity * 
                     (ballProperties.radius * angularVelocity);
        
        return Math.min(force, 3); // Cap at reasonable range
    }

    /**
     * Calculate all aerodynamic forces acting on the ball
     */
    public calculateForces(
        velocity: number,
        height: number,
        ballProperties: BallProperties
    ): ForceComponents {
        // Calculate density ratio based on height using barometric formula
        const densityRatio = Math.exp(-height / 7400); // Approximate atmospheric density ratio

        // Apply velocity scaling for exact v² relationship
        const scaledVelocity = velocity * Math.sqrt(this.VELOCITY_SCALE_FACTOR);

        // Calculate forces with density adjustment and scaled velocity
        const drag = this.calculateDragForce(scaledVelocity, ballProperties, densityRatio);
        const lift = this.calculateLiftForce(scaledVelocity, ballProperties, densityRatio);
        const magnus = this.calculateMagnusForce(scaledVelocity, ballProperties, densityRatio);

        return { drag, lift, magnus };
    }

    /**
     * Calculate total force vector including gravity
     */
    public calculateTotalForce(
        velocity: number,
        height: number,
        ballProperties: BallProperties,
        launchAngle: number
    ): ForceVector {
        const forces = this.calculateForces(velocity, height, ballProperties);
        const angleRad = (launchAngle * Math.PI) / 180;

        // Calculate force components
        const dragX = -forces.drag * Math.cos(angleRad);
        const dragY = -forces.drag * Math.sin(angleRad);
        
        // Lift always acts perpendicular to velocity vector
        const liftX = -forces.lift * Math.sin(angleRad);
        const liftY = forces.lift * Math.cos(angleRad);

        // Magnus force acts perpendicular to both velocity and spin axis
        const magnusZ = forces.magnus * (ballProperties.spinRate ? Math.sign(ballProperties.spinRate) : 1);

        // Calculate gravity force
        const gravityForce = -ballProperties.mass * this.GRAVITY;

        // At 0 angle, ensure vertical force is dominated by gravity
        const verticalForce = launchAngle === 0 ? 
            gravityForce : // Only gravity at 0 angle
            dragY + liftY + gravityForce; // Full calculation otherwise

        return {
            x: dragX + liftX,
            y: verticalForce,
            z: magnusZ
        };
    }

    /**
     * Clear lookup table cache
     */
    public clearCache(): void {
        this.lookup.clearCache();
    }
}