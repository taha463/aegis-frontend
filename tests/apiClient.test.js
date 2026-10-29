import { describe, it } from 'node:test';
import assert from 'node:assert';
import { resilientFetch, createTelemetryEvent } from '../src/services/apiClient.js';

describe('Resilient API Client & Telemetry (System Design Section 19, 20, 25)', () => {
  it('creates structured telemetry events matching required fields', () => {
    const event = createTelemetryEvent({
      service: 'weather',
      operation: 'getCurrentWeather',
      location: '31.5204:74.3587',
      source: 'open-meteo',
      cacheHit: false,
      status: 'FRESH',
      durationMs: 120,
      fallbackUsed: false,
    });

    assert.ok(event.requestId.startsWith('req_'));
    assert.strictEqual(event.service, 'weather');
    assert.strictEqual(event.operation, 'getCurrentWeather');
    assert.strictEqual(event.status, 'FRESH');
    assert.strictEqual(event.fallbackUsed, false);
    assert.ok(typeof event.timestamp === 'string');
  });

  it('handles network timeout without throwing unhandled exceptions', async () => {
    // Call with a mock fetch that hangs longer than timeout
    const hangingFetch = () => new Promise((resolve) => setTimeout(resolve, 500));

    const result = await resilientFetch('https://example.com/api', {
      timeoutMs: 50,
      retries: 0,
      fetchFn: hangingFetch,
      service: 'test-service',
      operation: 'test-op',
    });

    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.status, 'TIMEOUT');
    assert.ok(result.error.includes('timed out'));
  });

  it('returns parsed json on successful response', async () => {
    const mockSuccessFetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ floodRisk: 'LOW', confidence: 0.95 }),
    });

    const result = await resilientFetch('https://example.com/api', {
      fetchFn: mockSuccessFetch,
      service: 'flood',
      operation: 'getRisk',
    });

    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.data.floodRisk, 'LOW');
    assert.strictEqual(result.status, 'FRESH');
  });

  it('handles HTTP error codes (e.g. 500) gracefully without crashing', async () => {
    const mock500Fetch = async () => ({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ message: 'Server crashed' }),
    });

    const result = await resilientFetch('https://example.com/api', {
      retries: 0,
      fetchFn: mock500Fetch,
      service: 'shelters',
      operation: 'getShelters',
    });

    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.httpStatus, 500);
    assert.strictEqual(result.status, 'UNAVAILABLE');
  });
});

