import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  STATUS,
  createCacheEntry,
  evaluateFreshness,
  MemoryStorageAdapter,
  CapabilityCache,
} from '../src/utils/cache.js';

describe('Capability Cache & Freshness Policy (System Design Section 9 & 10)', () => {
  it('defines the required status lifecycle constants', () => {
    assert.strictEqual(STATUS.FRESH, 'FRESH');
    assert.strictEqual(STATUS.STALE, 'STALE');
    assert.strictEqual(STATUS.DEGRADED, 'DEGRADED');
    assert.strictEqual(STATUS.UNAVAILABLE, 'UNAVAILABLE');
    assert.strictEqual(STATUS.OFFLINE, 'OFFLINE');
  });

  it('evaluates freshness based on TTL and stale-grace thresholds', () => {
    const now = Date.now();
    const ttlMs = 5 * 60 * 1000; // 5 min
    const staleGraceMs = 30 * 60 * 1000; // 30 min

    // Fresh: created 2 min ago
    const freshEntry = {
      createdAt: now - 2 * 60 * 1000,
      ttlMs,
      staleGraceMs,
    };
    assert.strictEqual(evaluateFreshness(freshEntry, now).status, STATUS.FRESH);

    // Stale: created 10 min ago (past 5 min TTL, but before 35 min total)
    const staleEntry = {
      createdAt: now - 10 * 60 * 1000,
      ttlMs,
      staleGraceMs,
    };
    const staleResult = evaluateFreshness(staleEntry, now);
    assert.strictEqual(staleResult.status, STATUS.STALE);
    assert.ok(staleResult.ageMinutes >= 10);

    // Expired / Unavailable: created 60 min ago
    const expiredEntry = {
      createdAt: now - 60 * 60 * 1000,
      ttlMs,
      staleGraceMs,
    };
    assert.strictEqual(evaluateFreshness(expiredEntry, now).status, STATUS.UNAVAILABLE);
  });

  it('stores and retrieves capability cache items with location context', () => {
    const memory = new MemoryStorageAdapter();
    const cache = new CapabilityCache(memory);

    const testData = { temperature: 28, condition: 'Clear' };
    const location = { latitude: 31.5204, longitude: 74.3587, region: 'Lahore' };

    cache.set('weather:31.5204:74.3587', testData, {
      ttlMs: 60 * 1000,
      staleGraceMs: 5 * 60 * 1000,
      location,
      source: 'open-meteo',
    });

    const retrieved = cache.get('weather:31.5204:74.3587');
    assert.ok(retrieved);
    assert.strictEqual(retrieved.status, STATUS.FRESH);
    assert.strictEqual(retrieved.data.temperature, 28);
    assert.strictEqual(retrieved.location.region, 'Lahore');
    assert.strictEqual(retrieved.source, 'open-meteo');
  });

  it('falls back gracefully to STALE data when offline or provider unavailable', () => {
    const memory = new MemoryStorageAdapter();
    const cache = new CapabilityCache(memory);

    const pastTime = Date.now() - 15 * 60 * 1000; // 15 mins ago
    const key = 'shelters:31.5204:74.3587';

    memory.setItem(key, JSON.stringify({
      data: [{ id: 1, name: 'Govt High School' }],
      createdAt: pastTime,
      ttlMs: 5 * 60 * 1000, // 5 min TTL
      staleGraceMs: 60 * 60 * 1000, // 60 min stale grace
      location: { latitude: 31.5204, longitude: 74.3587 },
      source: 'offline-cache',
    }));

    const result = cache.get(key);
    assert.ok(result);
    assert.strictEqual(result.status, STATUS.STALE);
    assert.strictEqual(result.data.length, 1);
  });
});

