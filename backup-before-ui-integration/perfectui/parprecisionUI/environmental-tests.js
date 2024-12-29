import {
    calculateAdvancedWindEffect,
    calculateSpinDecay
} from './advanced-wind-calculations';

describe('Advanced Wind Effect Tests', () => {
    test('Wind gradient calculation', () => {
        const params = {
            windSpeed: 10,
            windDirection: 0,
            altitude: 100,
            temperature: 70,
            stability: 'neutral'
        };

        const result = calculateAdvancedWindEffect(params);

        // Verify wind profile
        expect(result.windProfile.layers).toHaveLength(3); // Should have 3 layers up to 100ft
        expect(result.windProfile.effectiveSpeed).toBeGreaterThan(params.windSpeed);
        expect(result.windProfile.maxGradient).toBeLessThan(0.5); // Max 50% increase
        
        // Verify components
        expect(result.components.headwind).toBeLessThanOrEqual(0);
        expect(Math.abs(result.components.crosswind)).toBeLessThanOrEqual(result.effectiveSpeed);
    });

    test('Turbulence modeling', () => {
        // Test stable conditions
        const stableResult = calculateAdvancedWindEffect({
            windSpeed: 15,
            windDirection: 0,
            altitude: 100,
            temperature: 70,
            stability: 'stable'
        });

        // Test unstable conditions
        const unstableResult = calculateAdvancedWindEffect({
            windSpeed: 15,
            windDirection: 0,
            altitude: 100,
            temperature: 90,
            stability: 'unstable'
        });

        // Unstable should have more turbulence
        expect(unstableResult.turbulence.intensity)
            .toBeGreaterThan(stableResult.turbulence.intensity);
        
        // Gust factor should be reasonable
        expect(stableResult.turbulence.gustFactor).toBeGreaterThan(1);
        expect(stableResult.turbulence.gustFactor).toBeLessThan(2);
    });

    test('Wind shear with height', () => {
        const lowAltitude = calculateAdvancedWindEffect({
            windSpeed: 10,
            windDirection: 0,
            altitude: 50,
            temperature: 70
        });

        const highAltitude = calculateAdvancedWindEffect({
            windSpeed: 10,
            windDirection: 0,
            altitude: 200,
            temperature: 70
        });

        // Higher altitude should have more directional shear
        expect(Math.abs(highAltitude.shear))
            .toBeGreaterThan(Math.abs(lowAltitude.shear));
    });
});

describe('Spin Decay Tests', () => {
    test('Basic spin decay', () => {
        const params = {
            initialSpin: 3000,
            airDensity: 1.225,
            time: 2,
            velocity: 70,
            temperature: 70,
            altitude: 0
        };

        const result = calculateSpinDecay(params);

        // Spin should decay
        expect(result.spinRate).toBeLessThan(params.initialSpin);
        // Decay should be reasonable
        expect(result.spinRate).toBeGreaterThan(params.initialSpin * 0.5);
    });

    test('Environmental effects on spin decay', () => {
        const baseParams = {
            initialSpin: 3000,
            time: 2,
            velocity: 70
        };

        // Test altitude effect
        const seaLevel = calculateSpinDecay({
            ...baseParams,
            altitude: 0,
            airDensity: 1.225,
            temperature: 70
        });

        const highAltitude = calculateSpinDecay({
            ...baseParams,
            altitude: 5000,
            airDensity: 1.0,
            temperature: 70
        });

        // High altitude should have less spin decay
        expect(highAltitude.spinRate).toBeGreaterThan(seaLevel.spinRate);

        // Test temperature effect
        const coldTemp = calculateSpinDecay({
            ...baseParams,
            altitude: 0,
            airDensity: 1.225,
            temperature: 40
        });

        const hotTemp = calculateSpinDecay({
            ...baseParams,
            altitude: 0,
            airDensity: 1.225,
            temperature: 100
        });

        // Temperature extremes should increase decay
        expect(coldTemp.spinRate).toBeLessThan(seaLevel.spinRate);
        expect(hotTemp.spinRate).toBeLessThan(seaLevel.spinRate);
    });

    test('Edge cases', () => {
        // Test zero wind
        const zeroWind = calculateAdvancedWindEffect({
            windSpeed: 0,
            windDirection: 0,
            altitude: 100,
            temperature: 70
        });

        expect(zeroWind.effectiveSpeed).toBe(0);
        expect(zeroWind.turbulence.intensity).toBe(0);

        // Test maximum wind
        const strongWind = calculateAdvancedWindEffect({
            windSpeed: 50,
            windDirection: 45,
            altitude: 100,
            temperature: 70
        });

        expect(strongWind.turbulence.intensity).toBeGreaterThan(0.5);
        expect(strongWind.components.headwind).toBeDefined();
        expect(strongWind.components.crosswind).toBeDefined();

        // Test spin decay with extreme values
        const extremeSpinParams = {
            initialSpin: 5000,
            airDensity: 0.8,
            time: 5,
            velocity: 100,
            temperature: 110,
            altitude: 10000
        };

        const extremeSpinResult = calculateSpinDecay(extremeSpinParams);
        expect(extremeSpinResult.spinRate).toBeGreaterThan(0);
        expect(extremeSpinResult.spinRate).toBeLessThan(extremeSpinParams.initialSpin);
    });
});

// Integration tests
describe('Integration Tests', () => {
    test('Combined effects on ball flight', () => {
        // Test realistic golf shot conditions
        const windEffect = calculateAdvancedWindEffect({
            windSpeed: 15,
            windDirection: 30,
            altitude: 150,
            temperature: 75,
            stability: 'neutral'
        });

        const spinDecay = calculateSpinDecay({
            initialSpin: 2800,
            airDensity: 1.2,
            time: 3,
            velocity: 65,
            temperature: 75,
            altitude: 150
        });

        // Verify reasonable combined effects
        expect(windEffect.effectiveSpeed).toBeGreaterThan(15);
        expect(windEffect.effectiveSpeed).toBeLessThan(25);
        expect(spinDecay.spinRate).toBeGreaterThan(1400);
        expect(spinDecay.spinRate).toBeLessThan(2800);
    });
});
