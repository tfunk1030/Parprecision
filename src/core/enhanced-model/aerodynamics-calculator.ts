import { Vector3D, Forces, BallProperties, Environment, SpinState } from './types';

/**
 * Aerodynamics calculator for golf ball flight
 * Based on wind tunnel data and empirical measurements
 */
export class AerodynamicsCalculator {
    private readonly AIR_VISCOSITY = 1.81e-5;  // Standard air viscosity
    private readonly BALL_DIAMETER = 0.0427;   // Standard ball diameter (m)
    private readonly LIFT_FACTOR = 1.5;        // Empirical lift enhancement
    private readonly DRAG_REDUCTION = 0.5;     // Drag reduction factor for dimples

    /**
     * Calculate Reynolds number based on velocity
     */
    private calculateReynoldsNumber(
        velocity: number,
        airDensity: number
    ): number {
        return (airDensity * velocity * this.BALL_DIAMETER) / this.AIR_VISCOSITY;
    }

    /**
     * Get drag coefficient based on Reynolds number
     * Data from wind tunnel testing of golf balls with dimples
     */
    private getDragCoefficient(reynoldsNumber: number): number {
        // Enhanced drag model for dimpled golf balls
        if (reynoldsNumber < 40000) {
            return 0.4; // Laminar flow
        } else if (reynoldsNumber < 100000) {
            // Transition region - dimples help maintain lower drag
            return 0.35;
        } else {
            // Turbulent flow - dimples significantly reduce drag
            return 0.25;
        }
    }

    /**
     * Get lift coefficient based on spin rate
     * Enhanced model based on wind tunnel data
     */
    private getLiftCoefficient(spinRate: number, velocity: number): number {
        // Calculate spin factor (non-dimensional)
        const spinFactor = (spinRate * Math.PI / 30) * this.BALL_DIAMETER / velocity;
        
        // Enhanced lift model with saturation
        const baseCoeff = 0.15 + Math.min(spinFactor * 0.12, 0.25);
        
        return baseCoeff * this.LIFT_FACTOR;
    }

    /**
     * Calculate drag force vector
     * Enhanced model with dimple effects
     */
    private calculateDragForce(
        velocity: Vector3D,
        airDensity: number,
        dragCoefficient: number,
        area: number
    ): Vector3D {
        const speed = Math.sqrt(
            velocity.x * velocity.x +
            velocity.y * velocity.y +
            velocity.z * velocity.z
        );
        
        if (speed === 0) return { x: 0, y: 0, z: 0 };
        
        // Reduced drag due to dimples
        const dragMagnitude = 0.5 * airDensity * area * dragCoefficient * speed * speed * this.DRAG_REDUCTION;
        
        return {
            x: -dragMagnitude * velocity.x / speed,
            y: -dragMagnitude * velocity.y / speed,
            z: -dragMagnitude * velocity.z / speed
        };
    }

    /**
     * Calculate lift force vector
     * Enhanced model with improved lift distribution
     */
    private calculateLiftForce(
        velocity: Vector3D,
        spinVector: Vector3D,
        airDensity: number,
        liftCoefficient: number,
        area: number
    ): Vector3D {
        const speed = Math.sqrt(
            velocity.x * velocity.x +
            velocity.y * velocity.y +
            velocity.z * velocity.z
        );
        
        if (speed === 0) return { x: 0, y: 0, z: 0 };

        // Enhanced lift calculation
        const liftMagnitude = 0.5 * airDensity * area * liftCoefficient * speed * speed;
        
        // Calculate lift direction (perpendicular to both velocity and spin axis)
        const crossProduct = {
            x: spinVector.y * velocity.z - spinVector.z * velocity.y,
            y: spinVector.z * velocity.x - spinVector.x * velocity.z,
            z: spinVector.x * velocity.y - spinVector.y * velocity.x
        };
        
        const crossMagnitude = Math.sqrt(
            crossProduct.x * crossProduct.x +
            crossProduct.y * crossProduct.y +
            crossProduct.z * crossProduct.z
        );
        
        if (crossMagnitude === 0) return { x: 0, y: liftMagnitude, z: 0 };
        
        return {
            x: liftMagnitude * crossProduct.x / crossMagnitude,
            y: liftMagnitude * crossProduct.y / crossMagnitude,
            z: liftMagnitude * crossProduct.z / crossMagnitude
        };
    }

    /**
     * Calculate all aerodynamic forces
     */
    public calculateForces(
        velocity: Vector3D,
        spin: SpinState,
        properties: BallProperties,
        airDensity: number
    ): Forces {
        const speed = Math.sqrt(
            velocity.x * velocity.x +
            velocity.y * velocity.y +
            velocity.z * velocity.z
        );

        // Calculate Reynolds number
        const reynolds = this.calculateReynoldsNumber(speed, airDensity);

        // Get coefficients with enhanced models
        const dragCoeff = this.getDragCoefficient(reynolds);
        const liftCoeff = this.getLiftCoefficient(spin.rate, speed);

        // Calculate forces with improved models
        const drag = this.calculateDragForce(velocity, airDensity, dragCoeff, properties.area);
        const lift = this.calculateLiftForce(velocity, spin.axis, airDensity, liftCoeff, properties.area);

        // Return combined forces
        return {
            drag,
            lift,
            magnus: lift,  // Magnus effect is effectively the same as lift force
            gravity: { x: 0, y: -9.81 * properties.mass, z: 0 }
        };
    }
}