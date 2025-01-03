import { useState, useEffect } from 'react';
import { monitoring } from '@/services/monitoring';

function useLocation() {
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    const success = (position: GeolocationPosition) => {
      setLocation(position);
      setError(null);
      monitoring.trackEvent('location_obtained', { coords: position.coords });
    };

    const handleError = (err: GeolocationPositionError) => {
      setError(err.message);
      monitoring.trackError(new Error(err.message), {
        operation: 'geolocation',
        params: { code: err.code }
      });
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