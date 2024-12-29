import BallFlightCalculator from './BallFlightCalculator';

class BallFlightTestSuite {
  constructor() {
    this.calculator = new BallFlightCalculator();
    this.testCases = this.getTestCases();
  }

  getTestCases() {
    return [
      // Standard Conditions Tests
      {
        name: "Driver - Standard Conditions",
        initialConditions: {
          velocity: { x: 235, y: 85, z: 0 },
          spinRate: 2800
        },
        environmentalConditions: {
          airDensity: 0.0765,
          windSpeed: 0,
          windDirection: 0,
          temperature: 70,
          humidity: 50,
          altitude: 0,
          groundHardness: 0.7
        },
        clubData: {
          type: "driver",
          quality: 1,
          impact: "center"
        },
        expected: {
          carryDistance: 275,
          maxHeight: 105,
          landingAngle: 38,
          totalDistance: 290
        }
      },
      // Wind Effect Tests
      {
        name: "Driver - 10mph Headwind",
        initialConditions: {
          velocity: { x: 235, y: 85, z: 0 },
          spinRate: 2800
        },
        environmentalConditions: {
          airDensity: 0.0765,
          windSpeed: 10,
          windDirection: 0,
          temperature: 70,
          humidity: 50,
          altitude: 0,
          groundHardness: 0.7
        },
        clubData: {
          type: "driver",
          quality: 1,
          impact: "center"
        },
        expected: {
          carryDistance: 258,
          maxHeight: 102,
          landingAngle: 40,
          totalDistance: 270
        }
      },
      // Altitude Tests
      {
        name: "Driver - Denver Altitude",
        initialConditions: {
          velocity: { x: 235, y: 85, z: 0 },
          spinRate: 2800
        },
        environmentalConditions: {
          airDensity: 0.0645,
          windSpeed: 0,
          windDirection: 0,
          temperature: 70,
          humidity: 30,
          altitude: 5280,
          groundHardness: 0.8
        },
        clubData: {
          type: "driver",
          quality: 1,
          impact: "center"
        },
        expected: {
          carryDistance: 302,
          maxHeight: 112,
          landingAngle: 37,
          totalDistance: 320
        }
      }
      // Add more test cases as needed...
    ];
  }

  runAllTests() {
    const results = [];
    console.log("Starting Ball Flight Test Suite...\n");

    this.testCases.forEach(testCase => {
      console.log(`Running test: ${testCase.name}`);
      const result = this.runTest(testCase);
      results.push(result);
      this.printTestResult(result);
    });

    this.printSummary(results);
    return results;
  }

  runTest(testCase) {
    const trajectory = this.calculator.calculateTrajectory(
      testCase.initialConditions,
      testCase.environmentalConditions,
      testCase.clubData
    );

    const result = {
      name: testCase.name,
      expected: testCase.expected,
      actual: this.analyzeTrajectory(trajectory),
      errors: {}
    };

    // Calculate errors
    for (const [key, value] of Object.entries(testCase.expected)) {
      result.errors[key] = {
        absolute: Math.abs(result.actual[key] - value),
        percentage: (Math.abs(result.actual[key] - value) / value) * 100
      };
    }

    result.passed = Object.values(result.errors)
      .every(error => error.percentage < 5); // 5% tolerance

    return result;
  }

  analyzeTrajectory(trajectory) {
    const yards = 3; // Convert feet to yards
    return {
      carryDistance: Math.round(trajectory[trajectory.length - 1].position.x / yards),
      maxHeight: Math.round(Math.max(...trajectory.map(p => p.position.y)) / yards),
      landingAngle: Math.round(this.calculateLandingAngle(trajectory)),
      totalDistance: Math.round(trajectory[trajectory.length - 1].position.x / yards)
    };
  }

  calculateLandingAngle(trajectory) {
    const landingIndex = trajectory.findIndex(p => p.position.y <= 0);
    if (landingIndex < 2) return 0;

    const p1 = trajectory[landingIndex - 1];
    const p2 = trajectory[landingIndex];
    
    const dx = p2.position.x - p1.position.x;
    const dy = p2.position.y - p1.position.y;
    
    return Math.abs(Math.atan2(dy, dx) * 180 / Math.PI);
  }

  printTestResult(result) {
    console.log(`\nResults for: ${result.name}`);
    console.log("----------------------------------------");
    
    for (const [key, value] of Object.entries(result.expected)) {
      console.log(`${key}:`);
      console.log(`  Expected: ${value}`);
      console.log(`  Actual: ${result.actual[key]}`);
      console.log(`  Error: ${result.errors[key].percentage.toFixed(2)}%`);
    }
    
    console.log(`\nTest ${result.passed ? 'PASSED' : 'FAILED'}`);
    console.log("----------------------------------------\n");
  }

  printSummary(results) {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    
    console.log("\nTest Suite Summary");
    console.log("=============================");
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${totalTests - passedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  }
}

export default BallFlightTestSuite;
