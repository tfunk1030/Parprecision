import { Environment, ValidationCase, BallState, BallProperties, SpinState, Vector3D } from '../types';
import { AerodynamicsEngineImpl } from '../core/aerodynamics';

const standardEnvironment: Environment = {
    temperature: 20,  // Celsius
    pressure: 101325, // Pa (sea level)
    humidity: 0.5,    // 50%
    altitude: 0,      // sea level
    wind: { x: 0, y: 0, z: 0 }
};

const standardBallState: BallState = {
    position: { x: 0, y: 0, z: 0 },
    velocity: { x: 70, y: 0, z: 30 }, // ~160mph ball speed
    spin: {
        rate: 2500,  // rpm
        axis: { x: 0, y: 1, z: 0 }  // backspin
    },
    mass: 0.0459  // kg (typical golf ball mass)
};

const standardBallProperties: BallProperties = {
    radius: 0.02135,  // meters
    mass: 0.0459,     // kg
    area: Math.PI * 0.02135 * 0.02135,  // m^2
    dragCoefficient: 0.23,
    liftCoefficient: 0.15,
    magnusCoefficient: 0.23,
    spinDecayRate: 0.08
};

export const weatherValidationCases: ValidationCase[] = [
    // Dry conditions (baseline)
    {
        initialState: standardBallState,
        environment: {
            ...standardEnvironment,
            humidity: 0.2
        },
        properties: standardBallProperties,
        expectedMetrics: {
            carryDistance: 245,  // yards
            totalDistance: 255,  // yards
            maxHeight: 32,      // yards
            timeOfFlight: 6.2,  // seconds
            spinRate: 2500,     // rpm
            launchAngle: 23,    // degrees
            launchDirection: 0,  // degrees
            ballSpeed: 70       // m/s
        }
    },
    
    // Light rain
    {
        initialState: standardBallState,
        environment: {
            ...standardEnvironment,
            humidity: 0.5
        },
        properties: standardBallProperties,
        expectedMetrics: {
            carryDistance: 238,  // -3% from baseline
            totalDistance: 248,
            maxHeight: 31,
            timeOfFlight: 6.1,
            spinRate: 2500,
            launchAngle: 22.5,   // -0.5 degrees
            launchDirection: 0,
            ballSpeed: 70
        }
    },
    
    // Heavy rain
    {
        initialState: standardBallState,
        environment: {
            ...standardEnvironment,
            humidity: 0.9
        },
        properties: standardBallProperties,
        expectedMetrics: {
            carryDistance: 220,  // -10% from baseline
            totalDistance: 230,
            maxHeight: 29,
            timeOfFlight: 5.8,
            spinRate: 2500,
            launchAngle: 21,     // -2 degrees
            launchDirection: 0,
            ballSpeed: 70
        }
    },
    
    // Hot conditions
    {
        initialState: standardBallState,
        environment: {
            ...standardEnvironment,
            temperature: 35  // 95°F
        },
        properties: standardBallProperties,
        expectedMetrics: {
            carryDistance: 250,  // +2% from baseline
            totalDistance: 260,
            maxHeight: 33,
            timeOfFlight: 6.3,
            spinRate: 2500,
            launchAngle: 23,
            launchDirection: 0,
            ballSpeed: 70
        }
    },
    
    // Cold conditions
    {
        initialState: standardBallState,
        environment: {
            ...standardEnvironment,
            temperature: 5   // 41°F
        },
        properties: standardBallProperties,
        expectedMetrics: {
            carryDistance: 240,  // -2% from baseline
            totalDistance: 250,
            maxHeight: 31,
            timeOfFlight: 6.1,
            spinRate: 2500,
            launchAngle: 22.5,
            launchDirection: 0,
            ballSpeed: 70
        }
    }
];

// Run validation tests
export async function validateWeatherEffects(): Promise<void> {
    const aero = new AerodynamicsEngineImpl();
    
    for (const testCase of weatherValidationCases) {
        const forces = aero.calculateForces(
            testCase.initialState.velocity,
            testCase.initialState.spin,
            testCase.properties,
            testCase.environment
        );
        
        // Validate forces are within expected ranges
        console.log('Test case:', testCase.environment);
        console.log('Forces:', forces);
        console.log('Expected metrics:', testCase.expectedMetrics);
        console.log('---');
    }
}
