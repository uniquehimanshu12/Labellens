import { LocationData } from '../types';

export const locationService = {
  detectLocation(): Promise<LocationData> {
    return new Promise((resolve) => {
      if (!('geolocation' in navigator)) {
        resolve({
          latitude: null,
          longitude: null,
          accuracy: null,
          placeName: 'Geolocation API not supported',
          timestamp: new Date().toISOString(),
          locationSource: 'Unavailable',
        });
        return;
      }

      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 30000,
      };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = parseFloat(position.coords.latitude.toFixed(4));
          const lng = parseFloat(position.coords.longitude.toFixed(4));
          const accuracy = Math.round(position.coords.accuracy);
          
          let placeName = 'Location Detected';
          // Try a quick reverse geocode if possible or approximate by coordinates
          try {
            placeName = `GPS Point (${lat}, ${lng})`;
          } catch {
            placeName = 'Coordinates Acquired';
          }

          resolve({
            latitude: lat,
            longitude: lng,
            accuracy,
            placeName,
            timestamp: new Date().toISOString(),
            locationSource: 'GPS',
          });
        },
        (error) => {
          console.warn('Geolocation failed or denied:', error.message);
          resolve({
            latitude: null,
            longitude: null,
            accuracy: null,
            placeName: 'Location unavailable',
            timestamp: new Date().toISOString(),
            locationSource: 'Unavailable',
          });
        },
        options
      );
    });
  },

  createManualLocation(placeName: string, lat?: number, lng?: number, accuracy: number = 50): LocationData {
    return {
      latitude: lat ?? 28.4595,
      longitude: lng ?? 77.0266,
      accuracy,
      placeName: placeName || 'Manual Entry Point',
      timestamp: new Date().toISOString(),
      locationSource: 'Manual',
    };
  },
};
