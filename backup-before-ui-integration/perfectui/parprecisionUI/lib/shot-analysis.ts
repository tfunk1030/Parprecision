import { ShotPreset } from './preset-context';

export interface ShotData {
  distance: number;
  height: number;
  spin: number;
  launchAngle: number;
  windSpeed?: number;
  windDirection?: number;
  clubType?: string;
  timestamp: number;
}

export interface ShotAnalysis {
  consistency: number;
  dispersion: number;
  efficiency: number;
  recommendations: string[];
}

export interface TrendAnalysis {
  distanceTrend: number;
  spinTrend: number;
  heightTrend: number;
  consistencyTrend: number;
}

export class ShotAnalyzer {
  private static readonly CONSISTENCY_THRESHOLD = 0.85;
  private static readonly DISPERSION_THRESHOLD = 10;
  private static readonly EFFICIENCY_THRESHOLD = 0.9;

  static analyzeShotPattern(shots: ShotData[]): ShotAnalysis {
    if (shots.length < 2) {
      return {
        consistency: 1,
        dispersion: 0,
        efficiency: 1,
        recommendations: ['Need more shots for accurate analysis']
      };
    }

    // Calculate consistency based on shot parameters variation
    const consistency = this.calculateConsistency(shots);

    // Calculate dispersion (spread of shots)
    const dispersion = this.calculateDispersion(shots);

    // Calculate efficiency (actual vs optimal performance)
    const efficiency = this.calculateEfficiency(shots);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      consistency,
      dispersion,
      efficiency
    );

    return {
      consistency,
      dispersion,
      efficiency,
      recommendations
    };
  }

  static analyzeTrends(shots: ShotData[]): TrendAnalysis {
    if (shots.length < 5) {
      return {
        distanceTrend: 0,
        spinTrend: 0,
        heightTrend: 0,
        consistencyTrend: 0
      };
    }

    // Sort shots by timestamp
    const sortedShots = [...shots].sort((a, b) => a.timestamp - b.timestamp);

    // Calculate trends using linear regression
    return {
      distanceTrend: this.calculateTrend(sortedShots.map(s => s.distance)),
      spinTrend: this.calculateTrend(sortedShots.map(s => s.spin)),
      heightTrend: this.calculateTrend(sortedShots.map(s => s.height)),
      consistencyTrend: this.calculateConsistencyTrend(sortedShots)
    };
  }

  private static calculateConsistency(shots: ShotData[]): number {
    const distances = shots.map(s => s.distance);
    const spins = shots.map(s => s.spin);
    const heights = shots.map(s => s.height);
    const angles = shots.map(s => s.launchAngle);

    const variationScore = (
      this.calculateVariation(distances) +
      this.calculateVariation(spins) +
      this.calculateVariation(heights) +
      this.calculateVariation(angles)
    ) / 4;

    return Math.max(0, 1 - variationScore);
  }

  private static calculateDispersion(shots: ShotData[]): number {
    const distances = shots.map(s => s.distance);
    const heights = shots.map(s => s.height);

    const distanceVariation = this.calculateVariation(distances);
    const heightVariation = this.calculateVariation(heights);

    return Math.sqrt(distanceVariation * distanceVariation + heightVariation * heightVariation);
  }

  private static calculateEfficiency(shots: ShotData[]): number {
    const avgDistance = this.average(shots.map(s => s.distance));
    const avgSpin = this.average(shots.map(s => s.spin));
    const avgHeight = this.average(shots.map(s => s.height));

    // Compare with optimal values (these could be adjusted based on club type)
    const optimalDistance = 250; // Example value
    const optimalSpin = 2500; // Example value
    const optimalHeight = 30; // Example value

    const distanceEff = avgDistance / optimalDistance;
    const spinEff = 1 - Math.abs(avgSpin - optimalSpin) / optimalSpin;
    const heightEff = 1 - Math.abs(avgHeight - optimalHeight) / optimalHeight;

    return (distanceEff + spinEff + heightEff) / 3;
  }

  private static generateRecommendations(
    consistency: number,
    dispersion: number,
    efficiency: number
  ): string[] {
    const recommendations: string[] = [];

    if (consistency < this.CONSISTENCY_THRESHOLD) {
      recommendations.push('💫 Work on maintaining consistent swing mechanics');
    }

    if (dispersion > this.DISPERSION_THRESHOLD) {
      recommendations.push('🎯 Focus on improving shot accuracy and reducing spread');
    }

    if (efficiency < this.EFFICIENCY_THRESHOLD) {
      recommendations.push('⚡ Optimize launch conditions for better performance');
    }

    if (recommendations.length === 0) {
      recommendations.push('✨ Great job! Keep up the excellent performance');
    }

    return recommendations;
  }

  private static calculateVariation(values: number[]): number {
    const avg = this.average(values);
    const variance = values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / values.length;
    return Math.sqrt(variance) / avg;
  }

  private static average(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private static calculateTrend(values: number[]): number {
    const n = values.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    
    const sumX = indices.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = indices.reduce((acc, x, i) => acc + x * values[i], 0);
    const sumXX = indices.reduce((acc, x) => acc + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  private static calculateConsistencyTrend(shots: ShotData[]): number {
    const windowSize = 5;
    const consistencies: number[] = [];

    for (let i = 0; i <= shots.length - windowSize; i++) {
      const windowShots = shots.slice(i, i + windowSize);
      consistencies.push(this.calculateConsistency(windowShots));
    }

    return this.calculateTrend(consistencies);
  }
}
