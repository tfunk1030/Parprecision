import { useState, useEffect, useCallback } from 'react';
import { WeatherData, api, getUserLocation } from '../services/api';
import { monitoring } from '@/services/monitoring';

interface WeatherState {
  data: WeatherData | null;
  isLoading: boolean;
  error: Error | null;
  lastUpdated: number | null;
}

const CACHE_KEY = 'parprecision_weather_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

interface CacheData {
  data: WeatherData;
  timestamp: number;
}

const getCachedWeather = (): CacheData | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp }: CacheData = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return { data, timestamp };
  } catch (error) {
    monitoring.trackError(error instanceof Error ? error : new Error('Unknown error'), {
      operation: 'read_weather_cache'
    });
    return null;
  }
};

const setCachedWeather = (data: WeatherData): void => {
  try {
    const cacheData: CacheData = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    monitoring.trackError(error instanceof Error ? error : new Error('Unknown error'), {
      operation: 'write_weather_cache'
    });
  }
};

export function useWeather() {
  const [state, setState] = useState<WeatherState>({
    data: null,
    isLoading: true,
    error: null,
    lastUpdated: null,
  });
  const [location, setLocation] = useState<string | null>(null);

  const readFromCache = useCallback(async (key: string) => {
    try {
      const cached = localStorage.getItem(`weather_${key}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data;
        }
      }
      return null;
    } catch (error) {
      monitoring.trackError(error instanceof Error ? error : new Error('Unknown error'), {
        operation: 'read_weather_cache'
      });
      return null;
    }
  }, []);

  const writeToCache = useCallback(async (key: string, data: WeatherData) => {
    try {
      localStorage.setItem(`weather_${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      monitoring.trackError(error instanceof Error ? error : new Error('Unknown error'), {
        operation: 'write_weather_cache'
      });
    }
  }, []);

  const fetchWeather = useCallback(
    async (force: boolean = false) => {
      if (!force) {
        const cached = getCachedWeather();
        if (cached) {
          setState({
            data: cached.data,
            isLoading: false,
            error: null,
            lastUpdated: cached.timestamp,
          });
          return;
        }
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const userLocation = await getUserLocation();
        let data: WeatherData;

        if ('error' in userLocation) {
          // Handle error case
          throw new Error(userLocation.error);
        } else {
          // Handle success case - userLocation is of type Location
          data = await api.getWeatherData(`${userLocation.lat},${userLocation.lon}`);
        }

        setCachedWeather(data);
        setState({
          data,
          isLoading: false,
          error: null,
          lastUpdated: Date.now(),
        });
      } catch (error: any) {
        monitoring.trackError(error instanceof Error ? error : new Error('Unknown error'), {
          operation: 'fetch_weather',
          params: { location }
        });
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message || 'An error occurred while fetching weather data.',
        }));
      }
    },
    [location]
  );

  useEffect(() => {
    fetchWeather();

    // Set up periodic refresh
    const intervalId = setInterval(() => {
      fetchWeather(true);
    }, CACHE_DURATION);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchWeather]);

  return {
    ...state,
    refresh: () => fetchWeather(true),
    setLocation,
    timeUntilNextUpdate: state.lastUpdated
      ? Math.max(0, CACHE_DURATION - (Date.now() - state.lastUpdated))
      : 0,
  };
} 