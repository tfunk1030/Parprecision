import { BallState, Environment, BallProperties, TrajectoryResult, IAerodynamicsEngine } from '../../types';

export class MockFlightIntegrator {
    constructor(private readonly aero: IAerodynamicsEngine) {}

    async integrate(
        initialState: BallState,
        environment: Environment,
        properties: BallProperties
    ): Promise<TrajectoryResult> {
        const point = {
            position: { ...initialState.position },
            velocity: { ...initialState.velocity },
            spin: { ...initialState.spin },
            forces: {
                drag: { x: 0, y: 0, z: 0 },
                lift: { x: 0, y: 0, z: 0 },
                magnus: { x: 0, y: 0, z: 0 },
                gravity: { x: 0, y: -9.81 * properties.mass, z: 0 }
            },
            mass: initialState.mass,
            time: 0
        };

        // Return minimal trajectory for testing
        return {
            points: [point],
            metrics: {
                carryDistance: 100,
                totalDistance: 100,
                maxHeight: 20,
                timeOfFlight: 1,
                spinRate: initialState.spin.rate,
                launchAngle: 15,
                launchDirection: 0,
                ballSpeed: 70
            },
            finalState: point
        };
    }
}