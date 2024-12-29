import { TrajectoryData } from './data-collection';
import { ValidationMetrics, TrajectoryResult } from '../core/types';

type MetricKey = 'carryDistance' | 'maxHeight' | 'flightTime' | 'launchAngle' | 'spinRate';

interface DashboardConfig {
    updateInterval: number;  // milliseconds
    retentionPeriod: number;  // minutes
    errorThresholds: Record<MetricKey, number>;
}

interface MetricsSummary {
    mean: number;
    stdDev: number;
    min: number;
    max: number;
    count: number;
}

export class ValidationDashboard {
    private config: DashboardConfig;
    private data: TrajectoryData[] = [];
    private updateInterval: NodeJS.Timeout | null = null;

    constructor(config: DashboardConfig) {
        this.config = config;
    }

    public start(): void {
        if (this.updateInterval) {
            throw new Error('Dashboard already running');
        }

        this.updateInterval = setInterval(() => {
            this.update();
        }, this.config.updateInterval);
    }

    public stop(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    public addData(data: TrajectoryData): void {
        this.data.push(data);
        this.pruneOldData();
    }

    public displayRealTimeMetrics(): void {
        const metrics = this.calculateMetricsSummaries();
        console.log('\nReal-Time Metrics Summary:');
        console.log('=========================');
        
        for (const [metric, summary] of Object.entries(metrics)) {
            console.log(`\n${metric}:`);
            console.log(`  Mean: ${summary.mean.toFixed(2)}`);
            console.log(`  Std Dev: ${summary.stdDev.toFixed(2)}`);
            console.log(`  Min: ${summary.min.toFixed(2)}`);
            console.log(`  Max: ${summary.max.toFixed(2)}`);
            console.log(`  Sample Count: ${summary.count}`);
        }
    }

    public compareWithTrackman(): void {
        const errors = this.calculateTrackmanErrors();
        console.log('\nTrackMan Comparison:');
        console.log('===================');
        
        for (const metric of Object.keys(errors) as MetricKey[]) {
            const error = errors[metric];
            const threshold = this.config.errorThresholds[metric];
            const status = error <= threshold ? '✓' : '✗';
            
            console.log(`${metric}:`);
            console.log(`  Error: ${error.toFixed(2)}%`);
            console.log(`  Threshold: ${threshold}%`);
            console.log(`  Status: ${status}`);
        }
    }

    public showErrorRates(): void {
        const errorRates = this.calculateErrorRates();
        console.log('\nError Rates:');
        console.log('============');
        
        for (const metric of Object.keys(errorRates) as MetricKey[]) {
            const rate = errorRates[metric];
            console.log(`${metric}: ${(rate * 100).toFixed(2)}% exceeded threshold`);
        }
    }

    private update(): void {
        this.pruneOldData();
        this.displayRealTimeMetrics();
        this.compareWithTrackman();
        this.showErrorRates();
    }

    private pruneOldData(): void {
        const cutoff = Date.now() - (this.config.retentionPeriod * 60 * 1000);
        this.data = this.data.filter(d => d.timestamp >= cutoff);
    }

    private calculateMetricsSummaries(): Record<string, MetricsSummary> {
        const metrics: MetricKey[] = ['carryDistance', 'maxHeight', 'flightTime', 'launchAngle', 'spinRate'];
        const summaries: Record<MetricKey, MetricsSummary> = {} as Record<MetricKey, MetricsSummary>;

        for (const metric of metrics) {
            const values = this.data.map(d => d.metrics[metric]);
            summaries[metric] = this.calculateSummary(values);
        }

        return summaries;
    }

    private calculateSummary(values: number[]): MetricsSummary {
        if (values.length === 0) {
            return {
                mean: 0,
                stdDev: 0,
                min: 0,
                max: 0,
                count: 0
            };
        }

        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squaredDiffs = values.map(x => Math.pow(x - mean, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;

        return {
            mean,
            stdDev: Math.sqrt(variance),
            min: Math.min(...values),
            max: Math.max(...values),
            count: values.length
        };
    }

    private calculateTrackmanErrors(): Record<MetricKey, number> {
        const metrics: MetricKey[] = ['carryDistance', 'maxHeight', 'flightTime', 'launchAngle', 'spinRate'];
        const errors: Record<MetricKey, number> = {} as Record<MetricKey, number>;

        for (const metric of metrics) {
            const percentErrors = this.data.map(d => {
                const simulated = d.simulatedData.metrics?.[metric];
                const trackman = d.trackmanData.metrics?.[metric];
                
                if (typeof simulated === 'number' && typeof trackman === 'number' && trackman !== 0) {
                    return Math.abs((simulated - trackman) / trackman) * 100;
                }
                return 0;
            });

            errors[metric] = percentErrors.reduce((a, b) => a + b, 0) / percentErrors.length;
        }

        return errors;
    }

    private calculateErrorRates(): Record<MetricKey, number> {
        const metrics: MetricKey[] = ['carryDistance', 'maxHeight', 'flightTime', 'launchAngle', 'spinRate'];
        const rates: Record<MetricKey, number> = {} as Record<MetricKey, number>;

        for (const metric of metrics) {
            const threshold = this.config.errorThresholds[metric];
            const exceedCount = this.data.filter(d => {
                const error = Math.abs(d.error[metric]);
                return error > threshold;
            }).length;

            rates[metric] = exceedCount / this.data.length;
        }

        return rates;
    }
}