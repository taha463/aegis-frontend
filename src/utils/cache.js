/**
 * Aegis In-Memory Capability Cache & Freshness Lifecycle
 * Conforms to Aegis System Design v1 - Sections 6, 9, 10, 11
 *
 * Implements 3-Hour Cache Memory Architecture:
 * - High-speed in-memory Map store (fastest possible retrieval, 0ms latency)
 * - 3-hour TTL policy across intelligence domains (Weather, Flood, Shelters, Forecast)
 * - Stale-while-revalidate with clean relative timestamps ("Updated 20 min ago", "Updated 1 hour ago")
 * - Completely eliminates blocking full-screen loaders when cache is available
 */

export const STATUS = Object.freeze({
  FRESH: 'FRESH',
  STALE: 'STALE',
  DEGRADED: 'DEGRADED',
  UNAVAILABLE: 'UNAVAILABLE',
  OFFLINE: 'OFFLINE',
});

export const THREE_HOURS_MS = 3 * 60 * 60 * 1000; // 3 hours in milliseconds

// Domain-specific 3-hour cache policies
export const DOMAIN_CACHE_POLICIES = Object.freeze({
  weather: {
    ttlMs: THREE_HOURS_MS,
    staleGraceMs: THREE_HOURS_MS,
  },
  floodRisk: {
    ttlMs: THREE_HOURS_MS,
    staleGraceMs: THREE_HOURS_MS,
  },
  forecast: {
    ttlMs: THREE_HOURS_MS,
    staleGraceMs: THREE_HOURS_MS,
  },
  shelters: {
    ttlMs: THREE_HOURS_MS,
    staleGraceMs: THREE_HOURS_MS,
  },
  alerts: {
    ttlMs: THREE_HOURS_MS,
    staleGraceMs: THREE_HOURS_MS,
  },
  profile: {
    ttlMs: THREE_HOURS_MS,
    staleGraceMs: 24 * 60 * 60 * 1000,
  },
});

/**
 * Format relative timestamp without vulgar "Fallback" text.
 * e.g. "Updated just now", "Updated 20 min ago", "Updated 1 hour ago"
 */
export function formatRelativeTime(timestamp) {
  if (!timestamp) return 'Updated recently';
  const now = Date.now();
  const time = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime();
  if (isNaN(time)) return 'Updated recently';
  const diffMs = Math.max(0, now - time);
  const mins = Math.floor(diffMs / 60000);

  if (mins < 1) return 'Updated just now';
  if (mins === 1) return 'Updated 1 min ago';
  if (mins < 60) return `Updated ${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours === 1) return 'Updated 1 hour ago';
  if (hours < 24) return `Updated ${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return `Updated ${days} day${days > 1 ? 's' : ''} ago`;
}

/**
 * High-speed In-Memory Storage Adapter
 */
export class MemoryStorageAdapter {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

// Global persistent in-memory singleton
const globalMemoryStore = new MemoryStorageAdapter();

/**
 * Creates a structured cache entry with location and freshness metadata
 */
export function createCacheEntry(data, options = {}) {
  const now = options.now || Date.now();
  const ttlMs = options.ttlMs || THREE_HOURS_MS;
  const staleGraceMs = options.staleGraceMs || THREE_HOURS_MS;

  return {
    data,
    location: options.location || null,
    source: options.source || 'api',
    createdAt: now,
    ttlMs,
    staleGraceMs,
    expiresAt: now + ttlMs,
    version: options.version || 1,
  };
}

/**
 * Evaluates the freshness status of a cache entry.
 */
export function evaluateFreshness(entry, currentTime = Date.now()) {
  if (!entry || !entry.createdAt) {
    return {
      status: STATUS.UNAVAILABLE,
      ageMinutes: null,
      isUsable: false,
    };
  }

  const ageMs = Math.max(0, currentTime - entry.createdAt);
  const ageMinutes = Math.floor(ageMs / 60000);
  const ttlMs = entry.ttlMs || THREE_HOURS_MS;
  const staleGraceMs = entry.staleGraceMs || THREE_HOURS_MS;

  if (ageMs <= ttlMs) {
    return {
      status: STATUS.FRESH,
      ageMinutes,
      isUsable: true,
    };
  }

  if (ageMs <= ttlMs + staleGraceMs) {
    return {
      status: STATUS.STALE,
      ageMinutes,
      isUsable: true,
    };
  }

  return {
    status: STATUS.UNAVAILABLE,
    ageMinutes,
    isUsable: false,
  };
}

/**
 * Capability-aware Cache Manager (defaults to fast In-Memory Cache)
 */
export class CapabilityCache {
  constructor(storageAdapter = null) {
    // Default to in-memory cache as specified in system design
    this.storage = storageAdapter || globalMemoryStore;
  }

  get(key) {
    try {
      const raw = this.storage.getItem(key);
      if (!raw) return null;

      const entry = JSON.parse(raw);
      const freshness = evaluateFreshness(entry);

      if (!freshness.isUsable) {
        return null;
      }

      return {
        ...entry,
        status: freshness.status,
        ageMinutes: freshness.ageMinutes,
        relativeTime: formatRelativeTime(entry.createdAt),
      };
    } catch (e) {
      console.warn(`[CapabilityCache] Error reading key "${key}":`, e);
      return null;
    }
  }

  set(key, data, options = {}) {
    try {
      const entry = createCacheEntry(data, {
        ...options,
        ttlMs: options.ttlMs || THREE_HOURS_MS,
      });
      this.storage.setItem(key, JSON.stringify(entry));
      return {
        ...entry,
        relativeTime: formatRelativeTime(entry.createdAt),
      };
    } catch (e) {
      console.warn(`[CapabilityCache] Error writing key "${key}":`, e);
      return null;
    }
  }

  remove(key) {
    try {
      this.storage.removeItem(key);
    } catch (e) {}
  }

  clear() {
    try {
      this.storage.clear();
    } catch (e) {}
  }
}

export const defaultCapabilityCache = new CapabilityCache();
