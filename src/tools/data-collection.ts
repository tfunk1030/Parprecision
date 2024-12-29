import { 
    BallState,
    Environment,
    BallProperties,
    TrajectoryResult,
    ValidationMetrics
} from '../core/types';

export interface TestConditions {
    environment: Environment;
    ballProperties: BallProperties;
    initialState: BallState;
}

export interface TrajectoryData {
    timestamp: number;
    conditions: TestConditions;
    trackmanData: TrajectoryResult;
    simulatedData: TrajectoryResult;
    metrics: ValidationMetrics;
    error: {
        carryDistance: number;
        maxHeight: number;
        flightTime: number;
        launchAngle: number;
        spinRate: number;
    };
}

export interface DataCollectionConfig {
    duration: number;  // Duration in minutes
    sampleRate: number;  // Samples per second
    location: {
        latitude: number;
        longitude: number;
        altitude: number;
    };
    sensors: {
        trackman: {
            deviceId: string;
            calibrationData: any;
        };
        weather: {
            deviceId: string;
            updateInterval: number;  // milliseconds
        };
    };
}

export class DataCollector {
    private config: DataCollectionConfig;
    private isCollecting: boolean = false;
    private collectedData: TrajectoryData[] = [];
    private collectionInterval: NodeJS.Timeout | null = null;

    constructor(config: DataCollectionConfig) {
        this.config = config;
    }

    public async startCollection(): Promise<void> {
        if (this.isCollecting) {
            throw new Error('Data collection already in progress');
        }

        this.isCollecting = true;
        console.log('Starting data collection...');

        try {
            await this.initializeSensors();
            this.startAutomaticCollection();
        } catch (error) {
            console.error('Error during data collection:', error);
            this.stopCollection();
            throw error;
        }
    }

    public stopCollection(): void {
        if (this.collectionInterval) {
            clearInterval(this.collectionInterval);
            this.collectionInterval = null;
        }
        this.isCollecting = false;
        console.log('Data collection stopped');
    }

    public addData(data: TrajectoryData): void {
        this.collectedData.push(data);
        this.pruneOldData();
    }

    public getCollectedData(): TrajectoryData[] {
        return [...this.collectedData];
    }

    public async exportData(format: 'csv' | 'json' = 'json'): Promise<string> {
        if (format === 'csv') {
            return this.exportToCsv();
        }
        return JSON.stringify(this.collectedData, null, 2);
    }

    private async initializeSensors(): Promise<void> {
        // Initialize TrackMan connection
        await this.initializeTrackman();
        // Initialize weather station
        await this.initializeWeatherStation();
        console.log('Sensors initialized successfully');
    }

    private async initializeTrackman(): Promise<void> {
        const { deviceId, calibrationData } = this.config.sensors.trackman;
        // TODO: Implement actual TrackMan initialization
        console.log(`Initializing TrackMan device ${deviceId}...`);
    }

    private async initializeWeatherStation(): Promise<void> {
        const { deviceId, updateInterval } = this.config.sensors.weather;
        // TODO: Implement actual weather station initialization
        console.log(`Initializing weather station ${deviceId}...`);
    }

    private startAutomaticCollection(): void {
        const interval = Math.floor(1000 / this.config.sampleRate);
        this.collectionInterval = setInterval(() => {
            if (!this.isCollecting) {
                this.stopCollection();
                return;
            }
            this.collectSample();
        }, interval);
    }

    private async collectSample(): Promise<void> {
        try {
            // TODO: Implement actual data collection from sensors
            // This is a placeholder that would be replaced with real sensor data
            const sampleData: TrajectoryData = {
                timestamp: Date.now(),
                conditions: await this.getCurrentConditions(),
                trackmanData: await this.getTrackmanData(),
                simulatedData: await this.getSimulatedData(),
                metrics: await this.calculateMetrics(),
                error: await this.calculateError()
            };
            this.addData(sampleData);
        } catch (error) {
            console.error('Error collecting sample:', error);
        }
    }

    private async getCurrentConditions(): Promise<TestConditions> {
        // TODO: Implement actual conditions collection
        return {
            environment: {
                temperature: 20,
                pressure: 101325,
                humidity: 0.5,
                altitude: this.config.location.altitude,
                wind: { x: 0, y: 0, z: 0 }
            },
            ballProperties: {
                mass: 0.0459,
                radius: 0.02135,
                area: Math.PI * 0.02135 * 0.02135,
                dragCoefficient: 0.23,
                liftCoefficient: 0.15,
                magnusCoefficient: 0.12,
                spinDecayRate: 100
            },
            initialState: {
                position: { x: 0, y: 0, z: 0 },
                velocity: { x: 0, y: 0, z: 0 },
                spin: {
                    rate: 0,
                    axis: { x: 0, y: 0, z: 0 }
                },
                mass: 0.0459
            }
        };
    }

    private async getTrackmanData(): Promise<TrajectoryResult> {
        // TODO: Implement actual TrackMan data collection
        return {
            points: [],
            metrics: {
                carryDistance: 0,
                maxHeight: 0,
                flightTime: 0,
                timeOfFlight: 0,
                spinRate: 0,
                launchAngle: 0,
                landingAngle: 0,
                totalDistance: 0,
                launchDirection: 0,
                ballSpeed: 0
            }
        };
    }

    private async getSimulatedData(): Promise<TrajectoryResult> {
        // TODO: Implement actual simulation
        return {
            points: [],
            metrics: {
                carryDistance: 0,
                maxHeight: 0,
                flightTime: 0,
                spinRate: 0,
                launchAngle: 0,
                landingAngle: 0,
                timeOfFlight: 0,
                totalDistance: 0,
                launchDirection: 0,
                ballSpeed: 0
            }
        };
    }

    private async calculateMetrics(): Promise<ValidationMetrics> {
        // TODO: Implement actual metrics calculation
        return {
            carryDistance: 0,
            maxHeight: 0,
            flightTime: 0,
            launchAngle: 0,
            landingAngle: 0,
            spinRate: 0
        };
    }

    private async calculateError(): Promise<{
        carryDistance: number;
        maxHeight: number;
        flightTime: number;
        launchAngle: number;
        spinRate: number;
    }> {
        // TODO: Implement actual error calculation
        return {
            carryDistance: 0,
            maxHeight: 0,
            flightTime: 0,
            launchAngle: 0,
            spinRate: 0
        };
    }

    private pruneOldData(): void {
        const cutoffTime = Date.now() - (this.config.duration * 60 * 1000);
        this.collectedData = this.collectedData.filter(d => d.timestamp >= cutoffTime);
    }

    private exportToCsv(): string {
        if (this.collectedData.length === 0) {
            return '';
        }

        // Get headers from first data point
        const headers = this.getFlattenedHeaders(this.collectedData[0]);
        const rows = this.collectedData.map(data => this.flattenDataToRow(data, headers));

        return [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
    }

    private getFlattenedHeaders(data: TrajectoryData): string[] {
        const headers: string[] = ['timestamp'];
        
        // Add all possible headers by flattening the object structure
        const addHeaders = (obj: any, prefix = '') => {
            for (const key in obj) {
                const value = obj[key];
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    addHeaders(value, `${prefix}${key}_`);
                } else {
                    headers.push(`${prefix}${key}`);
                }
            }
        };

        addHeaders(data.conditions, 'conditions_');
        addHeaders(data.trackmanData, 'trackman_');
        addHeaders(data.simulatedData, 'simulated_');
        addHeaders(data.metrics, 'metrics_');
        addHeaders(data.error, 'error_');

        return headers;
    }

    private flattenDataToRow(data: TrajectoryData, headers: string[]): (string | number)[] {
        const row: (string | number)[] = [];
        
        for (const header of headers) {
            let value: any = data;
            const parts = header.split('_');
            
            for (const part of parts) {
                if (value && typeof value === 'object') {
                    value = value[part];
                } else {
                    value = null;
                    break;
                }
            }

            row.push(value !== null && value !== undefined ? value : '');
        }

        return row;
    }
}