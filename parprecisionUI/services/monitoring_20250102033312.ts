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
  [key: string]: any;
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

    // Track long calculations
    if (duration > 1000) {
      this.trackEvent('long_calculation', { 
        type,
        duration,
        timestamp: new Date().toISOString()
      });
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
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureException(error, {
        extra: context
      });
    }
  }

  trackMetric(name: string, value: any): void {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureMessage(`Metric: ${name}`, {
        level: 'info',
        extra: { value }
      });
    }
  }

  trackEvent(name: string, data: Record<string, any>): void {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureMessage(`Event: ${name}`, {
        level: 'info',
        extra: data
      });
    }
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
    }).catch((error) => {
      // Send error to monitoring service instead of console
      monitoring.trackError(error, {
        operation: 'web_vitals_reporting',
        params: { metric }
      });
    });
  }

  // Only log in development using monitoring service
  if (process.env.NODE_ENV === 'development') {
    monitoring.trackMetric('web_vitals', metric);
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