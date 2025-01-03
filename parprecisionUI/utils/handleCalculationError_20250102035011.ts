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

export function handleCalculationError(error: unknown): CalculationError {
  // If it's already a CalculationError, return it
  if (
    error &&
    typeof error === 'object' &&
    'type' in error &&
    'userMessage' in error
  ) {
    return error as CalculationError;
  }

  // Handle network errors
  if (error instanceof TypeError && error.message.includes('network')) {
    return createCalculationError(
      CalculationErrorType.NETWORK_ERROR,
      error.message
    );
  }

  // Handle invalid input errors
  if (error instanceof RangeError || error instanceof TypeError) {
    return createCalculationError(
      CalculationErrorType.INVALID_INPUT,
      error.message
    );
  }

  // Handle other known errors
  if (error instanceof Error) {
    if (error.message.includes('weather')) {
      return createCalculationError(
        CalculationErrorType.WEATHER_ERROR,
        error.message
      );
    }
    if (error.message.includes('physics') || error.message.includes('calculation')) {
      return createCalculationError(
        CalculationErrorType.PHYSICS_ERROR,
        error.message
      );
    }
  }

  // Handle unknown errors
  return createCalculationError(
    CalculationErrorType.UNKNOWN_ERROR,
    error instanceof Error ? error.message : 'Unknown error occurred'
  );
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
  console.error(`[${error.type}] ${error.message}`, {
    details: error.details,
    userMessage: error.userMessage,
    timestamp: new Date().toISOString(),
  });
  
  // TODO: Implement error tracking service integration
  // Example: Sentry.captureException(error);
} 