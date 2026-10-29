/**
 * Aegis Profile Service
 * Conforms to Aegis System Design v1 - Sections 4 & 16: Authentication Independence
 *
 * Guarantees:
 * - Application shell & user identity are completely isolated from backend intelligence
 * - A backend timeout or 500 never prevents the user from viewing the dashboard
 * - Offline / degraded fallback using Firebase Auth session metadata
 */

import { STATUS, CapabilityCache, DOMAIN_CACHE_POLICIES } from '../utils/cache.js';
import { resilientFetch } from './apiClient.js';
import API_URL from '../config.js';

const cache = new CapabilityCache();

export const FALLBACK_PROFILE = Object.freeze({
  fullName: 'Citizen',
  email: '',
  phone: '',
  city: 'Locating...',
  role: 'Citizen',
});

/**
 * Resolves user profile with resilient fallback.
 */
export async function resolveUserProfile(firebaseUser, options = {}) {
  const {
    fetchFn,
    timeoutMs = 4000,
    apiUrl = API_URL,
  } = options;

  if (!firebaseUser) {
    return {
      status: STATUS.UNAVAILABLE,
      profile: { ...FALLBACK_PROFILE },
      isFallback: true,
      error: 'Not authenticated',
    };
  }

  // 1. Establish session baseline from Firebase Auth
  const baseProfile = {
    ...FALLBACK_PROFILE,
    fullName: firebaseUser.displayName || 'Citizen',
    email: firebaseUser.email || '',
    uid: firebaseUser.uid,
  };

  const cacheKey = `profile:${firebaseUser.uid}`;

  // 2. Check local capability cache
  const cached = cache.get(cacheKey);
  if (cached && cached.data) {
    return {
      status: cached.status,
      profile: { ...baseProfile, ...cached.data },
      isFallback: false,
      source: 'cache',
      ageMinutes: cached.ageMinutes,
    };
  }

  // 3. Attempt backend profile sync
  try {
    let token = '';
    if (typeof firebaseUser.getIdToken === 'function') {
      token = await firebaseUser.getIdToken();
    }

    const response = await resilientFetch(`${apiUrl}/user/profile`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      timeoutMs,
      retries: 0, // Quick single attempt so citizen is not delayed
      service: 'profile',
      operation: 'resolveUserProfile',
      fetchFn,
    });

    if (response.ok && response.data) {
      const merged = { ...baseProfile, ...response.data };
      cache.set(cacheKey, response.data, {
        ttlMs: DOMAIN_CACHE_POLICIES.profile.ttlMs,
        staleGraceMs: DOMAIN_CACHE_POLICIES.profile.staleGraceMs,
        source: 'backend-profile',
      });
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem('aegis_user_profile', JSON.stringify(merged));
        } catch (e) {}
      }

      return {
        status: STATUS.FRESH,
        profile: merged,
        isFallback: false,
        source: 'api',
      };
    }
  } catch (err) {
    console.warn('[ProfileService] Backend profile sync failed, falling back to session:', err.message);
  }

  // 4. Graceful degraded fallback: Return base Firebase Auth profile
  return {
    status: STATUS.DEGRADED,
    profile: baseProfile,
    isFallback: true,
    source: 'firebase-auth-session',
  };
}

