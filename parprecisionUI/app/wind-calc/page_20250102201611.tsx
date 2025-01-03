'use client'

import { useState, useEffect } from 'react';
import { useWeather } from '@/context/WeatherContext';
import { WindDirectionCompass } from '@/components/Wind-Direction-Compass';

type WindCalcState = {
  windDirection: number;
  windSpeed: number;
  shotDirection: number;
  targetYardage: number;
};

export default function WindCalcPage() {
  const { weather, setWeather } = useWeather();
  const [windState, setWindState] = useState<WindCalcState>({
    windDirection: weather?.windDirection || 0,
    windSpeed: weather?.windSpeed || 0,
    shotDirection: 0,
    targetYardage: 150
  });

  // Sync with WeatherContext when it updates
  useEffect(() => {
    if (weather) {
      setWindState(prev => ({
        ...prev,
        windDirection: weather.windDirection,
        windSpeed: weather.windSpeed
      }));
    }
  }, [weather]);

  const handleWindSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSpeed = parseFloat(e.target.value) || 0;
    const formattedSpeed = Number(newSpeed.toFixed(1));
    setWindState(prev => ({ ...prev, windSpeed: formattedSpeed }));
    setWeather(prev => prev ? { ...prev, windSpeed: formattedSpeed } : null);
  };

  const handleDirectionChange = (type: 'wind' | 'shot', degrees: number) => {
    if (type === 'wind') {
      setWindState(prev => ({ ...prev, windDirection: degrees }));
      setWeather(prev => prev ? { ...prev, windDirection: degrees } : null);
    }
  };

  const handleTargetYardageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const yards = parseFloat(e.target.value) || 0;
    setWindState(prev => ({ ...prev, targetYardage: yards }));
  };

  const handleCalculateEffect = () => {
    // Implement wind effect calculation
    console.log('Calculating wind effect with:', windState);
  };

  if (!weather) {
    return <div className="p-4 text-white">Loading weather data...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Wind Calculator</h1>

      <div className="max-w-xl mx-auto space-y-6 bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg border border-gray-700/50 shadow-xl">
        {/* Weather Data Display */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-900/50 rounded-lg">
          <div className="text-sm text-gray-400">
            Temperature: {weather.temperature.toFixed(1)}°F
          </div>
          <div className="text-sm text-gray-400">
            Humidity: {weather.humidity.toFixed(1)}%
          </div>
        </div>

        {/* Wind Direction Display and Controls */}
        <div className="flex flex-col items-center">
          <div className="text-sm font-medium text-gray-400 mb-2 bg-gray-900/50 px-4 py-2 rounded-full">
            <span>
              <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-1 shadow-lg shadow-blue-500/50" />
              Wind: {windState.windDirection.toFixed(1)}°
            </span>
          </div>

          {/* Manual Wind Speed Input */}
          <div className="w-full mb-4">
            <label className="block text-sm text-gray-400 mb-1">
              Wind Speed (mph)
            </label>
            <input
              type="number"
              value={windState.windSpeed}
              onChange={handleWindSpeedChange}
              className="w-full bg-gray-900/50 border border-gray-700 rounded p-2 text-white"
              step="0.1"
              min="0"
              max="100"
            />
            <div className="text-center text-sm text-gray-400 mt-1">
              Current: {windState.windSpeed.toFixed(1)} mph
            </div>
          </div>

          <div className="text-sm text-gray-400 mb-4 opacity-75">
            Drag the blue handle to set wind direction
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/5 rounded-full blur-2xl" />
            <WindDirectionCompass
              windDirection={windState.windDirection}
              shotDirection={windState.shotDirection}
              onChange={handleDirectionChange}
              size={280}
              lockShot={true}
            />
          </div>
        </div>

        {/* Target Yardage Input */}
        <div className="space-y-2">
          <label className="block text-sm text-gray-400">
            Target Yardage
          </label>
          <input
            type="number"
            value={windState.targetYardage}
            onChange={handleTargetYardageChange}
            className="w-full bg-gray-900/50 border border-gray-700 rounded p-2 text-white"
            min="0"
            max="1000"
          />
        </div>

        {/* Calculate Button */}
        <button
          onClick={handleCalculateEffect}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Calculate Wind Effect
        </button>
      </div>
    </div>
  );
}
