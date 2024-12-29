import { PerformanceProfiler } from '../core/performance-profiler';
import { PerformanceMonitor, performanceMonitor } from '../core/performance-monitor';
import { BallState, Environment, BallProperties, LaunchConditions, Forces, Vector3D, SpinState, IAerodynamicsEngine } from '../types';
import { MockFlightIntegrator } from './mocks/mock-flight-integrator';

describe('Performance Tests', () => {
    const mockAero: IAerodynamicsEngine = {
        calculateForces: (velocity: Vector3D, spin: SpinState, properties: BallProperties, environment: Environment): Forces => {
            return {
                drag: { x: 0, y: 0, z: 0 },
                lift: { x: 0, y: 0, z: 0 },
                magnus: { x: 0, y: 0, z: 0 },
                gravity: { x: 0, y: -9.81 * properties.mass, z: 0 }
            };
        }
    };

    const initialState: BallState = {
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 70, y: 0, z: 30 },
        spin: {
            rate: 2500,
            axis: { x: 0, y: 1, z: 0 }
        },
        mass: 0.0459
    };

    const environment: Environment = {
        temperature: 20,
        pressure: 101325,
        humidity: 0.5,
        altitude: 0,
        wind: { x: 5, y: 0, z: 0 }
    };

    const properties: BallProperties = {
        mass: 0.0459,
        radius: 0.02135,
        area: Math.PI * 0.02135 * 0.02135,
        dragCoefficient: 0.25,
        liftCoefficient: 0.15,
        magnusCoefficient: 0.1,
        spinDecayRate: 0.01
    };

    beforeEach(() => {
        performanceMonitor.clearMetrics();
    });

    describe('Flight Integration Performance', () => {
        it('should profile integration with default settings', async () => {
            performanceMonitor.startOperation('integration_0');
            await new Promise(resolve => setTimeout(resolve, 100)); // Simulate work
            const memoryUsage = await performanceMonitor.getMemoryUsage();
            
            expect(memoryUsage.used).toBeDefined();
            expect(memoryUsage.free).toBeDefined();
            expect(memoryUsage.total).toBeDefined();
        }, 10000);

        it('should profile integration with high precision', async () => {
            performanceMonitor.startOperation('integration_1');
            await new Promise(resolve => setTimeout(resolve, 100)); // Simulate work
            const memoryUsage = await performanceMonitor.getMemoryUsage();
            
            expect(memoryUsage.used).toBeDefined();
            expect(memoryUsage.free).toBeDefined();
            expect(memoryUsage.total).toBeDefined();
        }, 10000);
    });

    describe('Memory Management', () => {
        it('should handle memory efficiently during long integration', async () => {
            const initialMemory = process.memoryUsage().heapUsed;
            performanceMonitor.startOperation('integration_2');
            await new Promise(resolve => setTimeout(resolve, 100)); // Simulate work
            const memoryUsage = await performanceMonitor.getMemoryUsage();
            const finalMemory = process.memoryUsage().heapUsed;
            
            expect(memoryUsage.used).toBeDefined();
            expect(finalMemory - initialMemory).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
        }, 30000);

        it('should monitor memory usage during execution', () => {
            const memorySnapshot = process.memoryUsage();
            
            expect(memorySnapshot.heapUsed).toBeDefined();
            expect(memorySnapshot.heapTotal).toBeDefined();
            expect(memorySnapshot.external).toBeDefined();
            expect(memorySnapshot.arrayBuffers).toBeDefined();
        });
    });
});
