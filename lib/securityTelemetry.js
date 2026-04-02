const RATE_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT = 5;

const getStore = () => {
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
  const ip = String(rawIp || '').trim();
  if (!ip) return 'unknown';
  return ip.toLowerCase();
};

const prune = (timestamps, now) => {
  const cutoff = now - RATE_WINDOW_MS;
  return timestamps.filter((time) => time > cutoff);
};

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
