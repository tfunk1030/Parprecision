import React, { useState, useEffect } from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Wind, ArrowUpRight, Crosshair } from 'lucide-react';

interface FlightDataPoint {
  time: number;
  x: number;
  y: number;
  z: number;
  velocity: number;
  height: number;
}

interface ShotData {
  clubType: string;
  ballSpeed: number;
  launchAngle: number;
  spinRate: number;
  windSpeed: number;
  windDirection: number;
  temperature: number;
  altitude: number;
  humidity: number;
}

export default function UltraRealisticShot({
  shotData = {
    clubType: 'Driver',
    ballSpeed: 167,
    launchAngle: 14.2,
    spinRate: 2800,
    windSpeed: 10,
    windDirection: 45,
    temperature: 72,
    altitude: 0,
    humidity: 60
  }
}) {
  const [view, setView] = useState('trajectory');
  const [flightData, setFlightData] = useState<FlightDataPoint[]>([]);
  const [playback, setPlayback] = useState(0);

  useEffect(() => {
    // Calculate realistic ball flight with advanced physics
    const calculateFlightPath = () => {
      const dt = 0.01; // Time step (seconds)
      const data: FlightDataPoint[] = [];
      let t = 0;
      
      // Initial conditions
      let x = 0, y = 0, z = 0;
      let vx = shotData.ballSpeed * Math.cos(shotData.launchAngle * Math.PI / 180);
      let vy = shotData.ballSpeed * Math.sin(shotData.launchAngle * Math.PI / 180);
      let vz = 0;

      // Environmental constants
      const g = -32.2;  // Gravity (ft/s²)
      const rho = 0.0023769 * Math.exp(-shotData.altitude / 30000); // Air density at altitude
      const spinFactor = shotData.spinRate / 2500; // Normalized spin effect
      
      // Ball characteristics
      const cd = 0.33;  // Drag coefficient
      const cl = 0.27;  // Lift coefficient
      const area = 0.00138; // Ball cross-sectional area (m²)
      const mass = 0.0459; // Ball mass (kg)

      while (y >= 0 && t < 10) {
        // Calculate forces
        const v = Math.sqrt(vx*vx + vy*vy + vz*vz);
        const dragForce = 0.5 * rho * cd * area * v * v;
        const liftForce = 0.5 * rho * cl * area * v * v * spinFactor;
        
        // Wind effects
        const windVx = shotData.windSpeed * Math.cos(shotData.windDirection * Math.PI / 180);
        const windVz = shotData.windSpeed * Math.sin(shotData.windDirection * Math.PI / 180);
        
        // Update velocities with forces
        vx += (-dragForce * vx/v + windVx/mass) * dt;
        vy += (g - dragForce * vy/v + liftForce/mass) * dt;
        vz += (-dragForce * vz/v + windVz/mass) * dt;
        
        // Update positions
        x += vx * dt;
        y += vy * dt;
        z += vz * dt;
        
        t += dt;
        
        data.push({
          time: t,
          x: x * 1.0936, // Convert to yards
          y: y * 1.0936,
          z: z * 1.0936,
          velocity: v * 2.237, // Convert to mph
          height: y * 1.0936
        });
      }
      
      return data;
    };

    setFlightData(calculateFlightPath());
  }, [shotData]);

  const visibleData = flightData.slice(0, Math.floor(flightData.length * (playback / 100)));

  useEffect(() => {
    if (playback < 100) {
      const timer = setInterval(() => {
        setPlayback(p => Math.min(p + 1, 100));
      }, 20);
      return () => clearInterval(timer);
    }
  }, [playback]);

  return (
    <div className="bg-gray-900 rounded-2xl p-8 shadow-2xl border border-gray-800">
      {/* Header with controls */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setView('trajectory')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              view === 'trajectory' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-800 text-gray-300'
            }`}
          >
            Trajectory View
          </button>
          <button
            onClick={() => setView('top')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              view === 'top' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-800 text-gray-300'
            }`}
          >
            Top View
          </button>
        </div>

        {/* Wind indicator */}
        <div className="flex items-center gap-3 bg-gray-800 px-4 py-2 rounded-lg">
          <Wind 
            className="text-white transform transition-transform" 
            style={{ transform: `rotate(${shotData.windDirection}deg)` }}
          />
          <div>
            <div className="text-gray-400 text-sm">Wind</div>
            <div className="text-white font-bold">{shotData.windSpeed} mph</div>
          </div>
        </div>
      </div>

      {/* Main visualization area */}
      <div className="relative h-[500px] bg-gray-800/50 rounded-xl overflow-hidden">
        {/* Shot path visualization */}
        <div className="absolute inset-0">
          <LineChart
            width={800}
            height={500}
            data={visibleData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <defs>
              <linearGradient id="shotPath" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.8} />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="rgba(255,255,255,0.1)" 
            />
            
            <XAxis
              dataKey="x"
              stroke="#ffffff80"
              label={{ 
                value: 'Distance (yards)', 
                position: 'bottom', 
                fill: 'white' 
              }}
            />
            
            <YAxis
              dataKey={view === 'trajectory' ? 'height' : 'z'}
              stroke="#ffffff80"
              label={({
                value: view === 'trajectory' ? 'Height (yards)' : 'Side (yards)',
                angle: -90,
                position: 'left',
                fill: 'white'
              })}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-black/90 text-white p-3 rounded-lg border border-gray-700">
                      <div className="font-bold">
                        {Math.round(payload[0].payload.x)} yards
                      </div>
                      <div className="text-sm text-gray-300">
                        Height: {Math.round(payload[0].payload.height)} yards
                      </div>
                      <div className="text-sm text-gray-300">
                        Speed: {Math.round(payload[0].payload.velocity)} mph
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Ball flight path */}
            <Line
              type="monotone"
              dataKey={view === 'trajectory' ? 'height' : 'z'}
              stroke="url(#shotPath)"
              strokeWidth={3}
              dot={false}
              filter="url(#glow)"
            />

            {/* Ball position marker */}
            {visibleData.length > 0 && (
              <circle
                cx={visibleData[visibleData.length - 1].x}
                cy={view === 'trajectory' 
                  ? visibleData[visibleData.length - 1].height 
                  : visibleData[visibleData.length - 1].z}
                r={6}
                fill="white"
                filter="url(#glow)"
              >
                <animate
                  attributeName="r"
                  values="4;6;4"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </circle>
            )}
          </LineChart>
        </div>

        {/* Shot metrics */}
        <div className="absolute bottom-4 left-4 right-4 grid grid-cols-4 gap-4">
          {[
            { 
              label: 'Carry',
              value: Math.round(visibleData[visibleData.length - 1]?.x || 0).toString(),
              unit: 'yards'
            },
            { 
              label: 'Peak Height',
              value: Math.round(Math.max(...(visibleData.map(p => p.height) || [0]))).toString(),
              unit: 'yards'
            },
            { 
              label: 'Ball Speed',
              value: Math.round(visibleData[0]?.velocity || 0).toString(),
              unit: 'mph'
            },
            { 
              label: 'Spin Rate',
              value: shotData.spinRate.toLocaleString(),
              unit: 'rpm'
            }
          ].map(metric => (
            <div 
              key={metric.label}
              className="bg-black/50 backdrop-blur p-3 rounded-lg border border-gray-700"
            >
              <div className="text-gray-400 text-sm">{metric.label}</div>
              <div className="text-xl text-white font-bold">
                {metric.value}
                <span className="text-sm text-gray-400 ml-1">
                  {metric.unit}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress indicator */}
      <div className="mt-4 bg-gray-800 h-1 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-75"
          style={{ width: `${playback}%` }}
        />
      </div>
    </div>
  );
}
