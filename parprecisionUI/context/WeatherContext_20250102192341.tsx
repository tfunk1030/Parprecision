'use client';
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type WeatherData = {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  altitude: number;
};

type WeatherContextValue = {
  weather: WeatherData | null;
  setWeather: React.Dispatch<React.SetStateAction<WeatherData | null>>;
};

const WeatherContext = createContext<WeatherContextValue>({
  weather: null,
  setWeather: () => {},
});

export const WeatherProvider = ({ children }: { children: ReactNode }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  // Example effect: fetch or initialize realistic weather data
  useEffect(() => {
    setWeather({
      temperature: 58,       // No hardcoded 70°F fallback
      humidity: 50,
      windSpeed: 10.2,       // mph
      windDirection: 135,    // degrees
      pressure: 29.92,       // inHg or whichever units you prefer
      altitude: 600,         // feet
    });
  }, []);

  return (
    <WeatherContext.Provider value={{ weather, setWeather }}>
      {children}
    </WeatherContext.Provider>
  );
};

export const useWeather = () => useContext(WeatherContext);
