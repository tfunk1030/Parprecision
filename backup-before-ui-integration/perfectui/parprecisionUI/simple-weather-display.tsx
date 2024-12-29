import React from 'react';
import { Thermometer, Droplets, Wind, Gauge, ArrowUp, Mountain } from 'lucide-react';

interface WeatherCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
}

const SimpleWeatherDisplay = () => {
  const mockWeather = {
    current: {
      temp: 72,
      humidity: 45,
      pressure: 29.92,
      altitude: 850,
      wind: {
        speed: 10,
        direction: 45,
        gust: 12
      }
    },
    golfImpact: {
      densityAltitude: 925,
      carryEffect: 1.02
    }
  };

  const WeatherCard = ({ icon, label, value, subValue }: WeatherCardProps) => (
    <div className="bg-gray-700/50 p-4 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-gray-400 text-sm">{label}</span>
      </div>
      <div className="text-2xl text-emerald-400">{value}</div>
      {subValue && (
        <div className="text-sm text-gray-500 mt-1">{subValue}</div>
      )}
    </div>
  );

  return (
    <div className="p-6 bg-gray-800 rounded-lg">
      <h2 className="text-xl font-bold text-emerald-400 mb-4">Current Weather</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <WeatherCard
          icon={<Thermometer className="w-5 h-5 text-gray-400" />}
          label="Temperature"
          value={`${mockWeather.current.temp}°F`}
          subValue={`${(mockWeather.golfImpact.carryEffect * 100 - 100).toFixed(1)}% carry effect`}
        />
        
        <WeatherCard
          icon={<Droplets className="w-5 h-5 text-gray-400" />}
          label="Humidity"
          value={`${mockWeather.current.humidity}%`}
        />
        
        <WeatherCard
          icon={<Wind className="w-5 h-5 text-gray-400" />}
          label="Wind"
          value={`${mockWeather.current.wind.speed} mph`}
          subValue={`Gusts to ${mockWeather.current.wind.gust} mph`}
        />
        
        <WeatherCard
          icon={<ArrowUp className="w-5 h-5 text-gray-400" />}
          label="Wind Direction"
          value={`${mockWeather.current.wind.direction}°`}
        />
        
        <WeatherCard
          icon={<Gauge className="w-5 h-5 text-gray-400" />}
          label="Pressure"
          value={`${mockWeather.current.pressure} inHg`}
        />
        
        <WeatherCard
          icon={<Mountain className="w-5 h-5 text-gray-400" />}
          label="Altitude"
          value={`${mockWeather.current.altitude} ft`}
          subValue={`DA: ${mockWeather.golfImpact.densityAltitude} ft`}
        />
      </div>

      <div className="mt-4 text-xs text-gray-500">
        Last Updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default SimpleWeatherDisplay;