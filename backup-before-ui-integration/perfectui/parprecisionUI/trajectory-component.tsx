import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Compass } from 'lucide-react';

interface LaunchParams {
  v0: number;          // initial velocity (ft/s)
  theta: number;       // launch angle (degrees)
  spinRate: number;    // rpm
  windSpeed: number;   // mph
  windDir: number;     // degrees (0 = tailwind, 90 = right to left)
  altitude: number;    // feet above sea level
}

interface TrajectoryPoint {
  x: number;
  y: number;
  z: number;
  time: number;
}

interface TrajectoryData {
  front: TrajectoryPoint[];
  side: TrajectoryPoint[];
}

const TrajectoryVisualization = () => {
  // Initial conditions with more realistic golf values
  const [launchParams, setLaunchParams] = useState<LaunchParams>({
    v0: 150,          // initial velocity (ft/s)
    theta: 12,        // launch angle (degrees)
    spinRate: 2700,   // rpm
    windSpeed: 10,    // mph
    windDir: 45,      // degrees (0 = tailwind, 90 = right to left)
    altitude: 0        // feet above sea level
  });

  const [trajectory, setTrajectory] = useState<TrajectoryData>({ front: [], side: [] });

  // Physics constants
  const g = 32.174;                  // Gravity (ft/s^2)
  const rho = 0.0023769;             // Air density (slug/ft^3)
  const d = 1.68/12;                 // Ball diameter (ft)
  const A = Math.PI * d * d / 4;     // Cross-sectional area (ft^2)
  const m = 0.1012;                  // Mass (slugs)
  const Cd = 0.225;                  // Drag coefficient
  const Cl = 0.21;                   // Lift coefficient

  const calculateTrajectory = () => {
    const dt = 0.01;  // Time step (s)
    const t_max = 10; // Maximum simulation time (s)

    // Convert inputs to SI units for calculations
    const v0_ms = launchParams.v0;
    const theta_rad = launchParams.theta * Math.PI / 180;
    const omega = launchParams.spinRate * 2 * Math.PI / 60; // Convert RPM to rad/s
    const wind_ms = launchParams.windSpeed * 0.44704; // Convert mph to m/s
    const wind_rad = launchParams.windDir * Math.PI / 180;

    // Initial velocity components
    const vx0 = v0_ms * Math.cos(theta_rad);
    const vy0 = v0_ms * Math.sin(theta_rad);
    const vz0 = 0;

    // Arrays to store trajectory points
    const frontView: TrajectoryPoint[] = [];
    const sideView: TrajectoryPoint[] = [];

    // Initial conditions
    let x = 0, y = 0, z = 0;
    let vx = vx0, vy = vy0, vz = vz0;
    let t = 0;

    while (t < t_max && y >= 0) {
      // Store current position
      frontView.push({ x, y: y, z: 0, time: t });
      sideView.push({ x, y: 0, z, time: t });

      // Calculate relative velocity components including wind
      const vr_x = vx - wind_ms * Math.cos(wind_rad);
      const vr_y = vy;
      const vr_z = vz - wind_ms * Math.sin(wind_rad);
      const v_rel = Math.sqrt(vr_x * vr_x + vr_y * vr_y + vr_z * vr_z);

      // Magnus force coefficients
      const S = omega * d / (2 * v_rel);
      const Fm_coeff = 0.5 * rho * A * Cl * S * v_rel * v_rel / m;

      // Drag force
      const Fd_x = -0.5 * rho * A * Cd * v_rel * vr_x / m;
      const Fd_y = -0.5 * rho * A * Cd * v_rel * vr_y / m;
      const Fd_z = -0.5 * rho * A * Cd * v_rel * vr_z / m;

      // Magnus force (simplified model)
      const Fm_y = Fm_coeff;

      // Update velocities
      vx += (Fd_x) * dt;
      vy += (Fd_y + Fm_y - g) * dt;
      vz += (Fd_z) * dt;

      // Update positions
      x += vx * dt;
      y += vy * dt;
      z += vz * dt;

      t += dt;
    }

    setTrajectory({ front: frontView, side: sideView });
  };

  useEffect(() => {
    calculateTrajectory();
  }, [launchParams]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
          <p className="text-white">Distance: {data.x.toFixed(1)} ft</p>
          <p className="text-emerald-400">Height: {data.y.toFixed(1)} ft</p>
          <p className="text-blue-400">Time: {data.time.toFixed(2)} s</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl">
      <h2 className="text-xl font-bold text-white mb-4">Shot Trajectory</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trajectory.front}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="x"
                type="number"
                domain={[0, 'dataMax']}
                label={{ value: 'Distance (ft)', position: 'bottom', fill: '#9CA3AF' }}
                tick={{ fill: '#9CA3AF' }}
              />
              <YAxis
                dataKey="y"
                type="number"
                domain={[0, 'dataMax']}
                label={{ value: 'Height (ft)', angle: -90, position: 'left', fill: '#9CA3AF' }}
                tick={{ fill: '#9CA3AF' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="y"
                stroke="#10B981"
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trajectory.side}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="x"
                type="number"
                domain={[0, 'dataMax']}
                label={{ value: 'Distance (ft)', position: 'bottom', fill: '#9CA3AF' }}
                tick={{ fill: '#9CA3AF' }}
              />
              <YAxis
                dataKey="z"
                type="number"
                domain={['dataMin', 'dataMax']}
                label={{ value: 'Lateral Distance (ft)', angle: -90, position: 'left', fill: '#9CA3AF' }}
                tick={{ fill: '#9CA3AF' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="z"
                stroke="#3B82F6"
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Initial Speed:</span>
          <input
            type="number"
            value={launchParams.v0}
            onChange={(e) => setLaunchParams({...launchParams, v0: parseFloat(e.target.value)})}
            className="bg-gray-700 text-white px-2 py-1 rounded w-20"
          />
          <span className="text-gray-400">ft/s</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-400">Launch Angle:</span>
          <input
            type="number"
            value={launchParams.theta}
            onChange={(e) => setLaunchParams({...launchParams, theta: parseFloat(e.target.value)})}
            className="bg-gray-700 text-white px-2 py-1 rounded w-20"
          />
          <span className="text-gray-400">°</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-400">Spin Rate:</span>
          <input
            type="number"
            value={launchParams.spinRate}
            onChange={(e) => setLaunchParams({...launchParams, spinRate: parseFloat(e.target.value)})}
            className="bg-gray-700 text-white px-2 py-1 rounded w-20"
          />
          <span className="text-gray-400">rpm</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-400">Wind Speed:</span>
          <input
            type="number"
            value={launchParams.windSpeed}
            onChange={(e) => setLaunchParams({...launchParams, windSpeed: parseFloat(e.target.value)})}
            className="bg-gray-700 text-white px-2 py-1 rounded w-20"
          />
          <span className="text-gray-400">mph</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-400">Wind Direction:</span>
          <div className="relative flex items-center">
            <input
              type="number"
              value={launchParams.windDir}
              onChange={(e) => setLaunchParams({...launchParams, windDir: parseFloat(e.target.value)})}
              className="bg-gray-700 text-white px-2 py-1 rounded w-20"
            />
            <Compass className="w-4 h-4 text-gray-400 absolute right-2" />
          </div>
          <span className="text-gray-400">°</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-400">Altitude:</span>
          <input
            type="number"
            value={launchParams.altitude}
            onChange={(e) => setLaunchParams({...launchParams, altitude: parseFloat(e.target.value)})}
            className="bg-gray-700 text-white px-2 py-1 rounded w-20"
          />
          <span className="text-gray-400">ft</span>
        </div>
      </div>
    </div>
  );
};

export default TrajectoryVisualization;