import { useState, useEffect } from "react";
import { fetchWeatherData, FALLBACK_WEATHER } from "../services/weatherService.js";
import { STATUS } from "../utils/cache.js";

/**
 * Domain Hook: useWeather
 * Provides isolated weather intelligence with 3-hour cache memory and relative timestamps.
 */
export function useWeather(coords) {
  const [weather, setWeather] = useState(FALLBACK_WEATHER);
  const [status, setStatus] = useState(STATUS.FRESH);
  const [loading, setLoading] = useState(true);
  const [relativeTime, setRelativeTime] = useState("Updated just now");
  const [ageMinutes, setAgeMinutes] = useState(0);

  useEffect(() => {
    let isMounted = true;
    if (!coords || !coords[0] || !coords[1]) {
      setLoading(false);
      return;
    }

    const loadWeather = async () => {
      try {
        const result = await fetchWeatherData(coords[0], coords[1]);
        if (isMounted) {
          setWeather(result.data);
          setStatus(result.status);
          if (result.relativeTime) setRelativeTime(result.relativeTime);
          if (result.ageMinutes !== undefined) setAgeMinutes(result.ageMinutes);
        }
      } catch (err) {
        if (isMounted) {
          setStatus(STATUS.DEGRADED);
          setRelativeTime("Updated recently");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadWeather();
    return () => {
      isMounted = false;
    };
  }, [coords ? `${coords[0]}:${coords[1]}` : null]);

  return { weather, status, loading, relativeTime, ageMinutes };
}
