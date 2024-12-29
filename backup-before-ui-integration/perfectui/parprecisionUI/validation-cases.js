/**
 * Comprehensive validation test cases for wind profiles
 */

export const VALIDATION_CASES = [
    // Real-world tournament conditions
    {
        name: "2022 Open Championship R1",
        conditions: {
            windSpeed: 15,
            windDirection: 225,
            temperature: 68,
            humidity: 75,
            altitude: 0,
            stability: 'neutral',
            expectedResults: {
                spinDecayRate: 0.042,
                carryReduction: 0.068,
                lateralDrift: 12.5
            }
        }
    },
    // High altitude tournament conditions
    {
        name: "Mexico Championship",
        conditions: {
            windSpeed: 8,
            windDirection: 90,
            temperature: 75,
            humidity: 45,
            altitude: 7350,
            stability: 'stable',
            expectedResults: {
                spinDecayRate: 0.035,
                carryIncrease: 0.117,
                lateralDrift: 8.2
            }
        }
    },
    // Extreme weather conditions
    {
        name: "Strong Wind Scenario",
        conditions: {
            windSpeed: 25,
            windDirection: 0,
            temperature: 65,
            humidity: 60,
            altitude: 0,
            stability: 'unstable',
            expectedResults: {
                spinDecayRate: 0.048,
                carryReduction: 0.155,
                lateralDrift: 0
            }
        }
    },
    // Temperature extremes
    {
        name: "Cold Weather Test",
        conditions: {
            windSpeed: 12,
            windDirection: 45,
            temperature: 35,
            humidity: 80,
            altitude: 500,
            stability: 'stable',
            expectedResults: {
                spinDecayRate: 0.039,
                carryReduction: 0.082,
                lateralDrift: 6.8
            }
        }
    },
    {
        name: "Hot Weather Test",
        conditions: {
            windSpeed: 10,
            windDirection: 180,
            temperature: 95,
            humidity: 40,
            altitude: 1200,
            stability: 'unstable',
            expectedResults: {
                spinDecayRate: 0.044,
                carryIncrease: 0.035,
                lateralDrift: 0
            }
        }
    }
];

/**
 * Validation thresholds for test cases
 */
export const VALIDATION_THRESHOLDS = {
    spinDecayTolerance: 0.005,   // Acceptable deviation in spin decay rate
    carryTolerance: 0.01,        // Acceptable deviation in carry distance
    lateralTolerance: 1.0,       // Acceptable deviation in lateral drift (yards)
    turbulenceIntensity: {
        stable: {
            min: 0.08,
            max: 0.15
        },
        neutral: {
            min: 0.12,
            max: 0.20
        },
        unstable: {
            min: 0.15,
            max: 0.25
        }
    }
};

/**
 * Expected shot shape characteristics
 */
export const SHOT_SHAPE_VALIDATIONS = {
    driver: {
        normalizedSpinRate: {
            min: 2200,
            max: 3200
        },
        launchAngle: {
            min: 8,
            max: 15
        }
    },
    iron: {
        normalizedSpinRate: {
            min: 4000,
            max: 7000
        },
        launchAngle: {
            min: 15,
            max: 30
        }
    }
};

/**
 * Wind gradient validation profiles
 */
export const WIND_GRADIENT_PROFILES = {
    standard: [
        { height: 0, factor: 1.0 },
        { height: 50, factor: 1.15 },
        { height: 100, factor: 1.25 },
        { height: 150, factor: 1.32 },
        { height: 200, factor: 1.38 },
        { height: 250, factor: 1.42 }
    ],
    tolerance: 0.05  // 5% tolerance for gradient factors
};

/**
 * Helper function to validate a test case
 */
export function validateTestCase(testCase, results) {
    const validations = {
        passed: true,
        deviations: {},
        errors: []
    };

    // Check spin decay rate
    const spinDecayDiff = Math.abs(
        results.spinDecayRate - testCase.conditions.expectedResults.spinDecayRate
    );
    validations.deviations.spinDecay = spinDecayDiff;
    if (spinDecayDiff > VALIDATION_THRESHOLDS.spinDecayTolerance) {
        validations.passed = false;
        validations.errors.push(`Spin decay deviation exceeds threshold: ${spinDecayDiff.toFixed(4)}`);
    }

    // Check carry effect
    const carryKey = testCase.conditions.expectedResults.carryReduction ? 
        'carryReduction' : 'carryIncrease';
    const carryDiff = Math.abs(
        results[carryKey] - testCase.conditions.expectedResults[carryKey]
    );
    validations.deviations.carry = carryDiff;
    if (carryDiff > VALIDATION_THRESHOLDS.carryTolerance) {
        validations.passed = false;
        validations.errors.push(`Carry effect deviation exceeds threshold: ${carryDiff.toFixed(4)}`);
    }

    // Check lateral drift
    const lateralDiff = Math.abs(
        results.lateralDrift - testCase.conditions.expectedResults.lateralDrift
    );
    validations.deviations.lateral = lateralDiff;
    if (lateralDiff > VALIDATION_THRESHOLDS.lateralTolerance) {
        validations.passed = false;
        validations.errors.push(`Lateral drift deviation exceeds threshold: ${lateralDiff.toFixed(2)} yards`);
    }

    return validations;
}
