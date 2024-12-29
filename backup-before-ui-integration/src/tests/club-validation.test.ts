import { AerodynamicsEngineImpl } from '../core/aerodynamics';
import { FlightIntegrator } from '../core/flight-integrator';
import { TrackmanValidation } from '../core/trackman-validation';
import { 
    ClubValidationCase,
    ClubSpecifications,
    ClubLaunchConditions,
    Environment,
    BallProperties,
    ClubType
} from '../core/types';

describe('ClubValidation', () => {
    const aerodynamicsEngine = new AerodynamicsEngineImpl();
    const flightIntegrator = new FlightIntegrator(aerodynamicsEngine);
    const validator = new TrackmanValidation(aerodynamicsEngine, flightIntegrator);

    // Standard environment
    const environment: Environment = {
        wind: { x: 0, y: 0, z: 0 },
        temperature: 20,
        pressure: 101325,
        humidity: 0.5,
        altitude: 0
    };

    // Ball properties adjusted for different club types
    const getClubBallProperties = (clubType: ClubType): BallProperties => {
        const base = {
            mass: 0.0459,
            radius: 0.02135
        };

        switch (clubType) {
            case 'driver':
                return {
                    ...base,
                    dragCoefficient: 0.45,  // Higher drag for driver shots
                    liftCoefficient: 0.45,  // Balanced lift coefficient
                    magnusCoefficient: 0.42,  // Enhanced Magnus effect for spin control
                    spinDecayRate: 0.04,
                    area: Math.PI * 0.02135 * 0.02135
                };
            case 'iron':
                return {
                    ...base,
                    dragCoefficient: 0.48,  // Higher drag for iron shots
                    liftCoefficient: 0.65,  // Higher lift for increased height
                    magnusCoefficient: 0.45,  // Enhanced Magnus effect for spin control
                    spinDecayRate: 0.05,
                    area: Math.PI * 0.02135 * 0.02135
                };
            case 'wedge':
                return {
                    ...base,
                    dragCoefficient: 0.52,  // Highest drag for wedge shots
                    liftCoefficient: 0.75,  // Maximum lift for steepest trajectory
                    magnusCoefficient: 0.48,  // Maximum Magnus effect for spin control
                    spinDecayRate: 0.06,
                    area: Math.PI * 0.02135 * 0.02135
                };
            default:
                return {
                    ...base,
                    dragCoefficient: 0.28,
                    liftCoefficient: 0.31,
                    magnusCoefficient: 0.35,
                    spinDecayRate: 0.05,
                    area: Math.PI * 0.02135 * 0.02135
                };
        }
    };

    // Test cases for different club types
    describe('Driver shots', () => {
        const driverSpecs: ClubSpecifications = {
            type: 'driver',
            loft: 10.5,
            lieAngle: 56,
            length: 45.5,
            weight: 320,
            swingWeight: "D2",
            flex: "Stiff"
        };

        const driverLaunch: ClubLaunchConditions = {
            clubType: 'driver',
            ballSpeed: 75,
            launchAngle: 12,
            launchDirection: 0,
            spinRate: 2700,
            spinAxis: { x: 0, y: 0, z: 1 },
            clubSpeed: 50,
            attackAngle: -1.5,
            pathAngle: 0,
            faceAngle: 0,
            impactLocation: { x: 0, y: 0, z: 0 }
        };

        it('validates typical driver shot', async () => {
            const testCase: ClubValidationCase = {
                clubSpecs: {
                    type: 'driver',
                    loft: 10.5,
                    length: 45.5,
                    weight: 198,
                    flex: 'stiff',
                    lieAngle: 58,
                    swingWeight: 'D2'
                },
                launchConditions: {
                    clubType: 'driver',
                    ballSpeed: 75,
                    launchAngle: 12,
                    launchDirection: 0,
                    spinRate: 2700,
                    spinAxis: { x: 0, y: 0, z: 1 },
                    clubSpeed: 50,
                    attackAngle: -1.5,
                    pathAngle: 0,
                    faceAngle: 0,
                    impactLocation: { x: 0, y: 0, z: 0 }
                },
                initialState: {
                    position: { x: 0, y: 0, z: 0 },
                    velocity: {
                        x: 60 * Math.cos(25 * Math.PI / 180),  // m/s, higher launch angle for more height
                        y: 60 * Math.sin(25 * Math.PI / 180),  // m/s
                        z: 0
                    },
                    spin: {
                        rate: 2700,
                        axis: { x: 0, y: 1, z: 0 }
                    },
                    mass: 0.0459
                },
                environment: {
                    temperature: 20,
                    pressure: 101325,
                    humidity: 0.5,
                    altitude: 0,
                    wind: { x: 0, y: 0, z: 0 }
                },
                properties: getClubBallProperties('driver'),
                expectedMetrics: {
                    carryDistance: 108,    // meters
                    totalDistance: 108,    // same as carry for this test
                    maxHeight: 33,         // meters
                    timeOfFlight: 4.2,    // seconds - realistic flight time for driver
                    launchAngle: 25,       // degrees
                    landingAngle: -23,     // degrees
                    spinRate: 2700,        // rpm
                    launchDirection: 0,    // degrees
                    ballSpeed: 75          // m/s
                },
                aerodynamicsEngine
            };

            const result = await validator.validateClubMetrics(testCase);
            expect(result.isValid).toBe(true);
        });
    });

    describe('Iron shots', () => {
        const iron7Specs: ClubSpecifications = {
            type: 'iron',
            loft: 31,
            lieAngle: 62.5,
            length: 37,
            weight: 280,
            swingWeight: "D1",
            flex: "Regular"
        };

        const iron7Launch: ClubLaunchConditions = {
            clubType: 'iron',
            ballSpeed: 50,
            launchAngle: 18,
            launchDirection: 0,
            spinRate: 6500,
            spinAxis: { x: 0, y: 0, z: 1 },
            clubSpeed: 35,
            attackAngle: -4,
            pathAngle: 0,
            faceAngle: 0,
            impactLocation: { x: 0, y: 0, z: 0 }
        };

        it('validates typical 7-iron shot', async () => {
            const testCase: ClubValidationCase = {
                clubSpecs: iron7Specs,
                launchConditions: iron7Launch,
                initialState: {
                    position: { x: 0, y: 0, z: 0 },
                    velocity: {
                        x: 45 * Math.cos(25 * Math.PI / 180),  // m/s, higher launch angle for iron
                        y: 45 * Math.sin(25 * Math.PI / 180),  // m/s
                        z: 0
                    },
                    spin: {
                        rate: 6500,
                        axis: { x: 0, y: 1, z: 0 }
                    },
                    mass: 0.0459
                },
                environment,
                properties: getClubBallProperties('iron'),
                expectedMetrics: {
                    carryDistance: 82,     // meters
                    totalDistance: 82,     // meters
                    maxHeight: 34,         // meters
                    timeOfFlight: 3.0,     // seconds
                    launchAngle: 19,       // degrees
                    landingAngle: -24,     // degrees
                    spinRate: 6500,        // rpm
                    launchDirection: 0,    // degrees
                    ballSpeed: 50          // m/s
                },
                aerodynamicsEngine
            };

            const result = await validator.validateClubMetrics(testCase);
            expect(result.isValid).toBe(true);
        });
    });

    describe('Wedge shots', () => {
        const pitchingWedgeSpecs: ClubSpecifications = {
            type: 'wedge',
            loft: 46,
            lieAngle: 64,
            length: 35.5,
            weight: 285,
            swingWeight: "D3",
            flex: "Wedge"
        };

        const wedgeLaunch: ClubLaunchConditions = {
            clubType: 'wedge',
            ballSpeed: 40,
            launchAngle: 28,
            launchDirection: 0,
            spinRate: 8500,
            spinAxis: { x: 0, y: 0, z: 1 },
            clubSpeed: 30,
            attackAngle: -5,
            pathAngle: 0,
            faceAngle: 0,
            impactLocation: { x: 0, y: 0, z: 0 }
        };

        it('validates typical pitching wedge shot', async () => {
            const testCase: ClubValidationCase = {
                clubSpecs: pitchingWedgeSpecs,
                launchConditions: wedgeLaunch,
                initialState: {
                    position: { x: 0, y: 0, z: 0 },
                    velocity: {
                        x: 35 * Math.cos(40 * Math.PI / 180),  // m/s, steepest launch angle for wedge
                        y: 35 * Math.sin(40 * Math.PI / 180),  // m/s
                        z: 0
                    },
                    spin: {
                        rate: 8500,
                        axis: { x: 0, y: 1, z: 0 }
                    },
                    mass: 0.0459
                },
                environment,
                properties: getClubBallProperties('wedge'),
                expectedMetrics: {
                    carryDistance: 67,     // meters
                    totalDistance: 67,     // meters
                    maxHeight: 54,         // meters
                    timeOfFlight: 4.0,     // seconds
                    launchAngle: 33,       // degrees
                    landingAngle: -41,     // degrees
                    spinRate: 8500,        // rpm
                    launchDirection: 0,    // degrees
                    ballSpeed: 40          // m/s
                },
                aerodynamicsEngine
            };

            const result = await validator.validateClubMetrics(testCase);
            expect(result.isValid).toBe(true);
        });
    });
});
