import { EnvironmentalSystem } from '../environmental-system';
import { Environment, Vector3D } from '../types';

describe('Environmental System', () => {
    let system: EnvironmentalSystem;

    // Standard test conditions
    const standardEnvironment: Environment = {
        temperature: 70,    // °F
        pressure: 29.92,    // inHg
        altitude: 0,        // feet
        humidity: 0.5,      // 50%
        wind: { x: 5, y: 0, z: 0 }  // 5 m/s wind
    };

    beforeEach(() => {
        system = new EnvironmentalSystem();
    });

    test('should calculate wind at different heights', () => {
        const baseWind: Vector3D = { x: 5, y: 0, z: 0 };

        // Ground level wind should be reduced
        const groundWind = system.calculateWindAtHeight(baseWind, 0);
        expect(groundWind.x).toBeLessThan(baseWind.x);

        // Mid-height wind should be about the same
        const midWind = system.calculateWindAtHeight(baseWind, 50);
        expect(midWind.x).toBeCloseTo(baseWind.x);

        // High-altitude wind should be increased
        const highWind = system.calculateWindAtHeight(baseWind, 150);
        expect(highWind.x).toBeGreaterThan(baseWind.x);
    });

    test('should calculate temperature effects', () => {
        // Standard temperature (70°F)
        const standardEffects = system.calculateTemperatureEffects(70);
        expect(standardEffects.compressionChange).toBe(0);
        expect(standardEffects.corChange).toBe(0);
        expect(standardEffects.distanceEffect).toBe(0);

        // Cold temperature (40°F)
        const coldEffects = system.calculateTemperatureEffects(40);
        expect(coldEffects.compressionChange).toBeGreaterThan(0);
        expect(coldEffects.corChange).toBeLessThan(0);
        expect(coldEffects.distanceEffect).toBeLessThan(0);

        // Hot temperature (100°F)
        const hotEffects = system.calculateTemperatureEffects(100);
        expect(hotEffects.compressionChange).toBeLessThan(0);
        expect(hotEffects.corChange).toBeGreaterThan(0);
        expect(hotEffects.distanceEffect).toBeGreaterThan(0);
    });

    test('should calculate altitude effects', () => {
        // Sea level
        const seaLevelEffect = system.calculateAltitudeEffect(0);
        expect(seaLevelEffect).toBe(1.0);

        // High altitude
        const highAltitudeEffect = system.calculateAltitudeEffect(5000);
        expect(highAltitudeEffect).toBeLessThan(1.0);

        // Very high altitude
        const veryHighAltitudeEffect = system.calculateAltitudeEffect(6000);
        expect(veryHighAltitudeEffect).toBeLessThan(highAltitudeEffect);
    });

    test('should calculate air density', () => {
        // Standard conditions
        const standardDensity = system.calculateAirDensity(standardEnvironment);
        expect(standardDensity).toBeCloseTo(1.225, 2); // kg/m³

        // High altitude conditions
        const highAltitude: Environment = {
            ...standardEnvironment,
            altitude: 5000,
            pressure: 24.89 // Standard pressure at 5000ft
        };
        const highAltitudeDensity = system.calculateAirDensity(highAltitude);
        expect(highAltitudeDensity).toBeLessThan(standardDensity);

        // Hot conditions
        const hotConditions: Environment = {
            ...standardEnvironment,
            temperature: 100
        };
        const hotDensity = system.calculateAirDensity(hotConditions);
        expect(hotDensity).toBeLessThan(standardDensity);

        // High humidity
        const humidConditions: Environment = {
            ...standardEnvironment,
            humidity: 0.9
        };
        const humidDensity = system.calculateAirDensity(humidConditions);
        expect(humidDensity).toBeLessThan(standardDensity);
    });

    test('should process all environmental effects', () => {
        const results = system.processEnvironment(standardEnvironment);

        // Check all components are present
        expect(results.airDensity).toBeDefined();
        expect(results.temperatureEffects).toBeDefined();
        expect(results.altitudeEffect).toBeDefined();
        expect(results.windAtHeight).toBeDefined();

        // Check wind function works
        const windAt100ft = results.windAtHeight(100);
        expect(windAt100ft.x).toBeGreaterThan(standardEnvironment.wind.x);

        // Verify temperature effects at standard conditions
        expect(results.temperatureEffects.compressionChange).toBe(0);
        expect(results.temperatureEffects.distanceEffect).toBe(0);

        // Verify altitude effect at sea level
        expect(results.altitudeEffect).toBe(1.0);
    });

    test('should handle extreme conditions', () => {
        const extremeConditions: Environment = {
            temperature: 120,    // Very hot
            pressure: 20,        // Very low pressure
            altitude: 10000,     // Very high altitude
            humidity: 1.0,       // Maximum humidity
            wind: { x: 20, y: 0, z: 0 }  // Strong wind
        };

        const results = system.processEnvironment(extremeConditions);

        // Air density should be much lower than standard
        expect(results.airDensity).toBeLessThan(1.0);

        // Temperature effects should be significant
        expect(Math.abs(results.temperatureEffects.distanceEffect)).toBeGreaterThan(0.02);

        // Altitude effect should be significant
        expect(results.altitudeEffect).toBeLessThan(0.8);

        // Wind should be very strong at height
        const windAt150ft = results.windAtHeight(150);
        expect(windAt150ft.x).toBeGreaterThan(25);
    });
});