type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitStore = Map<string, RateLimitBucket>;

type CheckRateLimitInput = {
  namespace: string;
  key: string;
  max: number;
  windowMs: number;
};

type RateLimitState = {
  allowed: boolean;
  retryAfterSec: number;
  remaining: number;
};

declare global {
  var __RRS_RATE_LIMIT_STORE__: Map<string, RateLimitStore> | undefined;
}

function getNamespaceStore(namespace: string): RateLimitStore {
  if (!globalThis.__RRS_RATE_LIMIT_STORE__) {
    globalThis.__RRS_RATE_LIMIT_STORE__ = new Map();
  }
  const root = globalThis.__RRS_RATE_LIMIT_STORE__;
  const existing = root.get(namespace);
  if (existing) return existing;
  const created: RateLimitStore = new Map();
  root.set(namespace, created);
  return created;
}

export function getClientIpFromHeaders(headers: Headers): string {
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim() || 'unknown-ip';
  }
  return headers.get('x-real-ip') || 'unknown-ip';
}

export function checkRateLimit(input: CheckRateLimitInput): RateLimitState {
  const { namespace, key, max, windowMs } = input;
  const now = Date.now();
  const store = getNamespaceStore(namespace);
  const bucket = store.get(key);

  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      retryAfterSec: 0,
      remaining: Math.max(max - 1, 0),
    };
  }

  bucket.count += 1;

  if (bucket.count > max) {
    return {
      allowed: false,
      retryAfterSec: Math.max(Math.ceil((bucket.resetAt - now) / 1000), 1),
      remaining: 0,
    };
  }

  return {
    allowed: true,
    retryAfterSec: 0,
    remaining: Math.max(max - bucket.count, 0),
  };
}

export function enforceRateLimit(input: CheckRateLimitInput): void {
  const state = checkRateLimit(input);
  if (!state.allowed) {
    throw new Error(`Too many requests. Please try again in ${state.retryAfterSec} seconds.`);
  }
}
