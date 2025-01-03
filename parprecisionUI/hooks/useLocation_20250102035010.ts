import { useState, useEffect } from 'react';

function useLocation() {
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Geolocation Status:', navigator.geolocation); // Log geolocation status

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    const success = (position: GeolocationPosition) => {
      setLocation(position);
      setError(null);
      console.log('Location:', position); // Log the obtained location
    };

    const handleError = (err: GeolocationPositionError) => {
      setError(err.message);
      console.error('Geolocation error:', err); // Log geolocation errors
    };

    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(success, handleError, options);
  }, []);

  return { location, error };
} 