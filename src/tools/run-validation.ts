import { DataCollector, DataCollectionConfig } from './data-collection';
import { ValidationDashboard } from './validation-dashboard';
import { BallState, Environment, BallProperties, LaunchConditions } from '../core/types';
import { FlightIntegrator } from '../core/flight-integrator';
import { AerodynamicsEngineImpl } from '../core/aerodynamics';

async function runValidation() {
    // 1. Set up data collection configuration
    const config: DataCollectionConfig = {
        duration: 30,  // 30 minutes
        sampleRate: 1, // 1 sample per second
        location: {
            latitude: 40.7128,
            longitude: -74.0060,
            altitude: 0
        },
        sensors: {
            trackman: {
                deviceId: 'TM-001',
                calibrationData: {}
            },
            weather: {
                deviceId: 'WS-001',
                updateInterval: 1000
            }
        }
    };

    // 2. Initialize data collector
    const collector = new DataCollector(config);

    // 3. Set up validation dashboard
    const dashboardConfig = {
        updateInterval: 1000,  // Update every second
        retentionPeriod: 60,   // Keep last 60 minutes of data
        errorThresholds: {
            carryDistance: 2,   // 2% error threshold
            maxHeight: 5,       // 5% error threshold
            flightTime: 3,      // 3% error threshold
            launchAngle: 1,     // 1% error threshold
            spinRate: 5         // 5% error threshold
        }
    };
    const dashboard = new ValidationDashboard(dashboardConfig);

    // 4. Initialize flight simulation components
    const aerodynamicsEngine = new AerodynamicsEngineImpl();
    const flightIntegrator = new FlightIntegrator(aerodynamicsEngine);

    // 5. Set up test conditions
    const initialState: BallState = {
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 70, y: 30, z: 0 },
        spin: {
            rate: 2500,
            axis: { x: 0, y: 0, z: 1 }
        },
        mass: 0.0459
    };

    const environment: Environment = {
        wind: { x: 0, y: 0, z: 0 },
        temperature: 20,
        pressure: 101325,
        humidity: 0.5,
        altitude: 0
    };

    const properties: BallProperties = {
        mass: 0.0459,          // kg
        radius: 0.02135,       // m
        area: Math.PI * 0.02135 * 0.02135,  // m^2
        dragCoefficient: 0.23,
        liftCoefficient: 0.15,
        magnusCoefficient: 0.12,
        spinDecayRate: 100     // rpm/s
    };

    // 6. Start data collection and monitoring
    console.log('Starting validation...');
    await collector.startCollection();
    dashboard.start();

    try {
        // 7. Run test iterations
        for (let i = 0; i < 10; i++) {
            console.log(`\nRunning test iteration ${i + 1}/10`);

            // Simulate shot
            const trajectory = await flightIntegrator.simulateFlight(
                initialState,
                environment,
                properties
            );

            // Add data to collector (in real world, this would include TrackMan data)
            collector.addData({
                timestamp: Date.now(),
                conditions: {
                    environment,
                    ballProperties: properties,
                    initialState
                },
                trackmanData: trajectory,  // In real world, this would be actual TrackMan data
                simulatedData: trajectory,
                metrics: trajectory.metrics!,
                error: {
                    carryDistance: 0,  // In real world, calculate difference from TrackMan
                    maxHeight: 0,
                    flightTime: 0,
                    launchAngle: 0,
                    spinRate: 0
                }
            });

            // Wait between iterations
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // 8. Display final results
        console.log('\nValidation Results:');
        console.log('==================');
        dashboard.displayRealTimeMetrics();
        dashboard.compareWithTrackman();
        dashboard.showErrorRates();

        // 9. Export collected data
        const jsonData = await collector.exportData('json');
        console.log('\nExported data sample:');
        console.log(JSON.stringify(JSON.parse(jsonData)[0], null, 2));

    } catch (error) {
        console.error('Error during validation:', error);
    } finally {
        // 10. Cleanup
        collector.stopCollection();
        dashboard.stop();
    }
}

// Run the validation if this script is executed directly
if (require.main === module) {
    runValidation().catch(console.error);
}

export { runValidation };