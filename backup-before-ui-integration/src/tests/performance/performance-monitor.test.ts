import { PerformanceMonitor } from '../../core/gpu/performance-monitor';

describe('PerformanceMonitor', () => {
    let monitor: PerformanceMonitor;

    afterAll(async () => {
        // Clean up any remaining instances
        if (monitor) {
            await monitor.cleanup();
        }
    });

    beforeEach(async () => {
        monitor = await PerformanceMonitor.getInstance();
        monitor.resetAccumulators();
    });

    afterEach(async () => {
        if (monitor) {
            await monitor.cleanup();
        }
    });

    afterEach(async () => {
        await monitor.cleanup();
    });

    describe('Operation Tracking', () => {
        it('should track compute operations', async () => {
            const operation = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            };

            const time = await monitor.trackComputeOperation(operation);
            expect(time).toBeGreaterThanOrEqual(100);

            const metrics = await monitor.getDetailedMetrics();
            expect(metrics.computeTime).toBeGreaterThanOrEqual(100);
        });

        it('should track transfer operations', async () => {
            const operation = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            };

            const time = await monitor.trackTransferOperation(operation);
            expect(time).toBeGreaterThanOrEqual(100);

            const metrics = await monitor.getDetailedMetrics();
            expect(metrics.transferTime).toBeGreaterThanOrEqual(100);
        });
    });

    describe('State Management', () => {
        it('should reset accumulators', async () => {
            const operation = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            };

            await monitor.trackComputeOperation(operation);
            await monitor.trackTransferOperation(operation);

            let metrics = await monitor.getDetailedMetrics();
            expect(metrics.computeTime).toBeGreaterThan(0);
            expect(metrics.transferTime).toBeGreaterThan(0);

            monitor.resetAccumulators();
            metrics = await monitor.getDetailedMetrics();
            expect(metrics.computeTime).toBeCloseTo(0);
            expect(metrics.transferTime).toBeCloseTo(0);
        });
    });

    describe('Metrics', () => {
        it('should get detailed metrics', async () => {
            const metrics = await monitor.getDetailedMetrics();
            
            expect(metrics).toHaveProperty('memoryStats');
            expect(metrics.memoryStats).toHaveProperty('numTensors');
            expect(metrics.memoryStats).toHaveProperty('numBytes');
            expect(metrics.memoryStats).toHaveProperty('unreliable');
            
            expect(metrics).toHaveProperty('computeTime');
            expect(metrics).toHaveProperty('transferTime');
            expect(metrics).toHaveProperty('gpuUtilization');
            
            expect(typeof metrics.computeTime).toBe('number');
            expect(typeof metrics.transferTime).toBe('number');
            expect(typeof metrics.gpuUtilization).toBe('number');
        });
    });
});
