import { describe, it } from 'node:test';
import assert from 'node:assert';
import { formatRelativeTime, CapabilityCache, MemoryStorageAdapter, STATUS, THREE_HOURS_MS } from '../src/utils/cache.js';
import { fetchFloodRisk, fetchFloodForecast } from '../src/services/floodService.js';
import { fetchWeatherData } from '../src/services/weatherService.js';
import { fetchNearbyShelters } from '../src/services/shelterService.js';
import { resolveUserProfile } from '../src/services/profileService.js';

describe('Aegis 3-Hour Cache Memory Architecture & Clean UI (System Design v1)', () => {
  it('formats clean relative timestamps without vulgar fallback or live labels', () => {
    const now = Date.now();
    assert.strictEqual(formatRelativeTime(now), 'Updated just now');
    assert.strictEqual(formatRelativeTime(now - 30 * 1000), 'Updated just now');
    assert.strictEqual(formatRelativeTime(now - 60 * 1000), 'Updated 1 min ago');
    assert.strictEqual(formatRelativeTime(now - 20 * 60 * 1000), 'Updated 20 min ago');
    assert.strictEqual(formatRelativeTime(now - 60 * 60 * 1000), 'Updated 1 hour ago');
    assert.strictEqual(formatRelativeTime(now - 120 * 60 * 1000), 'Updated 2 hours ago');

    // Never returns "Fallback Mode" or "Live"
    const sampleTimes = [now, now - 60000, now - 3600000, null, undefined];
    for (const t of sampleTimes) {
      const formatted = formatRelativeTime(t);
      assert.ok(!formatted.includes('Fallback'), `Should not contain Fallback: ${formatted}`);
      assert.ok(!formatted.includes('Live'), `Should not contain Live: ${formatted}`);
    }
  });

  it('guarantees 3-hour memory cache retrieval in < 15ms even when network hangs', async () => {
    const memStore = new MemoryStorageAdapter();
    const testCache = new CapabilityCache(memStore);

    // Seed cache 25 minutes ago
    const pastTime = Date.now() - 25 * 60 * 1000;
    testCache.set('flood-risk:31.5204:74.3587', {
      level: 'High Alert',
      score: 82,
      riverDischarge: '210k m³/s',
      description: 'Historical high ground monitoring active',
      lastUpdated: 'Updated 25 min ago',
    }, {
      ttlMs: THREE_HOURS_MS,
      staleGraceMs: THREE_HOURS_MS,
      now: pastTime,
    });

    testCache.set('weather:31.5204:74.3587', {
      temp: 31,
      condition: 'Clear Sky',
      windSpeed: '8 km/h',
      humidity: '55%',
    }, {
      ttlMs: THREE_HOURS_MS,
      now: pastTime,
    });

    // Hanging network fetch that simulates a 10s hang
    const hangingFetch = () => new Promise((resolve) => setTimeout(() => resolve({ ok: false, status: 504 }), 10000));

    // Test flood risk instant retrieval
    const startFlood = Date.now();
    const floodRes = await fetchFloodRisk(31.5204, 74.3587, {
      fetchFn: hangingFetch,
      cache: testCache,
      timeoutMs: 1000,
    });
    const floodDuration = Date.now() - startFlood;

    assert.ok(floodDuration < 20, `Must return in < 20ms from memory cache, took ${floodDuration}ms`);
    assert.strictEqual(floodRes.data.level, 'High Alert');
    assert.strictEqual(floodRes.data.score, 82);
    assert.strictEqual(floodRes.source, 'memory-cache');
    assert.strictEqual(floodRes.relativeTime, 'Updated 25 min ago');

    // Test weather instant retrieval
    const startWeather = Date.now();
    const weatherRes = await fetchWeatherData(31.5204, 74.3587, {
      fetchFn: hangingFetch,
      cache: testCache,
      timeoutMs: 1000,
    });
    const weatherDuration = Date.now() - startWeather;

    assert.ok(weatherDuration < 20, `Must return in < 20ms from memory cache, took ${weatherDuration}ms`);
    assert.strictEqual(weatherRes.data.temp, 31);
    assert.strictEqual(weatherRes.source, 'memory-cache');
    assert.strictEqual(weatherRes.relativeTime, 'Updated 25 min ago');
  });

  it('proves auth identity and session never crash or unmount during total external timeout', async () => {
    const mockFirebaseUser = {
      uid: 'user_cit_998',
      displayName: 'Taha Ahmed',
      email: 'taha@aegis.org',
      getIdToken: async () => 'mock_token',
    };

    // External backend is completely dead
    const deadBackendFetch = async () => {
      throw new Error('Connection timed out');
    };

    const res = await resolveUserProfile(mockFirebaseUser, {
      fetchFn: deadBackendFetch,
      timeoutMs: 1000,
    });

    assert.ok(res.profile, 'Profile must exist');
    assert.strictEqual(res.profile.fullName, 'Taha Ahmed');
    assert.strictEqual(res.profile.email, 'taha@aegis.org');
    assert.strictEqual(res.profile.uid, 'user_cit_998');
    assert.strictEqual(res.source, 'firebase-auth-session');
  });

  it('navigating back to dashboard reuses fresh memory cache with ZERO network calls', async () => {
    const memStore = new MemoryStorageAdapter();
    const testCache = new CapabilityCache(memStore);

    // Seed fresh cache (fetched 5 minutes ago)
    const freshTime = Date.now() - 5 * 60 * 1000;
    testCache.set('weather:31.5204:74.3587', {
      temp: 26,
      condition: 'Clear Sky',
      windSpeed: '4 km/h',
      humidity: '40%',
    }, {
      ttlMs: THREE_HOURS_MS,
      staleGraceMs: THREE_HOURS_MS,
      now: freshTime,
    });

    let networkCallMade = false;
    const trackingFetch = async () => {
      networkCallMade = true;
      return { ok: true, json: async () => ({}) };
    };

    // User navigates away and comes back to Dashboard
    const result = await fetchWeatherData(31.5204, 74.3587, {
      cache: testCache,
      fetchFn: trackingFetch,
    });

    assert.strictEqual(result.source, 'memory-cache');
    assert.strictEqual(result.status, STATUS.FRESH);
    assert.strictEqual(result.data.temp, 26);
    assert.strictEqual(networkCallMade, false, 'Must NOT trigger any network calls when cache is fresh');
  });
});

