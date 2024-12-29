import * as tf from '@tensorflow/tfjs-node-gpu';
import { MemoryManager, MemoryStats } from './memory-manager';
import { DeviceManager } from './device-manager';

export interface PerformanceMetrics {
    computeTime: number;
    transferTime: number;
    gpuUtilization: number;
    memoryStats: MemoryStats;
    deviceMetrics: {
        load: number;
        temperature?: number;
        memoryUsage: number;
        computeUtilization: number;
    };
    tensorStats: {
        activeCount: number;
        totalAllocated: number;
        peakMemory: number;
    };
    pipelineStats: {
        cacheHits: number;
        cacheMisses: number;
        averageComputeTime: number;
    };
}

export class PerformanceMonitor {
    private static instance?: PerformanceMonitor;
    private readonly memoryManager: MemoryManager;
    private readonly deviceManager: DeviceManager;
    
    private frameCount: number = 0;
    private lastFrameTime: number = 0;
    private frameTimestamps: number[] = [];
    private pipelineStats = {
        cacheHits: 0,
        cacheMisses: 0,
        computeTimes: [] as number[]
    };

    private constructor() {
        this.memoryManager = MemoryManager.getInstance();
        this.deviceManager = DeviceManager.getInstance();
        this.startMonitoring();
    }

    public static async getInstance(): Promise<PerformanceMonitor> {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
            await PerformanceMonitor.instance.deviceManager.selectDevice();
        }
        return PerformanceMonitor.instance;
    }

    public async getMemoryUsage(): Promise<MemoryStats> {
        const stats = this.memoryManager.getMemoryStats();
        const tfMemory = tf.memory();
        return {
            numTensors: tfMemory.numTensors,
            numBytes: tfMemory.numBytes,
            numDataBuffers: tfMemory.numDataBuffers,
            poolSize: stats.poolSize,
            unreliable: stats.unreliable
        };
    }

    public async getCPUUsage(): Promise<number> {
        const deviceInfo = await this.deviceManager.getDeviceInfo();
        return deviceInfo.load;
    }

    public recordCacheHit(operationId: string): void {
        this.pipelineStats.cacheHits++;
    }

    public recordCacheMiss(operationId: string): void {
        this.pipelineStats.cacheMisses++;
    }

    private startMonitoring(): void {
        // Monitor frame rate and performance metrics
        const monitorLoop = () => {
            this.updateFrameStats();
            if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
                window.requestAnimationFrame(monitorLoop);
            } else {
                setTimeout(monitorLoop, 16); // ~60fps in Node.js
            }
        };
        
        if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
            window.requestAnimationFrame(monitorLoop);
        } else {
            setTimeout(monitorLoop, 16);
        }
    }

    private updateFrameStats(): void {
        const now = performance.now();
        this.frameCount++;

        // Update frame timestamps
        this.frameTimestamps.push(now);
        // Keep only last second of timestamps
        const oneSecondAgo = now - 1000;
        this.frameTimestamps = this.frameTimestamps.filter(t => t > oneSecondAgo);

        // Calculate frame time
        if (this.lastFrameTime) {
            const frameTime = now - this.lastFrameTime;
            this.pipelineStats.computeTimes.push(frameTime);
            // Keep only last 100 frame times
            if (this.pipelineStats.computeTimes.length > 100) {
                this.pipelineStats.computeTimes.shift();
            }
        }
        this.lastFrameTime = now;
    }

    public recordPipelineStats(hit: boolean, computeTime: number): void {
        if (hit) {
            this.pipelineStats.cacheHits++;
        } else {
            this.pipelineStats.cacheMisses++;
        }
        this.pipelineStats.computeTimes.push(computeTime);
    }

    public async getMetrics(): Promise<PerformanceMetrics> {
        const now = performance.now();
        const fps = this.frameTimestamps.length;
        const frameTime = this.pipelineStats.computeTimes.length > 0 
            ? this.pipelineStats.computeTimes.reduce((a, b) => a + b, 0) / this.pipelineStats.computeTimes.length
            : 0;

        const [memoryStats, deviceInfo] = [
            this.memoryManager.getMemoryStats(),
            await this.deviceManager.getDeviceInfo()
        ];
        const tfMemory = tf.memory();

        const computeTime = this.pipelineStats.computeTimes.reduce((a, b) => a + b, 0);
        const transferTime = 0; // Not tracking transfer time currently
        const gpuUtilization = deviceInfo.load;

        return {
            computeTime,
            transferTime,
            gpuUtilization,
            memoryStats,
            deviceMetrics: {
                load: deviceInfo.load,
                temperature: undefined,
                memoryUsage: tfMemory.numBytes,
                computeUtilization: deviceInfo.load
            },
            tensorStats: {
                activeCount: tfMemory.numTensors,
                totalAllocated: tfMemory.numBytes,
                peakMemory: tfMemory.numBytes
            },
            pipelineStats: {
                cacheHits: this.pipelineStats.cacheHits,
                cacheMisses: this.pipelineStats.cacheMisses,
                averageComputeTime: frameTime
            }
        };
    }

    public reset(): void {
        this.frameCount = 0;
        this.lastFrameTime = 0;
        this.frameTimestamps = [];
        this.pipelineStats = {
            cacheHits: 0,
            cacheMisses: 0,
            computeTimes: []
        };
    }

    public async trackComputeOperation<T>(operation: () => Promise<T>): Promise<number> {
        const start = performance.now();
        await operation();
        const time = performance.now() - start;
        this.pipelineStats.computeTimes.push(time);
        return time;
    }

    public async trackTransferOperation<T>(operation: () => Promise<T>): Promise<number> {
        const start = performance.now();
        await operation();
        const time = performance.now() - start;
        return time;
    }

    public resetAccumulators(): void {
        this.reset();
    }

    public async getDetailedMetrics(): Promise<PerformanceMetrics> {
        return this.getMetrics();
    }

    public async cleanup(): Promise<void> {
        this.reset();
        await this.deviceManager.cleanup();
        PerformanceMonitor.instance = undefined;
    }
}
