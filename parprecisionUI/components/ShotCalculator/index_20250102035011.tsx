import React, { useState, useEffect } from 'react';
import { physicsService, BasicShotParams, ShotResult } from '../../services/physics-service';
import { monitoring } from '../../services/monitoring';
import { environmentalService } from '../../lib/environmental-service';
import type { WeatherData } from '../../types/weather';
import type { Location } from '../../lib/environmental-service';

interface ShotCalculatorProps {
  initialClub?: string;
  initialDistance?: number;
}

export const ShotCalculator: React.FC<ShotCalculatorProps> = ({ initialClub, initialDistance }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ShotResult | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [location, setLocation] = useState<Location | null>(null);

  const [params, setParams] = useState<BasicShotParams>({
    distance: initialDistance || 150,
    clubType: initialClub || 'iron7',
    temperature: 70,
  });

  const handleParamChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setParams((prev) => ({
      ...prev,
      [name]: name === 'distance' || name === 'temperature' ? Number(value) : value,
    }));
  };

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await physicsService.calculateShot(params);
      setResults(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Calculation failed';
      setError(errorMessage);
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleManualLocationSubmit = async (manualLocation: { latitude: number; longitude: number }) => {
    try {
      const weatherData = await environmentalService.getWeatherData(
        manualLocation.latitude,
        manualLocation.longitude
      );
      setWeather(weatherData);
      setLocation({
        latitude: manualLocation.latitude,
        longitude: manualLocation.longitude,
        altitude: null,
        accuracy: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to fetch weather data for manual location:', error);
    }
  };

  useEffect(() => {
    const fetchWeatherData = async () => {
      if (location) {
        try {
          const weatherData = await environmentalService.getWeatherData(
            location.latitude,
            location.longitude
          );
          setWeather(weatherData);
        } catch (error) {
          console.error('Failed to fetch weather data:', error);
        }
      }
    };

    fetchWeatherData();
  }, [location]);

  useEffect(() => {
    if (weather) {
      setParams(prev => ({
        ...prev,
        temperature: weather.temperature,
        windSpeed: weather.windSpeed,
        windDirection: weather.windDirection,
        pressure: weather.pressure,
        humidity: weather.humidity
      }));
    }
  }, [weather]);

  return (
    <div className="p-4 bg-white rounded shadow" data-testid="shot-calculator">
      <h2 className="text-xl font-bold mb-4">Shot Calculator</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Distance (yards)
          </label>
          <input
            type="number"
            name="distance"
            value={params.distance}
            onChange={handleParamChange}
            className="mt-1 block w-full rounded border-gray-300 shadow-sm"
            data-testid="distance-input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Club Type
          </label>
          <select
            name="clubType"
            value={params.clubType}
            onChange={handleParamChange}
            className="mt-1 block w-full rounded border-gray-300 shadow-sm"
            data-testid="club-type-select"
          >
            <option value="driver">Driver</option>
            <option value="wood3">3 Wood</option>
            <option value="iron5">5 Iron</option>
            <option value="iron7">7 Iron</option>
            <option value="iron9">9 Iron</option>
            <option value="wedge">Wedge</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Temperature (°F)
          </label>
          <input
            type="number"
            name="temperature"
            value={params.temperature}
            onChange={handleParamChange}
            className="mt-1 block w-full rounded border-gray-300 shadow-sm"
            data-testid="temperature-input"
          />
        </div>

        <button
          onClick={handleCalculate}
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          data-testid="calculate-button"
        >
          {loading ? 'Calculating...' : 'Calculate Shot'}
        </button>

        {error && (
          <div className="text-red-600" data-testid="error-message">
            {error}
          </div>
        )}

        {results && (
          <div className="mt-4 p-4 bg-gray-50 rounded" data-testid="results">
            <h3 className="font-semibold mb-2">Results</h3>
            <div className="space-y-2">
              <p data-testid="adjusted-distance">
                Adjusted Distance: {results.adjustedDistance.toFixed(1)} yards
              </p>
              <p data-testid="max-height">
                Maximum Height: {results.maxHeight.toFixed(1)} yards
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 