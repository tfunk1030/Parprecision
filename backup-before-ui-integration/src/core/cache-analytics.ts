import { performanceMonitor } from './performance-monitor';
import { CacheManager } from './cache-manager';

interface CacheMetrics {
    hitRate: number;
    missRate: number;
    evictionRate: number;
    averageAccessTime: number;
    memoryUsage: number;
    entryCount: number;
}

interface CachePattern {
    type: string;
    confidence: number;
    description: string;
    metrics: {
        value: number;
        threshold: number;
        trend: number;
    };
}

interface PerformanceInsight {
    type: 'optimization' | 'warning' | 'critical';
    message: string;
    metrics: Record<string, number>;
    recommendation: string;
}

interface CacheAnalyticsData {
    overallStats: {
        hitRate: number;
        entryCount: number;
    };
    memoryStats: {
        currentUsage: number;
    };
    performanceStats: {
        evictionRate: number;
    };
}

export class CacheAnalytics {
    private static instance: CacheAnalytics;
    private monitor!: any;
    private cache!: CacheManager;
    private readonly metrics: Map<string, number[]> = new Map();
    private readonly patterns: CachePattern[] = [];
    private readonly insights: PerformanceInsight[] = [];
    private collectionInterval: NodeJS.Timeout | null = null;

    private constructor() {
        if (CacheAnalytics.instance) {
            return CacheAnalytics.instance;
        }
        CacheAnalytics.instance = this;
        this.initialize();
    }

    private initialize(): void {
        this.cache = CacheManager.getInstance();
        this.monitor = performanceMonitor;
        this.startPeriodicCollection();
    }

    public static getInstance(): CacheAnalytics {
        if (!CacheAnalytics.instance) {
            CacheAnalytics.instance = new CacheAnalytics();
        }
        return CacheAnalytics.instance;
    }

    private startPeriodicCollection(): void {
        if (this.collectionInterval) {
            clearInterval(this.collectionInterval);
        }

        this.collectionInterval = setInterval(() => {
            this.collectMetrics();
        }, 60000); // Collect every minute
    }

    private collectMetrics(): void {
        const stats = this.cache.getStats();
        const timestamp = Date.now();

        this.updateMetric('hitRate', stats.hitRate);
        this.updateMetric('memoryUsage', stats.memoryUsage);
        this.updateMetric('entryCount', stats.entryCount);

        this.monitor.logMetrics({
            cache_hit_rate: stats.hitRate,
            cache_memory_usage: stats.memoryUsage,
            cache_entry_count: stats.entryCount
        });

        this.analyzePatterns();
        this.generateInsights();
    }

    private updateMetric(name: string, value: number): void {
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        const values = this.metrics.get(name)!;
        values.push(value);

        // Keep last hour of data (60 samples at 1 per minute)
        if (values.length > 60) {
            values.shift();
        }
    }

    private analyzePatterns(): void {
        this.patterns.length = 0; // Clear existing patterns

        // Analyze hit rate trend
        const hitRates = this.metrics.get('hitRate') || [];
        if (hitRates.length >= 5) {
            const recentHitRates = hitRates.slice(-5);
            const avgHitRate = recentHitRates.reduce((a, b) => a + b, 0) / 5;
            const trend = this.calculateTrend(recentHitRates);

            if (avgHitRate < 0.8) {
                this.patterns.push({
                    type: 'low_hit_rate',
                    confidence: 0.9,
                    description: 'Cache hit rate is below optimal levels',
                    metrics: {
                        value: avgHitRate,
                        threshold: 0.8,
                        trend
                    }
                });
            }
        }

        // Analyze memory usage
        const memoryUsage = this.metrics.get('memoryUsage') || [];
        if (memoryUsage.length >= 5) {
            const recentUsage = memoryUsage.slice(-5);
            const avgUsage = recentUsage.reduce((a, b) => a + b, 0) / 5;
            const trend = this.calculateTrend(recentUsage);

            if (trend > 0.1) {
                this.patterns.push({
                    type: 'increasing_memory_usage',
                    confidence: 0.85,
                    description: 'Memory usage is showing an upward trend',
                    metrics: {
                        value: avgUsage,
                        threshold: 0,
                        trend
                    }
                });
            }
        }
    }

    private calculateTrend(values: number[]): number {
        if (values.length < 2) return 0;
        
        const n = values.length;
        const xMean = (n - 1) / 2;
        const yMean = values.reduce((a, b) => a + b, 0) / n;

        let numerator = 0;
        let denominator = 0;

        for (let i = 0; i < n; i++) {
            const x = i - xMean;
            const y = values[i] - yMean;
            numerator += x * y;
            denominator += x * x;
        }

        return denominator === 0 ? 0 : numerator / denominator;
    }

    private generateInsights(): void {
        this.insights.length = 0; // Clear existing insights

        for (const pattern of this.patterns) {
            switch (pattern.type) {
                case 'low_hit_rate':
                    this.insights.push({
                        type: 'optimization',
                        message: 'Cache hit rate is below optimal levels',
                        metrics: {
                            current_hit_rate: pattern.metrics.value,
                            target_hit_rate: pattern.metrics.threshold
                        },
                        recommendation: 'Consider adjusting cache size or implementing predictive preloading'
                    });
                    break;

                case 'increasing_memory_usage':
                    this.insights.push({
                        type: 'warning',
                        message: 'Memory usage is trending upward',
                        metrics: {
                            memory_growth_rate: pattern.metrics.trend,
                            current_usage: pattern.metrics.value
                        },
                        recommendation: 'Review cache eviction policy and consider implementing size-based limits'
                    });
                    break;
            }
        }
    }

    public getMetrics(): CacheMetrics {
        const stats = this.cache.getStats();
        return {
            hitRate: stats.hitRate,
            missRate: 1 - stats.hitRate,
            evictionRate: 0, // TODO: Track evictions
            averageAccessTime: 0, // TODO: Track access times
            memoryUsage: stats.memoryUsage,
            entryCount: stats.entryCount
        };
    }

    public getPatterns(): CachePattern[] {
        return [...this.patterns];
    }

    public getInsights(): PerformanceInsight[] {
        return [...this.insights];
    }

    public getAnalytics(): CacheAnalyticsData {
        const stats = this.cache.getStats();
        return {
            overallStats: {
                hitRate: stats.hitRate,
                entryCount: stats.entryCount
            },
            memoryStats: {
                currentUsage: stats.memoryUsage
            },
            performanceStats: {
                evictionRate: 0 // TODO: Track evictions
            }
        };
    }

    public stop(): void {
        if (this.collectionInterval) {
            clearInterval(this.collectionInterval);
            this.collectionInterval = null;
        }
    }
}
