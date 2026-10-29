import { describe, it } from 'node:test';
import assert from 'node:assert';
import { resolveUserProfile, FALLBACK_PROFILE } from '../src/services/profileService.js';
import { STATUS } from '../src/utils/cache.js';

describe('Profile Service & Auth Isolation (System Design Section 4 & 16)', () => {
  it('returns fallback profile immediately if no firebase user is logged in', async () => {
    const result = await resolveUserProfile(null, { fetchFn: async () => {} });
    assert.strictEqual(result.profile.fullName, 'Citizen');
    assert.strictEqual(result.status, STATUS.UNAVAILABLE);
  });

  it('uses Firebase Auth user data as baseline even if backend profile request times out or fails', async () => {
    const mockFirebaseUser = {
      uid: 'user_123',
      email: 'citizen@example.com',
      displayName: 'Taha Ahmed',
      getIdToken: async () => 'mock_token',
    };

    // Simulate backend down (500)
    const failingFetch = async () => ({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({}),
    });

    const result = await resolveUserProfile(mockFirebaseUser, {
      fetchFn: failingFetch,
      timeoutMs: 100,
    });

    // Golden Rule 1: Auth must never depend on intelligence providers or backend availability
    assert.strictEqual(result.profile.fullName, 'Taha Ahmed');
    assert.strictEqual(result.profile.email, 'citizen@example.com');
    assert.strictEqual(result.status, STATUS.DEGRADED);
    assert.strictEqual(result.isFallback, true);
  });

  it('merges backend profile attributes when backend is available', async () => {
    const mockFirebaseUser = {
      uid: 'user_123',
      email: 'citizen@example.com',
      displayName: 'Taha Ahmed',
      getIdToken: async () => 'mock_token',
    };

    const successFetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        fullName: 'Taha Ahmed Al-Sayed',
        phone: '+923001234567',
        role: 'Citizen',
        city: 'Lahore',
      }),
    });

    const result = await resolveUserProfile(mockFirebaseUser, {
      fetchFn: successFetch,
    });

    assert.strictEqual(result.status, STATUS.FRESH);
    assert.strictEqual(result.profile.fullName, 'Taha Ahmed Al-Sayed');
    assert.strictEqual(result.profile.city, 'Lahore');
    assert.strictEqual(result.isFallback, false);
  });
});

