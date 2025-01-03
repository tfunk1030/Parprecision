'use client'

import React, { useRef, useEffect, useState } from 'react';
import { Wind } from 'lucide-react';
import { useWeather } from '@/context/WeatherContext';

const ProWindCalculator = () => {
  const { weather, setWeather } = useWeather();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [windData, setWindData] = useState({
    speed: '0',
    direction: '0',
  });

  const [shotData, setShotData] = useState({
    direction: 0,
    distance: 150,
  });

  useEffect(() => {
    if (!weather) return;
    setWindData({
      speed: String(weather.windSpeed.toFixed(1)),
      direction: String(weather.windDirection.toFixed(0)),
    });
  }, [weather]);

  const handleWindSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || 0;
    setWindData((prev) => ({ ...prev, speed: val.toFixed(1) }));

    setWeather((prev) => {
      if (!prev) return null;
      return { ...prev, windSpeed: parseFloat(val.toFixed(1)) };
    });
  };

  const handleWindDirectionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || 0;
    setWindData((prev) => ({ ...prev, direction: val.toFixed(0) }));

    setWeather((prev) => {
      if (!prev) return null;
      return { ...prev, windDirection: parseFloat(val.toFixed(0)) };
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const angle = parseFloat(windData.direction) || 0;

    // Demonstration: basic arrow in the center pointing to "angle"
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.beginPath();
    ctx.moveTo(0, -50);
    ctx.lineTo(0, 50);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }, [windData]);

  useEffect(() => {
    // Additional logic if needed
  }, [shotData, windData]);

  if (!weather) {
    return <div className="text-white p-4">Loading weather...</div>;
  }

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
                step="0.1"
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-emerald-300 focus:ring-2 focus:ring-emerald-500"
                value={windData.speed}
                onChange={handleWindSpeedChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-emerald-500 mb-1">Wind Direction (°)</label>
              <input
                type="number"
                step="1"
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-emerald-300 focus:ring-2 focus:ring-emerald-500"
                value={windData.direction}
                onChange={handleWindDirectionChange}
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
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-emerald-300 focus:ring-2 focus:ring-emerald-500"
                value={shotData.direction}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setShotData((prev) => ({ ...prev, direction: val }));
                }}
                min="0"
                max="360"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-emerald-500 mb-1">Shot Distance (yards)</label>
              <input
                type="number"
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-emerald-300 focus:ring-2 focus:ring-emerald-500"
                value={shotData.distance}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setShotData((prev) => ({ ...prev, distance: val }));
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProWindCalculator;