/**
 * Aegis Weather Service & Provider Adapter
 * Conforms to Aegis System Design v1 - Sections 4, 6, 8, 9, 10, 19
 *
 * Implements 3-Hour Cache-First Architecture:
 * - Checks in-memory cache first: if entry exists (< 3 hours old), returns immediately (0ms).
 * - Location-aware cache keys: `weather:{lat}:{lon}`
 * - Background revalidates silently without blocking or freezing UI.
 * - If Open-Meteo is 429 rate-limited or offline, seamlessly preserves cached weather.
 * - Clean relative timestamps ("Updated 20 min ago", "Updated 1 hour ago").
 * - Zero "Fallback Mode" or "Live" text.
 */

import { STATUS, defaultCapabilityCache, DOMAIN_CACHE_POLICIES, formatRelativeTime, THREE_HOURS_MS } from '../utils/cache.js';
import { createLocationKey, normalizeCoords } from '../utils/location.js';
import { resilientFetch } from './apiClient.js';

export const FALLBACK_WEATHER = Object.freeze({
  temp: 28,
  condition: 'Fair / Partly Cloudy',
  windSpeed: '12 km/h',
  humidity: '65%',
  lastUpdated: 'Updated recently',
});

// WMO Weather interpretation codes
function mapWmoCodeToCondition(code) {
  if (code === 0) return 'Clear Sky';
  if (code === 1 || code === 2 || code === 3) return 'Mainly Clear / Partly Cloudy';
  if (code === 45 || code === 48) return 'Foggy';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 61 && code <= 65) return 'Rain / Showers';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Heavy Showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Cloudy';
}

/**
 * Fetches current weather for given coordinates.
 */
export async function fetchWeatherData(lat, lon, options = {}) {
  const norm = normalizeCoords(lat, lon);
  if (norm.latitude === null || norm.longitude === null) {
    return {
      status: STATUS.UNAVAILABLE,
      data: { ...FALLBACK_WEATHER },
      error: 'Invalid coordinates provided',
      fallbackUsed: true,
      location: norm,
    };
  }

  const cache = options.cache || defaultCapabilityCache;
  const cacheKey = createLocationKey('weather', norm.latitude, norm.longitude);

  // 1. Check in-memory cache first (3-hour window)
  const cached = cache.get(cacheKey);
  const forceRefresh = Boolean(options.forceRefresh);

  if (cached && cached.data && !forceRefresh) {
    const isStale = cached.status === STATUS.STALE;
    if (isStale) {
      triggerBackgroundWeatherRefresh(norm, cache, cacheKey, options);
    }
    return {
      status: cached.status || STATUS.FRESH,
      data: cached.data,
      location: norm,
      source: 'memory-cache',
      updatedAt: cached.createdAt,
      ageMinutes: cached.ageMinutes,
      relativeTime: cached.relativeTime || formatRelativeTime(cached.createdAt),
      fallbackUsed: isStale,
    };
  }

  // 2. Fetch from Open-Meteo
  const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${norm.latitude}&longitude=${norm.longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`;

  const response = await resilientFetch(openMeteoUrl, {
    timeoutMs: options.timeoutMs || 3500,
    retries: 0,
    service: 'weather',
    operation: 'getCurrentWeather',
    location: `${norm.latitude}:${norm.longitude}`,
    source: 'open-meteo',
    fetchFn: options.fetchFn,
  });

  if (response.ok && response.data && response.data.current) {
    const cur = response.data.current;
    const weatherData = {
      temp: Math.round(cur.temperature_2m),
      condition: mapWmoCodeToCondition(cur.weather_code),
      windSpeed: `${Math.round(cur.wind_speed_10m)} km/h`,
      humidity: `${Math.round(cur.relative_humidity_2m)}%`,
      lastUpdated: formatRelativeTime(Date.now()),
    };

    cache.set(cacheKey, weatherData, {
      ttlMs: THREE_HOURS_MS,
      staleGraceMs: THREE_HOURS_MS,
      location: norm,
      source: 'open-meteo',
    });

    return {
      status: STATUS.FRESH,
      data: weatherData,
      location: norm,
      source: 'open-meteo',
      updatedAt: Date.now(),
      relativeTime: 'Updated just now',
      fallbackUsed: false,
    };
  }

  // 3. Fallback to cached entry if available
  if (cached && cached.data) {
    return {
      status: cached.status || STATUS.FRESH,
      data: cached.data,
      location: norm,
      source: cached.source || 'memory-cache',
      updatedAt: cached.createdAt,
      ageMinutes: cached.ageMinutes,
      relativeTime: cached.relativeTime || formatRelativeTime(cached.createdAt),
      fallbackUsed: false,
    };
  }

  // 4. Fallback baseline seeded into cache
  const initialData = { ...FALLBACK_WEATHER, lastUpdated: formatRelativeTime(Date.now()) };
  cache.set(cacheKey, initialData, {
    ttlMs: THREE_HOURS_MS,
    staleGraceMs: THREE_HOURS_MS,
    location: norm,
    source: 'baseline',
  });

  return {
    status: STATUS.DEGRADED,
    data: initialData,
    location: norm,
    source: 'baseline',
    updatedAt: Date.now(),
    relativeTime: 'Updated recently',
    fallbackUsed: true,
    error: response.error || 'Weather provider unavailable',
  };
}

function triggerBackgroundWeatherRefresh(norm, cache, cacheKey, options) {
  const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${norm.latitude}&longitude=${norm.longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`;
  resilientFetch(openMeteoUrl, {
    timeoutMs: 3500,
    retries: 0,
    service: 'weather',
    operation: 'bgRefreshWeather',
    location: `${norm.latitude}:${norm.longitude}`,
    source: 'open-meteo',
    fetchFn: options.fetchFn,
  }).then((res) => {
    if (res && res.ok && res.data && res.data.current) {
      const cur = res.data.current;
      const weatherData = {
        temp: Math.round(cur.temperature_2m),
        condition: mapWmoCodeToCondition(cur.weather_code),
        windSpeed: `${Math.round(cur.wind_speed_10m)} km/h`,
        humidity: `${Math.round(cur.relative_humidity_2m)}%`,
        lastUpdated: formatRelativeTime(Date.now()),
      };
      cache.set(cacheKey, weatherData, {
        ttlMs: THREE_HOURS_MS,
        staleGraceMs: THREE_HOURS_MS,
        location: norm,
        source: 'open-meteo',
      });
    }
  }).catch(() => {});
}
