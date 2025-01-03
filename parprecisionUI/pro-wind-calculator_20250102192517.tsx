'use client'

import React, { useState, useRef, useEffect } from 'react';
import { Wind } from 'lucide-react';
import { useWeather } from '@/context/WeatherContext';

const ProWindCalculator = () => {
  const { weather, setWeather } = useWeather();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Local state for shot data as shown
  const [shotData, setShotData] = useState({
    direction: 0,
    distance: 150,
  });

  // If weather is still loading, show fallback
  if (!weather) {
    return <div>Loading weather...</div>;
  }

  // Transform weather data into local windData for display
  const [windData, setWindData] = useState({
    speed: String(weather.windSpeed),
    direction: String(weather.windDirection),
  });

  // Handler for wind speed input
  const handleWindSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseFloat(e.target.value) || 0;
    setWindData({ ...windData, speed: raw.toFixed(1) });
    // Also update global context if you want it to sync
    setWeather((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        windSpeed: parseFloat(raw.toFixed(1)),
      };
    });
  };

  // Handler for wind direction input
  const handleWindDirectionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseFloat(e.target.value) || 0;
    setWindData({ ...windData, direction: raw.toFixed(0) });
    // Also update context
    setWeather((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        windDirection: raw,
      };
    });
  };

  // Draw a simple representation of the wind direction
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and redraw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Example: just draw an arrow indicating wind direction
    // ...
  }, [windData]);

  // Optionally recalc something based on shot/wind changes
  useEffect(() => {
    // Example: do a quick calculation or call a physics function
    // ...
  }, [windData, shotData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-emerald-400">Pro Wind Calculator</h1>
          <div className="flex items-center gap-2 bg-emerald-500/20 px-3 py-1 rounded-lg">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            <span className="text-sm text-emerald-500">PRO</span>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-md border border-gray-700/50 mb-6">
          <div className="aspect-square mb-6">
            <canvas ref={canvasRef} width={400} height={400} className="w-full h-full" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-emerald-500 mb-1">Wind Speed (mph)</label>
              <input
                type="number"
                value={windData.speed}
                onChange={handleWindSpeedChange}
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-emerald-300 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-emerald-500 mb-1">Wind Direction (°)</label>
              <input
                type="number"
                value={windData.direction}
                onChange={handleWindDirectionChange}
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-emerald-300 focus:ring-2 focus:ring-emerald-500"
                min="0"
                max="360"
              />
            </div>
          </div>

          <div className="mt-4 p-3 bg-emerald-500/10 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <Wind size={16} />
              <span>Wind direction indicates where the wind is coming FROM (0° = from North).</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-md border border-gray-700/50 mb-6">
          <h3 className="text-xl font-semibold text-emerald-400 mb-4">Shot Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-emerald-500 mb-1">Shot Direction (°)</label>
              <input
                type="number"
                value={shotData.direction}
                onChange={(e) => setShotData({ ...shotData, direction: parseFloat(e.target.value) || 0 })}
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-emerald-300 focus:ring-2 focus:ring-emerald-500"
                min="0"
                max="360"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-emerald-500 mb-1">Shot Distance (yards)</label>
              <input
                type="number"
                value={shotData.distance}
                onChange={(e) => setShotData({ ...shotData, distance: parseFloat(e.target.value) || 0 })}
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-emerald-300 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProWindCalculator;