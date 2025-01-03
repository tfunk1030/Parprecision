'use client'

import { EnvironmentalConditions, EnvironmentalCalculator } from './environmental-calculations'
import { OpenWeatherMapClient } from './openweathermap-client'
import type { WeatherData } from '@/types/weather'
import { monitoring } from '@/services/monitoring'

export type { WeatherData } from '@/types/weather'
export type { EnvironmentalConditions } from './environmental-calculations'

interface SubscriberCallback {
  (conditions: EnvironmentalConditions): void
}

export interface Location {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number | null;
}

export class EnvironmentalService {
  private static instance: EnvironmentalService
  private conditions: EnvironmentalConditions
  private subscribers: Set<(conditions: EnvironmentalConditions) => void>
  private updateInterval: NodeJS.Timeout | null
  private baseAltitude: number
  private lastUpdate: number
  private weatherCache: Map<string, WeatherData>
  private weatherCacheTTL: number
  private locationCache: Map<string, Location>
  private openWeatherMapClient: OpenWeatherMapClient;
  private location: { lat: number; lon: number };

  private constructor() {
    this.baseAltitude = 0
    this.conditions = {
      temperature: 0,
      humidity: 0,
      pressure: 0,
      altitude: 0,
      windSpeed: 0,
      windDirection: 0,
      density: 1.225
    }
    this.subscribers = new Set()
    this.updateInterval = null
    this.lastUpdate = Date.now()
    this.initializeLocation()
    this.weatherCache = new Map()
    this.weatherCacheTTL = Number(process.env.WEATHER_CACHE_TTL)
    this.locationCache = new Map()
    this.openWeatherMapClient = new OpenWeatherMapClient(process.env.OPENWEATHERMAP_API_KEY || '')
    this.location = { lat: 40.7128, lon: -74.0060 }; // NYC as default
  }

  private async initializeLocation() {
    try {
      if (!window.isSecureContext) {
        throw new Error('Geolocation requires a secure context (HTTPS)');
      }

      const position = await this.getCurrentPosition()
      this.baseAltitude = position.coords.altitude || 0
      await this.fetchWeatherData(position.coords.latitude, position.coords.longitude)
    } catch (error) {
      monitoring.trackError(error instanceof Error ? error : new Error('Unknown error'), {
        operation: 'initialize_location',
        params: { error }
      });
      
      if (error instanceof GeolocationPositionError) {
        const errorDetails = {
          PERMISSION_DENIED: 'User denied geolocation permission',
          POSITION_UNAVAILABLE: 'Location information unavailable',
          TIMEOUT: 'Location request timed out'
        }[error.code] || 'Unknown geolocation error';
        
        monitoring.trackEvent('geolocation_error', { 
          code: error.code,
          details: errorDetails 
        });
      }
      
      // Fallback to default values
      this.conditions = {
        temperature: 70,
        humidity: 60,
        pressure: 1013.25,
        altitude: 100,
        windSpeed: 5,
        windDirection: 0,
        density: 1.225
      }
      this.notifySubscribers()
    }
  }

  private getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          { enableHighAccuracy: true, timeout: 5000 }
        )
      } else {
        reject(new Error('Geolocation not supported'))
      }
    })
  }

  private cache = new Map<string, { data: any, timestamp: number }>()
  
  private async fetchWeatherData(lat: number, lon: number, retries = 3): Promise<void> {
    const cacheKey = `${lat},${lon}`;
    const cached = this.cache.get(cacheKey);
    
    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < (Number(process.env.WEATHER_CACHE_TTL) * 1000)) {
      this.updateConditionsFromData(cached.data);
      return;
    }

    try {
      const response = await fetch(`/api/weather?location=${lat},${lon}`);
      if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(`API request failed with status ${response.status}: ${errorText}`);
        monitoring.trackError(error, {
          operation: 'fetch_weather_data',
          params: { lat, lon, status: response.status, error: errorText }
        });
        throw error;
      }
      
      const data = await response.json();
      
      // Validate the data structure
      if (!data || typeof data.temperature === 'undefined') {
        const error = new Error('Invalid weather data received');
        monitoring.trackError(error, {
          operation: 'fetch_weather_data',
          params: { lat, lon, data }
        });
        throw error;
      }

      this.updateConditionsFromData(data);
      
      // Update cache
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      if (this.cache.size > Number(process.env.WEATHER_CACHE_MAX_SIZE)) {
        // Remove oldest entry
        const firstKey = this.cache.keys().next().value;
        if (firstKey) {
          this.cache.delete(firstKey);
        }
      }

      monitoring.trackEvent('weather_data_fetched', {
        lat,
        lon,
        temperature: data.temperature,
        windSpeed: data.windSpeed
      });
    } catch (error) {
      monitoring.trackError(error instanceof Error ? error : new Error('Unknown error'), {
        operation: 'fetch_weather_data',
        params: { lat, lon, retries }
      });

      if (retries > 0) {
        // Exponential backoff
        const delay = Math.pow(2, 3 - retries) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWeatherData(lat, lon, retries - 1);
      }

      // If all retries failed, use default values based on location and time of year
      const now = new Date();
      const month = now.getMonth(); // 0-11
      const isNorthernHemisphere = lat > 0;
      
      // Adjust temperature based on latitude and season
      const baseTemp = isNorthernHemisphere ? 
        (month >= 5 && month <= 7 ? 75 : month >= 2 && month <= 4 ? 65 : month >= 8 && month <= 10 ? 65 : 55) : // Northern seasons
        (month >= 5 && month <= 7 ? 55 : month >= 2 && month <= 4 ? 65 : month >= 8 && month <= 10 ? 65 : 75);  // Southern seasons
      
      // Adjust for latitude (cooler towards poles)
      const latitudeAdjustment = Math.abs(lat) * 0.5;
      
      this.conditions = {
        temperature: baseTemp - latitudeAdjustment,
        humidity: 60,
        pressure: 1013.25,
        altitude: Math.abs(lat) > 45 ? 500 : 100, // Higher elevation at higher latitudes
        windSpeed: 5,
        windDirection: 0,
        density: 1.225
      };
      
      monitoring.trackEvent('using_default_weather', {
        lat,
        lon,
        conditions: this.conditions,
        reason: error instanceof Error ? error.message : 'Unknown error'
      });
      
      this.notifySubscribers();
    }
  }

  private updateConditionsFromData(data: any) {
    const altitudeEffect = this.calculateAltitudeEffect(data.altitude || this.baseAltitude);
    
    this.conditions = {
      ...this.conditions,
      temperature: data.temperature,
      humidity: data.humidity,
      pressure: data.pressure,
      altitude: data.altitude || this.baseAltitude,
      windSpeed: data.windSpeed,
      windDirection: data.windDirection,
      density: EnvironmentalCalculator.calculateAirDensity({
        ...this.conditions,
        altitude: data.altitude || this.baseAltitude,
      }) * altitudeEffect
    };
    this.notifySubscribers();
  }

  public static getInstance(): EnvironmentalService {
    if (!EnvironmentalService.instance) {
      EnvironmentalService.instance = new EnvironmentalService()
    }
    return EnvironmentalService.instance
  }

  public subscribe(callback: SubscriberCallback): () => void {
    this.subscribers.add(callback)
    callback(this.conditions)
    return () => {
      this.subscribers.delete(callback)
    }
  }

  private notifySubscribers(): void {
    this.subscribers.forEach((callback) => callback(this.conditions))
  }

  private updateConditions(): void {
    const now = Date.now()
    const timeScale = now / (24 * 60 * 60 * 1000) // Scale to one day

    // Update conditions with some natural variation
    this.conditions = {
      ...this.conditions,
      temperature: 70 + Math.sin(timeScale * Math.PI * 2) * 10, // Vary between 60-80°F
      humidity: 60 + Math.sin(timeScale * Math.PI * 2 + 1) * 20, // Vary between 40-80%
      altitude: this.baseAltitude + Math.sin(timeScale * Math.PI * 2 + 2) * 10, // Small variations
      pressure: 1013.25 + Math.sin(timeScale * Math.PI * 2 + 3) * 10, // Vary around standard
      windSpeed: Math.abs(Math.sin(timeScale * Math.PI * 2 + 4) * 15), // Vary between 0-15 mph
      windDirection: (Math.sin(timeScale * Math.PI * 2 + 5) * 180 + 180) % 360, // Vary between 0-360 degrees
      density: 0 // Will be calculated below
    }

    // Calculate air density
    this.conditions.density = EnvironmentalCalculator.calculateAirDensity(this.conditions)

    this.lastUpdate = now
    this.notifySubscribers()
  }

  public startMonitoring(): void {
    if (!this.updateInterval) {
      this.updateInterval = setInterval(() => this.updateConditions(), 1000)
      this.updateConditions() // Initial update
    }
  }

  public stopMonitoring(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
  }

  public getConditions(): EnvironmentalConditions {
    return { ...this.conditions }
  }

  public calculateWindEffect(
    shotDirection: number
  ): { headwind: number; crosswind: number } {
    return EnvironmentalCalculator.calculateWindEffect(
      this.conditions.windSpeed,
      this.conditions.windDirection,
      shotDirection
    )
  }

  public calculateAltitudeEffect(altitude: number): number {
    // At higher altitudes, the ball travels further due to less air resistance
    // Using PGA's standard calculation: ~2% increase per 1000ft of elevation
    const altitudeInFeet = altitude * 3.28084; // Convert meters to feet
    const altitudeEffect = 1 + (altitudeInFeet / 1000) * 0.02;
    
    // Cap the maximum effect at 10% increase
    return Math.min(altitudeEffect, 1.10);
  }

  async getCurrentConditions(): Promise<EnvironmentalConditions> {
    // In a real application, this would fetch from a weather API
    return {
      temperature: 70,
      humidity: 60,
      altitude: 100,
      windSpeed: 5,
      windDirection: 45,
      pressure: 1013.25,
      density: EnvironmentalCalculator.calculateAirDensity({
        temperature: 70,
        humidity: 60,
        pressure: 1013.25,
        altitude: 100,
        windSpeed: 5,
        windDirection: 45,
        density: 1.225
      })
    }
  }

  async getWeatherData(latitude: number, longitude: number): Promise<WeatherData> {
    const cachedWeather = this.weatherCache.get(`${latitude},${longitude}`);
    if (cachedWeather) {
      return cachedWeather;
    }

    const weatherData = await this.openWeatherMapClient.getCurrentWeather(latitude, longitude);
    const formattedWeatherData: WeatherData = {
      temperature: weatherData.main.temp,
      pressure: weatherData.main.pressure,
      humidity: weatherData.main.humidity,
      windSpeed: weatherData.wind.speed,
      windDirection: weatherData.wind.deg,
      altitude: weatherData.altitude || 0,
      latitude: weatherData.coord.lat,
      longitude: weatherData.coord.lon,
      condition: weatherData.weather[0].main,
      location: weatherData.name,
      icon: weatherData.weather[0].icon,
      time: new Date(weatherData.dt * 1000)
    };

    this.weatherCache.set(`${latitude},${longitude}`, formattedWeatherData);
    return formattedWeatherData;
  }

  async getLocation(): Promise<Location | null> {
    // Check for secure context
    if (!window.isSecureContext) {
      throw new Error('Geolocation requires HTTPS');
    }

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude,
            accuracy: position.coords.accuracy,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp,
          };
          this.locationCache.set('lastLocation', location);
          resolve(location);
        },
        (error) => {
          this.handleGeolocationError(error);
        },
        options
      );
    });
  }

  trackCalculation(duration: number, type: string): void {
    // Track long calculations
    if (duration > 1000) {
      monitoring.trackEvent('long_calculation', { 
        type,
        duration,
        timestamp: new Date().toISOString()
      });
    }
  }

  private handleGeolocationError(error: GeolocationPositionError): void {
    monitoring.trackError(new Error(`Geolocation error: ${error.message}`), {
      operation: 'geolocation',
      params: { code: error.code }
    });
    // Use default location
    this.location = { lat: 40.7128, lon: -74.0060 }; // NYC as default
    this.fetchWeatherData(this.location.lat, this.location.lon);
  }
}

export const environmentalService = EnvironmentalService.getInstance()
