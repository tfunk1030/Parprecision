'use client'

import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { BarChart2, Clock, Target, Wind, Maximize2, Filter } from 'lucide-react';

interface Shot {
  id: string;
  date: string;
  distance: number;
  yardsOffline: number;
  club: string;
  conditions: {
    wind: number;
    temp: number;
  };
}

interface ShotHistoryProps {
  shots: Shot[];
  onSelectShot: (shot: Shot) => void;
}

interface StatisticalAnalysisProps {
  shots: Shot[];
}

interface StatsAccumulator {
  [key: string]: {
    totalDistance: number;
    totalOffline: number;
    count: number;
    distances: number[];
    offlines: number[];
  };
}

interface ClubStats {
  club: string;
  avgDistance: number;
  avgOffline: number;
  consistency: number;
  dispersion: number;
}

// Shot History Component
function ShotHistory({ shots, onSelectShot }: ShotHistoryProps) {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  const filteredShots = shots.filter(shot => {
    if (filter === 'all') return true;
    return shot.club === filter;
  }).sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    }
    if (sortBy === 'distance') return b.distance - a.distance;
    if (sortBy === 'accuracy') return Math.abs(a.yardsOffline) - Math.abs(b.yardsOffline);
    return 0;
  });

  return (
    <div className="bg-gray-900 rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Shot History</h2>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-gray-800 text-white rounded-lg px-3 py-1 border border-gray-700"
          >
            <option value="all">All Clubs</option>
            <option value="Driver">Driver</option>
            <option value="Iron">Irons</option>
            <option value="Wedge">Wedges</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-gray-800 text-white rounded-lg px-3 py-1 border border-gray-700"
          >
            <option value="date">Most Recent</option>
            <option value="distance">Longest</option>
            <option value="accuracy">Most Accurate</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filteredShots.map((shot) => (
          <button
            key={shot.id}
            onClick={() => onSelectShot(shot)}
            className="w-full bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="text-white font-medium">{shot.club}</div>
                <div className="text-gray-400 text-sm">{new Date(shot.date).toLocaleDateString()}</div>
              </div>
              <div className="text-right">
                <div className="text-white font-bold">{shot.distance} yards</div>
                <div className={`text-sm ${Math.abs(shot.yardsOffline) < 10 ? 'text-green-400' : 'text-red-400'}`}>
                  {shot.yardsOffline > 0 ? 'Right' : 'Left'} {Math.abs(shot.yardsOffline)} yards
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Statistical Analysis Component
function StatisticalAnalysis({ shots }: StatisticalAnalysisProps) {
  const [selectedMetric, setSelectedMetric] = useState('distance');

  const calculateStats = (): ClubStats[] => {
    const stats = shots.reduce<StatsAccumulator>((acc, shot) => {
      if (!acc[shot.club]) {
        acc[shot.club] = {
          totalDistance: 0,
          totalOffline: 0,
          count: 0,
          distances: [],
          offlines: []
        };
      }
      acc[shot.club].totalDistance += shot.distance;
      acc[shot.club].totalOffline += Math.abs(shot.yardsOffline);
      acc[shot.club].count += 1;
      acc[shot.club].distances.push(shot.distance);
      acc[shot.club].offlines.push(Math.abs(shot.yardsOffline));
      return acc;
    }, {});

    return Object.entries(stats).map(([club, data]) => ({
      club,
      avgDistance: Math.round(data.totalDistance / data.count),
      avgOffline: Math.round(data.totalOffline / data.count),
      consistency: Math.round(
        Math.sqrt(data.distances.reduce((acc, dist) => 
          acc + Math.pow(dist - data.totalDistance / data.count, 2), 0) / data.count)
      ),
      dispersion: Math.round(
        Math.sqrt(data.offlines.reduce((acc, off) => 
          acc + Math.pow(off - data.totalOffline / data.count, 2), 0) / data.count)
      )
    }));
  };

  const stats = calculateStats();

  return (
    <div className="bg-gray-900 rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Club Statistics</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedMetric('distance')}
            className={`px-3 py-1 rounded-lg ${
              selectedMetric === 'distance' ? 'bg-blue-600' : 'bg-gray-800'
            } text-white`}
          >
            Distance
          </button>
          <button
            onClick={() => setSelectedMetric('offline')}
            className={`px-3 py-1 rounded-lg ${
              selectedMetric === 'offline' ? 'bg-blue-600' : 'bg-gray-800'
            } text-white`}
          >
            Dispersion
          </button>
        </div>
      </div>

      <BarChart width={600} height={300} data={stats}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="club" stroke="#9CA3AF" />
        <YAxis stroke="#9CA3AF" />
        <Tooltip
          contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
          labelStyle={{ color: '#F9FAFB' }}
          formatter={(value) => `${value} yards`}
        />
        <Bar 
          dataKey={selectedMetric === 'distance' ? 'avgDistance' : 'avgOffline'}
          fill={selectedMetric === 'distance' ? '#3B82F6' : '#EF4444'}
        />
      </BarChart>

      <div className="grid grid-cols-2 gap-4 mt-6">
        {stats.map((stat) => (
          <div key={stat.club} className="bg-gray-800 rounded-lg p-4">
            <div className="text-white font-medium mb-2">{stat.club}</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="text-gray-400">Avg Distance</div>
                <div className="text-white font-bold">{stat.avgDistance} yards</div>
              </div>
              <div>
                <div className="text-gray-400">Avg Offline</div>
                <div className="text-white font-bold">{stat.avgOffline} yards</div>
              </div>
              <div>
                <div className="text-gray-400">Distance SD</div>
                <div className="text-white font-bold">±{stat.consistency} yards</div>
              </div>
              <div>
                <div className="text-gray-400">Dispersion</div>
                <div className="text-white font-bold">±{stat.dispersion} yards</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Main Analysis System Component
export default function AnalysisSystem() {
  const [shots, setShots] = useState<Shot[]>([]);
  const [selectedShot, setSelectedShot] = useState<Shot | null>(null);

  useEffect(() => {
    // Simulate loading shot data with yards offline instead of degrees
    const mockShots = Array(20).fill(0).map((_, i) => ({
      id: i.toString(),
      date: new Date(2024, 0, i + 1).toISOString(),
      club: ['Driver', 'Iron', 'Wedge'][Math.floor(Math.random() * 3)],
      distance: Math.round(200 + Math.random() * 100),
      yardsOffline: Math.round((Math.random() - 0.5) * 40), // -20 to +20 yards offline
      conditions: {
        wind: Math.round(Math.random() * 20),
        temp: Math.round(60 + Math.random() * 30)
      }
    }));
    setShots(mockShots);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      <ShotHistory shots={shots} onSelectShot={setSelectedShot} />
      <StatisticalAnalysis shots={shots} />
    </div>
  );
}
