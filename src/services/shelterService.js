/**
 * Aegis Shelter & Safe-Zone Service
 * Conforms to Aegis System Design v1 - Sections 4, 8, 9, 10, 22
 *
 * Implements 3-Hour Cache-First Architecture:
 * - Checks in-memory cache first: if entry exists (< 3 hours old), returns immediately (0ms).
 * - Background revalidates silently without blocking or freezing UI.
 * - Distance calculation with latitude/longitude normalization.
 * - Clean relative timestamps ("Updated 20 min ago", "Updated 1 hour ago").
 */

import { STATUS, defaultCapabilityCache, DOMAIN_CACHE_POLICIES, formatRelativeTime, THREE_HOURS_MS } from '../utils/cache.js';
import { createLocationKey, normalizeCoords, calculateDistanceKm } from '../utils/location.js';
import { resilientFetch } from './apiClient.js';
import API_URL from '../config.js';

export const FALLBACK_SHELTERS = Object.freeze([
  { id: 'default_1', name: 'Govt Primary School / Relief Camp', distance: '3.2 km', status: 'OPEN' },
  { id: 'default_2', name: 'Emergency Shelter Jamia Mosque', distance: '5.2 km', status: 'OPEN' },
]);

export async function fetchNearbyShelters(lat, lon, options = {}) {
  const norm = normalizeCoords(lat, lon);
  const cache = options.cache || defaultCapabilityCache;
  const cacheKey = createLocationKey('shelters', norm.latitude, norm.longitude);

  // 1. Check in-memory cache first (3-hour window)
  const cached = cache.get(cacheKey);
  const forceRefresh = Boolean(options.forceRefresh);

  if (cached && Array.isArray(cached.data) && !forceRefresh) {
    const isStale = cached.status === STATUS.STALE;
    if (isStale) {
      triggerBackgroundSheltersRefresh(norm, cache, cacheKey, options);
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

  // 2. Fetch from network
  const apiUrl = options.apiUrl || API_URL;
  const response = await resilientFetch(`${apiUrl}/shelters?lat=${norm.latitude}&lon=${norm.longitude}`, {
    timeoutMs: options.timeoutMs || 3500,
    retries: 0,
    service: 'shelters',
    operation: 'fetchNearbyShelters',
    location: `${norm.latitude}:${norm.longitude}`,
    fetchFn: options.fetchFn,
  });

  if (response.ok && Array.isArray(response.data) && response.data.length > 0) {
    const withDistance = response.data.map((shelter) => {
      const dist = calculateDistanceKm(
        norm.latitude,
        norm.longitude,
        shelter.latitude || shelter.lat,
        shelter.longitude || shelter.lng || shelter.lon
      );
      return {
        ...shelter,
        distanceKm: dist,
        distance: dist !== null ? `${dist} km` : (shelter.distance || 'Nearby'),
        status: shelter.status || 'OPEN',
      };
    }).sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));

    cache.set(cacheKey, withDistance, {
      ttlMs: THREE_HOURS_MS,
      staleGraceMs: THREE_HOURS_MS,
      location: norm,
      source: 'shelter-api',
    });

    return {
      status: STATUS.FRESH,
      data: withDistance,
      location: norm,
      updatedAt: Date.now(),
      relativeTime: 'Updated just now',
      fallbackUsed: false,
    };
  }

  // 3. Fallback to existing cache if available
  if (cached && Array.isArray(cached.data)) {
    return {
      status: cached.status || STATUS.FRESH,
      data: cached.data,
      location: norm,
      updatedAt: cached.createdAt,
      ageMinutes: cached.ageMinutes,
      relativeTime: cached.relativeTime || formatRelativeTime(cached.createdAt),
      fallbackUsed: false,
    };
  }

  // 4. Fallback baseline seeded into cache
  cache.set(cacheKey, [...FALLBACK_SHELTERS], {
    ttlMs: THREE_HOURS_MS,
    staleGraceMs: THREE_HOURS_MS,
    location: norm,
    source: 'baseline',
  });

  return {
    status: STATUS.DEGRADED,
    data: [...FALLBACK_SHELTERS],
    location: norm,
    updatedAt: Date.now(),
    relativeTime: 'Updated recently',
    fallbackUsed: true,
    error: response.error || 'Shelter service unavailable',
  };
}

function triggerBackgroundSheltersRefresh(norm, cache, cacheKey, options) {
  const apiUrl = options.apiUrl || API_URL;
  resilientFetch(`${apiUrl}/shelters?lat=${norm.latitude}&lon=${norm.longitude}`, {
    timeoutMs: 3500,
    retries: 0,
    service: 'shelters',
    operation: 'bgRefreshShelters',
    location: `${norm.latitude}:${norm.longitude}`,
    fetchFn: options.fetchFn,
  }).then((res) => {
    if (res && res.ok && Array.isArray(res.data) && res.data.length > 0) {
      const withDistance = res.data.map((shelter) => {
        const dist = calculateDistanceKm(
          norm.latitude,
          norm.longitude,
          shelter.latitude || shelter.lat,
          shelter.longitude || shelter.lng || shelter.lon
        );
        return {
          ...shelter,
          distanceKm: dist,
          distance: dist !== null ? `${dist} km` : (shelter.distance || 'Nearby'),
          status: shelter.status || 'OPEN',
        };
      }).sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));

      cache.set(cacheKey, withDistance, {
        ttlMs: THREE_HOURS_MS,
        staleGraceMs: THREE_HOURS_MS,
        location: norm,
        source: 'shelter-api',
      });
    }
  }).catch(() => {});
}
