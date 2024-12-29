import { 
    TrajectoryResult, 
    Environment, 
    BallProperties, 
    LaunchConditions,
    TrajectoryPoint
} from '../types';
import { performanceMonitor } from './performance-monitor';

interface CacheEntry {
    trajectory: TrajectoryResult;
    timestamp: number;
    accessCount: number;
    size: number;
    lastAccess: number;
}

export class CacheManager {
    private static instance: CacheManager;
    private readonly cache: Map<string, CacheEntry> = new Map();
    private readonly monitor = performanceMonitor;
    private readonly maxSize: number;
    private readonly maxAge: number;
    private currentSize: number = 0;

    private constructor(
        maxSizeMB: number = 100,
        maxAgeSeconds: number = 3600
    ) {
        this.maxSize = maxSizeMB * 1024 * 1024;
        this.maxAge = maxAgeSeconds * 1000;
    }

    public static getInstance(): CacheManager {
        if (!CacheManager.instance) {
            CacheManager.instance = new CacheManager();
        }
        return CacheManager.instance;
    }

    private generateCacheKey(
        conditions: LaunchConditions,
        environment: Environment,
        properties: BallProperties
    ): string {
        return JSON.stringify({
            conditions,
            environment: {
                temperature: Math.round(environment.temperature),
                pressure: Math.round(environment.pressure * 100) / 100,
                humidity: Math.round(environment.humidity * 100) / 100,
                altitude: Math.round(environment.altitude)
            },
            properties: {
                mass: properties.mass,
                radius: properties.radius,
                area: properties.area,
                dragCoefficient: Math.round(properties.dragCoefficient * 1000) / 1000,
                liftCoefficient: Math.round(properties.liftCoefficient * 1000) / 1000,
                magnusCoefficient: Math.round(properties.magnusCoefficient * 1000) / 1000,
                spinDecayRate: properties.spinDecayRate
            }
        });
    }

    public get(key: string, operationId: string): TrajectoryResult | null {
        const entry = this.cache.get(key);
        
        if (!entry) {
            return null;
        }

        const now = Date.now();
        const age = now - entry.timestamp;
        if (age > this.maxAge) {
            this.cache.delete(key);
            this.currentSize -= entry.size;
            return null;
        }

        entry.accessCount++;
        entry.lastAccess = now;
        
        return entry.trajectory;
    }

    public set(key: string, trajectory: TrajectoryResult): void {
        const size = this.calculateSize(trajectory);

        if (this.currentSize + size > this.maxSize) {
            this.evictOldest();
        }

        const now = Date.now();
        this.cache.set(key, {
            trajectory,
            timestamp: now,
            lastAccess: now,
            accessCount: 1,
            size
        });

        this.currentSize += size;
    }

    private evictOldest(): void {
        let oldestKey: string | null = null;
        let oldestTime = Infinity;

        for (const [key, entry] of this.cache.entries()) {
            if (entry.lastAccess < oldestTime) {
                oldestTime = entry.lastAccess;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            const entry = this.cache.get(oldestKey);
            if (entry) {
                this.currentSize -= entry.size;
                this.cache.delete(oldestKey);
            }
        }
    }

    public clear(): void {
        this.cache.clear();
        this.currentSize = 0;
    }

    public getStats(): {
        size: number;
        hitRate: number;
        memoryUsage: number;
        entryCount: number;
    } {
        let totalHits = 0;
        let totalAccesses = 0;

        for (const entry of this.cache.values()) {
            totalHits += entry.accessCount - 1;
            totalAccesses += entry.accessCount;
        }

        return {
            size: this.cache.size,
            hitRate: totalAccesses > 0 ? totalHits / totalAccesses : 0,
            memoryUsage: this.currentSize,
            entryCount: this.cache.size
        };
    }

    private calculateSize(trajectory: TrajectoryResult): number {
        return trajectory.points.length * 200; // Rough estimate of point size in bytes
    }
}
