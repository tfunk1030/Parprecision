import { LookupSystem } from './lookup-system';

describe('LookupSystem', () => {
    const lookup = new LookupSystem();

    describe('drag coefficient lookup', () => {
        test('should interpolate between known Reynolds numbers', () => {
            const drag1 = lookup.getDragCoefficient(115000); // Between 110000 and 120000
            const drag2 = lookup.getDragCoefficient(125000); // Between 120000 and 130000

            // Should be between known values
            expect(drag1).toBeGreaterThan(0.230); // 120000 value
            expect(drag1).toBeLessThan(0.235);    // 110000 value
            expect(drag2).toBeGreaterThan(0.225); // 130000 value
            expect(drag2).toBeLessThan(0.230);    // 120000 value
        });

        test('should handle boundary values', () => {
            const minDrag = lookup.getDragCoefficient(110000);
            const maxDrag = lookup.getDragCoefficient(170000);

            expect(minDrag).toBe(0.235); // First value in table
            expect(maxDrag).toBe(0.205); // Last value in table
        });

        test('should extrapolate beyond table bounds', () => {
            const lowDrag = lookup.getDragCoefficient(100000);
            const highDrag = lookup.getDragCoefficient(180000);

            // Should use closest value
            expect(lowDrag).toBe(0.235);  // First table value
            expect(highDrag).toBe(0.205); // Last table value
        });
    });

    describe('lift coefficient lookup', () => {
        test('should interpolate between known spin rates', () => {
            const lift1 = lookup.getLiftCoefficient(2250); // Between 2000 and 2500
            const lift2 = lookup.getLiftCoefficient(2750); // Between 2500 and 3000

            // Should be between known values
            expect(lift1).toBeGreaterThan(0.21); // 2000 value
            expect(lift1).toBeLessThan(0.25);    // 2500 value
            expect(lift2).toBeGreaterThan(0.25); // 2500 value
            expect(lift2).toBeLessThan(0.29);    // 3000 value
        });

        test('should handle boundary values', () => {
            const minLift = lookup.getLiftCoefficient(2000);
            const maxLift = lookup.getLiftCoefficient(4000);

            expect(minLift).toBe(0.21); // First value in table
            expect(maxLift).toBe(0.35); // Last value in table
        });
    });

    describe('wind height multiplier lookup', () => {
        test('should interpolate between known heights', () => {
            const mult1 = lookup.getWindHeightMultiplier(30); // Between 10 and 50
            const mult2 = lookup.getWindHeightMultiplier(75); // Between 50 and 100

            // Should be between known values
            expect(mult1).toBeGreaterThan(0.85); // 10m value
            expect(mult1).toBeLessThan(1.0);     // 50m value
            expect(mult2).toBeGreaterThan(1.0);  // 50m value
            expect(mult2).toBeLessThan(1.15);    // 100m value
        });

        test('should handle ground level correctly', () => {
            const groundMult = lookup.getWindHeightMultiplier(0);
            expect(groundMult).toBe(0.75); // Ground level value
        });
    });

    describe('cache behavior', () => {
        test('should cache and return exact values', () => {
            // First lookup
            const value1 = lookup.getLiftCoefficient(2500);
            
            // Second lookup should use cache
            const value2 = lookup.getLiftCoefficient(2500);

            expect(value1).toBe(value2);
            expect(value1).toBe(0.25); // Known table value

            // Clear cache
            lookup.clearCache();

            // Should still return same value after cache clear
            const value3 = lookup.getLiftCoefficient(2500);
            expect(value3).toBe(value1);
        });

        test('should handle cache size limit', () => {
            // Fill cache with many values
            for (let i = 0; i < 2000; i++) {
                lookup.getLiftCoefficient(i);
            }

            // Should still work without errors
            const value = lookup.getLiftCoefficient(2500);
            expect(value).toBe(0.25);
        });
    });
});