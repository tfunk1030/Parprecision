import { IAerodynamicsEngine, Vector3D, Forces, Environment, BallProperties, SpinState } from '../types';
import { WindEffectsEngine } from './wind-effects';
import { WeatherSystem } from './weather-system';

export class AerodynamicsEngineImpl implements IAerodynamicsEngine {
    private readonly rho = 1.225;  // kg/m^3 air density at sea level
    private readonly g = 9.81;     // m/s^2 gravitational acceleration
    private readonly windEffects = new WindEffectsEngine();
    private readonly weatherSystem = new WeatherSystem();

    constructor() {}

    public calculateForces(
        velocity: Vector3D,
        spin: SpinState,
        properties: BallProperties,
        environment: Environment,
        dt?: number,
        position?: Vector3D,
        prevTurbulence?: Vector3D
    ): Forces {
        // Get weather effects
        const weatherEffects = this.weatherSystem.calculateWeatherEffects(environment);

        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y + velocity.z * velocity.z);
        
        // Handle zero velocity case
        if (speed === 0) {
            return {
                drag: { x: 0, y: 0, z: 0 },
                lift: { x: 0, y: 0, z: 0 },
                magnus: { x: 0, y: 0, z: 0 },
                gravity: { x: 0, y: -this.g * properties.mass, z: 0 }
            };
        }

        // Calculate wind effects if position and dt are provided
        let windForce = { x: 0, y: 0, z: 0 };
        if (position && dt) {
            windForce = this.windEffects.calculateWindForces(
                velocity,
                position,
                environment,
                dt,
                prevTurbulence
            );
        }

        // Calculate drag force
        const dragCoeff = properties.dragCoefficient * (1 + weatherEffects.distanceLoss);
        const area = Math.PI * properties.radius * properties.radius;
        const dragMagnitude = 0.5 * this.rho * dragCoeff * area * speed * speed;
        const dragForce = {
            x: -dragMagnitude * velocity.x / speed,
            y: -dragMagnitude * velocity.y / speed,
            z: -dragMagnitude * velocity.z / speed
        };

        // Calculate Magnus force (spin effects)
        let magnusForce = { x: 0, y: 0, z: 0 };
        if (spin && speed > 0) {
            const magnusCoeff = properties.magnusCoefficient;
            const magnusMagnitude = 0.5 * this.rho * magnusCoeff * area * speed * speed;

            magnusForce = {
                x: magnusMagnitude * (velocity.y * spin.axis.z - velocity.z * spin.axis.y) / speed,
                y: magnusMagnitude * (velocity.z * spin.axis.x - velocity.x * spin.axis.z) / speed,
                z: magnusMagnitude * (velocity.x * spin.axis.y - velocity.y * spin.axis.x) / speed
            };
        }

        // Calculate lift force
        const liftCoeff = properties.liftCoefficient;
        const liftMagnitude = 0.5 * this.rho * liftCoeff * area * speed * speed;
        const liftForce = {
            x: liftMagnitude * (velocity.y * spin.axis.z - velocity.z * spin.axis.y) / speed,
            y: liftMagnitude * (velocity.z * spin.axis.x - velocity.x * spin.axis.z) / speed,
            z: liftMagnitude * (velocity.x * spin.axis.y - velocity.y * spin.axis.x) / speed
        };

        // Calculate gravity force
        const gravityForce = {
            x: 0,
            y: -properties.mass * this.g,
            z: 0
        };

        return {
            drag: dragForce,
            lift: liftForce,
            magnus: magnusForce,
            gravity: gravityForce
        };
    }
}
