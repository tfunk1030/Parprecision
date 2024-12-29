import { EnhancedShotModel, ShotResult } from './enhanced-shot-model';
import { Environment, BallProperties, Vector3D, SpinState } from './types';
import { AdvancedModelInterface } from './advanced-model-interface';
import fs from 'fs';
import path from 'path';

interface ValidationResult {
    testCase: string;
    enhancedResult: ShotResult;
    expectedRanges: {
        distance: { min: number; max: number; };
        height: { min: number; max: number; };
        landingAngle: { min: number; max: number; };
        flightTime: { min: number; max: number; };
    };
    withinRange: boolean;
    advancedResult?: any;
    differences?: {
        distance: number;
        height: number;
        landingAngle: number;
        flightTime: number;
    };
}

interface TestCase {
    name: string;
    velocity: Vector3D;
    spin: SpinState;
    environment: Environment;
    expectedRanges: {
        distance: { min: number; max: number; };
        height: { min: number; max: number; };
        landingAngle: { min: number; max: number; };
        flightTime: { min: number; max: number; };
    };
}

/**
 * Validates enhanced model against expected ranges and advanced physics model if available
 */
export class ModelValidator {
    private readonly enhancedModel: EnhancedShotModel;
    private readonly advancedModel: AdvancedModelInterface;
    private readonly tolerances = {
        distance: 0.05,      // 5% tolerance
        height: 0.08,        // 8% tolerance
        landingAngle: 5,     // 5 degrees tolerance
        flightTime: 0.10     // 10% tolerance
    };

    // Standard golf ball properties based on USGA specifications
    private readonly standardBall: BallProperties = {
        mass: 0.04593,       // 45.93g (1.62oz)
        radius: 0.02135,     // 21.35mm (1.68 inches)
        area: Math.PI * 0.02135 * 0.02135,
        dragCoefficient: 0.25,    // Typical value at Reynolds numbers for golf
        liftCoefficient: 0.21,    // Measured from wind tunnel tests
        magnusCoefficient: 0.35,  // Enhanced for realistic trajectories
        spinDecayRate: 0.025      // Slower decay for better distance
    };

    constructor() {
        this.enhancedModel = new EnhancedShotModel();
        this.advancedModel = new AdvancedModelInterface();
    }

    /**
     * Generate test cases with expected ranges
     * Using realistic club head speeds and launch conditions
     */
    private generateTestCases(): TestCase[] {
        return [
            {
                name: "Driver - Standard Conditions",
                velocity: { 
                    x: 75.5, // 169 mph ball speed (115 mph club head)
                    y: 20.2, // 15 degree launch angle
                    z: 0
                },
                spin: { 
                    rate: 2700,  // Typical driver backspin
                    axis: { x: 0, y: 1, z: 0 }
                },
                environment: {
                    temperature: 70,
                    pressure: 29.92,
                    altitude: 0,
                    humidity: 0.5,
                    wind: { x: 0, y: 0, z: 0 }
                },
                expectedRanges: {
                    distance: { min: 230, max: 330 },
                    height: { min: 20, max: 45 },
                    landingAngle: { min: 35, max: 65 },
                    flightTime: { min: 4, max: 7 }
                }
            },
            {
                name: "Driver - High Altitude",
                velocity: {
                    x: 75.5,
                    y: 20.2,
                    z: 0
                },
                spin: {
                    rate: 2700,
                    axis: { x: 0, y: 1, z: 0 }
                },
                environment: {
                    temperature: 70,
                    pressure: 24.89,
                    altitude: 5000,
                    humidity: 0.5,
                    wind: { x: 0, y: 0, z: 0 }
                },
                expectedRanges: {
                    distance: { min: 250, max: 350 },
                    height: { min: 22, max: 48 },
                    landingAngle: { min: 35, max: 65 },
                    flightTime: { min: 4.2, max: 7.5 }
                }
            },
            {
                name: "7-Iron - Standard Conditions",
                velocity: {
                    x: 53.6, // 120 mph ball speed (85 mph club head)
                    y: 19.5, // 20 degree launch angle
                    z: 0
                },
                spin: {
                    rate: 6500, // Typical 7-iron backspin
                    axis: { x: 0, y: 1, z: 0 }
                },
                environment: {
                    temperature: 70,
                    pressure: 29.92,
                    altitude: 0,
                    humidity: 0.5,
                    wind: { x: 0, y: 0, z: 0 }
                },
                expectedRanges: {
                    distance: { min: 140, max: 200 },
                    height: { min: 15, max: 35 },
                    landingAngle: { min: 42, max: 72 },
                    flightTime: { min: 3.5, max: 6 }
                }
            }
        ];
    }

    /**
     * Check if result is within expected ranges
     */
    private checkRanges(result: ShotResult, ranges: TestCase['expectedRanges']): boolean {
        return (
            result.distance >= ranges.distance.min &&
            result.distance <= ranges.distance.max &&
            result.height >= ranges.height.min &&
            result.height <= ranges.height.max &&
            result.landingAngle >= ranges.landingAngle.min &&
            result.landingAngle <= ranges.landingAngle.max &&
            result.flightTime >= ranges.flightTime.min &&
            result.flightTime <= ranges.flightTime.max
        );
    }

    /**
     * Run validation tests and generate report
     */
    public async runValidation(): Promise<void> {
        console.log('Starting validation...');
        const testCases = this.generateTestCases();
        const results: ValidationResult[] = [];
        let advancedModelAvailable = false;

        // Check if advanced model is available
        try {
            advancedModelAvailable = await this.advancedModel.testConnection();
            if (advancedModelAvailable) {
                const version = await this.advancedModel.getVersion();
                console.log(`Advanced Model Connected (Version: ${version})`);
            }
        } catch (error) {
            console.log('Advanced model not available, proceeding with range validation only');
        }

        // Run test cases
        for (const testCase of testCases) {
            console.log(`\nRunning test case: ${testCase.name}`);

            // Get enhanced model result
            const enhancedResult = this.enhancedModel.calculateShot(
                testCase.velocity,
                testCase.spin,
                this.standardBall,
                testCase.environment
            );

            // Check against expected ranges
            const withinRange = this.checkRanges(enhancedResult, testCase.expectedRanges);

            const validationResult: ValidationResult = {
                testCase: testCase.name,
                enhancedResult,
                expectedRanges: testCase.expectedRanges,
                withinRange
            };

            // If advanced model is available, add comparison
            if (advancedModelAvailable) {
                try {
                    const advancedResult = await this.advancedModel.calculateShot(
                        testCase.velocity,
                        testCase.spin,
                        this.standardBall,
                        testCase.environment
                    );

                    validationResult.advancedResult = advancedResult;
                    validationResult.differences = {
                        distance: Math.abs((enhancedResult.distance - advancedResult.distance) / advancedResult.distance),
                        height: Math.abs((enhancedResult.height - advancedResult.height) / advancedResult.height),
                        landingAngle: Math.abs(enhancedResult.landingAngle - advancedResult.landingAngle),
                        flightTime: Math.abs((enhancedResult.flightTime - advancedResult.flightTime) / advancedResult.flightTime)
                    };
                } catch (error) {
                    console.log(`Warning: Advanced model comparison failed for ${testCase.name}`);
                }
            }

            results.push(validationResult);

            // Log progress
            console.log(`  Result: ${withinRange ? 'PASS' : 'FAIL'}`);
            console.log(`  Distance: ${enhancedResult.distance.toFixed(1)} yards (Expected: ${testCase.expectedRanges.distance.min}-${testCase.expectedRanges.distance.max})`);
            console.log(`  Height: ${enhancedResult.height.toFixed(1)} yards (Expected: ${testCase.expectedRanges.height.min}-${testCase.expectedRanges.height.max})`);
            console.log(`  Ball Speed: ${Math.sqrt(testCase.velocity.x * testCase.velocity.x + testCase.velocity.y * testCase.velocity.y).toFixed(1)} m/s`);
            console.log(`  Launch Angle: ${(Math.atan2(testCase.velocity.y, testCase.velocity.x) * 180 / Math.PI).toFixed(1)}°`);
            console.log(`  Spin Rate: ${testCase.spin.rate} rpm`);
        }

        // Generate report
        await this.generateReport(results, advancedModelAvailable);
    }

    /**
     * Generate validation report
     */
    private async generateReport(results: ValidationResult[], advancedModelAvailable: boolean): Promise<void> {
        const reportPath = path.join(__dirname, 'validation-report.md');
        let report = '# Enhanced Model Validation Report\n\n';

        // Ball Properties
        report += `## Golf Ball Properties\n`;
        report += `- Mass: ${(this.standardBall.mass * 1000).toFixed(2)}g\n`;
        report += `- Diameter: ${(this.standardBall.radius * 2 * 1000).toFixed(2)}mm\n`;
        report += `- Drag Coefficient: ${this.standardBall.dragCoefficient}\n`;
        report += `- Lift Coefficient: ${this.standardBall.liftCoefficient}\n`;
        report += `- Magnus Coefficient: ${this.standardBall.magnusCoefficient}\n`;
        report += `- Spin Decay Rate: ${this.standardBall.spinDecayRate}\n\n`;

        // Summary
        const totalTests = results.length;
        const passedTests = results.filter(r => r.withinRange).length;
        report += `## Summary\n`;
        report += `- Total Tests: ${totalTests}\n`;
        report += `- Passed Tests: ${passedTests}\n`;
        report += `- Pass Rate: ${(passedTests / totalTests * 100).toFixed(1)}%\n`;
        report += `- Advanced Model Available: ${advancedModelAvailable ? 'Yes' : 'No'}\n\n`;

        // Expected Ranges
        report += `## Validation Ranges\n`;
        report += `- Distance: Varies by club/conditions\n`;
        report += `- Height: Varies by club/conditions\n`;
        report += `- Landing Angle: Club-specific ranges\n`;
        report += `- Flight Time: Expected ranges\n\n`;

        // Detailed Results
        report += `## Detailed Results\n\n`;
        for (const result of results) {
            report += `### ${result.testCase}\n`;
            report += `Status: ${result.withinRange ? '✅ PASS' : '❌ FAIL'}\n\n`;
            
            report += `Enhanced Model Results:\n`;
            report += `- Distance: ${result.enhancedResult.distance.toFixed(1)} yards (Expected: ${result.expectedRanges.distance.min}-${result.expectedRanges.distance.max})\n`;
            report += `- Height: ${result.enhancedResult.height.toFixed(1)} yards (Expected: ${result.expectedRanges.height.min}-${result.expectedRanges.height.max})\n`;
            report += `- Landing Angle: ${result.enhancedResult.landingAngle.toFixed(1)}° (Expected: ${result.expectedRanges.landingAngle.min}-${result.expectedRanges.landingAngle.max})\n`;
            report += `- Flight Time: ${result.enhancedResult.flightTime.toFixed(2)} seconds (Expected: ${result.expectedRanges.flightTime.min}-${result.expectedRanges.flightTime.max})\n\n`;

            if (result.advancedResult && result.differences) {
                report += `Advanced Model Comparison:\n`;
                report += `- Distance Difference: ${(result.differences.distance * 100).toFixed(1)}%\n`;
                report += `- Height Difference: ${(result.differences.height * 100).toFixed(1)}%\n`;
                report += `- Landing Angle Difference: ${result.differences.landingAngle.toFixed(1)}°\n`;
                report += `- Flight Time Difference: ${(result.differences.flightTime * 100).toFixed(1)}%\n\n`;
            }
        }

        // Write report
        await fs.promises.writeFile(reportPath, report);
        console.log(`\nValidation report written to: ${reportPath}`);
    }
}