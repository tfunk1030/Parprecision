import { EnvironmentalCalculator } from '../environmental-calculator';
import { Environment } from '../types';

describe('Environmental Calculator', () => {
    let calculator: EnvironmentalCalculator;

    // Standard test conditions
    const standardEnvironment: Environment = {
        temperature: 70,    // °F
        pressure: 29.92,    // inHg
        altitude: 0,        // feet
        humidity: 0.5,      // 50%
        wind: { x: 5, y: 0, z: 0 }  // 5 m/s wind
    };

    beforeEach(() => {
        calculator = new EnvironmentalCalculator();
    });

    test('should calculate adjustments correctly', () => {
        const adjustments = calculator.calculateAdjustments(standardEnvironment);

        // At standard conditions
        expect(adjustments.distanceEffect).toBeCloseTo(0, 2);
        expect(adjustments.spinEffect).toBeCloseTo(0, 2);
        expect(adjustments.trajectoryEffect).toBeGreaterThan(0); // Due to wind
        expect(adjustments.airDensity).toBeCloseTo(1.225, 2);
    });

    test('should handle extreme conditions', () => {
        const extremeEnvironment: Environment = {
            temperature: 100,   // Hot
            pressure: 24.89,    // Low pressure
            altitude: 5000,     // High altitude
            humidity: 0.9,      // High humidity
            wind: { x: 10, y: 0, z: 10 }  // Strong wind
        };

        const adjustments = calculator.calculateAdjustments(extremeEnvironment);

        // Effects should be significant
        expect(Math.abs(adjustments.distanceEffect)).toBeGreaterThan(0.1);
        expect(Math.abs(adjustments.spinEffect)).toBeGreaterThan(10);
        expect(adjustments.trajectoryEffect).toBeGreaterThan(10);
        expect(adjustments.airDensity).toBeLessThan(1.0);
    });

    test('should calculate wind at different heights', () => {
        const baseWind = standardEnvironment.wind;
        
        // Ground level
        const groundWind = calculator.getWindAtHeight(standardEnvironment, 0);
        expect(groundWind.x).toBeLessThan(baseWind.x);

        // High altitude
        const highWind = calculator.getWindAtHeight(standardEnvironment, 150);
        expect(highWind.x).toBeGreaterThan(baseWind.x);
    });

    test('should provide relevant recommendations', () => {
        // Standard conditions
        const standardRecommendations = calculator.getRecommendations(standardEnvironment);
        expect(standardRecommendations.length).toBeGreaterThan(0); // Wind recommendations

        // Cold conditions
        const coldEnvironment: Environment = {
            ...standardEnvironment,
            temperature: 40
        };
        const coldRecommendations = calculator.getRecommendations(coldEnvironment);
        expect(coldRecommendations.some(r => r.includes('cold'))).toBe(true);

        // High altitude
        const altitudeEnvironment: Environment = {
            ...standardEnvironment,
            altitude: 5000
        };
        const altitudeRecommendations = calculator.getRecommendations(altitudeEnvironment);
        expect(altitudeRecommendations.some(r => r.includes('altitude'))).toBe(true);
    });

    test('should use cache effectively', () => {
        // Initial cache should be empty
        expect(calculator.getCacheSize()).toBe(0);

        // Calculate adjustments
        const adjustments1 = calculator.calculateAdjustments(standardEnvironment);
        
        // Cache should now have entries
        expect(calculator.getCacheSize()).toBeGreaterThan(0);

        // Calculate again with same conditions
        const adjustments2 = calculator.calculateAdjustments(standardEnvironment);

        // Results should be identical (from cache)
        expect(adjustments2).toEqual(adjustments1);

        // Clear cache
        calculator.clearCache();
        expect(calculator.getCacheSize()).toBe(0);
    });

    test('should handle rounding in cache keys', () => {
        // Slightly different conditions that should map to same cache key
        const environment1: Environment = {
            ...standardEnvironment,
            temperature: 70.01,
            pressure: 29.921
        };

        const environment2: Environment = {
            ...standardEnvironment,
            temperature: 70.02,
            pressure: 29.922
        };

        const adjustments1 = calculator.calculateAdjustments(environment1);
        const adjustments2 = calculator.calculateAdjustments(environment2);

        // Should use same cache entry
        expect(calculator.getCacheSize()).toBe(1);
        expect(adjustments1).toEqual(adjustments2);
    });

    test('should cache wind calculations separately', () => {
        // Get wind at different heights
        calculator.getWindAtHeight(standardEnvironment, 0);
        calculator.getWindAtHeight(standardEnvironment, 100);
        calculator.getWindAtHeight(standardEnvironment, 150);

        // Each height should have its own cache entry
        expect(calculator.getCacheSize()).toBe(3);

        // Same height should use cache
        const wind1 = calculator.getWindAtHeight(standardEnvironment, 100);
        const wind2 = calculator.getWindAtHeight(standardEnvironment, 100);
        expect(wind1).toEqual(wind2);
        expect(calculator.getCacheSize()).toBe(3); // No new entries
    });
});