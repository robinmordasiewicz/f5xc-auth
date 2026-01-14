// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * Simple TTL (Time To Live) Cache
 *
 * Provides in-memory caching with expiration and optional file watching
 * to reduce repeated file system operations.
 *
 * @module cache
 * @since 1.2.0
 * @packageDocumentation
 */

/**
 * Cache entry with expiration metadata
 */
interface CacheEntry<T> {
  /** Cached data */
  data: T;
  /** Timestamp when entry was created */
  timestamp: number;
  /** Time-to-live in milliseconds */
  ttl: number;
}

/**
 * Cache configuration options
 */
export interface CacheConfig {
  /** Enable caching (default: true) */
  enabled?: boolean;
  /** Default TTL in milliseconds (default: 300000 = 5 minutes) */
  defaultTtl?: number;
}

/**
 * Simple TTL Cache
 *
 * Provides in-memory caching with automatic expiration.
 * Thread-safe for single-threaded Node.js applications.
 *
 * @example
 * ```typescript
 * const cache = new SimpleCache<Profile>({ defaultTtl: 300000 });
 *
 * // Cache a profile
 * cache.set("default", profileData, 600000);
 *
 * // Retrieve from cache
 * const profile = cache.get("default");
 * if (profile) {
 *   // Use cached data
 * }
 *
 * // Clear specific entry
 * cache.invalidate("default");
 * ```
 */
export class SimpleCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private config: Required<CacheConfig>;

  constructor(config: CacheConfig = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      defaultTtl: config.defaultTtl ?? 300000, // 5 minutes default
    };
  }

  /**
   * Store data in cache with optional TTL
   *
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttl - Time-to-live in milliseconds (optional, uses default)
   */
  set(key: string, data: T, ttl?: number): void {
    if (!this.config.enabled) {
      return;
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.config.defaultTtl,
    });
  }

  /**
   * Retrieve data from cache
   *
   * Returns undefined if:
   * - Key not found
   * - Entry has expired
   * - Caching is disabled
   *
   * @param key - Cache key
   * @returns Cached data or undefined
   */
  get(key: string): T | undefined {
    if (!this.config.enabled) {
      return undefined;
    }

    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }

    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      // Entry expired, remove it
      this.cache.delete(key);
      return undefined;
    }

    return entry.data;
  }

  /**
   * Check if key exists and is not expired
   *
   * @param key - Cache key
   * @returns True if key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Invalidate a specific cache entry
   *
   * @param key - Cache key to invalidate
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get all cached keys (including expired entries)
   *
   * @returns Array of cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache statistics
   *
   * @returns Cache statistics object
   */
  stats(): { size: number; enabled: boolean; defaultTtl: number } {
    return {
      size: this.cache.size,
      enabled: this.config.enabled,
      defaultTtl: this.config.defaultTtl,
    };
  }

  /**
   * Clean up expired entries
   * Useful for long-running processes
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}
