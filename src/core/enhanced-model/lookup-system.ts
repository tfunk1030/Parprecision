import { DRAG_COEFFICIENTS, LIFT_COEFFICIENTS } from './types';

/**
 * Efficient lookup system for physics coefficients
 * Implements caching and interpolation for missing values
 */
export class LookupSystem {
    private cache: Map<string, number> = new Map();
    private readonly maxCacheSize = 1000;

    /**
     * Generate cache key for coefficient lookups
     */
    private generateKey(type: string, value: number): string {
        return `${type}_${value}`;
    }

    /**
     * Add value to cache with LRU eviction
     */
    private addToCache(key: string, value: number): void {
        if (this.cache.size >= this.maxCacheSize) {
            // Remove oldest entry (first key in map)
            const firstKey = Array.from(this.cache.keys())[0];
            if (firstKey) {
                this.cache.delete(firstKey);
            }
        }
        this.cache.set(key, value);
    }

    /**
     * Find closest values for interpolation
     */
    private findClosestValues(value: number, coefficients: Record<number, number>): {
        lower: number;
        upper: number;
        lowerValue: number;
        upperValue: number;
    } {
        const keys = Object.keys(coefficients).map(Number).sort((a, b) => a - b);
        
        // Handle edge cases
        if (value <= keys[0]) {
            return {
                lower: keys[0],
                upper: keys[1],
                lowerValue: coefficients[keys[0]],
                upperValue: coefficients[keys[1]]
            };
        }
        if (value >= keys[keys.length - 1]) {
            return {
                lower: keys[keys.length - 2],
                upper: keys[keys.length - 1],
                lowerValue: coefficients[keys[keys.length - 2]],
                upperValue: coefficients[keys[keys.length - 1]]
            };
        }

        // Find surrounding values
        let lowerIndex = 0;
        while (lowerIndex < keys.length - 1 && keys[lowerIndex + 1] <= value) {
            lowerIndex++;
        }

        return {
            lower: keys[lowerIndex],
            upper: keys[lowerIndex + 1],
            lowerValue: coefficients[keys[lowerIndex]],
            upperValue: coefficients[keys[lowerIndex + 1]]
        };
    }

    /**
     * Linear interpolation between two values
     */
    private interpolate(
        value: number,
        lower: number,
        upper: number,
        lowerValue: number,
        upperValue: number
    ): number {
        const ratio = (value - lower) / (upper - lower);
        return lowerValue + ratio * (upperValue - lowerValue);
    }

    /**
     * Get drag coefficient with caching and interpolation
     */
    public getDragCoefficient(reynolds: number): number {
        const key = this.generateKey('drag', reynolds);
        
        // Check cache first
        const cached = this.cache.get(key);
        if (cached !== undefined) {
            return cached;
        }

        // Find closest values and interpolate
        const { lower, upper, lowerValue, upperValue } = 
            this.findClosestValues(reynolds, DRAG_COEFFICIENTS);
        
        const result = this.interpolate(reynolds, lower, upper, lowerValue, upperValue);
        
        // Cache result
        this.addToCache(key, result);
        
        return result;
    }

    /**
     * Get lift coefficient with caching and interpolation
     */
    public getLiftCoefficient(spinRate: number): number {
        const key = this.generateKey('lift', spinRate);
        
        // Check cache first
        const cached = this.cache.get(key);
        if (cached !== undefined) {
            return cached;
        }

        // Find closest values and interpolate
        const { lower, upper, lowerValue, upperValue } = 
            this.findClosestValues(spinRate, LIFT_COEFFICIENTS);
        
        const result = this.interpolate(spinRate, lower, upper, lowerValue, upperValue);
        
        // Cache result
        this.addToCache(key, result);
        
        return result;
    }

    /**
     * Clear the coefficient cache
     */
    public clearCache(): void {
        this.cache.clear();
    }

    /**
     * Get current cache size
     */
    public getCacheSize(): number {
        return this.cache.size;
    }

    /**
     * Check if value exists in cache
     */
    public isCached(type: string, value: number): boolean {
        return this.cache.has(this.generateKey(type, value));
    }
}