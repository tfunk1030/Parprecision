'use client'

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface WindProfileData {
  height: number;
  baseSpeed: number;
  actualSpeed: number;
  turbulence: number;
}

interface WindProfileProps {
  baseWindSpeed?: number;
  roughnessLength?: number;
  turbulenceIntensity?: number;
}

const WindProfileVisualizer = () => {
  const [windParams, setWindParams] = useState({
    windSpeed: 10,
    windDirection: 0,
    height: 250,
    temperature: 70,
    stability: 'neutral'
  });

  const [profileData, setProfileData] = useState<WindProfileData[]>([]);

  useEffect(() => {
    updateProfile();
  }, [windParams]);

  const updateProfile = () => {
    const calculateProfile = () => {
      const data: WindProfileData[] = [];
      const referenceHeight = 10; // meters
      const maxHeight = 100; // meters
      const heightStep = 5; // meters

      for (let height = 0; height <= maxHeight; height += heightStep) {
        // Power law wind profile
        const baseSpeed = windParams.windSpeed * Math.pow(height / referenceHeight, 0.14);
        
        // Add turbulence component
        const turbulence = (Math.random() - 0.5) * 2 * 0.2 * baseSpeed;
        const actualSpeed = baseSpeed + turbulence;

        data.push({
          height,
          baseSpeed,
          actualSpeed,
          turbulence
        });
      }

      return data;
    };

    setProfileData(calculateProfile());
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
          <p className="text-white">Height: {payload[0].payload.height}m</p>
          <p className="text-emerald-400">Speed: {payload[0].payload.actualSpeed.toFixed(1)} m/s</p>
          <p className="text-blue-400">Base: {payload[0].payload.baseSpeed.toFixed(1)} m/s</p>
          <p className="text-red-400">Turbulence: {payload[0].payload.turbulence.toFixed(2)} m/s</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-xl font-bold text-white mb-4">Wind Profile Analysis</h2>
        
        {/* Controls */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Wind Speed: {windParams.windSpeed} mph
            </label>
            <input
              type="range"
              min="0"
              max="30"
              value={windParams.windSpeed}
              onChange={(e) => setWindParams(prev => ({
                ...prev,
                windSpeed: Number(e.target.value)
              }))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Direction: {windParams.windDirection}°
            </label>
            <input
              type="range"
              min="0"
              max="359"
              value={windParams.windDirection}
              onChange={(e) => setWindParams(prev => ({
                ...prev,
                windDirection: Number(e.target.value)
              }))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Wind Profile Chart */}
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              width={800}
              height={400}
              data={profileData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis 
                dataKey="actualSpeed"
                label={{ value: 'Wind Speed (m/s)', position: 'bottom', style: { fill: 'white' } }}
                stroke="#fff"
              />
              <YAxis 
                dataKey="height"
                label={{ value: 'Height (m)', angle: -90, position: 'left', style: { fill: 'white' } }}
                stroke="#fff"
              />
              <Tooltip content={<CustomTooltip />} />
              
              <Line 
                type="monotone"
                dataKey="baseSpeed"
                stroke="#4ade80"
                strokeWidth={2}
                dot={false}
                name="Base Profile"
              />
              <Line 
                type="monotone"
                dataKey="actualSpeed"
                stroke="#60a5fa"
                strokeWidth={2}
                dot={false}
                name="Actual Wind"
              />
              <ReferenceLine 
                x={windParams.windSpeed} 
                stroke="#fff" 
                strokeDasharray="3 3"
                label={{ value: 'Surface Wind', position: 'left', style: { fill: 'white' } }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Wind Vector Display */}
        <div className="mt-6">
          <div className="relative w-32 h-32 mx-auto">
            <div 
              className="absolute inset-0 border-2 border-gray-600 rounded-full"
              style={{
                transform: `rotate(${windParams.windDirection}deg)`
              }}
            >
              <div 
                className="absolute top-0 left-1/2 w-1 h-1/2 bg-blue-500"
                style={{
                  transformOrigin: 'bottom center',
                  transform: 'translateX(-50%)',
                  height: `${Math.min(windParams.windSpeed * 2, 100)}%`
                }}
              >
                <div className="w-3 h-3 bg-blue-500 transform -translate-x-1/2 rotate-45" />
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-bold">
                {windParams.windSpeed} mph
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WindProfileVisualizer;
