/**
 * securityTelemetry.js — In-Process Rate Limiter & Telemetry Store
 *
 * Implements a sliding-window rate limiter for the AI receipt-scan endpoint.
 * State is stored in globalThis to survive Hot Module Replacement in dev.
 *
 * Rate limit config:
 *   - RATE_LIMIT      : 5 requests allowed per window
 *   - RATE_WINDOW_MS  : 5-minute (300 000 ms) rolling window per IP
 *
 * Exports:
 *   - checkAndTrackReceiptScanRateLimit(ip) → { allowed, retryAfterSeconds, remaining, limit, windowSeconds }
 *   - getSecurityTelemetrySnapshot()        → live stats for the Admin dashboard
 *
 * Note: This is process-local memory. In a multi-process deployment
 * (multiple Node workers or containers) each process maintains separate
 * counters. For distributed rate limiting, replace with Redis.
 */

const RATE_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT = 5;

const getStore = () => {
  // Keep telemetry in process memory so admin dashboard can inspect current runtime behavior.
  if (!globalThis.__securityTelemetryStore) {
    globalThis.__securityTelemetryStore = {
      receiptScanByIp: new Map(),
      receiptDeniedTotal: 0,
      receiptAcceptedTotal: 0,
      lastDeniedAt: null,
    };
  }

  return globalThis.__securityTelemetryStore;
};

const toIpKey = (rawIp) => {
  // Normalize key to avoid duplicate buckets caused by formatting differences.
  const ip = String(rawIp || '').trim();
  if (!ip) return 'unknown';
  return ip.toLowerCase();
};

const prune = (timestamps, now) => {
  // Sliding-window cleanup: keep only requests that are still inside the rate window.
  const cutoff = now - RATE_WINDOW_MS;
  return timestamps.filter((time) => time > cutoff);
};

/**
 * checkAndTrackReceiptScanRateLimit(ipAddress)
 * Main rate-limit gate for the receipt-scan API route.
 *
 * Algorithm:
 *   1. Retrieve (or prune) the timestamp list for this IP.
 *   2. If length >= RATE_LIMIT → deny, increment denied counter, return retryAfter.
 *   3. Otherwise              → allow, record timestamp, increment accepted counter.
 *
 * @param {string} ipAddress  - raw IP string from request headers
 * @returns {{ allowed: boolean, retryAfterSeconds: number, remaining: number,
 *             limit: number, windowSeconds: number }}
 */
export const checkAndTrackReceiptScanRateLimit = (ipAddress) => {
  const store = getStore();
  const now = Date.now();
  const key = toIpKey(ipAddress);

  const current = prune(store.receiptScanByIp.get(key) || [], now);
  if (current.length >= RATE_LIMIT) {
    store.receiptDeniedTotal += 1;
    store.lastDeniedAt = new Date(now).toISOString();

    const retryAfterMs = RATE_WINDOW_MS - (now - current[0]);
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
      remaining: 0,
      limit: RATE_LIMIT,
      windowSeconds: RATE_WINDOW_MS / 1000,
    };
  }

  current.push(now);
  store.receiptScanByIp.set(key, current);
  store.receiptAcceptedTotal += 1;

  return {
    allowed: true,
    retryAfterSeconds: 0,
    remaining: Math.max(0, RATE_LIMIT - current.length),
    limit: RATE_LIMIT,
    windowSeconds: RATE_WINDOW_MS / 1000,
  };
};

/**
 * getSecurityTelemetrySnapshot()
 * Returns a sanitized view of the current telemetry store for the Admin panel.
 * Also performs housekeeping by evicting expired IP records from the Map.
 *
 * @returns {{ receiptScan: { activeClientCount, deniedTotal, acceptedTotal,
 *             lastDeniedAt, limit, windowSeconds } }}
 */
export const getSecurityTelemetrySnapshot = () => {
  const store = getStore();
  const now = Date.now();
  let activeClientCount = 0;

  for (const [key, timestamps] of store.receiptScanByIp.entries()) {
    const next = prune(timestamps, now);
    if (next.length === 0) {
      store.receiptScanByIp.delete(key);
      continue;
    }
    store.receiptScanByIp.set(key, next);
    activeClientCount += 1;
  }

  return {
    receiptScan: {
      activeClientCount,
      deniedTotal: store.receiptDeniedTotal,
      acceptedTotal: store.receiptAcceptedTotal,
      lastDeniedAt: store.lastDeniedAt,
      limit: RATE_LIMIT,
      windowSeconds: RATE_WINDOW_MS / 1000,
    },
  };
};
