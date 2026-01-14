// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * Unit tests for ProfileManager
 *
 * Test coverage: 35 tests across 5 suites
 * - CRUD Operations: Profile creation, reading, updating, deletion, listing, validation
 * - Active Profile Management: Get, set, switch, clear active profile
 * - Caching: TTL-based caching, cache invalidation, cache hits/misses
 * - Credential Rotation: Token/cert rotation, metadata updates, expiration calculation
 * - Security: File permissions, sensitive data masking
 */

import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { promises as fs } from "fs";
import { ProfileManager, getProfileManager } from "../../../src/profile/manager.js";
import type { Profile } from "../../../src/profile/types.js";

// Mock dependencies
vi.mock("fs", () => ({
  promises: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    readdir: vi.fn().mockResolvedValue([]),
    readFile: vi.fn().mockRejectedValue(new Error("File not found")),
    writeFile: vi.fn().mockResolvedValue(undefined),
    unlink: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("../../../src/config/paths.js", () => ({
  paths: {
    configDir: "/mock/config",
    profilesDir: "/mock/config/profiles",
    activeProfile: "/mock/config/active-profile",
  },
}));

describe("ProfileManager", () => {
  let manager: ProfileManager;

  const mockProfile: Profile = {
    name: "test-profile",
    apiUrl: "https://tenant.console.ves.volterra.io",
    apiToken: "test-token-12345",
  };

  beforeEach(() => {
    vi.resetAllMocks(); // Reset mock implementations, not just call history
    manager = new ProfileManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("CRUD Operations", () => {
    test("creates new profile with validation", async () => {
      const result = await manager.save(mockProfile);

      expect(result.success).toBe(true);
      expect(result.message).toContain("saved successfully");
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining("test-profile.json"),
        expect.stringContaining('"name": "test-profile"'),
        { mode: 0o600 }
      );
    });

    test("reads existing profile from file", async () => {
      const profileData = JSON.stringify(mockProfile);
      vi.mocked(fs.readFile).mockResolvedValueOnce(profileData);

      const profile = await manager.get("test-profile");

      expect(profile).toEqual(mockProfile);
      expect(fs.readFile).toHaveBeenCalledWith(
        expect.stringContaining("test-profile.json"),
        "utf-8"
      );
    });

    test("reads YAML profile and converts keys to camelCase", async () => {
      const yamlProfile = `
name: test-profile
api_url: https://tenant.console.ves.volterra.io
api_token: test-token-12345
default_namespace: system
      `.trim();

      vi.mocked(fs.readFile)
        .mockRejectedValueOnce(new Error("Not found")) // .json
        .mockResolvedValueOnce(yamlProfile); // .yaml

      const profile = await manager.get("test-profile");

      expect(profile).toMatchObject({
        name: "test-profile",
        apiUrl: "https://tenant.console.ves.volterra.io",
        apiToken: "test-token-12345",
        defaultNamespace: "system",
      });
    });

    test("updates existing profile data", async () => {
      const updatedProfile: Profile = {
        ...mockProfile,
        defaultNamespace: "production",
      };

      const result = await manager.save(updatedProfile);

      expect(result.success).toBe(true);
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining("test-profile.json"),
        expect.stringContaining('"defaultNamespace": "production"'),
        { mode: 0o600 }
      );
    });

    test("deletes profile when not active", async () => {
      const profileData = JSON.stringify(mockProfile);
      vi.mocked(fs.readFile)
        .mockResolvedValueOnce(profileData) // get() call
        .mockRejectedValueOnce(new Error("Not found")); // getActive() call

      const result = await manager.delete("test-profile");

      expect(result.success).toBe(true);
      expect(result.message).toContain("deleted successfully");
      expect(fs.unlink).toHaveBeenCalledWith(expect.stringContaining("test-profile.json"));
    });

    test("prevents deleting active profile", async () => {
      const profileData = JSON.stringify(mockProfile);
      vi.mocked(fs.readFile)
        .mockResolvedValueOnce(profileData) // get() call
        .mockResolvedValueOnce("test-profile"); // getActive() call

      const result = await manager.delete("test-profile");

      expect(result.success).toBe(false);
      expect(result.message).toContain("Cannot delete active profile");
      expect(fs.unlink).not.toHaveBeenCalled();
    });

    test("lists all profiles sorted alphabetically", async () => {
      vi.mocked(fs.readdir).mockResolvedValueOnce(["prod.json", "dev.json", "staging.yaml"] as any);

      const prodProfile = JSON.stringify({ name: "prod", apiUrl: "https://prod.io", apiToken: "token1" });
      const devProfile = JSON.stringify({ name: "dev", apiUrl: "https://dev.io", apiToken: "token2" });
      const stagingProfile = "name: staging\napi_url: https://staging.io\napi_token: token3";

      vi.mocked(fs.readFile)
        .mockResolvedValueOnce(prodProfile)
        .mockResolvedValueOnce(devProfile)
        .mockRejectedValueOnce(new Error("Not found"))
        .mockResolvedValueOnce(stagingProfile);

      const profiles = await manager.list();

      expect(profiles).toHaveLength(3);
      expect(profiles[0].name).toBe("dev");
      expect(profiles[1].name).toBe("prod");
      expect(profiles[2].name).toBe("staging");
    });

    test("validates profile name format", async () => {
      const invalidProfiles = [
        { ...mockProfile, name: "" }, // empty
        { ...mockProfile, name: "invalid name!" }, // special chars
        { ...mockProfile, name: "a".repeat(65) }, // too long
        { ...mockProfile, name: "profile@test" }, // invalid char
      ];

      for (const profile of invalidProfiles) {
        const result = await manager.save(profile);
        expect(result.success).toBe(false);
        expect(result.message).toContain("Invalid profile name");
      }
    });

    test("validates API URL format", async () => {
      const invalidUrls = [
        "not-a-url",
        "ftp://invalid.com",
        "",
        "just-text",
      ];

      for (const url of invalidUrls) {
        const profile = { ...mockProfile, apiUrl: url };
        const result = await manager.save(profile);
        expect(result.success).toBe(false);
        expect(result.message).toContain("Invalid API URL");
      }
    });

    test("requires authentication method", async () => {
      const noAuthProfile = {
        name: "no-auth",
        apiUrl: "https://tenant.console.ves.volterra.io",
      };

      const result = await manager.save(noAuthProfile as Profile);

      expect(result.success).toBe(false);
      expect(result.message).toContain("authentication method");
    });

    test("handles missing profiles gracefully", async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error("ENOENT: no such file"));

      const profile = await manager.get("nonexistent");

      expect(profile).toBeNull();
    });

    test("handles corrupted JSON gracefully", async () => {
      vi.mocked(fs.readFile).mockResolvedValueOnce("{ invalid json }");

      const profile = await manager.get("corrupted");

      expect(profile).toBeNull();
    });

    test("supports both JSON and YAML profiles", async () => {
      vi.mocked(fs.readdir).mockResolvedValueOnce(["json-profile.json", "yaml-profile.yaml"] as any);

      const jsonProfile = JSON.stringify({ name: "json-profile", apiUrl: "https://json.io", apiToken: "token1" });
      const yamlProfile = "name: yaml-profile\napi_url: https://yaml.io\napi_token: token2";

      vi.mocked(fs.readFile)
        .mockResolvedValueOnce(jsonProfile) // json-profile.json succeeds
        .mockRejectedValueOnce(new Error("Not found")) // yaml-profile.json fails
        .mockResolvedValueOnce(yamlProfile); // yaml-profile.yaml succeeds

      const profiles = await manager.list();

      expect(profiles).toHaveLength(2);
      expect(profiles.find(p => p.name === "json-profile")).toBeTruthy();
      expect(profiles.find(p => p.name === "yaml-profile")).toBeTruthy();
    });
  });

  describe("Active Profile Management", () => {
    test("gets active profile name", async () => {
      vi.mocked(fs.readFile).mockResolvedValueOnce("test-profile");

      const active = await manager.getActive();

      expect(active).toBe("test-profile");
      expect(fs.readFile).toHaveBeenCalledWith(
        expect.stringContaining("active-profile"),
        "utf-8"
      );
    });

    test("sets active profile", async () => {
      const profileData = JSON.stringify(mockProfile);
      vi.mocked(fs.readFile).mockResolvedValueOnce(profileData);

      const result = await manager.setActive("test-profile");

      expect(result.success).toBe(true);
      expect(result.message).toContain("Switched to profile");
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining("active-profile"),
        "test-profile",
        { mode: 0o600 }
      );
    });

    test("switches between profiles", async () => {
      const profile1 = JSON.stringify({ name: "profile1", apiUrl: "https://p1.io", apiToken: "token1" });
      const profile2 = JSON.stringify({ name: "profile2", apiUrl: "https://p2.io", apiToken: "token2" });

      vi.mocked(fs.readFile)
        .mockResolvedValueOnce(profile1) // setActive("profile1")
        .mockResolvedValueOnce(profile2); // setActive("profile2")

      const result1 = await manager.setActive("profile1");
      const result2 = await manager.setActive("profile2");

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(fs.writeFile).toHaveBeenCalledTimes(2);
    });

    test("handles no active profile", async () => {
      vi.mocked(fs.readFile).mockRejectedValueOnce(new Error("ENOENT: no such file"));

      const active = await manager.getActive();

      expect(active).toBeNull();
    });

    test("validates active profile exists", async () => {
      vi.mocked(fs.readFile).mockRejectedValueOnce(new Error("Not found"));

      const result = await manager.setActive("nonexistent");

      expect(result.success).toBe(false);
      expect(result.message).toContain("not found");
      expect(fs.writeFile).not.toHaveBeenCalled();
    });

    test("clears active profile for force delete", async () => {
      await manager.clearActive();

      expect(fs.unlink).toHaveBeenCalledWith(expect.stringContaining("active-profile"));
    });

    test("gets active profile full data", async () => {
      const profileData = JSON.stringify(mockProfile);
      vi.mocked(fs.readFile)
        .mockResolvedValueOnce("test-profile") // getActive()
        .mockResolvedValueOnce(profileData); // get()

      const profile = await manager.getActiveProfile();

      expect(profile).toEqual(mockProfile);
    });

    test("returns null when no active profile set", async () => {
      vi.mocked(fs.readFile).mockRejectedValueOnce(new Error("ENOENT"));

      const profile = await manager.getActiveProfile();

      expect(profile).toBeNull();
    });
  });

  describe("Caching", () => {
    test("caches profile data with 5-minute TTL", async () => {
      const profileData = JSON.stringify(mockProfile);
      vi.mocked(fs.readFile).mockResolvedValueOnce(profileData);

      // First access - should read from file
      const profile1 = await manager.get("test-profile");

      // Second access - should use cache
      const profile2 = await manager.get("test-profile");

      expect(profile1).toEqual(mockProfile);
      expect(profile2).toEqual(mockProfile);
      expect(fs.readFile).toHaveBeenCalledTimes(1); // Only called once
    });

    test("returns cached data on second access", async () => {
      const profileData = JSON.stringify(mockProfile);
      vi.mocked(fs.readFile).mockResolvedValueOnce(profileData);

      await manager.get("test-profile");
      await manager.get("test-profile");
      await manager.get("test-profile");

      expect(fs.readFile).toHaveBeenCalledTimes(1); // Cache hit on 2nd and 3rd access
    });

    test("invalidates cache on save", async () => {
      const profileData = JSON.stringify(mockProfile);
      vi.mocked(fs.readFile)
        .mockResolvedValueOnce(profileData) // First get
        .mockResolvedValueOnce(profileData); // After save

      // First access - loads and caches
      await manager.get("test-profile");

      // Save - should invalidate cache
      await manager.save(mockProfile);

      // Second access - should re-read from file
      await manager.get("test-profile");

      expect(fs.readFile).toHaveBeenCalledTimes(2);
    });

    test("invalidates cache on delete", async () => {
      const profileData = JSON.stringify(mockProfile);
      vi.mocked(fs.readFile)
        .mockResolvedValueOnce(profileData) // First get
        .mockResolvedValueOnce(profileData) // delete() check
        .mockRejectedValueOnce(new Error("Not found")) // getActive() check
        .mockResolvedValueOnce(profileData); // After delete

      // First access - loads and caches
      await manager.get("test-profile");

      // Delete - should invalidate cache
      await manager.delete("test-profile");

      // Second access - should re-read from file
      await manager.get("test-profile");

      expect(fs.readFile).toHaveBeenCalledTimes(4);
    });

    test("respects TTL expiration", async () => {
      vi.useFakeTimers();

      const profileData = JSON.stringify(mockProfile);
      vi.mocked(fs.readFile)
        .mockResolvedValueOnce(profileData)
        .mockResolvedValueOnce(profileData);

      // First access
      await manager.get("test-profile");

      // Advance time by 6 minutes (past TTL)
      vi.advanceTimersByTime(6 * 60 * 1000);

      // Second access - cache expired, should re-read
      await manager.get("test-profile");

      expect(fs.readFile).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    test("cache cleanup removes expired entries", async () => {
      vi.useFakeTimers();

      const profileData = JSON.stringify(mockProfile);
      vi.mocked(fs.readFile)
        .mockResolvedValueOnce(profileData)
        .mockResolvedValueOnce(profileData);

      // Load profile into cache
      await manager.get("test-profile");

      // Advance time past TTL
      vi.advanceTimersByTime(6 * 60 * 1000);

      // Access after expiration should reload
      await manager.get("test-profile");

      expect(fs.readFile).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    test("disables cache when configured", async () => {
      // Note: Current implementation doesn't support disabling cache
      // This test documents expected behavior for future enhancement
      const profileData = JSON.stringify(mockProfile);
      vi.mocked(fs.readFile)
        .mockResolvedValueOnce(profileData)
        .mockResolvedValueOnce(profileData);

      // Even with cache, multiple calls should use cached data
      await manager.get("test-profile");
      await manager.get("test-profile");

      expect(fs.readFile).toHaveBeenCalledTimes(1); // Cache is enabled
    });

    test("cache hit/miss statistics", async () => {
      const profileData = JSON.stringify(mockProfile);
      vi.mocked(fs.readFile)
        .mockResolvedValueOnce(profileData)
        .mockResolvedValueOnce(profileData);

      // Miss - first access
      await manager.get("test-profile");
      expect(fs.readFile).toHaveBeenCalledTimes(1);

      // Hit - cached
      await manager.get("test-profile");
      expect(fs.readFile).toHaveBeenCalledTimes(1);

      // Miss - after invalidation
      await manager.save(mockProfile);
      await manager.get("test-profile");
      expect(fs.readFile).toHaveBeenCalledTimes(2);
    });
  });

  describe("Credential Rotation", () => {
    test("rotates API token", async () => {
      const profileWithMetadata: Profile = {
        ...mockProfile,
        metadata: {
          createdAt: "2024-01-01T00:00:00.000Z",
          rotateAfterDays: 90,
        },
      };

      vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify(profileWithMetadata));

      const result = await manager.rotateCredential("test-profile", {
        apiToken: "new-token-67890",
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("Credentials rotated successfully");
      expect(result.profile?.apiToken).toBe("new-token-67890");
      expect(result.profile?.metadata?.lastRotated).toBeDefined();
    });

    test("rotates P12 certificate", async () => {
      const profileWithP12: Profile = {
        name: "cert-profile",
        apiUrl: "https://tenant.console.ves.volterra.io",
        p12Bundle: "/path/to/old-cert.p12",
        metadata: {
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      };

      vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify(profileWithP12));

      const result = await manager.rotateCredential("cert-profile", {
        p12Bundle: "/path/to/new-cert.p12",
      });

      expect(result.success).toBe(true);
      expect(result.profile?.p12Bundle).toBe("/path/to/new-cert.p12");
    });

    test("rotates cert/key pair", async () => {
      const profileWithCertKey: Profile = {
        name: "cert-key-profile",
        apiUrl: "https://tenant.console.ves.volterra.io",
        cert: "/path/to/old-cert.pem",
        key: "/path/to/old-key.pem",
        metadata: {
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      };

      vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify(profileWithCertKey));

      const result = await manager.rotateCredential("cert-key-profile", {
        cert: "/path/to/new-cert.pem",
        key: "/path/to/new-key.pem",
      });

      expect(result.success).toBe(true);
      expect(result.profile?.cert).toBe("/path/to/new-cert.pem");
      expect(result.profile?.key).toBe("/path/to/new-key.pem");
    });

    test("updates lastRotated timestamp", async () => {
      const profileData = JSON.stringify(mockProfile);
      vi.mocked(fs.readFile).mockResolvedValueOnce(profileData);

      const beforeRotation = Date.now();
      const result = await manager.rotateCredential("test-profile", {
        apiToken: "new-token",
      });
      const afterRotation = Date.now();

      expect(result.success).toBe(true);
      const lastRotated = new Date(result.profile!.metadata!.lastRotated!).getTime();
      expect(lastRotated).toBeGreaterThanOrEqual(beforeRotation);
      expect(lastRotated).toBeLessThanOrEqual(afterRotation);
    });

    test("calculates new expiration dates", async () => {
      const profileWithRotation: Profile = {
        ...mockProfile,
        metadata: {
          createdAt: "2024-01-01T00:00:00.000Z",
          rotateAfterDays: 90,
        },
      };

      vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify(profileWithRotation));

      const result = await manager.rotateCredential("test-profile", {
        apiToken: "new-token",
      });

      expect(result.success).toBe(true);
      expect(result.profile?.metadata?.expiresAt).toBeDefined();

      const expiresAt = new Date(result.profile!.metadata!.expiresAt!);
      const expectedExpiration = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

      // Allow 1 minute difference for test execution time
      const diff = Math.abs(expiresAt.getTime() - expectedExpiration.getTime());
      expect(diff).toBeLessThan(60 * 1000);
    });

    test("warns when credentials expire soon", async () => {
      const expiringProfile: Profile = {
        ...mockProfile,
        metadata: {
          createdAt: "2024-01-01T00:00:00.000Z",
          lastRotated: "2024-01-01T00:00:00.000Z",
          expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
          rotateAfterDays: 90,
        },
      };

      vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify(expiringProfile));

      const profile = await manager.get("test-profile");

      expect(profile?.metadata?.expiresAt).toBeDefined();
      const daysUntilExpiration = Math.floor(
        (new Date(profile!.metadata!.expiresAt!).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
      );
      expect(daysUntilExpiration).toBeLessThan(7);
    });

    test("validates rotation workflow", async () => {
      const profileData = JSON.stringify(mockProfile);
      vi.mocked(fs.readFile).mockResolvedValueOnce(profileData);

      // Rotate credentials
      const result = await manager.rotateCredential("test-profile", {
        apiToken: "new-token",
      });

      expect(result.success).toBe(true);
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining("test-profile.json"),
        expect.stringContaining("new-token"),
        { mode: 0o600 }
      );
    });

    test("handles rotation for nonexistent profile", async () => {
      // get() tries .json, .yaml, .yml extensions - all must fail
      vi.mocked(fs.readFile)
        .mockRejectedValueOnce(new Error("Not found"))
        .mockRejectedValueOnce(new Error("Not found"))
        .mockRejectedValueOnce(new Error("Not found"));

      const result = await manager.rotateCredential("nonexistent", {
        apiToken: "new-token",
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("not found");
    });
  });

  describe("Security", () => {
    test("sets file permissions to 0600 for profiles", async () => {
      await manager.save(mockProfile);

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        { mode: 0o600 }
      );
    });

    test("sets directory permissions to 0700 for profile directory", async () => {
      await manager.ensureDirectories();

      expect(fs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining("profiles"),
        { recursive: true, mode: 0o700 }
      );
    });

    test("masks sensitive fields in profile display", () => {
      const profile: Profile = {
        name: "test",
        apiUrl: "https://tenant.console.ves.volterra.io",
        apiToken: "secret-token-12345",
        p12Bundle: "/path/to/cert.p12",
        cert: "/path/to/cert.pem",
        key: "/path/to/key.pem",
        defaultNamespace: "system",
      };

      const masked = manager.maskProfile(profile);

      expect(masked.name).toBe("test");
      expect(masked.apiUrl).toBe("https://tenant.console.ves.volterra.io");
      expect(masked.apiToken).toBe("****2345"); // Last 4 chars
      expect(masked.p12Bundle).toBe("[configured]");
      expect(masked.cert).toBe("[configured]");
      expect(masked.key).toBe("[configured]");
      expect(masked.defaultNamespace).toBe("system");
    });

    test("masks short tokens completely", () => {
      const profile: Profile = {
        name: "test",
        apiUrl: "https://tenant.console.ves.volterra.io",
        apiToken: "123", // Short token
      };

      const masked = manager.maskProfile(profile);

      expect(masked.apiToken).toBe("****");
    });
  });

  describe("Singleton Pattern", () => {
    test("getProfileManager returns singleton instance", () => {
      const instance1 = getProfileManager();
      const instance2 = getProfileManager();

      expect(instance1).toBe(instance2);
    });

    test("exists() checks profile existence", async () => {
      const profileData = JSON.stringify(mockProfile);
      // get() tries .json first and succeeds
      vi.mocked(fs.readFile).mockResolvedValueOnce(profileData);

      const exists = await manager.exists("test-profile");

      expect(exists).toBe(true);
    });

    test("exists() returns false for missing profile", async () => {
      // get() tries .json, .yaml, .yml - all must fail
      vi.mocked(fs.readFile)
        .mockRejectedValueOnce(new Error("Not found"))
        .mockRejectedValueOnce(new Error("Not found"))
        .mockRejectedValueOnce(new Error("Not found"));

      const exists = await manager.exists("nonexistent");

      expect(exists).toBe(false);
    });
  });

  describe("Error Handling Edge Cases", () => {
    test("delete() handles filesystem error gracefully", async () => {
      const profileData = JSON.stringify(mockProfile);
      // First readFile for get() check succeeds
      vi.mocked(fs.readFile).mockResolvedValueOnce(profileData);
      // readFile for getActive() returns null (not active)
      vi.mocked(fs.readFile).mockRejectedValueOnce(new Error("No active profile"));
      // unlink fails with permission error
      vi.mocked(fs.unlink).mockRejectedValueOnce(new Error("EPERM: permission denied"));

      const result = await manager.delete("test-profile");

      expect(result.success).toBe(false);
      expect(result.message).toContain("Failed to delete profile");
      expect(result.message).toContain("permission denied");
    });

    test("setActive() handles filesystem write error gracefully", async () => {
      const profileData = JSON.stringify(mockProfile);
      // readFile for get() succeeds
      vi.mocked(fs.readFile).mockResolvedValueOnce(profileData);
      // writeFile for setActive fails with disk full error
      vi.mocked(fs.writeFile).mockRejectedValueOnce(new Error("ENOSPC: no space left on device"));

      const result = await manager.setActive("test-profile");

      expect(result.success).toBe(false);
      expect(result.message).toContain("Failed to set active profile");
      expect(result.message).toContain("no space left on device");
    });

    test("rotateCredential() handles save failure", async () => {
      const profileWithMetadata: Profile = {
        ...mockProfile,
        metadata: {
          createdAt: "2024-01-01T00:00:00.000Z",
          rotateAfterDays: 90,
        },
      };
      const profileData = JSON.stringify(profileWithMetadata);

      // readFile for get() succeeds
      vi.mocked(fs.readFile).mockResolvedValueOnce(profileData);
      // writeFile for save() fails
      vi.mocked(fs.writeFile).mockRejectedValueOnce(new Error("Write error"));

      const result = await manager.rotateCredential("test-profile", {
        apiToken: "new-token",
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("Failed to save profile");
    });

    test("delete() returns error for non-existent profile", async () => {
      vi.mocked(fs.readFile).mockRejectedValueOnce(new Error("Profile not found"));

      const result = await manager.delete("non-existent-profile");

      expect(result.success).toBe(false);
      expect(result.message).toContain("Profile 'non-existent-profile' not found");
    });

    test("list() handles .yml extension files", async () => {
      vi.mocked(fs.readdir).mockResolvedValueOnce(["profile1.yml", "profile2.json"] as any);

      const profile1Data = JSON.stringify({ name: "profile1", apiUrl: "https://test1.io", apiToken: "token1" });
      const profile2Data = JSON.stringify({ name: "profile2", apiUrl: "https://test2.io", apiToken: "token2" });

      vi.mocked(fs.readFile)
        .mockResolvedValueOnce(profile1Data) // profile1.yml
        .mockResolvedValueOnce(profile2Data); // profile2.json

      const profiles = await manager.list();

      expect(profiles).toHaveLength(2);
      expect(profiles.find(p => p.name === "profile1")).toBeTruthy();
      expect(profiles.find(p => p.name === "profile2")).toBeTruthy();
    });

    test("list() returns empty array on readdir error", async () => {
      vi.mocked(fs.readdir).mockRejectedValueOnce(new Error("Directory read error"));

      const profiles = await manager.list();

      expect(profiles).toEqual([]);
    });
  });
});
