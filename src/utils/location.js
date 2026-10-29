/**
 * Aegis Location Utilities
 * Conforms to Aegis System Design v1 - Section 8: Location Data Integrity
 * Ensures normalized geographic coordinates and consistent location caching keys.
 */

export const COORDINATE_PRECISION = 4; // ~11 meters resolution

/**
 * Validates whether latitude and longitude are valid decimal numbers within geographic bounds.
 */
export function isValidCoords(lat, lon) {
  if (lat === null || lat === undefined || lon === null || lon === undefined) {
    return false;
  }
  const nLat = Number(lat);
  const nLon = Number(lon);
  if (Number.isNaN(nLat) || Number.isNaN(nLon)) {
    return false;
  }
  return nLat >= -90 && nLat <= 90 && nLon >= -180 && nLon <= 180;
}

/**
 * Normalizes coordinates to consistent decimal precision.
 * Prevents minor GPS jitter from busting caches (e.g. 32.1617001 vs 32.1617000).
 */
export function normalizeCoords(lat, lon) {
  if (!isValidCoords(lat, lon)) {
    return { latitude: null, longitude: null };
  }
  const factor = Math.pow(10, COORDINATE_PRECISION);
  const nLat = Math.round(Number(lat) * factor) / factor;
  const nLon = Math.round(Number(lon) * factor) / factor;
  return {
    latitude: nLat,
    longitude: nLon,
  };
}

/**
 * Creates a capability-aware, location-sensitive cache key.
 * Example: createLocationKey('weather', 32.1617, 74.1883) -> 'weather:32.1617:74.1883'
 */
export function createLocationKey(prefix, lat, lon) {
  const norm = normalizeCoords(lat, lon);
  if (norm.latitude === null || norm.longitude === null) {
    return `${prefix}:unknown`;
  }
  return `${prefix}:${norm.latitude.toFixed(COORDINATE_PRECISION)}:${norm.longitude.toFixed(COORDINATE_PRECISION)}`;
}

/**
 * Calculates Haversine distance between two coordinates in kilometers.
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (!isValidCoords(lat1, lon1) || !isValidCoords(lat2, lon2)) {
    return null;
  }
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius in km

  const dLat = toRad(Number(lat2) - Number(lat1));
  const dLon = toRad(Number(lon2) - Number(lon1));

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(Number(lat1))) *
      Math.cos(toRad(Number(lat2))) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

