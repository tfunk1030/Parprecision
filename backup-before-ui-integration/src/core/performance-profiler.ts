import { 
    BallState, 
    Environment, 
    BallProperties, 
    LaunchConditions, 
    TrajectoryResult,
    ProfileOptions
} from '../types';
import { FlightIntegrator } from './flight-integrator';
import { OptimizationAlgorithms } from './optimization-algorithms';
import { CacheManager } from './cache-manager';
import { performanceMonitor } from './performance-monitor';
import { AerodynamicsEngineImpl } from './aerodynamics-engine';
import os from 'os';

interface ProfileMetrics {
    timestamp: number;
    cpu: {
        usage: number;
        loadAverage?: number;
    };
    memory: {
        used: number;
        free: number;
        total: number;
        heapUsage?: number;
    };
    cacheStats?: {
        hitRate: number;
        size: number;
        memoryUsage: number;
        entryCount: number;
    };
}

export class PerformanceProfiler {
    private readonly integrator: FlightIntegrator;
    private readonly optimizer: OptimizationAlgorithms;
    private readonly cache: CacheManager;
    private readonly monitor = performanceMonitor;
    private readonly maxConcurrency: number;
    private readonly aero: AerodynamicsEngineImpl;

    constructor() {
        this.aero = new AerodynamicsEngineImpl();
        this.integrator = new FlightIntegrator(this.aero);
        this.optimizer = new OptimizationAlgorithms(this.aero);
        this.cache = CacheManager.getInstance();
        this.maxConcurrency = os.cpus().length;
    }

    private metricFn(trajectory: TrajectoryResult): number {
        if (!trajectory.points.length) return 0;
        const lastPoint = trajectory.points[trajectory.points.length - 1];
        return Math.sqrt(
            lastPoint.position.x * lastPoint.position.x +
            lastPoint.position.z * lastPoint.position.z
        );
    }

    private async collectProfileMetrics(): Promise<ProfileMetrics> {
        const cacheStats = this.cache.getStats();
        const cpuUsage = process.cpuUsage();
        const memUsage = process.memoryUsage();

        return {
            timestamp: Date.now(),
            cpu: {
                usage: cpuUsage.user + cpuUsage.system,
                loadAverage: os.loadavg()[0]
            },
            memory: {
                used: os.totalmem() - os.freemem(),
                free: os.freemem(),
                total: os.totalmem(),
                heapUsage: memUsage.heapUsed
            },
            cacheStats: {
                hitRate: cacheStats.hitRate,
                size: cacheStats.size,
                memoryUsage: cacheStats.memoryUsage,
                entryCount: cacheStats.entryCount
            }
        };
    }

    public async profileIntegration(
        initialState: BallState,
        environment: Environment,
        properties: BallProperties,
        iterations: number,
        options: ProfileOptions = {}
    ): Promise<ProfileMetrics> {
        const baseMetrics = await this.collectProfileMetrics();

        // Run integration
        for (let i = 0; i < iterations; i++) {
            await this.integrator.integrate(initialState, environment, properties);
        }

        const endMetrics = await this.collectProfileMetrics();
        return this.calculateDifferentialMetrics(baseMetrics, endMetrics);
    }

    public async profileOptimization(
        conditions: LaunchConditions,
        environment: Environment,
        properties: BallProperties,
        iterations: number,
        options: ProfileOptions = {}
    ): Promise<ProfileMetrics> {
        const baseMetrics = await this.collectProfileMetrics();

        // Run optimization using PSO
        for (let i = 0; i < iterations; i++) {
            await this.optimizer.particleSwarmOptimization(
                conditions,
                environment,
                properties,
                this.metricFn.bind(this),
                { numParticles: 5, iterations: 10 }
            );
        }

        const endMetrics = await this.collectProfileMetrics();
        return this.calculateDifferentialMetrics(baseMetrics, endMetrics);
    }

    private calculateDifferentialMetrics(
        start: ProfileMetrics,
        end: ProfileMetrics
    ): ProfileMetrics {
        return {
            ...end,
            cpu: {
                ...end.cpu,
                usage: end.cpu.usage - start.cpu.usage
            },
            memory: {
                ...end.memory,
                used: end.memory.used - start.memory.used,
                heapUsage: (end.memory.heapUsage || 0) - (start.memory.heapUsage || 0)
            }
        };
    }
}
