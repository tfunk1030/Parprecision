export interface PerformanceMetrics {
    memoryUsage: {
        used: number;
        free: number;
        total: number;
        heapUsage?: number;
    };
    computeTime: number;
    transferTime: number;
}

export class PerformanceMonitor {
    private static _instance: PerformanceMonitor;
    private metrics = new Map<string, number>();
    private operations = new Map<string, number>();
    private computeTimeAccumulator = 0;
    private transferTimeAccumulator = 0;
    private lastResetTime = Date.now();

    private constructor() {}

    public static getInstance(): PerformanceMonitor {
        if (!PerformanceMonitor._instance) {
            PerformanceMonitor._instance = new PerformanceMonitor();
        }
        return PerformanceMonitor._instance;
    }

    async getMemoryUsage(): Promise<PerformanceMetrics['memoryUsage']> {
        const memUsage = process.memoryUsage();
        return {
            used: memUsage.heapUsed,
            free: memUsage.heapTotal - memUsage.heapUsed,
            total: memUsage.heapTotal,
            heapUsage: memUsage.heapUsed
        };
    }

    async trackOperation(name: string, operation: () => Promise<void>): Promise<number> {
        const startTime = performance.now();
        await operation();
        return performance.now() - startTime;
    }

    async getComputeMetrics(): Promise<number> {
        return this.computeTimeAccumulator;
    }

    async getTransferMetrics(): Promise<number> {
        return this.transferTimeAccumulator;
    }

    async trackComputeOperation(operation: () => Promise<void>): Promise<number> {
        const time = await this.trackOperation('compute', operation);
        this.computeTimeAccumulator += time;
        return time;
    }

    async trackTransferOperation(operation: () => Promise<void>): Promise<number> {
        const time = await this.trackOperation('transfer', operation);
        this.transferTimeAccumulator += time;
        return time;
    }

    resetAccumulators(): void {
        this.computeTimeAccumulator = 0;
        this.transferTimeAccumulator = 0;
        this.lastResetTime = Date.now();
    }

    async getDetailedMetrics(): Promise<PerformanceMetrics> {
        const memory = await this.getMemoryUsage();
        const compute = await this.getComputeMetrics();
        const transfer = await this.getTransferMetrics();
        
        return {
            memoryUsage: memory,
            computeTime: compute,
            transferTime: transfer
        };
    }

    logMetrics(metrics: Record<string, number>): void {
        console.log('Performance Metrics:', metrics);
    }

    clearMetrics(): void {
        this.metrics.clear();
        this.operations.clear();
        this.resetAccumulators();
    }

    startOperation(name: string): void {
        this.operations.set(name, performance.now());
    }

    endOperation(name: string): void {
        const startTime = this.operations.get(name);
        if (startTime) {
            const duration = performance.now() - startTime;
            this.metrics.set(name, duration);
            this.operations.delete(name);
            this.computeTimeAccumulator += duration;
        }
    }
}

// Create and export the singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();
