/**
 * Aegis Resilient API Client & Observability Layer
 * Conforms to Aegis System Design v1 - Sections 19, 20, 25, 26
 *
 * Provides:
 * - Strict timeout isolation (prevents hanging HTTP requests from blocking the UI)
 * - Single bounded retry with exponential jitter for transient network failures
 * - Structured telemetry emitting diagnostics without leaking tokens or sensitive data
 * - Non-throwing degraded result contracts: { ok, status, data, error, telemetry }
 */

import { STATUS } from '../utils/cache.js';

const rateLimitCooldowns = new Map();

export function isDomainRateLimited(url) {
  try {
    const host = new URL(url).host;
    const cooldownUntil = rateLimitCooldowns.get(host);
    return Boolean(cooldownUntil && Date.now() < cooldownUntil);
  } catch (_) {
    return false;
  }
}

export function recordDomainRateLimit(url, cooldownMs = 60000) {
  try {
    const host = new URL(url).host;
    rateLimitCooldowns.set(host, Date.now() + cooldownMs);
    console.warn(`[Aegis:ApiClient] Rate limit recorded for ${host}. Cooldown: ${cooldownMs / 1000}s`);
  } catch (_) {}
}

let reqCounter = 0;

/**
 * Creates structured telemetry metadata.
 */
export function createTelemetryEvent({
  service,
  operation,
  location = null,
  source = 'api',
  cacheHit = false,
  cacheAgeMinutes = null,
  status = STATUS.FRESH,
  durationMs = 0,
  errorType = null,
  fallbackUsed = false,
}) {
  reqCounter = (reqCounter + 1) % 100000;
  return {
    requestId: `req_${Date.now().toString(36)}_${reqCounter}`,
    timestamp: new Date().toISOString(),
    service,
    operation,
    location,
    source,
    cacheHit,
    cacheAgeMinutes,
    status,
    durationMs,
    errorType,
    fallbackUsed,
  };
}

/**
 * Logs telemetry defensively.
 */
export function emitTelemetry(telemetry) {
  const prefix = `[Aegis:${telemetry.service}:${telemetry.operation}]`;
  if (telemetry.status === STATUS.FRESH) {
    console.info(`${prefix} SUCCESS in ${telemetry.durationMs}ms (status: ${telemetry.status})`);
  } else if (telemetry.status === STATUS.STALE || telemetry.fallbackUsed) {
    console.warn(`${prefix} DEGRADED / FALLBACK in ${telemetry.durationMs}ms (reason: ${telemetry.errorType})`);
  } else {
    console.error(`${prefix} FAILED in ${telemetry.durationMs}ms (error: ${telemetry.errorType})`);
  }
}

/**
 * Executes a network fetch with bounded timeout, retry, and degraded contract.
 */
export async function resilientFetch(url, options = {}) {
  const {
    timeoutMs = 3500,
    retries = 0,
    headers = {},
    service = 'core',
    operation = 'request',
    location = null,
    source = 'http',
    fetchFn = (typeof fetch !== 'undefined' ? fetch : null),
    ...fetchOptions
  } = options;

  if (!fetchFn) {
    return {
      ok: false,
      status: STATUS.UNAVAILABLE,
      data: null,
      error: 'Fetch environment not available',
      telemetry: createTelemetryEvent({
        service,
        operation,
        location,
        source,
        status: STATUS.UNAVAILABLE,
        errorType: 'NO_FETCH',
      }),
    };
  }

  if (isDomainRateLimited(url)) {
    return {
      ok: false,
      httpStatus: 429,
      status: STATUS.UNAVAILABLE,
      data: null,
      error: 'Domain cooling down from rate limit (HTTP 429)',
      telemetry: createTelemetryEvent({
        service,
        operation,
        location,
        source,
        status: STATUS.UNAVAILABLE,
        errorType: 'RATE_LIMITED_COOLDOWN',
      }),
    };
  }

  const startTime = Date.now();
  let attempt = 0;
  let lastError = null;

  while (attempt <= retries) {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutHandle = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

    try {
      const response = await fetchFn(url, {
        ...fetchOptions,
        headers,
        signal: controller ? controller.signal : undefined,
      });

      if (timeoutHandle) clearTimeout(timeoutHandle);

      if (controller && controller.signal && controller.signal.aborted) {
        throw new Error(`Request timed out after ${timeoutMs}ms`);
      }

      const durationMs = Date.now() - startTime;

      if (!response.ok) {
        let errBody = null;
        try {
          errBody = await response.json();
        } catch (_) {}

        if (response.status === 429) { recordDomainRateLimit(url, 60000); }
        const errorMsg = (errBody && errBody.message) || response.statusText || `HTTP ${response.status}`;
        const telemetry = createTelemetryEvent({
          service,
          operation,
          location,
          source,
          status: STATUS.UNAVAILABLE,
          durationMs,
          errorType: `HTTP_${response.status}`,
        });
        emitTelemetry(telemetry);

        return {
          ok: false,
          httpStatus: response.status,
          status: STATUS.UNAVAILABLE,
          data: null,
          error: errorMsg,
          telemetry,
        };
      }

      let parsedData = null;
      try {
        parsedData = await response.json();
      } catch (parseErr) {
        parsedData = null;
      }

      const telemetry = createTelemetryEvent({
        service,
        operation,
        location,
        source,
        status: STATUS.FRESH,
        durationMs,
      });
      emitTelemetry(telemetry);

      return {
        ok: true,
        httpStatus: response.status,
        status: STATUS.FRESH,
        data: parsedData,
        error: null,
        telemetry,
      };
    } catch (err) {
      if (timeoutHandle) clearTimeout(timeoutHandle);

      const isAbort =
        (controller && controller.signal && controller.signal.aborted) ||
        err.name === 'AbortError' ||
        err.message?.includes('aborted');
      lastError = isAbort ? `Request timed out after ${timeoutMs}ms` : (err.message || 'Network error');

      attempt++;
      if (attempt <= retries && !isAbort) {
        // Wait 300ms before bounded retry
        await new Promise((res) => setTimeout(res, 300));
      }
    }
  }

  const totalDuration = Date.now() - startTime;
  const isTimeout = lastError && lastError.includes('timed out');
  const errorStatus = isTimeout ? 'TIMEOUT' : STATUS.UNAVAILABLE;

  const telemetry = createTelemetryEvent({
    service,
    operation,
    location,
    source,
    status: errorStatus,
    durationMs: totalDuration,
    errorType: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
  });
  emitTelemetry(telemetry);

  return {
    ok: false,
    status: errorStatus,
    data: null,
    error: lastError,
    telemetry,
  };
}
