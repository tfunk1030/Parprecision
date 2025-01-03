'use client';
import { useEffect, useState } from 'react';
import { useWeather } from '@/context/WeatherContext';

// Example shot calculation based on weather data
const ShotCalculator = () => {
  const { weather } = useWeather();
  const [distance, setDistance] = useState(150);
  const [adjustedDistance, setAdjustedDistance] = useState(150);
  const [clubRecommendation, setClubRecommendation] = useState('');

  // Remove any reference to hardcoded 70°F
  useEffect(() => {
    if (!weather) return;

    // Example: Basic formula adjusting distance based on temperature
    const temperatureFactor = (weather.temperature - 60) * 0.2; // Just an example
    const altitudeFactor = (weather.altitude / 1000) * 2;       // Another example
    // Possibly incorporate wind directly, or let wind be calculated elsewhere
    const result = distance + temperatureFactor + altitudeFactor;
    setAdjustedDistance(Math.round(result));

    // Simple logic to pick a club
    if (result > 160) setClubRecommendation('7-iron');
    else setClubRecommendation('8-iron');
  }, [weather, distance]);

  return (
    <div className="max-w-md p-4 space-y-4 bg-gray-800 text-white rounded">
      <h2 className="text-xl font-semibold">Shot Calculator</h2>
      <label className="block text-sm font-medium text-emerald-500 mb-1">Base Distance (yards)</label>
      <input
        type="number"
        value={distance}
        onChange={(e) => setDistance(parseFloat(e.target.value) || 0)}
        className="w-full bg-gray-900 border border-gray-700 rounded p-2 focus:ring-2 focus:ring-emerald-500"
      />

      <p className="mt-2">
        Adjusted Distance: <span className="font-bold">{adjustedDistance}</span> yards
      </p>
      <p>
        Recommended Club: <span className="font-bold">{clubRecommendation || 'N/A'}</span>
      </p>
    </div>
  );
};

export default ShotCalculator; 