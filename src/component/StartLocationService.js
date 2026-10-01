import {useEffect, useRef} from 'react';
import Geolocation from '@react-native-community/geolocation';
import {useSelector} from 'react-redux';
import {updateLocation} from '../API/api';

const StartLocationService = () => {
  const user = useSelector(state => state.user);
  const intervalRef = useRef(null);
  const watchRef = useRef(null);
  const lastCoordsRef = useRef({lat: null, lng: null});

  const INTERVAL_MINUTES = 1;
  const intervalMs = INTERVAL_MINUTES * 60 * 1000;

  useEffect(() => {
    const id = user?.id;
    if (!id) {
      return;
    }

    const sendLocation = async () => {
      const {lat, lng} = lastCoordsRef.current;
      if (lat == null || lng == null) {
        return;
      }

      try {
        await updateLocation(id, String(lat), String(lng), true);
        console.log('[LocationService] JS API sent', {id, lat, lng});
      } catch (e) {
        console.warn('[LocationService] JS updateLocation failed', e);
      }
    };

    watchRef.current = Geolocation.watchPosition(
      position => {
        const {latitude, longitude} = position.coords;
        lastCoordsRef.current = {lat: latitude, lng: longitude};
      },
      error => {
        console.warn('[LocationService] watchPosition error', error);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10,
        interval: 1000,
        fastestInterval: 500,
      },
    );

    intervalRef.current = setInterval(() => {
      sendLocation();
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (watchRef.current != null) {
        Geolocation.clearWatch(watchRef.current);
        watchRef.current = null;
      }
    };
  }, [user?.id, intervalMs]);

  return null;
};

export default StartLocationService;

