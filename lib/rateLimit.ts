import { LRUCache } from 'lru-cache';

const cache = new LRUCache<string, number[]>({ max: 500 });

export function rateLimit(
  identifier: string,
  max: number,
  windowMs: number
): boolean {
  if (process.env.NODE_ENV !== 'production') {
    return true; // Bypass rate limiting in development/test environments
  }
  const now = Date.now();
  const timestamps = cache.get(identifier) ?? [];
  const recent = timestamps.filter((t) => now - t < windowMs);
  if (recent.length >= max) return false;
  cache.set(identifier, [...recent, now]);
  return true;
}

