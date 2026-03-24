/**
 * Simple in-memory sliding-window rate limiter.
 * Not suitable for multi-process deployments — use Redis in that case.
 */

interface SlidingWindow {
  timestamps: number[];
}

const store = new Map<string, SlidingWindow>();

// Cleanup stale entries every 60 seconds
setInterval(() => {
  const cutoff = Date.now() - 120_000;
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}, 60_000).unref();

/**
 * Check if a request is within the rate limit.
 *
 * @param key    Unique identifier (e.g. IP, device ID)
 * @param limit  Max requests allowed in the window
 * @param windowMs Window size in milliseconds
 * @returns `{ allowed, remaining, retryAfterMs }`
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  const cutoff = now - windowMs;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Drop timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= limit) {
    const oldest = entry.timestamps[0];
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: oldest + windowMs - now,
    };
  }

  entry.timestamps.push(now);
  return {
    allowed: true,
    remaining: limit - entry.timestamps.length,
    retryAfterMs: 0,
  };
}
