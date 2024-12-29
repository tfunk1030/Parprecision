import { HardwarePerformanceTester } from '../benchmark/hardware-performance';
import * as os from 'os';

// Skip these tests in watch mode to prevent long-running operations
const shouldRunPerformanceTests = process.env.NODE_ENV !== 'watch';

describe('Hardware Performance Tests', () => {
    let tester: HardwarePerformanceTester;
    let report: any;

    // Run performance tests once before all tests if not in watch mode
    beforeAll(async () => {
        if (shouldRunPerformanceTests) {
            tester = new HardwarePerformanceTester();
            report = await tester.runPerformanceTests();
        }
    });

    beforeEach(() => {
        if (!shouldRunPerformanceTests) {
            return;
        }
        expect(report).toBeDefined();
    });

    it('should generate valid performance report', async () => {
        if (!shouldRunPerformanceTests) {
            return;
        }

        // Verify hardware profile
        expect(report.hardware).toBeDefined();
        expect(report.hardware.cpuCount).toBe(os.cpus().length);
        expect(report.hardware.totalMemory).toBe(os.totalmem());

        // Verify batch performance
        expect(report.batchPerformance).toBeDefined();
        expect(report.batchPerformance.optimalBatchSize).toBeGreaterThan(0);
        expect(report.batchPerformance.maxThroughput).toBeGreaterThan(0);
        expect(report.batchPerformance.averageTimePerShot).toBeGreaterThan(0);
        expect(report.batchPerformance.averageMemoryPerShot).toBeGreaterThan(0);

        // Verify memory health
        expect(report.memoryHealth).toBeDefined();
        expect(typeof report.memoryHealth.hasLeak).toBe('boolean');
        expect(typeof report.memoryHealth.memoryGrowth).toBe('number');
        expect(typeof report.memoryHealth.averageGrowthRate).toBe('number');

        // Verify cache efficiency
        expect(report.cacheEfficiency).toBeDefined();
        expect(report.cacheEfficiency.hits).toBeGreaterThanOrEqual(0);
        expect(report.cacheEfficiency.misses).toBeGreaterThanOrEqual(0);
        expect(report.cacheEfficiency.hitRate).toBeGreaterThanOrEqual(0);
        expect(report.cacheEfficiency.hitRate).toBeLessThanOrEqual(1);
    });

    it('should handle different hardware configurations', async () => {
        if (!shouldRunPerformanceTests) {
            return;
        }

        // Verify adaptability to available CPU cores
        expect(report.batchPerformance.optimalBatchSize).toBeLessThanOrEqual(
            os.cpus().length * 100 // Reasonable upper limit based on CPU count
        );

        // Verify memory usage scales with available memory
        const memoryUsageRatio = (report.batchPerformance.averageMemoryPerShot *
            report.batchPerformance.optimalBatchSize) / os.totalmem();
        expect(memoryUsageRatio).toBeLessThan(0.5); // Should use less than 50% of total memory
    });

    it('should detect memory leaks accurately', async () => {
        if (!shouldRunPerformanceTests) {
            return;
        }

        // Verify memory leak detection
        if (report.memoryHealth.hasLeak) {
            expect(report.memoryHealth.memoryGrowth).toBeGreaterThan(1000);
            expect(report.memoryHealth.averageGrowthRate).toBeGreaterThan(0);
        } else {
            expect(report.memoryHealth.averageGrowthRate).toBeLessThan(1000);
        }
    });

    it('should measure cache efficiency correctly', async () => {
        if (!shouldRunPerformanceTests) {
            return;
        }

        // Verify cache metrics
        expect(report.cacheEfficiency.hits + report.cacheEfficiency.misses).toBeGreaterThan(0);
        expect(report.cacheEfficiency.hitRate).toEqual(
            report.cacheEfficiency.hits / (report.cacheEfficiency.hits + report.cacheEfficiency.misses)
        );
    });
});