'use client'

import React, { useState, useEffect } from 'react';
import { Cloud, Wind, Thermometer, Droplets, Mountain, ArrowUpRight } from 'lucide-react';

interface WeatherData {
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  altitude: number;
}

interface WeatherDisplayProps {
  onWeatherChange?: (weather: WeatherData) => void;
}

export default function WeatherDisplay({ onWeatherChange }: WeatherDisplayProps) {
  const [weather, setWeather] = useState<WeatherData>({
    temperature: 72,
    humidity: 60,
    pressure: 29.92,
    windSpeed: 10,
    windDirection: 45,
    altitude: 0
  });

  useEffect(() => {
    onWeatherChange?.(weather);
  }, [weather, onWeatherChange]);

  return (
    <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-emerald-900/50">
      <h2 className="text-xl font-semibold text-emerald-400 mb-4">Weather Conditions</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-gray-800/50 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <Thermometer className="w-4 h-4" />
            <span className="text-sm">Temperature</span>
          </div>
          <input
            type="number"
            value={weather.temperature}
            onChange={(e) => setWeather({ ...weather, temperature: parseFloat(e.target.value) })}
            className="w-full bg-transparent text-2xl text-white focus:outline-none"
          />
          <span className="text-sm text-gray-400">°F</span>
        </div>

        <div className="bg-gray-800/50 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <Wind className="w-4 h-4" />
            <span className="text-sm">Wind Speed</span>
          </div>
          <input
            type="number"
            value={weather.windSpeed}
            onChange={(e) => setWeather({ ...weather, windSpeed: parseFloat(e.target.value) })}
            className="w-full bg-transparent text-2xl text-white focus:outline-none"
          />
          <span className="text-sm text-gray-400">mph</span>
        </div>

        <div className="bg-gray-800/50 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <ArrowUpRight className="w-4 h-4" />
            <span className="text-sm">Wind Direction</span>
          </div>
          <input
            type="number"
            value={weather.windDirection}
            onChange={(e) => setWeather({ ...weather, windDirection: parseFloat(e.target.value) })}
            className="w-full bg-transparent text-2xl text-white focus:outline-none"
          />
          <span className="text-sm text-gray-400">degrees</span>
        </div>

        <div className="bg-gray-800/50 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <Droplets className="w-4 h-4" />
            <span className="text-sm">Humidity</span>
          </div>
          <input
            type="number"
            value={weather.humidity}
            onChange={(e) => setWeather({ ...weather, humidity: parseFloat(e.target.value) })}
            className="w-full bg-transparent text-2xl text-white focus:outline-none"
          />
          <span className="text-sm text-gray-400">%</span>
        </div>

        <div className="bg-gray-800/50 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <Cloud className="w-4 h-4" />
            <span className="text-sm">Pressure</span>
          </div>
          <input
            type="number"
            value={weather.pressure}
            onChange={(e) => setWeather({ ...weather, pressure: parseFloat(e.target.value) })}
            className="w-full bg-transparent text-2xl text-white focus:outline-none"
          />
          <span className="text-sm text-gray-400">inHg</span>
        </div>

        <div className="bg-gray-800/50 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <Mountain className="w-4 h-4" />
            <span className="text-sm">Altitude</span>
          </div>
          <input
            type="number"
            value={weather.altitude}
            onChange={(e) => setWeather({ ...weather, altitude: parseFloat(e.target.value) })}
            className="w-full bg-transparent text-2xl text-white focus:outline-none"
          />
          <span className="text-sm text-gray-400">ft</span>
        </div>
      </div>
    </div>
  );
}
