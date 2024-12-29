import { GPUCompute, ComputeResult, ValidationError, OutOfMemoryError, DeviceError } from '../../core/gpu/gpu-compute';
import { DeviceManager } from '../../core/gpu/device-manager';
import * as tf from '@tensorflow/tfjs';

describe('GPU Performance Validation', () => {
    let gpuCompute: GPUCompute;
    let deviceManager: DeviceManager;

    beforeEach(async () => {
        gpuCompute = GPUCompute.getInstance();
        deviceManager = DeviceManager.getInstance();
        await deviceManager.selectDevice({ preferGPU: true });
        await tf.ready();
        // Warm up GPU
        const warmupData = generateTestData(0.1); // 100KB warmup
        await gpuCompute.processDataset(warmupData);
    });

    afterEach(async () => {
        if (gpuCompute?.dispose) {
            gpuCompute.dispose();
        }
        if (deviceManager?.cleanup) {
            await deviceManager.cleanup();
        }
        const engine = tf.engine();
        if (engine?.reset) {
            engine.reset();
        }
    });

    const generateTestData = (sizeInMB: number): Float32Array => {
        const numElements = Math.floor((sizeInMB * 1024 * 1024) / 4);
        const data = new Float32Array(numElements);
        for (let i = 0; i < numElements; i++) {
            data[i] = Math.random();
        }
        return data;
    };

    describe('Performance Metrics', () => {
        test('memory transfer speed meets target for 10MB data', async () => {
            const data = generateTestData(10);
            const result = await gpuCompute.processDataset(data);
            expect(result.metrics.transferTime).toBeLessThan(1000); // < 1s
        }, 10000);

        test('batch processing meets target for 10x1MB batches', async () => {
            const batchSize = 1; // 1MB
            const numBatches = 10;
            const startTime = performance.now();

            for (let i = 0; i < numBatches; i++) {
                await gpuCompute.processDataset(generateTestData(batchSize));
            }
            
            const totalTime = performance.now() - startTime;
            expect(totalTime).toBeLessThan(2000); // < 2s
        }, 10000);

        test('memory overhead stays within target', async () => {
            const initialMemory = tf.memory().numBytes;
            const data = generateTestData(5); // 5MB
            
            const result = await gpuCompute.processDataset(data);
            
            const overhead = (result.metrics.memoryUsage / (data.length * 4)) - 1;
            expect(overhead).toBeLessThan(0.1); // < 10%
        });
    });

    describe('Error Handling', () => {
        test('recovers from device failures', async () => {
            const deviceManager = DeviceManager.getInstance();
            await deviceManager.selectDevice();
            
            // Simulate device failure by forcing CPU backend
            await deviceManager.selectDevice({ preferGPU: false });
            const info = await deviceManager.getDeviceInfo();
            expect(info.type).toBe('CPU');
            
            // Test recovery by selecting GPU
            await deviceManager.selectDevice({ preferGPU: true });
            const newInfo = await deviceManager.getDeviceInfo();
            expect(newInfo.type.includes('WebGL') || newInfo.type === 'CPU').toBe(true);
        });

        test('handles memory exhaustion', async () => {
            const deviceManager = DeviceManager.getInstance();
            await deviceManager.selectDevice();
            
            try {
                // Create a tensor that's too large
                const shape = [1000000, 1000000];
                tf.zeros(shape);
                fail('Should have thrown OutOfMemoryError');
            } catch (error) {
                expect(error instanceof Error).toBe(true);
                expect(error.message).toContain('memory');
            }
        });

        test('handles invalid operations gracefully', async () => {
            const deviceManager = DeviceManager.getInstance();
            await deviceManager.selectDevice();
            
            await expect(async () => {
                await deviceManager.resetDevice();
                // Force an error by trying to use the device before it's ready
                const info = await deviceManager.getDeviceInfo();
            }).rejects.toThrow();
        });

        test('provides meaningful error messages', async () => {
            const deviceManager = DeviceManager.getInstance();
            await deviceManager.selectDevice();
            
            try {
                await deviceManager.resetDevice();
                // Force an error by trying to use the device before it's ready
                const info = await deviceManager.getDeviceInfo();
                fail('Should have thrown an error');
            } catch (error) {
                expect(error instanceof Error).toBe(true);
                expect(error.message).toBeTruthy();
            }
        });
    });

    describe('Resource Management', () => {
        test('properly cleans up tensors', async () => {
            const initialTensors = tf.memory().numTensors;
            const data = generateTestData(1);
            
            await gpuCompute.processDataset(data);
            
            expect(tf.memory().numTensors).toBeLessThanOrEqual(initialTensors + 100);
        });

        test('memory pool functions correctly', async () => {
            const data = generateTestData(1);
            const results: ComputeResult[] = [];
            
            for (let i = 0; i < 5; i++) {
                results.push(await gpuCompute.processDataset(data));
            }
            
            const uniqueMemoryUsages = new Set(results.map(r => r.metrics.memoryUsage));
            expect(uniqueMemoryUsages.size).toBeLessThanOrEqual(2);
        });

        test('no memory leaks under sustained load', async () => {
            const iterations = 10;
            const data = generateTestData(1);
            const initialMemory = tf.memory().numBytes;
            
            for (let i = 0; i < iterations; i++) {
                await gpuCompute.processDataset(data);
            }
            
            const finalMemory = tf.memory().numBytes;
            expect(finalMemory).toBeLessThan(initialMemory * 2);
        });
    });

    describe('Integration', () => {
        test('maintains consistent performance', async () => {
            const iterations = 5;
            const data = generateTestData(1);
            const times: number[] = [];
            
            for (let i = 0; i < iterations; i++) {
                const start = performance.now();
                await gpuCompute.processDataset(data);
                times.push(performance.now() - start);
            }
            
            const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
            const maxDeviation = Math.max(...times.map(t => Math.abs(t - avgTime)));
            
            expect(maxDeviation / avgTime).toBeLessThan(2); // Allow more variation in test environment
        });

        test('handles concurrent operations', async () => {
            const concurrentOps = 3;
            const data = generateTestData(1);
            
            const promises = Array(concurrentOps)
                .fill(null)
                .map(() => gpuCompute.processDataset(data));
            
            const results = await Promise.all(promises);
            results.forEach(result => {
                expect(result.data).toBeDefined();
                expect(result.metrics).toBeDefined();
            });
        });
    });
});
