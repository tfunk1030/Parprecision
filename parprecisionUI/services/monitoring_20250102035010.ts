'use client'

import React from 'react';
import * as Sentry from '@sentry/nextjs';

// Initialize Sentry if DSN is provided
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV,
  });
}

interface ErrorContext {
  params?: any;
  operation: string;
}

class MonitoringService {
  private metrics = {
    calculations: {
      count: 0,
      totalDuration: 0,
      types: new Map<string, { count: number; totalDuration: number }>(),
    },
    cache: {
      hits: 0,
      misses: 0,
    },
    errors: {
      count: 0,
      byType: new Map<string, number>(),
    },
  };

  trackCalculation(duration: number, type: string): void {
    this.metrics.calculations.count++;
    this.metrics.calculations.totalDuration += duration;

    const typeMetrics = this.metrics.calculations.types.get(type) || {
      count: 0,
      totalDuration: 0,
    };
    typeMetrics.count++;
    typeMetrics.totalDuration += duration;
    this.metrics.calculations.types.set(type, typeMetrics);

    // Log if calculation takes too long
    if (duration > 1000) {
      console.warn(`Long calculation detected (${type}): ${duration}ms`);
    }
  }

  trackCache(hit: boolean): void {
    if (hit) {
      this.metrics.cache.hits++;
    } else {
      this.metrics.cache.misses++;
    }
  }

  trackError(error: Error, context: ErrorContext): void {
    this.metrics.errors.count++;
    const errorType = error.constructor.name;
    
    const currentCount = this.metrics.errors.byType.get(errorType) || 0;
    this.metrics.errors.byType.set(errorType, currentCount + 1);

    console.error('Operation error:', {
      type: errorType,
      message: error.message,
      context,
    });
  }

  getMetrics() {
    return {
      ...this.metrics,
      calculations: {
        ...this.metrics.calculations,
        averageDuration:
          this.metrics.calculations.count > 0
            ? this.metrics.calculations.totalDuration /
              this.metrics.calculations.count
            : 0,
        types: Object.fromEntries(this.metrics.calculations.types),
      },
      cache: {
        ...this.metrics.cache,
        hitRate:
          this.metrics.cache.hits + this.metrics.cache.misses > 0
            ? this.metrics.cache.hits /
              (this.metrics.cache.hits + this.metrics.cache.misses)
            : 0,
      },
      errors: {
        ...this.metrics.errors,
        byType: Object.fromEntries(this.metrics.errors.byType),
      },
    };
  }

  resetMetrics(): void {
    this.metrics = {
      calculations: {
        count: 0,
        totalDuration: 0,
        types: new Map(),
      },
      cache: {
        hits: 0,
        misses: 0,
      },
      errors: {
        count: 0,
        byType: new Map(),
      },
    };
  }
}

export const monitoring = new MonitoringService();

// Web Vitals tracking
export function reportWebVitals(metric: any) {
  if (process.env.NEXT_PUBLIC_ANALYTICS_ID) {
    // Send to analytics
    const body = {
      id: process.env.NEXT_PUBLIC_ANALYTICS_ID,
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
    };

    fetch('/api/analytics', {
      body: JSON.stringify(body),
      method: 'POST',
      keepalive: true,
    }).catch(console.error);
  }

  // Log locally in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Web Vitals]', metric);
  }
}

// Error boundary component
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const context: ErrorContext = {
      operation: 'react_error_boundary',
      params: errorInfo
    };
    monitoring.trackError(error, context);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return React.createElement('div', { className: 'error-boundary p-4 bg-red-100 rounded-lg' },
        React.createElement('h2', { className: 'text-lg font-semibold text-red-800 mb-2' }, 'Something went wrong'),
        React.createElement('button', {
          onClick: () => this.setState({ hasError: false }),
          className: 'px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700'
        }, 'Try again')
      );
    }

    return this.props.children;
  }
} 