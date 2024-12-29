import { LookupShotModel } from './lookup-shot-model';
import { CLUB_DATA } from './club-data';

console.log('Running Lookup Shot Model Tests');
console.log('=================================\n');

function runTests() {
    const model = new LookupShotModel();

    // Test cases with different clubs and conditions
    const testCases = [
        {
            name: 'Driver - Sea Level',
            params: {
                club: 'driver',
                clubSpeed: 110,
                launchAngle: CLUB_DATA.driver.launchAngle,
                spinRate: CLUB_DATA.driver.spinRate,
                spinAxis: { x: 0, y: 1, z: 0 },
                temperature: 70,
                pressure: 29.92,
                altitude: 0,
                humidity: 0.5,
                windSpeed: 0,
                windDirection: 0
            }
        },
        {
            name: 'Driver - High Altitude',
            params: {
                club: 'driver',
                clubSpeed: 110,
                launchAngle: CLUB_DATA.driver.launchAngle,
                spinRate: CLUB_DATA.driver.spinRate,
                spinAxis: { x: 0, y: 1, z: 0 },
                temperature: 70,
                pressure: 24.89,
                altitude: 5000,
                humidity: 0.5,
                windSpeed: 0,
                windDirection: 0
            }
        },
        {
            name: '7-Iron - No Wind',
            params: {
                club: '7-iron',
                clubSpeed: 85,
                launchAngle: CLUB_DATA['7-iron'].launchAngle,
                spinRate: CLUB_DATA['7-iron'].spinRate,
                spinAxis: { x: 0, y: 1, z: 0 },
                temperature: 70,
                pressure: 29.92,
                altitude: 0,
                humidity: 0.5,
                windSpeed: 0,
                windDirection: 0
            }
        },
        {
            name: '7-Iron - Crosswind',
            params: {
                club: '7-iron',
                clubSpeed: 85,
                launchAngle: CLUB_DATA['7-iron'].launchAngle,
                spinRate: CLUB_DATA['7-iron'].spinRate,
                spinAxis: { x: 0, y: 1, z: 0 },
                temperature: 70,
                pressure: 29.92,
                altitude: 0,
                humidity: 0.5,
                windSpeed: 10,
                windDirection: 90
            }
        },
        {
            name: 'Driver - Hot Day',
            params: {
                club: 'driver',
                clubSpeed: 110,
                launchAngle: CLUB_DATA.driver.launchAngle,
                spinRate: CLUB_DATA.driver.spinRate,
                spinAxis: { x: 0, y: 1, z: 0 },
                temperature: 95,
                pressure: 29.92,
                altitude: 0,
                humidity: 0.7,
                windSpeed: 0,
                windDirection: 0
            }
        }
    ];

    // Run each test case
    testCases.forEach(testCase => {
        console.log(`Test Case: ${testCase.name}`);
        console.log('Parameters:', JSON.stringify(testCase.params, null, 2));
        console.log();

        const start = process.hrtime();
        const result = model.calculateShot(testCase.params);
        const [seconds, nanoseconds] = process.hrtime(start);
        const calculationTime = seconds * 1000 + nanoseconds / 1e6;

        console.log('Results:');
        console.log(`- Total Distance: ${result.distance.toFixed(1)} yards`);
        console.log(`- Max Height: ${result.height.toFixed(1)} yards`);
        console.log(`- Landing Angle: ${result.landingAngle.toFixed(1)}°`);
        console.log(`- Flight Time: ${result.flightTime.toFixed(2)} seconds`);
        console.log();

        console.log('Environmental Effects:');
        console.log(`- Density Effect: ${result.environmentalEffects.densityEffect.toFixed(1)}%`);
        console.log(`- Wind Effect: ${result.environmentalEffects.windEffect.toFixed(1)} yards`);
        console.log(`- Temperature Effect: ${result.environmentalEffects.temperatureEffect.toFixed(1)}%`);
        console.log();

        console.log(`Calculation Time: ${calculationTime.toFixed(3)}ms`);
        console.log();

        console.log('Trajectory Sample Points:');
        result.trajectory.forEach((point, i) => {
            if (i === 0 || i === Math.floor(result.trajectory.length / 2)) {
                console.log(`  ${point.time.toFixed(1)}s: (${point.position.x.toFixed(1)}, ${point.position.y.toFixed(1)}, ${point.position.z.toFixed(1)}) yards`);
            }
        });

        console.log('\n' + '='.repeat(80) + '\n');
    });

    // Print model statistics
    const stats = model.getStats();
    console.log('Model Statistics:');
    console.log(`- Total Pre-calculated Results: ${stats.totalResults}`);
    console.log(`- Cache Size: ${stats.cacheSize}`);
    console.log(`- Memory Usage: ${stats.memoryUsage.toFixed(1)}MB`);
}

// Run tests and catch any errors
try {
    console.log('Initializing Lookup Shot Model...\n');
    runTests();
} catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
}