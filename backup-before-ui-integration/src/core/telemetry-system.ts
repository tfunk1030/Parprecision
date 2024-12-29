import { performanceMonitor } from './performance-monitor';
import { RealTimeMonitor } from './real-time-monitor';
import { EventEmitter } from 'events';
import * as os from 'os';

// Resource usage interface
export interface ResourceUsage {
    timestamp: number;
    cpu: {
        usage: number;
        temperature?: number;
        loadAverage: number[];
        threadUtilization: number;
    };
    memory: {
        used: number;
        free: number;
        total: number;
        heapUsage: number;
        gcMetrics: {
            collections: number;
            pauseTime: number;
        };
    };
    io: {
        reads: number;
        writes: number;
        throughput: number;
    };
}

interface Timeline {
    metric: string;
    dataPoints: {
        timestamp: number;
        value: number;
        metadata?: Record<string, any>;
    }[];
    statistics: {
        min: number;
        max: number;
        mean: number;
        stdDev: number;
        trend: number;
    };
}

interface Bottleneck {
    id: string;
    type: 'cpu' | 'memory' | 'disk' | 'network' | 'thread' | 'cache';
    severity: 'low' | 'medium' | 'high';
    metric: string;
    value: number;
    threshold: number;
    timestamp: number;
    duration: number;
    impact: {
        performance: number;
        reliability: number;
        resource: string;
    };
    context: Record<string, any>;
}

interface TelemetryData {
    resourceMetrics: ResourceUsage[];
    performanceTimelines: Timeline[];
    bottleneckIndicators: Bottleneck[];
}

interface HealthStatus {
    status: 'healthy' | 'degraded' | 'critical';
    components: {
        name: string;
        status: 'healthy' | 'degraded' | 'critical';
        metrics: Record<string, number>;
        lastCheck: number;
    }[];
    bottlenecks: Bottleneck[];
    recommendations: string[];
}

export class TelemetrySystem extends EventEmitter {
    private static instance: TelemetrySystem;
    private readonly monitor = performanceMonitor;
    private readonly realTimeMonitor: RealTimeMonitor;
    private readonly timelines: Map<string, Timeline> = new Map();
    private readonly bottlenecks: Bottleneck[] = [];
    private readonly resourceHistory: ResourceUsage[] = [];
    private collectionInterval: NodeJS.Timeout | null = null;
    private readonly maxHistorySize = 3600; // 1 hour at 1 sample/second
    private readonly cpuThresholds = {
        warning: 70,
        critical: 85
    };
    private readonly memoryThresholds = {
        warning: 80,
        critical: 90
    };

    private constructor() {
        super();
        this.realTimeMonitor = RealTimeMonitor.getInstance();
        this.initializeTimelines();
        this.startCollection();
        
        // Log initial metrics with numeric values
        performanceMonitor.logMetrics({
            'resource_alert_count': 0,
            'resource_alert_severity': 0
        });
        
        this.setupEventListeners();
    }

    public static getInstance(): TelemetrySystem {
        if (!TelemetrySystem.instance) {
            TelemetrySystem.instance = new TelemetrySystem();
        }
        return TelemetrySystem.instance;
    }

    private initializeTimelines() {
        // CPU timelines
        this.createTimeline('cpu_usage');
        this.createTimeline('cpu_temperature');
        this.createTimeline('load_average');

        // Memory timelines
        this.createTimeline('memory_used');
        this.createTimeline('heap_used');
        this.createTimeline('gc_collections');
    }

    private createTimeline(metric: string): void {
        this.timelines.set(metric, {
            metric,
            dataPoints: [],
            statistics: {
                min: Infinity,
                max: -Infinity,
                mean: 0,
                stdDev: 0,
                trend: 0
            }
        });
    }

    private startCollection(): void {
        if (this.collectionInterval) {
            clearInterval(this.collectionInterval);
        }

        this.collectionInterval = setInterval(() => {
            this.collectMetrics();
        }, 1000); // Collect every second
    }

    private setupEventListeners(): void {
        this.realTimeMonitor.on('bottleneck', (bottleneck: Bottleneck) => {
            this.addBottleneck(bottleneck);
        });
    }

    private async collectMetrics(): Promise<void> {
        const usage = await this.collectResourceUsage();
        
        this.resourceHistory.push(usage);
        if (this.resourceHistory.length > this.maxHistorySize) {
            this.resourceHistory.shift();
        }

        this.updateTimelines(usage);
        this.detectBottlenecks(usage);
        this.checkSystemHealth(usage);

        this.emit('metrics_collected', usage);
    }

    private async collectResourceUsage(): Promise<ResourceUsage> {
        const cpuUsage = process.cpuUsage();
        const memUsage = process.memoryUsage();
        const loadAvg = os.loadavg();

        const threadUtilization = os.cpus().reduce((acc, cpu) => {
            const total = Object.values(cpu.times).reduce((sum, time) => sum + time, 0);
            const idle = cpu.times.idle;
            return acc + ((total - idle) / total);
        }, 0) / os.cpus().length;

        return {
            timestamp: Date.now(),
            cpu: {
                usage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to seconds
                loadAverage: loadAvg,
                threadUtilization: threadUtilization * 100 // Convert to percentage
            },
            memory: {
                total: os.totalmem(),
                free: os.freemem(),
                used: os.totalmem() - os.freemem(),
                heapUsage: memUsage.heapUsed,
                gcMetrics: {
                    collections: 0, // Placeholder
                    pauseTime: 0 // Placeholder
                }
            },
            io: {
                reads: 0, // Placeholder
                writes: 0, // Placeholder
                throughput: 0 // Placeholder
            }
        };
    }

    private updateTimelines(usage: ResourceUsage): void {
        // Update CPU timelines
        this.updateTimelinePoint('cpu_usage', usage.timestamp, usage.cpu.usage);
        if (usage.cpu.temperature !== undefined) {
            this.updateTimelinePoint('cpu_temperature', usage.timestamp, usage.cpu.temperature);
        }
        this.updateTimelinePoint('load_average', usage.timestamp, usage.cpu.loadAverage[0]);

        // Update Memory timelines
        this.updateTimelinePoint('memory_used', usage.timestamp, usage.memory.used);
        this.updateTimelinePoint('heap_used', usage.timestamp, usage.memory.heapUsage);
        this.updateTimelinePoint('gc_collections', usage.timestamp, usage.memory.gcMetrics.collections);

        // Update statistics for each timeline
        for (const timeline of this.timelines.values()) {
            this.updateStatistics(timeline);
        }
    }

    private updateTimelinePoint(metric: string, timestamp: number, value: number, metadata?: Record<string, any>): void {
        const timeline = this.timelines.get(metric);
        if (!timeline) return;

        timeline.dataPoints.push({ timestamp, value, metadata });
        if (timeline.dataPoints.length > this.maxHistorySize) {
            timeline.dataPoints.shift();
        }
    }

    private updateStatistics(timeline: Timeline): void {
        const values = timeline.dataPoints.map(p => p.value);
        if (values.length === 0) return;

        const min = Math.min(...values);
        const max = Math.max(...values);
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const stdDev = Math.sqrt(
            values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length
        );

        // Calculate trend using simple linear regression
        const xValues = timeline.dataPoints.map(p => p.timestamp);
        const yValues = values;
        const xMean = xValues.reduce((a, b) => a + b, 0) / xValues.length;
        const yMean = mean;
        const numerator = xValues.reduce((acc, x, i) => 
            acc + (x - xMean) * (yValues[i] - yMean), 0);
        const denominator = xValues.reduce((acc, x) => 
            acc + Math.pow(x - xMean, 2), 0);
        const trend = numerator / denominator;

        timeline.statistics = { min, max, mean, stdDev, trend };
    }

    private detectBottlenecks(usage: ResourceUsage): void {
        // Check CPU bottlenecks
        if (usage.cpu.usage > this.cpuThresholds.critical) {
            this.addBottleneck({
                id: `cpu_${usage.timestamp}`,
                type: 'cpu',
                severity: 'high',
                metric: 'usage',
                value: usage.cpu.usage,
                threshold: this.cpuThresholds.critical,
                timestamp: usage.timestamp,
                duration: 0,
                impact: {
                    performance: 0.8,
                    reliability: 0.6,
                    resource: 'cpu'
                },
                context: {
                    loadAverage: usage.cpu.loadAverage,
                    threadUtilization: usage.cpu.threadUtilization
                }
            });
        }

        // Check Memory bottlenecks
        const memoryUsagePercent = (usage.memory.used / usage.memory.total) * 100;
        if (memoryUsagePercent > this.memoryThresholds.critical) {
            this.addBottleneck({
                id: `memory_${usage.timestamp}`,
                type: 'memory',
                severity: 'high',
                metric: 'usage',
                value: memoryUsagePercent,
                threshold: this.memoryThresholds.critical,
                timestamp: usage.timestamp,
                duration: 0,
                impact: {
                    performance: 0.7,
                    reliability: 0.8,
                    resource: 'memory'
                },
                context: {
                    free: usage.memory.free,
                    heapUsage: usage.memory.heapUsage,
                    gcMetrics: usage.memory.gcMetrics
                }
            });
        }
    }

    private addBottleneck(bottleneck: Bottleneck): void {
        this.bottlenecks.push(bottleneck);
        this.emit('bottleneck_detected', bottleneck);

        // Keep only recent bottlenecks
        const fiveMinutesAgo = Date.now() - 300000;
        this.bottlenecks.filter(b => b.timestamp >= fiveMinutesAgo);
    }

    private checkSystemHealth(usage: ResourceUsage): void {
        const components = [
            this.checkComponentHealth('CPU', usage.cpu),
            this.checkComponentHealth('Memory', usage.memory)
        ];

        const status = components.some(c => c.status === 'critical') ? 'critical' :
                      components.some(c => c.status === 'degraded') ? 'degraded' : 'healthy';

        const healthStatus: HealthStatus = {
            status,
            components,
            bottlenecks: [...this.bottlenecks],
            recommendations: this.generateRecommendations(components)
        };

        this.emit('health_status', healthStatus);
    }

    private checkComponentHealth(
        name: string, 
        metrics: Record<string, any>
    ): HealthStatus['components'][0] {
        let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
        const componentMetrics: Record<string, number> = {};

        switch (name) {
            case 'CPU':
                componentMetrics.usage = metrics.usage;
                if (metrics.usage > this.cpuThresholds.critical) {
                    status = 'critical';
                } else if (metrics.usage > this.cpuThresholds.warning) {
                    status = 'degraded';
                }
                break;

            case 'Memory':
                const usagePercent = (metrics.used / metrics.total) * 100;
                componentMetrics.usagePercent = usagePercent;
                if (usagePercent > this.memoryThresholds.critical) {
                    status = 'critical';
                } else if (usagePercent > this.memoryThresholds.warning) {
                    status = 'degraded';
                }
                break;
        }

        return {
            name,
            status,
            metrics: componentMetrics,
            lastCheck: Date.now()
        };
    }

    private generateRecommendations(
        components: HealthStatus['components']
    ): string[] {
        const recommendations: string[] = [];

        for (const component of components) {
            if (component.status === 'critical') {
                switch (component.name) {
                    case 'CPU':
                        recommendations.push(
                            'Consider scaling CPU resources or optimizing CPU-intensive operations'
                        );
                        break;
                    case 'Memory':
                        recommendations.push(
                            'Review memory usage patterns and consider implementing memory optimization strategies'
                        );
                        break;
                }
            }
        }

        return recommendations;
    }

    public getTelemetryData(): TelemetryData {
        return {
            resourceMetrics: [...this.resourceHistory],
            performanceTimelines: Array.from(this.timelines.values()),
            bottleneckIndicators: [...this.bottlenecks]
        };
    }

    public getTimeline(metric: string): Timeline | null {
        return this.timelines.get(metric) || null;
    }

    public getBottlenecks(): Bottleneck[] {
        return [...this.bottlenecks];
    }

    public stop(): void {
        if (this.collectionInterval) {
            clearInterval(this.collectionInterval);
            this.collectionInterval = null;
        }
    }
}
