import { NextResponse } from 'next/server';
import { monitoring } from '@/services/monitoring';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');

    if (!location) {
      return NextResponse.json({ error: 'Location parameter is required' }, { status: 400 });
    }

    const [lat, lon] = location.split(',').map(Number);
    
    if (isNaN(lat) || isNaN(lon)) {
      return NextResponse.json({ error: 'Invalid location format' }, { status: 400 });
    }

    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    if (!apiKey) {
      monitoring.trackError(new Error('OpenWeatherMap API key not configured'), {
        operation: 'weather_api',
        params: { location }
      });
      return NextResponse.json({ error: 'Weather service not configured' }, { status: 500 });
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    monitoring.trackEvent('weather_api_request', { url: url.replace(apiKey, '[REDACTED]') });

    const response = await fetch(url);
    const responseText = await response.text();

    if (!response.ok) {
      monitoring.trackError(new Error(`OpenWeatherMap API error: ${response.status}`), {
        operation: 'weather_api',
        params: { 
          status: response.status,
          location,
          response: responseText
        }
      });
      return NextResponse.json(
        { error: 'Failed to fetch weather data', details: responseText },
        { status: response.status }
      );
    }

    const data = JSON.parse(responseText);
    monitoring.trackEvent('weather_data_fetched', { location });

    return NextResponse.json({
      temperature: data.main.temp * 9/5 + 32,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: data.wind.speed * 2.237,
      windDirection: data.wind.deg,
      altitude: 0,
      latitude: lat,
      longitude: lon
    });
  } catch (error) {
    monitoring.trackError(error instanceof Error ? error : new Error('Unknown error in weather API'), {
      operation: 'weather_api',
      params: { url: request.url }
    });
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 