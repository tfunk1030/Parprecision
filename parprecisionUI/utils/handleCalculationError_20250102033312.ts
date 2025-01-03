import { monitoring } from '@/services/monitoring';

// Error types
export enum CalculationErrorType {
  INVALID_INPUT = 'INVALID_INPUT',
  PHYSICS_ERROR = 'PHYSICS_ERROR',
  WEATHER_ERROR = 'WEATHER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface CalculationError extends Error {
  type: CalculationErrorType;
  details?: Record<string, any>;
  userMessage: string;
}

const ERROR_MESSAGES: Record<CalculationErrorType, string> = {
  [CalculationErrorType.INVALID_INPUT]: 'Please check your input values and try again.',
  [CalculationErrorType.PHYSICS_ERROR]: 'There was an error in the physics calculations. Please try again with different parameters.',
  [CalculationErrorType.WEATHER_ERROR]: 'Unable to get accurate weather data. Please refresh the weather information.',
  [CalculationErrorType.NETWORK_ERROR]: 'Network connection issue. Please check your internet connection and try again.',
  [CalculationErrorType.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again later.',
};

export function createCalculationError(
  type: CalculationErrorType,
  message: string,
  details?: Record<string, any>
): CalculationError {
  return {
    name: 'CalculationError',
    type,
    message,
    userMessage: ERROR_MESSAGES[type],
    details,
  } as CalculationError;
}

export function handleCalculationError(error: any): string {
  const errorDetails = {
    type: error.type || 'unknown',
    message: error.message || 'An unknown error occurred',
    params: error.params || {}
  };

  monitoring.trackError(error instanceof Error ? error : new Error(errorDetails.message), {
    operation: 'shot_calculation',
    params: errorDetails
  });

  // Return user-friendly error message
  switch (errorDetails.type) {
    case 'validation':
      return `Invalid input: ${errorDetails.message}`;
    case 'calculation':
      return `Calculation error: ${errorDetails.message}`;
    case 'weather':
      return `Weather data error: ${errorDetails.message}`;
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

export function isCalculationError(error: unknown): error is CalculationError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'type' in error &&
    'userMessage' in error &&
    Object.values(CalculationErrorType).includes((error as CalculationError).type)
  );
}

// Helper function to log errors for monitoring
export function logCalculationError(error: CalculationError): void {
  monitoring.trackError(error, {
    operation: 'calculation',
    params: {
      type: error.type,
      details: error.details,
      userMessage: error.userMessage,
      timestamp: new Date().toISOString()
    }
  });
} 