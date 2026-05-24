import { LRUCache } from 'lru-cache';

const cache = new LRUCache<string, number[]>({ max: 500 });

export function rateLimit(
  identifier: string,
  max: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const timestamps = cache.get(identifier) ?? [];
  const recent = timestamps.filter((t) => now - t < windowMs);
  if (recent.length >= max) return false;
  cache.set(identifier, [...recent, now]);
  return true;
}
