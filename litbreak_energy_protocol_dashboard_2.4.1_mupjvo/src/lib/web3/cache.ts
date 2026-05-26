/**
 * RPC Call Cache — Minimizes redundant blockchain RPC calls.
 *
 * Implements a TTL-based cache for read-only contract calls.
 * Write operations always bypass the cache.
 *
 * Features:
 *   - Configurable TTL per cache key
 *   - Automatic stale entry cleanup
 *   - Request deduplication (coalescing concurrent identical calls)
 *   - Manual invalidation by key or pattern
 */

import { web3Config } from './config';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
}

// ─── Cache Implementation ────────────────────────────────────────────────────

class RpcCache {
  private cache = new Map<string, CacheEntry>();
  private pending = new Map<string, Promise<unknown>>();
  private defaultTtl: number;

  constructor(defaultTtlMs?: number) {
    this.defaultTtl = defaultTtlMs ?? web3Config.cacheTtlMs;
  }

  /**
   * Get a cached value if it exists and is not stale.
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set a cache value with optional custom TTL.
   */
  set<T>(key: string, data: T, ttlMs?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs ?? this.defaultTtl,
    });
  }

  /**
   * Execute a function with caching and request deduplication.
   *
   * If the same key is already being fetched, returns the existing promise
   * instead of making a duplicate RPC call.
   */
  async getOrFetch<T>(key: string, fetcher: () => Promise<T>, ttlMs?: number): Promise<T> {
    // Check cache first
    const cached = this.get<T>(key);
    if (cached !== null) return cached;

    // Check if there's already a pending request for this key
    const pendingRequest = this.pending.get(key);
    if (pendingRequest) {
      return pendingRequest as Promise<T>;
    }

    // Create new request with deduplication
    const promise = fetcher()
      .then((result) => {
        this.set(key, result, ttlMs);
        this.pending.delete(key);
        return result;
      })
      .catch((err) => {
        this.pending.delete(key);
        throw err;
      });

    this.pending.set(key, promise);
    return promise;
  }

  /**
   * Invalidate a specific cache key.
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache keys matching a prefix.
   * Useful for invalidating all entries after a state-changing transaction.
   */
  invalidateByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Invalidate the entire cache.
   * Called after any write transaction to ensure fresh data.
   */
  invalidateAll(): void {
    this.cache.clear();
  }

  /**
   * Remove all stale entries (garbage collection).
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics for debugging.
   */
  stats(): { size: number; pending: number } {
    return {
      size: this.cache.size,
      pending: this.pending.size,
    };
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────

let instance: RpcCache | null = null;

export function getRpcCache(): RpcCache {
  if (!instance) {
    instance = new RpcCache();
    // Run garbage collection every 30 seconds
    setInterval(() => instance?.cleanup(), 30_000);
  }
  return instance;
}

export { RpcCache };
