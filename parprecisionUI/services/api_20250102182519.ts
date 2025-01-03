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
}

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

const DEFAULT_WEATHER: WeatherData = {
  temperature: 70,
  humidity: 50,
  pressure: 29.92,
  windSpeed: 0,
  windDirection: 0,
  altitude: 0
};

let cachedWeather: WeatherData | null = null;

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
  async getWeatherData(location?: string): Promise<WeatherData> {
    try {
      // If we're offline or in development, use cached or default data
      if (!navigator.onLine || process.env.NODE_ENV === 'development') {
        console.log('Using cached/default weather data due to offline status or development mode');
        return cachedWeather || DEFAULT_WEATHER;
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_WEATHER_API_URL || '/api/weather';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      try {
        const response = await fetch(`${API_BASE_URL}?location=${location || ''}`, {
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        cachedWeather = {
          temperature: Math.round(data.temperature ?? DEFAULT_WEATHER.temperature),
          humidity: Math.round(data.humidity ?? DEFAULT_WEATHER.humidity),
          pressure: Number((data.pressure ?? DEFAULT_WEATHER.pressure).toFixed(2)),
          windSpeed: Math.round(data.windSpeed ?? DEFAULT_WEATHER.windSpeed),
          windDirection: Math.round(data.windDirection ?? DEFAULT_WEATHER.windDirection),
          altitude: Math.round(data.altitude ?? DEFAULT_WEATHER.altitude)
        };

        return cachedWeather;
      } catch (error) {
        if (error.name === 'AbortError') {
          console.warn('Weather API request timed out');
        } else {
          console.error('Error fetching weather data:', error);
        }
        // Return cached data if available, otherwise use defaults
        return cachedWeather || DEFAULT_WEATHER;
      }
    } catch (error) {
      console.error('Critical error in weather service:', error);
      return DEFAULT_WEATHER;
    }
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

  async geocodeLocation(location: string): Promise<{ latitude: number; longitude: number } | null> {
    if (!GEOCODING_API_KEY) {
      console.error('GEOCODING_API_KEY is not defined');
      return null;
    }

    const url = `${GEOCODING_API_URL}?q=${encodeURIComponent(location)}&key=${GEOCODING_API_KEY}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Geocoding API request failed with status ${response.status}`);
        return null;
      }

      const data = await response.json();

      if (data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry;
        return { latitude: lat, longitude: lng };
      } else {
        console.error('No results found for the given location.');
        return null;
      }
    } catch (error) {
      console.error('Error geocoding location:', error);
      return null;
    }
  },

  getCachedWeather(): WeatherData {
    return cachedWeather || DEFAULT_WEATHER;
  }
}

// Export getUserLocation
export async function getUserLocation(): Promise<string | { error: string }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser.');
      resolve({ error: 'Geolocation is not supported' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        resolve(`${latitude},${longitude}`);
      },
      (error) => {
        console.error('Error getting user location:', error);
        if (error.code === error.PERMISSION_DENIED) {
          resolve({ error: 'Location access denied' });
        } else {
          resolve({ error: 'Error getting location' });
        }
      }
    );
  });
}