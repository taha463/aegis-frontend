import { describe, it } from 'node:test';
import assert from 'node:assert';
import { fetchFloodRisk, fetchFloodForecast, FALLBACK_FLOOD_RISK } from '../src/services/floodService.js';
import { fetchNearbyShelters, FALLBACK_SHELTERS } from '../src/services/shelterService.js';
import { resolveActiveAlerts, generateSafeWording } from '../src/services/alertService.js';
import { STATUS, CapabilityCache, MemoryStorageAdapter } from '../src/utils/cache.js';

describe('Flood Intelligence, Shelter & Alert Services (System Design Section 4, 6, 23, 24)', () => {
  it('returns flood risk with deterministic fallback when backend model fails', async () => {
    const memory = new MemoryStorageAdapter();
    const testCache = new CapabilityCache(memory);

    const failingFetch = async () => ({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    const result = await fetchFloodRisk(31.5204, 74.3587, {
      fetchFn: failingFetch,
      cache: testCache,
      timeoutMs: 100,
    });

    assert.strictEqual(result.status, STATUS.DEGRADED);
    assert.ok(result.data.level);
    assert.strictEqual(result.fallbackUsed, true);
  });

  it('filters and sorts shelters by nearest proximity', async () => {
    const memory = new MemoryStorageAdapter();
    const testCache = new CapabilityCache(memory);

    const mockSheltersData = [
      { id: 's1', name: 'Far Shelter', latitude: 31.8000, longitude: 74.8000, status: 'OPEN' },
      { id: 's2', name: 'Close Shelter', latitude: 31.5300, longitude: 74.3600, status: 'OPEN' },
    ];

    const mockFetch = async () => ({
      ok: true,
      status: 200,
      json: async () => mockSheltersData,
    });

    const userLat = 31.5204;
    const userLon = 74.3587;

    const result = await fetchNearbyShelters(userLat, userLon, {
      fetchFn: mockFetch,
      cache: testCache,
    });

    assert.strictEqual(result.status, STATUS.FRESH);
    assert.strictEqual(result.data.length, 2);
    // Nearest should be first
    assert.strictEqual(result.data[0].id, 's2');
    assert.ok(result.data[0].distanceKm < result.data[1].distanceKm);
  });

  it('uses safe predefined template when AI wording provider fails (Rule 9)', () => {
    const riskLevel = 'HIGH';
    const locationName = 'Shahdara, Lahore';

    // When AI provider fails (null or error passed)
    const wording = generateSafeWording(riskLevel, locationName, null);

    assert.ok(wording.action.includes('Evacuate') || wording.action.includes('safe'));
    assert.strictEqual(wording.source, 'deterministic-template');
  });

  it('filters expired alerts based on expiry timestamp (Section 23)', () => {
    const now = Date.now();
    const mockAlerts = [
      {
        id: 'a1',
        title: 'Active Flood Warning',
        severity: 'CRITICAL',
        expiresAt: now + 60 * 60 * 1000, // Expires in 1 hour
      },
      {
        id: 'a2',
        title: 'Old Warning',
        severity: 'LOW',
        expiresAt: now - 30 * 60 * 1000, // Expired 30 mins ago
      },
    ];

    const active = resolveActiveAlerts(mockAlerts, now);
    assert.strictEqual(active.length, 1);
    assert.strictEqual(active[0].id, 'a1');
  });
});

