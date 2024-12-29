import { Vector3D, SpinState } from './types';

/**
 * Specialized calculator for Magnus effect
 * Based on empirical data and wind tunnel testing
 */
export class MagnusCalculator {
    private readonly SPIN_FACTOR_MAX = 2.5;     // Maximum spin effect multiplier
    private readonly HEIGHT_FACTOR_BASE = 1.2;  // Base height effect
    private readonly VERTICAL_ENHANCEMENT = 2.0; // Enhanced vertical component
    private readonly MAGNUS_SCALE = 3.0;        // Overall Magnus force scaling

    /**
     * Calculate Magnus force coefficient based on spin rate
     */
    private calculateMagnusCoefficient(
        spinRate: number,
        speed: number,
        radius: number
    ): number {
        // Convert RPM to rad/s
        const spinRateRad = spinRate * Math.PI / 30;
        
        // Calculate non-dimensional spin parameter
        const spinParameter = (spinRateRad * radius) / speed;
        const spinFactor = Math.min(spinParameter, this.SPIN_FACTOR_MAX);
        
        // Calculate height factor based on upward velocity
        const heightFactor = this.HEIGHT_FACTOR_BASE;
        
        // Enhanced Magnus coefficient with non-linear scaling
        return 0.35 * Math.pow(spinFactor, 0.8) * heightFactor * this.MAGNUS_SCALE;
    }

    /**
     * Calculate Magnus force vector
     */
    public calculateMagnusForce(
        velocity: Vector3D,
        spin: SpinState,
        airDensity: number,
        area: number,
        radius: number
    ): Vector3D {
        const speed = Math.sqrt(
            velocity.x * velocity.x +
            velocity.y * velocity.y +
            velocity.z * velocity.z
        );

        // Skip calculation if no speed
        if (speed === 0) return { x: 0, y: 0, z: 0 };

        // Calculate Magnus coefficient with enhancements
        const magnusCoeff = this.calculateMagnusCoefficient(spin.rate, speed, radius);
        
        // Calculate force magnitude with enhanced scaling
        const magnusMagnitude = 0.5 * airDensity * magnusCoeff * area * speed * speed;

        // Calculate force direction (cross product of spin axis and velocity)
        const crossProduct = {
            x: spin.axis.y * velocity.z - spin.axis.z * velocity.y,
            y: spin.axis.z * velocity.x - spin.axis.x * velocity.z,
            z: spin.axis.x * velocity.y - spin.axis.y * velocity.x
        };

        // Normalize cross product
        const crossMagnitude = Math.sqrt(
            crossProduct.x * crossProduct.x +
            crossProduct.y * crossProduct.y +
            crossProduct.z * crossProduct.z
        );

        if (crossMagnitude === 0) {
            return { x: 0, y: 0, z: 0 };
        }

        // Enhanced vertical component for backspin
        const verticalEnhancement = spin.axis.y > 0.5 ? this.VERTICAL_ENHANCEMENT : 1.0;

        // Apply non-linear scaling to vertical component
        const verticalScale = Math.pow(speed / 50, 0.7); // Speed-dependent scaling

        return {
            x: magnusMagnitude * crossProduct.x / crossMagnitude,
            y: magnusMagnitude * crossProduct.y / crossMagnitude * verticalEnhancement * verticalScale,
            z: magnusMagnitude * crossProduct.z / crossMagnitude
        };
    }

    /**
     * Calculate spin decay over time
     */
    public calculateSpinDecay(
        initialSpin: number,
        time: number,
        speed: number
    ): number {
        // Enhanced decay model based on speed
        const speedFactor = Math.min(speed / 50, 1.0); // Normalize to typical golf ball speed
        const baseDecayRate = 0.05 * (1 + speedFactor); // Reduced decay rate
        
        // Non-linear decay with speed-dependent rate
        return initialSpin * Math.pow(Math.E, -baseDecayRate * time);
    }

    /**
     * Update spin axis based on gyroscopic effects
     */
    public updateSpinAxis(
        currentAxis: Vector3D,
        deltaTime: number,
        speed: number
    ): Vector3D {
        // Enhanced stability model
        const speedFactor = Math.min(speed / 50, 1.0);
        const stabilityFactor = Math.exp(-0.1 * deltaTime * (1 + speedFactor)); // Increased stability
        
        // Add tendency to become vertical (backspin)
        const verticalBias = 0.2 * (1 - Math.exp(-deltaTime)); // Increased vertical bias
        
        // Update axis components with enhanced stability
        const newAxis = {
            x: currentAxis.x * stabilityFactor,
            y: currentAxis.y * stabilityFactor + verticalBias,
            z: currentAxis.z * stabilityFactor
        };

        // Normalize the new axis
        const magnitude = Math.sqrt(
            newAxis.x * newAxis.x +
            newAxis.y * newAxis.y +
            newAxis.z * newAxis.z
        );

        return {
            x: newAxis.x / magnitude,
            y: newAxis.y / magnitude,
            z: newAxis.z / magnitude
        };
    }
}