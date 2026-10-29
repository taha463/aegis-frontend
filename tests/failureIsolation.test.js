import { describe, it } from 'node:test';
import assert from 'node:assert';
import { resolveUserProfile } from '../src/services/profileService.js';
import { fetchWeatherData } from '../src/services/weatherService.js';
import { fetchFloodRisk } from '../src/services/floodService.js';
import { fetchNearbyShelters } from '../src/services/shelterService.js';
import { STATUS, CapabilityCache, MemoryStorageAdapter } from '../src/utils/cache.js';

describe('Aegis System Design v1 - Critical Failure Boundary Isolation (Section 32)', () => {
  it('CRITICAL TEST: When Weather Provider completely crashes/times out, Profile, Auth, Flood Risk, and Shelters remain fully operational', async () => {
    const memory = new MemoryStorageAdapter();
    const testCache = new CapabilityCache(memory);

    const lat = 31.5204;
    const lon = 74.3587;

    // 1. Weather provider completely down (Connection Refused / 500 / Hang)
    const brokenWeatherFetch = async () => {
      throw new Error('Weather API Outage / Network Offline');
    };

    // 2. Flood Risk provider operational
    const workingFloodFetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        level: 'High',
        score: 82,
        discharge: '180k m³/s',
      }),
    });

    // 3. Shelter provider operational
    const workingShelterFetch = async () => ({
      ok: true,
      status: 200,
      json: async () => [
        { id: 'sh_1', name: 'District Emergency Center', latitude: 31.53, longitude: 74.36, status: 'OPEN' }
      ],
    });

    // 4. Firebase User authenticated
    const mockFirebaseUser = {
      uid: 'user_safe_test',
      email: 'citizen@emergency.gov.pk',
      displayName: 'Citizen Resilience Tester',
    };

    // Execute concurrently across domain boundaries
    const [weatherResult, profileResult, floodResult, shelterResult] = await Promise.all([
      fetchWeatherData(lat, lon, { fetchFn: brokenWeatherFetch, cache: testCache, timeoutMs: 100, retries: 0 }),
      resolveUserProfile(mockFirebaseUser, { fetchFn: async () => ({ ok: false, status: 500 }), timeoutMs: 100 }),
      fetchFloodRisk(lat, lon, { fetchFn: workingFloodFetch, cache: testCache }),
      fetchNearbyShelters(lat, lon, { fetchFn: workingShelterFetch, cache: testCache }),
    ]);

    // Weather is degraded/fallback due to provider failure
    assert.strictEqual(weatherResult.status, STATUS.DEGRADED);
    assert.strictEqual(weatherResult.fallbackUsed, true);

    // Golden Rule 1: Auth/Profile remains fully usable
    assert.strictEqual(profileResult.profile.fullName, 'Citizen Resilience Tester');
    assert.strictEqual(profileResult.profile.email, 'citizen@emergency.gov.pk');

    // Golden Rule 2: Flood Intelligence is unaffected by weather provider failure!
    assert.strictEqual(floodResult.status, STATUS.FRESH);
    assert.strictEqual(floodResult.data.level, 'High');

    // Golden Rule 2: Shelter lookup is unaffected by weather provider failure!
    assert.strictEqual(shelterResult.status, STATUS.FRESH);
    assert.strictEqual(shelterResult.data.length, 1);
    assert.strictEqual(shelterResult.data[0].name, 'District Emergency Center');
  });

  it('CRITICAL TEST: When Backend completely crashes (500), Weather and Local Shelters remain available', async () => {
    const memory = new MemoryStorageAdapter();
    const testCache = new CapabilityCache(memory);

    const lat = 31.5204;
    const lon = 74.3587;

    // Backend completely down
    const backendDownFetch = async () => ({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Server crashed' }),
    });

    // Open-Meteo external weather is UP
    const openMeteoUpFetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        current: {
          temperature_2m: 29.0,
          weather_code: 0,
          wind_speed_10m: 8.0,
          relative_humidity_2m: 60,
        },
      }),
    });

    const [weatherResult, floodResult, shelterResult] = await Promise.all([
      fetchWeatherData(lat, lon, { fetchFn: openMeteoUpFetch, cache: testCache }),
      fetchFloodRisk(lat, lon, { fetchFn: backendDownFetch, cache: testCache, timeoutMs: 100, retries: 0 }),
      fetchNearbyShelters(lat, lon, { fetchFn: backendDownFetch, cache: testCache, timeoutMs: 100, retries: 0 }),
    ]);

    // External weather is FRESH
    assert.strictEqual(weatherResult.status, STATUS.FRESH);
    assert.strictEqual(weatherResult.data.temp, 29);

    // Flood & Shelters degrade gracefully to deterministic safe fallbacks rather than crashing
    assert.strictEqual(floodResult.status, STATUS.DEGRADED);
    assert.ok(floodResult.data.level);

    assert.strictEqual(shelterResult.status, STATUS.DEGRADED);
    assert.ok(shelterResult.data.length > 0);
  });
});

