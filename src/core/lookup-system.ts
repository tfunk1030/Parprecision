import { BallProperties } from './types';

interface LookupTable<T> {
    [key: number]: T;
}

// Pre-computed drag coefficients from wind tunnel data
const DRAG_COEFFICIENTS: LookupTable<number> = {
    110000: 0.235,
    120000: 0.230,
    130000: 0.225,
    140000: 0.220,
    150000: 0.215,
    160000: 0.210,
    170000: 0.205
};

// Pre-computed lift coefficients from circulation analysis
const LIFT_COEFFICIENTS: LookupTable<number> = {
    2000: 0.21,
    2500: 0.25,
    3000: 0.29,
    3500: 0.32,
    4000: 0.35
};

// Height-based wind profile
const WIND_HEIGHT_MULTIPLIERS: LookupTable<number> = {
    0: 0.75,    // Ground level
    10: 0.85,   // Low height
    50: 1.0,    // Mid height
    100: 1.15,  // High height
    150: 1.25   // Maximum height
};

export class LookupSystem {
    private tables: Map<string, LookupTable<number>>;
    private cache: Map<string, number>;
    private readonly maxCacheSize = 1000;

    constructor() {
        this.tables = new Map();
        this.cache = new Map();
        this.initializeTables();
    }

    private initializeTables(): void {
        this.tables.set('drag', DRAG_COEFFICIENTS);
        this.tables.set('lift', LIFT_COEFFICIENTS);
        this.tables.set('windHeight', WIND_HEIGHT_MULTIPLIERS);
    }

    private findClosestKey(table: LookupTable<number>, value: number): number {
        const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
        
        // Handle out-of-bounds cases
        if (value <= keys[0]) return keys[0];
        if (value >= keys[keys.length - 1]) return keys[keys.length - 1];

        // Find closest key within bounds
        for (let i = 0; i < keys.length - 1; i++) {
            if (value >= keys[i] && value <= keys[i + 1]) {
                return Math.abs(value - keys[i]) < Math.abs(value - keys[i + 1]) 
                    ? keys[i] 
                    : keys[i + 1];
            }
        }

        return keys[0]; // Fallback to first key
    }

    private interpolate(x: number, x1: number, x2: number, y1: number, y2: number): number {
        if (x1 === x2) return y1;
        if (x <= x1) return y1;
        if (x >= x2) return y2;
        return y1 + (x - x1) * (y2 - y1) / (x2 - x1);
    }

    private getCacheKey(tableName: string, value: number): string {
        return `${tableName}:${value.toFixed(3)}`;
    }

    private removeOldestCacheEntry(): void {
        const iterator = this.cache.keys();
        const firstKey = iterator.next().value;
        if (firstKey) {
            this.cache.delete(firstKey);
        }
    }

    public lookup(tableName: string, value: number): number {
        const table = this.tables.get(tableName);
        if (!table) {
            throw new Error(`Table ${tableName} not found`);
        }

        const cacheKey = this.getCacheKey(tableName, value);
        const cachedValue = this.cache.get(cacheKey);
        if (cachedValue !== undefined) {
            return cachedValue;
        }

        // Get sorted keys
        const keys = Object.keys(table).map(Number).sort((a, b) => a - b);

        // Handle out-of-bounds cases
        if (value <= keys[0]) return table[keys[0]];
        if (value >= keys[keys.length - 1]) return table[keys[keys.length - 1]];

        // Find surrounding keys for interpolation
        let lower = keys[0];
        let upper = keys[keys.length - 1];

        for (let i = 0; i < keys.length - 1; i++) {
            if (keys[i] <= value && keys[i + 1] >= value) {
                lower = keys[i];
                upper = keys[i + 1];
                break;
            }
        }

        // Interpolate between closest values
        const result = this.interpolate(
            value,
            lower,
            upper,
            table[lower],
            table[upper]
        );

        // Cache result
        if (this.cache.size >= this.maxCacheSize) {
            this.removeOldestCacheEntry();
        }
        this.cache.set(cacheKey, result);

        return result;
    }

    public getDragCoefficient(reynolds: number): number {
        return this.lookup('drag', reynolds);
    }

    public getLiftCoefficient(spinRate: number): number {
        return this.lookup('lift', spinRate);
    }

    public getWindHeightMultiplier(height: number): number {
        return this.lookup('windHeight', height);
    }

    public clearCache(): void {
        this.cache.clear();
    }
}