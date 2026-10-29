import { describe, it } from 'node:test';
import assert from 'node:assert';
import { fetchWeatherData, FALLBACK_WEATHER } from '../src/services/weatherService.js';
import { STATUS, CapabilityCache, MemoryStorageAdapter } from '../src/utils/cache.js';

describe('Weather Service & Degradation (System Design Section 4, 6, 8)', () => {
  it('returns fresh weather data from provider adapter when online', async () => {
    const memory = new MemoryStorageAdapter();
    const testCache = new CapabilityCache(memory);

    const mockFetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        current: {
          temperature_2m: 31.5,
          weather_code: 63, // moderate rain
          wind_speed_10m: 14.2,
          relative_humidity_2m: 85,
        },
      }),
    });

    const result = await fetchWeatherData(31.5204, 74.3587, {
      fetchFn: mockFetch,
      cache: testCache,
    });

    assert.strictEqual(result.status, STATUS.FRESH);
    assert.strictEqual(result.data.temp, 32);
    assert.ok(result.data.condition.toLowerCase().includes('rain'));
    assert.strictEqual(result.location.latitude, 31.5204);
  });

  it('falls back to STALE cached data when provider fails but cache exists', async () => {
    const memory = new MemoryStorageAdapter();
    const testCache = new CapabilityCache(memory);

    // Pre-populate with data from 20 minutes ago
    const pastTime = Date.now() - 20 * 60 * 1000;
    testCache.set('weather:31.5204:74.3587', {
      temp: 29,
      condition: 'Cloudy',
      windSpeed: '10 km/h',
      humidity: '75%',
    }, {
      ttlMs: 10 * 60 * 1000,
      staleGraceMs: 60 * 60 * 1000,
      now: pastTime,
    });

    // Provider fails with 503
    const failingFetch = async () => ({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      json: async () => ({}),
    });

    const result = await fetchWeatherData(31.5204, 74.3587, {
      fetchFn: failingFetch,
      cache: testCache,
    });

    assert.strictEqual(result.status, STATUS.STALE);
    assert.strictEqual(result.data.temp, 29);
    assert.strictEqual(result.fallbackUsed, true);
  });

  it('returns graceful DEGRADED state with safe fallback when provider fails and no cache exists', async () => {
    const memory = new MemoryStorageAdapter();
    const testCache = new CapabilityCache(memory);

    const failingFetch = async () => {
      throw new Error('Connection refused');
    };

    const result = await fetchWeatherData(31.5204, 74.3587, {
      fetchFn: failingFetch,
      cache: testCache,
      timeoutMs: 100,
      retries: 0,
    });

    // Does not crash! Aegis remains usable!
    assert.strictEqual(result.status, STATUS.DEGRADED);
    assert.ok(result.data);
    assert.strictEqual(result.fallbackUsed, true);
  });
});

