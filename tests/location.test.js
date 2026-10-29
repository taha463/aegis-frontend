import { describe, it } from 'node:test';
import assert from 'node:assert';
import { normalizeCoords, createLocationKey, calculateDistanceKm, isValidCoords } from '../src/utils/location.js';

describe('Location Utility & Normalization (System Design Section 8)', () => {
  it('normalizes coordinates to consistent 4-decimal precision', () => {
    const lat1 = 32.1617001;
    const lon1 = 74.1883002;
    const normalized = normalizeCoords(lat1, lon1);

    assert.strictEqual(normalized.latitude, 32.1617);
    assert.strictEqual(normalized.longitude, 74.1883);

    const lat2 = '32.1617';
    const lon2 = '74.1883';
    const normalizedStr = normalizeCoords(lat2, lon2);
    assert.strictEqual(normalizedStr.latitude, 32.1617);
    assert.strictEqual(normalizedStr.longitude, 74.1883);
  });

  it('generates consistent cache keys for near-identical coordinates', () => {
    const key1 = createLocationKey('weather', 32.161700, 74.188300);
    const key2 = createLocationKey('weather', 32.1617, 74.1883);
    assert.strictEqual(key1, key2);
    assert.strictEqual(key1, 'weather:32.1617:74.1883');
  });

  it('validates coordinate boundaries', () => {
    assert.strictEqual(isValidCoords(32.1617, 74.1883), true);
    assert.strictEqual(isValidCoords(95, 74.1883), false);
    assert.strictEqual(isValidCoords(-32.1617, 190), false);
    assert.strictEqual(isValidCoords(null, undefined), false);
    assert.strictEqual(isValidCoords('invalid', 'coords'), false);
  });

  it('calculates great-circle distance accurately in kilometers', () => {
    // Distance between Lahore (31.5204, 74.3587) and Islamabad (33.6844, 73.0479) ~ 260-275 km
    const dist = calculateDistanceKm(31.5204, 74.3587, 33.6844, 73.0479);
    assert.ok(dist > 250 && dist < 280, `Expected distance between 250 and 280km, got ${dist}`);
  });
});

