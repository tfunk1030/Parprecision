import { 
    ShotParameters, 
    ShotResult, 
    ParameterRanges,
    Point3D,
    TrajectoryPoint
} from './types';
import { AdvancedModelInterface } from '../enhanced-model/advanced-model-interface';
import { ResultConverter } from './result-converter';

/**
 * Generates a matrix of shot results using the advanced model
 */
export class ShotMatrixGenerator {
    private readonly advancedModel: AdvancedModelInterface;

    // Default parameter ranges based on real-world data
    private readonly defaultRanges: ParameterRanges = {
        clubSpeed: { min: 60, max: 120, step: 5 },    // mph
        launchAngle: { min: 0, max: 30, step: 2 },    // degrees
        spinRate: { min: 2000, max: 7000, step: 500 },// rpm
        temperature: { min: 40, max: 100, step: 10 }, // °F
        altitude: { min: 0, max: 10000, step: 1000 }, // feet
        humidity: { min: 0, max: 1, step: 0.2 },      // 0-1
        windSpeed: { min: 0, max: 30, step: 5 },      // mph
        windDirection: { min: 0, max: 360, step: 45 } // degrees
    };

    constructor() {
        this.advancedModel = new AdvancedModelInterface();
    }

    /**
     * Generate parameter combinations efficiently
     */
    private *generateParameterCombinations(ranges: ParameterRanges = this.defaultRanges): Generator<ShotParameters> {
        // Primary parameters (generate all combinations)
        for (let speed = ranges.clubSpeed.min; speed <= ranges.clubSpeed.max; speed += ranges.clubSpeed.step) {
            for (let angle = ranges.launchAngle.min; angle <= ranges.launchAngle.max; angle += ranges.launchAngle.step) {
                for (let spin = ranges.spinRate.min; spin <= ranges.spinRate.max; spin += ranges.spinRate.step) {
                    // Base parameters with standard conditions
                    const baseParams: ShotParameters = {
                        clubSpeed: speed,
                        launchAngle: angle,
                        spinRate: spin,
                        spinAxis: { x: 0, y: 1, z: 0 }, // Pure backspin
                        temperature: 70,
                        pressure: 29.92,
                        altitude: 0,
                        humidity: 0.5,
                        windSpeed: 0,
                        windDirection: 0
                    };

                    // Yield base case
                    yield baseParams;

                    // Environmental variations (selective combinations)
                    if (speed === ranges.clubSpeed.max) {
                        // Temperature variations
                        for (let temp = ranges.temperature.min; temp <= ranges.temperature.max; temp += ranges.temperature.step) {
                            if (temp !== 70) { // Skip standard temperature
                                yield { ...baseParams, temperature: temp };
                            }
                        }

                        // Altitude variations
                        for (let alt = ranges.altitude.min; alt <= ranges.altitude.max; alt += ranges.altitude.step) {
                            if (alt !== 0) { // Skip sea level
                                yield { ...baseParams, altitude: alt };
                            }
                        }
                    }

                    // Wind variations (more combinations for higher speeds)
                    if (speed >= 90) { // Only for faster shots
                        for (let windSpeed = ranges.windSpeed.min; windSpeed <= ranges.windSpeed.max; windSpeed += ranges.windSpeed.step) {
                            if (windSpeed === 0) continue; // Skip no wind
                            for (let windDir = ranges.windDirection.min; windDir < ranges.windDirection.max; windDir += ranges.windDirection.step) {
                                yield {
                                    ...baseParams,
                                    windSpeed,
                                    windDirection: windDir
                                };
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Generate shot matrix with progress tracking
     */
    public async generateShotMatrix(
        ranges: ParameterRanges = this.defaultRanges,
        progressCallback?: (progress: number, total: number) => void
    ): Promise<Map<string, ShotResult>> {
        // Initialize results storage
        const results = new Map<string, ShotResult>();
        
        // Calculate total combinations (approximate)
        const totalCombinations = this.calculateTotalCombinations(ranges);
        let processed = 0;

        // Check advanced model connection
        const connected = await this.advancedModel.testConnection();
        if (!connected) {
            throw new Error('Cannot connect to advanced model API');
        }

        // Process parameter combinations
        for (const params of this.generateParameterCombinations(ranges)) {
            try {
                // Get result from advanced model
                const advancedResult = await this.advancedModel.calculateShot(
                    this.convertVelocityToVector(params.clubSpeed, params.launchAngle),
                    {
                        rate: params.spinRate,
                        axis: params.spinAxis
                    },
                    {
                        mass: 0.04593,      // 45.93g standard golf ball
                        radius: 0.02135,    // 21.35mm radius
                        area: Math.PI * 0.02135 * 0.02135,
                        dragCoefficient: 0.25,
                        liftCoefficient: 0.21,
                        magnusCoefficient: 0.35,
                        spinDecayRate: 0.025
                    },
                    {
                        temperature: params.temperature,
                        pressure: params.pressure,
                        altitude: params.altitude,
                        humidity: params.humidity,
                        wind: this.convertWindToVector(params.windSpeed, params.windDirection)
                    }
                );

                // Convert advanced result to our format
                const result = ResultConverter.convertResult(advancedResult);

                // Store result
                results.set(this.generateKey(params), result);

                // Update progress
                processed++;
                if (progressCallback) {
                    progressCallback(processed, totalCombinations);
                }
            } catch (error) {
                console.error(`Error calculating shot for params:`, params, error);
            }

            // Add small delay to prevent overwhelming the advanced model
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        return results;
    }

    /**
     * Generate unique key for parameter combination
     */
    private generateKey(params: ShotParameters): string {
        return JSON.stringify({
            speed: Math.round(params.clubSpeed),
            angle: Math.round(params.launchAngle * 10) / 10,
            spin: Math.round(params.spinRate / 100) * 100,
            temp: Math.round(params.temperature),
            alt: Math.round(params.altitude / 100) * 100,
            wind: Math.round(params.windSpeed),
            dir: Math.round(params.windDirection / 5) * 5
        });
    }

    /**
     * Calculate total number of combinations
     */
    private calculateTotalCombinations(ranges: ParameterRanges): number {
        const speedSteps = Math.ceil((ranges.clubSpeed.max - ranges.clubSpeed.min) / ranges.clubSpeed.step);
        const angleSteps = Math.ceil((ranges.launchAngle.max - ranges.launchAngle.min) / ranges.launchAngle.step);
        const spinSteps = Math.ceil((ranges.spinRate.max - ranges.spinRate.min) / ranges.spinRate.step);
        
        // Base combinations
        let total = speedSteps * angleSteps * spinSteps;

        // Environmental variations
        const envCombinations = 
            Math.ceil((ranges.temperature.max - ranges.temperature.min) / ranges.temperature.step) +
            Math.ceil((ranges.altitude.max - ranges.altitude.min) / ranges.altitude.step);
        
        // Wind variations (only for higher speeds)
        const windCombinations = 
            Math.ceil((ranges.windSpeed.max - ranges.windSpeed.min) / ranges.windSpeed.step) *
            Math.ceil((ranges.windDirection.max - ranges.windDirection.min) / ranges.windDirection.step);
        
        // Add environmental and wind combinations
        total += envCombinations + (speedSteps / 2) * windCombinations;

        return total;
    }

    /**
     * Convert speed and angle to velocity vector
     */
    private convertVelocityToVector(speed: number, angle: number): Point3D {
        const radians = angle * Math.PI / 180;
        return {
            x: speed * Math.cos(radians),
            y: speed * Math.sin(radians),
            z: 0
        };
    }

    /**
     * Convert wind speed and direction to vector
     */
    private convertWindToVector(speed: number, direction: number): Point3D {
        const radians = direction * Math.PI / 180;
        return {
            x: speed * Math.sin(radians), // Wind direction 0° is North
            y: 0,
            z: speed * Math.cos(radians)
        };
    }
}