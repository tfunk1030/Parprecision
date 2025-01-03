import React, { useState, useEffect, useRef } from 'react';
import { Cloud, Sun, Wind, Thermometer } from 'lucide-react';

interface WeatherData {
  temperature: number | null;
  windSpeed: number | null;
  windDirection: string | null;
  humidity: number | null;
  pressure: number | null;
}

interface Club {
  name: string;
  distance: number;
}

interface ShotData {
  distance: number;
  adjustedDistance: number;
  suggestedClub: string;
  trajectory: string;
}

export const WeatherWidget = () => {
  const [loading, setLoading] = useState(true);
  const [weatherData, setWeatherData] = useState<WeatherData>({
    temperature: null,
    windSpeed: null,
    windDirection: null,
    humidity: null,
    pressure: null
  });

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        // Mock weather data for now
        const data: WeatherData = {
          temperature: 72,
          windSpeed: 10,
          windDirection: 'NE',
          humidity: 65,
          pressure: 29.92
        };
        setWeatherData(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching weather:", error);
        setLoading(false);
      }
    };

    fetchWeatherData();
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg animate-pulse">
        <div className="h-24 bg-gray-700 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Thermometer className="w-5 h-5 text-blue-400" />
          <div>
            <div className="text-sm text-gray-400">Temperature</div>
            <div className="text-lg font-semibold text-white">
              {weatherData.temperature}°F
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Wind className="w-5 h-5 text-green-400" />
          <div>
            <div className="text-sm text-gray-400">Wind</div>
            <div className="text-lg font-semibold text-white">
              {weatherData.windSpeed} mph {weatherData.windDirection}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Cloud className="w-5 h-5 text-gray-400" />
          <div>
            <div className="text-sm text-gray-400">Humidity</div>
            <div className="text-lg font-semibold text-white">
              {weatherData.humidity}%
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Sun className="w-5 h-5 text-yellow-400" />
          <div>
            <div className="text-sm text-gray-400">Pressure</div>
            <div className="text-lg font-semibold text-white">
              {weatherData.pressure} inHg
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ClubSelector = () => {
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [shotData, setShotData] = useState<ShotData>({
    distance: 0,
    adjustedDistance: 0,
    suggestedClub: '',
    trajectory: ''
  });
  
  const clubs: Club[] = [
    { name: 'Driver', distance: 250 },
    { name: '3-Wood', distance: 230 },
    { name: '5-Wood', distance: 215 },
    { name: '4-Iron', distance: 200 },
    { name: '5-Iron', distance: 190 },
    { name: '6-Iron', distance: 180 },
    { name: '7-Iron', distance: 170 },
    { name: '8-Iron', distance: 160 },
    { name: '9-Iron', distance: 145 },
    { name: 'PW', distance: 135 },
    { name: 'GW', distance: 125 },
    { name: 'SW', distance: 110 },
    { name: 'LW', distance: 95 },
  ];

  const handleClubSelect = (club: Club) => {
    setSelectedClub(club);
    setShotData({
      distance: club.distance,
      adjustedDistance: Math.round(club.distance * 1.05),
      suggestedClub: club.name,
      trajectory: 'mid'
    });
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl">
      <h2 className="text-xl font-bold text-white mb-4">Select Club</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {clubs.map((club) => (
          <button
            key={club.name}
            onClick={() => handleClubSelect(club)}
            className={`p-3 rounded-xl transition-all duration-300 ${
              selectedClub?.name === club.name 
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <div className="text-sm font-medium">{club.name}</div>
            <div className="text-xs opacity-75">{club.distance} yds</div>
          </button>
        ))}
      </div>

      {selectedClub && (
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-400">Adjusted Distance</div>
            <div className="text-lg font-semibold text-white">
              {shotData.adjustedDistance} yds
            </div>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-400">Trajectory</div>
            <div className="text-lg font-semibold text-white capitalize">
              {shotData.trajectory}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ShotVisualizer = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw shot path
    ctx.beginPath();
    ctx.moveTo(50, height - 50);
    
    // Draw a simple arc for the shot trajectory
    ctx.quadraticCurveTo(
      width / 2,
      50,
      width - 50,
      height - 50
    );

    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw landing point
    ctx.beginPath();
    ctx.arc(width - 50, height - 50, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#10B981';
    ctx.fill();

  }, []);

  return (
    <div className="bg-gray-800 p-6 rounded-xl">
      <h2 className="text-xl font-bold text-white mb-4">Shot Visualization</h2>
      <canvas
        ref={canvasRef}
        width={600}
        height={300}
        className="w-full bg-gray-900 rounded-lg"
      />
    </div>
  );
};

export default { WeatherWidget, ClubSelector, ShotVisualizer };
