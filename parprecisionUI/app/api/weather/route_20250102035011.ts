import { NextResponse } from 'next/server';

const TOMORROW_IO_API_URL = 'https://api.tomorrow.io/v4/weather/realtime';
const OPENWEATHERMAP_API_URL = 'https://api.openweathermap.org/data/2.5/weather';
const ALTITUDE_API_URL = 'https://api.open-elevation.com/api/v1/lookup';

const TOMORROW_IO_API_KEY = process.env.TOMORROW_IO_API_KEY;
const OPENWEATHERMAP_API_KEY = process.env.OPENWEATHERMAP_API_KEY;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get('location');

  if (!location) {
    return NextResponse.json({ error: 'Location is required' }, { status: 400 });
  }

  try {
    let weatherData;
    
    // Check if location is in lat,lon format
    const [lat, lon] = location.split(',').map(Number);
    if (!isNaN(lat) && !isNaN(lon)) {
      // Try Tomorrow.io first with coordinates
      weatherData = await fetchFromTomorrowIOWithCoords(lat, lon);

      // If Tomorrow.io fails, try OpenWeatherMap with coordinates
      if (!weatherData) {
        weatherData = await fetchFromOpenWeatherMapWithCoords(lat, lon);
      }
    } else {
      // Try Tomorrow.io first with location name
      weatherData = await fetchFromTomorrowIO(location);

      // If Tomorrow.io fails, try OpenWeatherMap with location name
      if (!weatherData) {
        weatherData = await fetchFromOpenWeatherMap(location);
      }
    }

    // If both weather APIs fail, return an error
    if (!weatherData) {
      return NextResponse.json({ error: 'Failed to fetch weather data from both APIs' }, { status: 500 });
    }

    // Fetch altitude data
    const altitudeData = await fetchAltitude(weatherData.latitude, weatherData.longitude);

    // Combine weather and altitude data
    const combinedData = {
      ...weatherData,
      altitude: altitudeData,
    };

    return NextResponse.json(combinedData);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function fetchFromTomorrowIOWithCoords(lat: number, lon: number) {
  if (!TOMORROW_IO_API_KEY) {
    console.error('TOMORROW_IO_API_KEY is not defined');
    return null;
  }

  const url = `${TOMORROW_IO_API_URL}?location=${lat},${lon}&apikey=${TOMORROW_IO_API_KEY}&units=imperial`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Tomorrow.io API request failed with status ${response.status}`);
      return null;
    }
    const data = await response.json();

    return {
      temperature: data.data.values.temperature,
      humidity: data.data.values.humidity,
      pressure: data.data.values.pressureSurfaceLevel,
      windSpeed: data.data.values.windSpeed,
      windDirection: data.data.values.windDirection,
      latitude: lat,
      longitude: lon,
    };
  } catch (error) {
    console.error('Error fetching data from Tomorrow.io:', error);
    return null;
  }
}

async function fetchFromOpenWeatherMapWithCoords(lat: number, lon: number) {
  if (!OPENWEATHERMAP_API_KEY) {
    console.error('OPENWEATHERMAP_API_KEY is not defined');
    return null;
  }

  const url = `${OPENWEATHERMAP_API_URL}?lat=${lat}&lon=${lon}&appid=${OPENWEATHERMAP_API_KEY}&units=imperial`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`OpenWeatherMap API request failed with status ${response.status}`);
      return null;
    }
    const data = await response.json();

    return {
      temperature: data.main.temp,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: data.wind.speed,
      windDirection: data.wind.deg,
      latitude: lat,
      longitude: lon,
    };
  } catch (error) {
    console.error('Error fetching data from OpenWeatherMap:', error);
    return null;
  }
}

async function fetchFromTomorrowIO(location: string) {
  if (!TOMORROW_IO_API_KEY) {
    console.error('TOMORROW_IO_API_KEY is not defined');
    return null;
  }

  const url = `${TOMORROW_IO_API_URL}?location=${location}&apikey=${TOMORROW_IO_API_KEY}&units=imperial`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Tomorrow.io API request failed with status ${response.status}`);
      return null;
    }
    const data = await response.json();

    // Adapt Tomorrow.io's response to your WeatherData interface
    return {
      temperature: data.data.values.temperature,
      humidity: data.data.values.humidity,
      pressure: data.data.values.pressureSurfaceLevel,
      windSpeed: data.data.values.windSpeed,
      windDirection: data.data.values.windDirection,
      latitude: data.location.lat,
      longitude: data.location.lon,
    };
  } catch (error) {
    console.error('Error fetching data from Tomorrow.io:', error);
    return null;
  }
}

async function fetchFromOpenWeatherMap(location: string) {
  if (!OPENWEATHERMAP_API_KEY) {
    console.error('OPENWEATHERMAP_API_KEY is not defined');
    return null;
  }

  const url = `${OPENWEATHERMAP_API_URL}?q=${location}&appid=${OPENWEATHERMAP_API_KEY}&units=imperial`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`OpenWeatherMap API request failed with status ${response.status}`);
      return null;
    }
    const data = await response.json();

    // Adapt OpenWeatherMap's response to your WeatherData interface
    return {
      temperature: data.main.temp,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: data.wind.speed,
      windDirection: data.wind.deg,
      latitude: data.coord.lat,
      longitude: data.coord.lon,
    };
  } catch (error) {
    console.error('Error fetching data from OpenWeatherMap:', error);
    return null;
  }
}

async function fetchAltitude(latitude: number, longitude: number) {
  const url = `${ALTITUDE_API_URL}?locations=${latitude},${longitude}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Altitude API request failed with status ${response.status}`);
      return null;
    }
    const data = await response.json();

    // Extract altitude from the response
    return data.results[0].elevation;
  } catch (error) {
    console.error('Error fetching altitude data:', error);
    return null;
  }
} 