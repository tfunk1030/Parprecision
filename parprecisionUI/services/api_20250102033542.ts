import { monitoring } from './monitoring';

// API configuration and types
export interface ShotData {
  distance: number
  windSpeed: number
  windDirection: number
  lateralOffset: number
  trajectory: [number, number][]
  height: number
}

export interface WeatherData {
  temperature: number
  humidity: number
  pressure: number
  windSpeed: number
  windDirection: number
  altitude: number
  latitude: number
  longitude: number
}

export interface Location {
  lat: number;
  lon: number;
}

export type LocationResult = Location | { error: string };

// Mock data generator functions
const generateTrajectoryPoints = (distance: number, height: number = 30): [number, number][] => {
  const points: [number, number][] = []
  const numPoints = 50
  for (let i = 0; i < numPoints; i++) {
    const x = (distance * i) / (numPoints - 1)
    const h = height * Math.sin((Math.PI * i) / (numPoints - 1))
    points.push([x, h])
  }
  return points
}

const API_BASE_URL = process.env.NEXT_PUBLIC_WEATHER_API_URL;
const GEOCODING_API_KEY = process.env.GEOCODING_API_KEY;
const GEOCODING_API_URL = 'https://api.opencagedata.com/geocode/v1/json'; // Example using OpenCage

// API service with mock implementations
export const api = {
  // Shot Analysis
  async getShotData(params: Partial<ShotData>): Promise<ShotData> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return {
      distance: params.distance || 200,
      windSpeed: params.windSpeed || 10,
      windDirection: params.windDirection || 45,
      lateralOffset: params.lateralOffset || 5,
      trajectory: generateTrajectoryPoints(params.distance || 200),
      height: 30
    }
  },

  // Weather Data
  async getWeatherData(location: string): Promise<WeatherData> {
    if (!process.env.NEXT_PUBLIC_WEATHER_API_URL) {
      throw new Error('NEXT_PUBLIC_WEATHER_API_URL is not defined');
    }

    const response = await fetch(`/api/weather?location=${encodeURIComponent(location)}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }
    const data = await response.json();

    return {
      temperature: data.temperature,
      humidity: data.humidity,
      pressure: data.pressure,
      windSpeed: data.windSpeed,
      windDirection: data.windDirection,
      altitude: data.altitude || 0,
      latitude: data.latitude,
      longitude: data.longitude
    };
  },

  // Flight Path Calculation
  async calculateFlightPath(params: {
    initialVelocity: number
    launchAngle: number
    spinRate: number
  }): Promise<[number, number, number][]> {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const points: [number, number, number][] = []
    const numPoints = 50
    const maxHeight = 30
    const distance = params.initialVelocity * 2

    for (let i = 0; i < numPoints; i++) {
      const t = i / (numPoints - 1)
      const x = distance * t
      const y = maxHeight * Math.sin(Math.PI * t)
      const z = 5 * Math.sin(2 * Math.PI * t) // Lateral movement
      points.push([x, y, z])
    }
    
    return points
  },

  // Club Selection
  async getClubRecommendation(distance: number, conditions: any): Promise<{
    club: string
    confidence: number
  }> {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const clubs = ['Driver', '3-Wood', '5-Wood', '4-Iron', '5-Iron', '6-Iron', '7-Iron', '8-Iron', '9-Iron', 'PW']
    const index = Math.min(Math.floor(distance / 25), clubs.length - 1)
    
    return {
      club: clubs[index],
      confidence: 0.85
    }
  },

  async geocodeLocation(location: string): Promise<Location | null> {
    const apiKey = process.env.NEXT_PUBLIC_GEOCODING_API_KEY;
    if (!apiKey) {
      monitoring.trackError(new Error('GEOCODING_API_KEY is not defined'), {
        operation: 'geocoding',
        params: { location }
      });
      return null;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${apiKey}`
      );

      if (!response.ok) {
        monitoring.trackError(new Error(`Geocoding API request failed with status ${response.status}`), {
          operation: 'geocoding',
          params: { location, status: response.status }
        });
        return null;
      }

      const data = await response.json();
      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        monitoring.trackError(new Error('No results found for the given location.'), {
          operation: 'geocoding',
          params: { location, status: data.status }
        });
        return null;
      }

      const result = data.results[0];
      return {
        lat: result.geometry.location.lat,
        lon: result.geometry.location.lng
      };
    } catch (error) {
      monitoring.trackError(error instanceof Error ? error : new Error('Unknown error'), {
        operation: 'geocoding',
        params: { location }
      });
      return null;
    }
  }
}

// Export getUserLocation
export async function getUserLocation(): Promise<Location | { error: string }> {
  if (!navigator.geolocation) {
    monitoring.trackError(new Error('Geolocation is not supported by this browser.'), {
      operation: 'get_user_location'
    });
    return { error: 'Geolocation is not supported' };
  }

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });

    return {
      lat: position.coords.latitude,
      lon: position.coords.longitude
    };
  } catch (error) {
    monitoring.trackError(error instanceof Error ? error : new Error('Unknown error'), {
      operation: 'get_user_location'
    });
    if (error instanceof GeolocationPositionError && error.code === error.PERMISSION_DENIED) {
      return { error: 'Location access denied' };
    } else {
      return { error: 'Error getting location' };
    }
  }
}
