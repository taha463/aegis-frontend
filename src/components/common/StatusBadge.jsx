import React from "react";
import { STATUS } from "../../utils/cache.js";

/**
 * StatusBadge Component
 * Conforms to Aegis System Design v1 - Section 10 & 18: Freshness & UI Cleanliness
 *
 * Displays clean relative freshness ("Updated just now", "Updated 20 min ago", "Updated 1 hour ago").
 * Completely eliminates vulgar "Fallback Mode" and "Live" tags.
 */
export const StatusBadge = ({
  status = STATUS.FRESH,
  ageMinutes = null,
  relativeTime = null,
  label = null,
}) => {
  const normStatus = (status || STATUS.FRESH).toUpperCase();

  // Compute clean relative timestamp
  let displayText = label || relativeTime;

  if (!displayText) {
    if (ageMinutes !== null && ageMinutes !== undefined) {
      if (ageMinutes < 1) {
        displayText = "Updated just now";
      } else if (ageMinutes === 1) {
        displayText = "Updated 1m ago";
      } else if (ageMinutes < 60) {
        displayText = `Updated ${ageMinutes}m ago`;
      } else {
        const hours = Math.floor(ageMinutes / 60);
        displayText = `Updated ${hours}h ago`;
      }
    } else if (normStatus === STATUS.UNAVAILABLE) {
      displayText = "Updating...";
    } else {
      displayText = "Updated recently";
    }
  }

  const isSyncing = normStatus === STATUS.UNAVAILABLE;

  const bg = isSyncing ? "#F3F4F6" : "#ECFDF5";
  const border = isSyncing ? "#E5E7EB" : "#A7F3D0";
  const text = isSyncing ? "#4B5563" : "#065F46";
  const dot = isSyncing ? "#9CA3AF" : "#10B981";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "2px 8px",
        borderRadius: "9999px",
        fontSize: "0.75rem",
        fontWeight: 600,
        backgroundColor: bg,
        border: `1px solid ${border}`,
        color: text,
        lineHeight: "1.2",
      }}
      title={`Freshness: ${displayText}`}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          backgroundColor: dot,
        }}
      />
      {displayText}
    </span>
  );
};

export default StatusBadge;
