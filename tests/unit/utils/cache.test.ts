// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { SimpleCache, CacheConfig } from "../../../src/utils/cache.js";

interface TestData {
  id: number;
  name: string;
}

describe("SimpleCache", () => {
  let cache: SimpleCache<TestData>;
  const testData: TestData = { id: 1, name: "test" };

  beforeEach(() => {
    vi.useFakeTimers();
    cache = new SimpleCache<TestData>();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Construction", () => {
    test("initializes with default configuration", () => {
      const defaultCache = new SimpleCache<TestData>();
      const stats = defaultCache.stats();

      expect(stats.enabled).toBe(true);
      expect(stats.defaultTtl).toBe(300000); // 5 minutes
      expect(stats.size).toBe(0);
    });

    test("accepts custom default TTL", () => {
      const customCache = new SimpleCache<TestData>({ defaultTtl: 600000 });
      const stats = customCache.stats();

      expect(stats.defaultTtl).toBe(600000); // 10 minutes
    });

    test("accepts enabled configuration", () => {
      const disabledCache = new SimpleCache<TestData>({ enabled: false });
      const stats = disabledCache.stats();

      expect(stats.enabled).toBe(false);
    });
  });

  describe("Basic Operations", () => {
    test("sets and gets values", () => {
      cache.set("test-key", testData);

      const result = cache.get("test-key");

      expect(result).toEqual(testData);
    });

    test("returns undefined for missing keys", () => {
      const result = cache.get("nonexistent");

      expect(result).toBeUndefined();
    });

    test("checks key existence with has()", () => {
      cache.set("test-key", testData);

      expect(cache.has("test-key")).toBe(true);
      expect(cache.has("nonexistent")).toBe(false);
    });

    test("invalidates specific keys", () => {
      cache.set("key1", testData);
      cache.set("key2", testData);

      cache.invalidate("key1");

      expect(cache.has("key1")).toBe(false);
      expect(cache.has("key2")).toBe(true);
    });

    test("clears all entries", () => {
      cache.set("key1", testData);
      cache.set("key2", testData);

      cache.clear();

      expect(cache.has("key1")).toBe(false);
      expect(cache.has("key2")).toBe(false);
      expect(cache.stats().size).toBe(0);
    });

    test("lists all cached keys", () => {
      cache.set("key1", testData);
      cache.set("key2", testData);
      cache.set("key3", testData);

      const keys = cache.keys();

      expect(keys).toHaveLength(3);
      expect(keys).toContain("key1");
      expect(keys).toContain("key2");
      expect(keys).toContain("key3");
    });
  });

  describe("TTL and Expiration", () => {
    test("expires entries after default TTL", () => {
      cache.set("test-key", testData);

      // Advance time by 5 minutes (default TTL)
      vi.advanceTimersByTime(300000);

      // Should still be valid at exactly TTL
      expect(cache.get("test-key")).toEqual(testData);

      // Advance by 1ms more - should expire
      vi.advanceTimersByTime(1);

      expect(cache.get("test-key")).toBeUndefined();
    });

    test("uses custom TTL when provided", () => {
      // Set with 1 minute TTL
      cache.set("test-key", testData, 60000);

      // Advance 59 seconds - should still be valid
      vi.advanceTimersByTime(59000);
      expect(cache.get("test-key")).toEqual(testData);

      // Advance 2 more seconds - should expire
      vi.advanceTimersByTime(2000);
      expect(cache.get("test-key")).toBeUndefined();
    });

    test("removes expired entry on access", () => {
      cache.set("test-key", testData);

      // Advance past TTL
      vi.advanceTimersByTime(300001);

      // Access triggers removal
      expect(cache.get("test-key")).toBeUndefined();

      // Verify entry was removed from internal map
      const keys = cache.keys();
      expect(keys).not.toContain("test-key");
    });

    test("has() returns false for expired entries", () => {
      cache.set("test-key", testData);

      // Advance past TTL
      vi.advanceTimersByTime(300001);

      expect(cache.has("test-key")).toBe(false);
    });

    test("cleanup() removes all expired entries", () => {
      // Set entries with different TTLs
      cache.set("key1", testData, 60000); // 1 minute
      cache.set("key2", testData, 120000); // 2 minutes
      cache.set("key3", testData, 180000); // 3 minutes

      // Advance 90 seconds - key1 expired, others valid
      vi.advanceTimersByTime(90000);

      cache.cleanup();

      expect(cache.has("key1")).toBe(false);
      expect(cache.has("key2")).toBe(true);
      expect(cache.has("key3")).toBe(true);
      expect(cache.stats().size).toBe(2);
    });
  });

  describe("Disabled Cache", () => {
    beforeEach(() => {
      cache = new SimpleCache<TestData>({ enabled: false });
    });

    test("set() does nothing when disabled", () => {
      cache.set("test-key", testData);

      expect(cache.stats().size).toBe(0);
    });

    test("get() returns undefined when disabled", () => {
      // Directly manipulate internal map to test disabled behavior
      cache.set("test-key", testData);

      const result = cache.get("test-key");

      expect(result).toBeUndefined();
    });

    test("has() returns false when disabled", () => {
      cache.set("test-key", testData);

      expect(cache.has("test-key")).toBe(false);
    });
  });

  describe("Cache Statistics", () => {
    test("stats() returns correct cache size", () => {
      cache.set("key1", testData);
      cache.set("key2", testData);

      const stats = cache.stats();

      expect(stats.size).toBe(2);
    });

    test("stats() includes expired entries in size", () => {
      cache.set("key1", testData);

      // Advance past TTL
      vi.advanceTimersByTime(300001);

      // Size includes expired entry until cleanup or access
      expect(cache.stats().size).toBe(1);

      // Access triggers removal
      cache.get("key1");

      expect(cache.stats().size).toBe(0);
    });

    test("stats() returns configuration values", () => {
      const customCache = new SimpleCache<TestData>({
        enabled: false,
        defaultTtl: 600000,
      });

      const stats = customCache.stats();

      expect(stats.enabled).toBe(false);
      expect(stats.defaultTtl).toBe(600000);
    });
  });

  describe("Edge Cases", () => {
    test("overwrites existing key", () => {
      const data1 = { id: 1, name: "first" };
      const data2 = { id: 2, name: "second" };

      cache.set("test-key", data1);
      cache.set("test-key", data2);

      expect(cache.get("test-key")).toEqual(data2);
    });

    test("handles undefined and null values", () => {
      const nullCache = new SimpleCache<TestData | null>();
      const undefinedCache = new SimpleCache<TestData | undefined>();

      nullCache.set("null-key", null);
      undefinedCache.set("undefined-key", undefined);

      expect(nullCache.get("null-key")).toBeNull();
      expect(undefinedCache.get("undefined-key")).toBeUndefined();
    });

    test("handles zero TTL", () => {
      cache.set("test-key", testData, 0);

      // Should expire immediately
      vi.advanceTimersByTime(1);

      expect(cache.get("test-key")).toBeUndefined();
    });

    test("handles large TTL values", () => {
      // Set with 1 year TTL
      const oneYear = 365 * 24 * 60 * 60 * 1000;
      cache.set("test-key", testData, oneYear);

      // Advance 364 days - should still be valid
      vi.advanceTimersByTime(364 * 24 * 60 * 60 * 1000);

      expect(cache.get("test-key")).toEqual(testData);
    });

    test("cleanup() handles empty cache", () => {
      expect(() => cache.cleanup()).not.toThrow();
      expect(cache.stats().size).toBe(0);
    });

    test("invalidate() handles nonexistent keys", () => {
      expect(() => cache.invalidate("nonexistent")).not.toThrow();
    });
  });
});
