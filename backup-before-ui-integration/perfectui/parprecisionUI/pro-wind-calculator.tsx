'use client'

import React, { useState, useRef, useEffect } from 'react';
import { Wind, Target } from 'lucide-react';

interface TrajectoryFactors {
  low: number;
  medium: number;
  high: number;
}

interface EffectData {
  windType: string;
  headWindEffect: number;
  crossWindEffect: number;
  totalEffect: number;
  adjustedDistance: number;
  relativeAngle: number;
  trajectoryFactor: number;
}

const trajectoryFactors: TrajectoryFactors = {
  low: 0.7,
  medium: 1.0,
  high: 1.3
};

const ProWindCalculator = () => {
  const [windData, setWindData] = useState({
    speed: '',
    direction: ''  // 0-360 degrees, 0 = N, 90 = E
  });
  
  const [shotData, setShotData] = useState({
    distance: '',
    direction: '',  // 0-360 degrees, 0 = N, 90 = E
    trajectory: 'medium' as keyof TrajectoryFactors  // low, medium, high
  });

  const [effectData, setEffectData] = useState<EffectData | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const calculateWindEffect = () => {
    if (!windData.speed || !windData.direction || !shotData.direction || !shotData.distance) {
      return;
    }

    // Convert directions to radians and calculate relative angle
    const windDir = (parseInt(windData.direction) * Math.PI) / 180;
    const shotDir = (parseInt(shotData.direction) * Math.PI) / 180;
    const relativeAngle = Math.abs(windDir - shotDir);

    // Calculate head/tail and crosswind components
    const windSpeed = parseFloat(windData.speed);
    const headWindEffect = windSpeed * Math.cos(relativeAngle);
    const crossWindEffect = windSpeed * Math.sin(relativeAngle);

    // Trajectory factors
    const trajectoryFactor = trajectoryFactors[shotData.trajectory];

    // Calculate total effects
    const distance = parseInt(shotData.distance);
    const headWindAdjustment = -headWindEffect * 0.5 * trajectoryFactor; // yards per mph
    const crossWindAdjustment = crossWindEffect * 0.8 * trajectoryFactor; // yards per mph

    // Determine wind type based on angle
    const angleDegrees = (relativeAngle * 180) / Math.PI;
    let windType = 'Crosswind';
    if (angleDegrees <= 45 || angleDegrees >= 315) {
      windType = 'Headwind';
    } else if (angleDegrees >= 135 && angleDegrees <= 225) {
      windType = 'Tailwind';
    }

    setEffectData({
      windType,
      headWindEffect: Math.round(headWindAdjustment),
      crossWindEffect: Math.round(crossWindAdjustment),
      totalEffect: Math.round(Math.sqrt(headWindAdjustment**2 + crossWindAdjustment**2)),
      adjustedDistance: Math.round(distance + headWindAdjustment),
      relativeAngle: Math.round(angleDegrees),
      trajectoryFactor
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 40;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw compass circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw compass points
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    directions.forEach((dir, i) => {
      const angle = (i * Math.PI / 4) - Math.PI / 2;
      const x = centerX + Math.cos(angle) * (radius + 20);
      const y = centerY + Math.sin(angle) * (radius + 20);
      
      ctx.fillStyle = '#64748b';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(dir, x, y);
    });

    // Draw wind vector
    if (windData.speed && windData.direction) {
      const angle = (parseInt(windData.direction) + 90) * Math.PI / 180;
      const length = Math.min(parseInt(windData.speed) * 5, radius);
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(angle) * length,
        centerY + Math.sin(angle) * length
      );
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Wind arrow head
      const headLen = 15;
      ctx.beginPath();
      ctx.moveTo(
        centerX + Math.cos(angle) * length,
        centerY + Math.sin(angle) * length
      );
      ctx.lineTo(
        centerX + Math.cos(angle) * length - headLen * Math.cos(angle - Math.PI / 6),
        centerY + Math.sin(angle) * length - headLen * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        centerX + Math.cos(angle) * length - headLen * Math.cos(angle + Math.PI / 6),
        centerY + Math.sin(angle) * length - headLen * Math.sin(angle + Math.PI / 6)
      );
      ctx.fillStyle = '#10b981';
      ctx.fill();
    }

    // Draw shot direction
    if (shotData.direction) {
      const angle = (parseInt(shotData.direction) - 90) * Math.PI / 180;
      const length = radius * 0.8;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(angle) * length,
        centerY + Math.sin(angle) * length
      );
      ctx.strokeStyle = '#eab308';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);

      // Shot arrow head
      const headLen = 12;
      ctx.beginPath();
      ctx.moveTo(
        centerX + Math.cos(angle) * length,
        centerY + Math.sin(angle) * length
      );
      ctx.lineTo(
        centerX + Math.cos(angle) * length - headLen * Math.cos(angle - Math.PI / 6),
        centerY + Math.sin(angle) * length - headLen * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        centerX + Math.cos(angle) * length - headLen * Math.cos(angle + Math.PI / 6),
        centerY + Math.sin(angle) * length - headLen * Math.sin(angle + Math.PI / 6)
      );
      ctx.fillStyle = '#eab308';
      ctx.fill();
    }
  }, [windData, shotData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-emerald-400">Pro Wind Calculator</h1>
          <div className="flex items-center gap-2 bg-emerald-500/20 px-3 py-1 rounded-lg">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="text-sm text-emerald-500">PRO</span>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-md border border-gray-700/50 mb-6">
          <div className="aspect-square mb-6">
            <canvas 
              ref={canvasRef}
              width={400}
              height={400}
              className="w-full h-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-emerald-500 mb-1">Wind Speed (mph)</label>
              <input
                type="number"
                value={windData.speed}
                onChange={(e) => setWindData({...windData, speed: e.target.value})}
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-emerald-300 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-emerald-500 mb-1">Wind Direction (°)</label>
              <input
                type="number"
                value={windData.direction}
                onChange={(e) => setWindData({...windData, direction: e.target.value})}
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-emerald-300 focus:ring-2 focus:ring-emerald-500"
                min="0"
                max="360"
                placeholder="0-360°"
              />
            </div>
          </div>

          <div className="mt-4 p-3 bg-emerald-500/10 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <Wind size={16} />
              <span>Wind direction indicates where the wind is coming FROM (0° = wind from North)</span>
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
                onChange={(e) => setShotData({...shotData, direction: e.target.value})}
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-emerald-300 focus:ring-2 focus:ring-emerald-500"
                min="0"
                max="360"
                placeholder="0-360°"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-emerald-500 mb-1">Shot Distance (yards)</label>
              <input
                type="number"
                value={shotData.distance}
                onChange={(e) => setShotData({...shotData, distance: e.target.value})}
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-emerald-300 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-emerald-500 mb-1">Shot Trajectory</label>
              <select
                value={shotData.trajectory}
                onChange={(e) => setShotData({...shotData, trajectory: e.target.value as keyof TrajectoryFactors})}
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-emerald-300 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        </div>

        {effectData && (
          <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-md border border-gray-700/50 mb-6">
            <h3 className="text-xl font-semibold text-emerald-400 mb-4">Wind Effect</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                <span className="text-emerald-400">Wind Type:</span>
                <span className="font-semibold">{effectData.windType}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                <span className="text-emerald-400">Relative Angle:</span>
                <span className="font-semibold">{effectData.relativeAngle}°</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                <span className="text-emerald-400">Trajectory Factor:</span>
                <span className="font-semibold">×{effectData.trajectoryFactor}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                <span className="text-emerald-400">Distance Effect:</span>
                <span className={`font-semibold ${effectData.headWindEffect > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {effectData.headWindEffect > 0 ? '+' : ''}{effectData.headWindEffect} yards
                </span>
              </div>
              {Math.abs(effectData.crossWindEffect) > 0 && (
                <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                  <span className="text-emerald-400">Side Effect:</span>
                  <span className="font-semibold">
                    {Math.abs(effectData.crossWindEffect)} yards 
                    {effectData.crossWindEffect > 0 ? ' right' : ' left'}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                <span className="text-emerald-400">Adjusted Distance:</span>
                <span className="font-semibold text-lg">{effectData.adjustedDistance} yards</span>
              </div>
            </div>
          </div>
        )}

        <button 
          onClick={calculateWindEffect}
          className="w-full bg-emerald-600 text-white py-4 rounded-xl font-semibold hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2"
        >
          <Target size={20} />
          Calculate Wind Effect
        </button>
      </div>
    </div>
  );
};

export default ProWindCalculator;