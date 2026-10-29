import { useState, useEffect } from "react";
import { generateSafeWording } from "../services/alertService.js";
import { STATUS } from "../utils/cache.js";

/**
 * Domain Hook: useAlerts
 * Provides safe citizen flood alert advisory.
 */
export function useAlerts(floodRisk, cityName = "Your Area") {
  const [alert, setAlert] = useState(null);
  const [status, setStatus] = useState(STATUS.FRESH);

  useEffect(() => {
    const level = floodRisk?.level || "Moderate";
    const safeAdvisory = generateSafeWording(level, cityName);
    setAlert({
      location: safeAdvisory.location,
      details: safeAdvisory.details,
      action: safeAdvisory.action,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      timeEstimate: "Just now",
      source: safeAdvisory.source,
    });
    setStatus(STATUS.FRESH);
  }, [floodRisk?.level, cityName]);

  return { alert, status };
}

