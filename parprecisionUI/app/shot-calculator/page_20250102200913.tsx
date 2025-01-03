'use client';

import { useWeather } from '@/context/WeatherContext';

export default function ShotCalculator() {
  const { weather } = useWeather();

  if (!weather) {
    return <div className="p-4">Loading weather data...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Shot Calculator</h1>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-800/50 p-4 rounded-lg">
          <h2 className="text-sm font-medium text-gray-400">Temperature</h2>
          <p className="text-xl">{weather.temperature.toFixed(1)}°F</p>
        </div>
        <div className="bg-gray-800/50 p-4 rounded-lg">
          <h2 className="text-sm font-medium text-gray-400">Wind</h2>
          <p className="text-xl">{weather.windSpeed.toFixed(1)} mph</p>
        </div>
      </div>

      {/* Rest of your shot calculator UI */}
    </div>
  );
}