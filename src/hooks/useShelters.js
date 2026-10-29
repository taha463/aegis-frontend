import { useState, useEffect } from "react";
import { fetchNearbyShelters, FALLBACK_SHELTERS } from "../services/shelterService.js";
import { STATUS } from "../utils/cache.js";

/**
 * Domain Hook: useShelters
 * Provides shelter lookup with 3-hour cache memory and relative timestamps.
 */
export function useShelters(coords) {
  const [shelters, setShelters] = useState(FALLBACK_SHELTERS);
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

    const loadShelters = async () => {
      try {
        const result = await fetchNearbyShelters(coords[0], coords[1]);
        if (isMounted) {
          setShelters(result.data);
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

    loadShelters();
    return () => {
      isMounted = false;
    };
  }, [coords ? `${coords[0]}:${coords[1]}` : null]);

  return { shelters, status, loading, relativeTime, ageMinutes };
}
