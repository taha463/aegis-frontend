import { useState, useEffect } from "react";
import { fetchFloodRisk, fetchFloodForecast, FALLBACK_FLOOD_RISK, FALLBACK_FORECAST } from "../services/floodService.js";
import { STATUS } from "../utils/cache.js";

/**
 * Domain Hook: useFloodRisk
 * Provides flood intelligence isolated from weather and profile with 3-hour cache memory.
 */
export function useFloodRisk(coords) {
  const [floodRisk, setFloodRisk] = useState(FALLBACK_FLOOD_RISK);
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

    const loadRisk = async () => {
      try {
        const result = await fetchFloodRisk(coords[0], coords[1]);
        if (isMounted) {
          setFloodRisk(result.data);
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

    loadRisk();
    return () => {
      isMounted = false;
    };
  }, [coords ? `${coords[0]}:${coords[1]}` : null]);

  return { floodRisk, status, loading, relativeTime, ageMinutes };
}

/**
 * Domain Hook: useFloodForecast
 */
export function useFloodForecast(coords) {
  const [forecast, setForecast] = useState(FALLBACK_FORECAST);
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

    const loadForecast = async () => {
      try {
        const result = await fetchFloodForecast(coords[0], coords[1]);
        if (isMounted) {
          setForecast(result.data);
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

    loadForecast();
    return () => {
      isMounted = false;
    };
  }, [coords ? `${coords[0]}:${coords[1]}` : null]);

  return { forecast, status, loading, relativeTime, ageMinutes };
}
