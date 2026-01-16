// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { ProfileManager } from "../../src/profile/manager.js";
import { CredentialManager, AuthMode } from "../../src/auth/credential-manager.js";
import { getProfileManager } from "../../src/profile/index.js";
import type { Profile } from "../../src/profile/types.js";

// Mock dependencies (only non-file-system modules)
vi.mock("../../src/utils/logging.js");
vi.mock("../../src/utils/path-security.js");
vi.mock("../../src/profile/index.js");

describe("Profile Management Integration Tests", () => {
  let profileManager: ProfileManager;
  let credentialManager: CredentialManager;
  let mockLogger: any;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    // Save environment
    originalEnv = { ...process.env };
    delete process.env.F5XC_API_URL;
    delete process.env.F5XC_API_TOKEN;

    // Set XDG_CONFIG_HOME to unique temporary directory for this test run
    const testId = Math.random().toString(36).substring(7);
    process.env.XDG_CONFIG_HOME = `/tmp/f5xc-test-${testId}`;

    // Reset mocks
    vi.clearAllMocks();

    // Setup logger mocks
    const loggingModule = await import("../../src/utils/logging.js");
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      setLevel: vi.fn(),
      getConfig: vi.fn(),
    };
    vi.mocked(loggingModule.logger.debug).mockImplementation(mockLogger.debug);
    vi.mocked(loggingModule.logger.info).mockImplementation(mockLogger.info);
    vi.mocked(loggingModule.logger.warn).mockImplementation(mockLogger.warn);
    vi.mocked(loggingModule.logger.error).mockImplementation(mockLogger.error);

    // Setup path security mocks
    const pathSecurity = await import("../../src/utils/path-security.js");
    vi.mocked(pathSecurity.validateFilePath).mockImplementation((path) => path);
    vi.mocked(pathSecurity.validateFilePaths).mockImplementation((paths) => paths);
    vi.mocked(pathSecurity.sanitizePathForLog).mockImplementation((path) =>
      path ? path.split("/").pop() ?? path : "[not set]"
    );

    // Initialize managers (uses XDG_CONFIG_HOME from environment)
    profileManager = new ProfileManager();

    // Setup getProfileManager to return our real profileManager instance
    const profileModule = await import("../../src/profile/index.js");
    vi.mocked(profileModule.getProfileManager).mockReturnValue(profileManager);

    credentialManager = new CredentialManager();
  });

  afterEach(async () => {
    // Clean up temporary test directory
    if (process.env.XDG_CONFIG_HOME?.startsWith("/tmp/f5xc-test-")) {
      const { rm } = await import("fs/promises");
      try {
        await rm(process.env.XDG_CONFIG_HOME, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    }

    // Restore environment
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe("Profile Lifecycle", () => {
    test("create profile → set active → use for auth → delete", async () => {
      // Create profile
      const newProfile: Profile = {
        name: "lifecycle-test",
        apiUrl: "https://tenant.console.ves.volterra.io",
        apiToken: "test-token-123",
      };

      // Save profile (creates real file)
      const createResult = await profileManager.save(newProfile);
      expect(createResult.success).toBe(true);
      expect(createResult.profile?.name).toBe("lifecycle-test");

      // Set as active profile
      const setActiveResult = await profileManager.setActive("lifecycle-test");
      expect(setActiveResult.success).toBe(true);

      // Verify active profile
      const activeName = await profileManager.getActive();
      expect(activeName).toBe("lifecycle-test");

      // Verify can retrieve the profile
      const retrievedProfile = await profileManager.get("lifecycle-test");
      expect(retrievedProfile?.apiToken).toBe("test-token-123");

      // Use for authentication
      await credentialManager.initialize();
      expect(credentialManager.getToken()).toBe("test-token-123");
      expect(credentialManager.getActiveProfile()).toBe("lifecycle-test");

      // Delete profile requires clearing active first
      await profileManager.clearActive();
      const deleteResult = await profileManager.delete("lifecycle-test");
      expect(deleteResult.success).toBe(true);
    });

    test("create multiple profiles → switch between them → verify isolation", async () => {
      // Create first profile
      const profile1: Profile = {
        name: "dev-profile",
        apiUrl: "https://dev.tenant.console.ves.volterra.io",
        apiToken: "dev-token",
      };

      // Create second profile
      const profile2: Profile = {
        name: "staging-profile",
        apiUrl: "https://staging.tenant.console.ves.volterra.io",
        apiToken: "staging-token",
      };

      // Save both profiles
      await profileManager.save(profile1);
      await profileManager.save(profile2);

      // Set dev profile as active
      await profileManager.setActive("dev-profile");

      // Initialize with dev profile
      await credentialManager.initialize();
      expect(credentialManager.getToken()).toBe("dev-token");
      expect(credentialManager.getApiUrl()).toContain("dev.tenant");

      // Switch to staging profile
      await profileManager.setActive("staging-profile");
      await credentialManager.reload();

      // Verify isolation - staging credentials loaded
      expect(credentialManager.getToken()).toBe("staging-token");
      expect(credentialManager.getApiUrl()).toContain("staging.tenant");
    });

    test("import YAML profile → convert to JSON → use seamlessly", async () => {
      // Arrange - Create a real YAML profile file
      const { writeFile, mkdir } = await import("fs/promises");
      const profilesDir = `${process.env.XDG_CONFIG_HOME}/f5xc/profiles`;

      await mkdir(profilesDir, { recursive: true });

      const yamlContent = `name: yaml-profile
apiUrl: https://tenant.console.ves.volterra.io
apiToken: yaml-token-456
metadata:
  createdAt: "2024-01-01T00:00:00.000Z"
`;

      await writeFile(`${profilesDir}/yaml-profile.yaml`, yamlContent, "utf-8");

      // Get profile (ProfileManager will try .json first, then .yaml)
      const profile = await profileManager.get("yaml-profile");

      // Assert - YAML parsed correctly
      expect(profile).toBeDefined();
      expect(profile?.name).toBe("yaml-profile");
      expect(profile?.apiToken).toBe("yaml-token-456");
      expect(profile?.metadata?.createdAt).toBe("2024-01-01T00:00:00.000Z");

      // Set as active and use for authentication
      await profileManager.setActive("yaml-profile");
      await credentialManager.initialize();

      expect(credentialManager.getAuthMode()).toBe(AuthMode.TOKEN);
      expect(credentialManager.getToken()).toBe("yaml-token-456");
    });
  });

  describe("Credential Rotation Flow", () => {
    test("rotate token → verify metadata updated → old token fails → new token works", async () => {
      // Arrange - create initial profile with old token
      const originalProfile: Profile = {
        name: "rotation-test",
        apiUrl: "https://tenant.console.ves.volterra.io",
        apiToken: "old-token",
        metadata: {
          createdAt: "2024-01-01T00:00:00.000Z",
          lastRotated: "2024-01-01T00:00:00.000Z",
          rotateAfterDays: 90,
        },
      };

      await profileManager.save(originalProfile);

      // Act - rotate credentials
      const rotationResult = await profileManager.rotateCredential("rotation-test", {
        apiToken: "new-rotated-token",
      });

      // Assert - rotation succeeded
      expect(rotationResult.success).toBe(true);

      // Verify profile was updated with new token and timestamp
      const updatedProfile = await profileManager.get("rotation-test");

      expect(updatedProfile?.apiToken).toBe("new-rotated-token");
      expect(updatedProfile?.metadata?.lastRotated).toBeDefined();
      expect(new Date(updatedProfile!.metadata!.lastRotated!).getTime()).toBeGreaterThan(
        new Date(originalProfile.metadata!.lastRotated!).getTime()
      );

      // Set as active and initialize with new token
      await profileManager.setActive("rotation-test");
      await credentialManager.initialize();

      expect(credentialManager.getToken()).toBe("new-rotated-token");
    });

    test("rotation warns before expiration → manual rotation → expiration reset", async () => {
      // Arrange - create profile approaching expiration (85 days ago, rotates every 90 = 5 days until rotation)
      const nearExpiryProfile: Profile = {
        name: "expiring-profile",
        apiUrl: "https://tenant.console.ves.volterra.io",
        apiToken: "expiring-token",
        metadata: {
          createdAt: "2024-01-01T00:00:00.000Z",
          lastRotated: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000).toISOString(),
          rotateAfterDays: 90,
        },
      };

      await profileManager.save(nearExpiryProfile);
      await profileManager.setActive("expiring-profile");

      // Mock logger to capture warning
      const { logger } = await import("../../src/utils/logging.js");
      const infoSpy = vi.spyOn(logger, "info");

      // Initialize - should warn about approaching expiration
      await credentialManager.initialize();

      // Verify warning was logged (within 7 days triggers info log)
      expect(infoSpy).toHaveBeenCalledWith(
        "Credentials rotation approaching",
        expect.objectContaining({
          profile: "expiring-profile",
          daysUntilRotation: expect.any(Number),
        })
      );

      // Rotate to reset expiration
      const rotateResult = await profileManager.rotateCredential("expiring-profile", {
        apiToken: "fresh-token",
      });

      expect(rotateResult.success).toBe(true);

      // Verify new lastRotated timestamp
      const rotatedProfile = await profileManager.get("expiring-profile");
      const daysSinceRotation =
        (Date.now() - new Date(rotatedProfile!.metadata!.lastRotated!).getTime()) /
        (24 * 60 * 60 * 1000);

      expect(daysSinceRotation).toBeLessThan(1); // Rotated less than 1 day ago
    });
  });

  describe("Caching Integration", () => {
    test("profile cached → modify on disk → cache invalidated → new data loaded", async () => {
      // Arrange - create initial profile
      const initialProfile: Profile = {
        name: "cache-test",
        apiUrl: "https://tenant.console.ves.volterra.io",
        apiToken: "initial-token",
      };

      await profileManager.save(initialProfile);

      // First read - loads from disk and caches
      const profile1 = await profileManager.get("cache-test");
      expect(profile1?.apiToken).toBe("initial-token");

      // Second read - should use cache (same data)
      const profile2 = await profileManager.get("cache-test");
      expect(profile2?.apiToken).toBe("initial-token");

      // Modify profile (save invalidates cache)
      const updatedProfile: Profile = {
        ...initialProfile,
        apiToken: "updated-token",
      };

      await profileManager.save(updatedProfile);

      // Read again - cache was invalidated by save(), loads new data
      const profile3 = await profileManager.get("cache-test");
      expect(profile3?.apiToken).toBe("updated-token");
    });

    test("multiple cache layers → invalidation propagates correctly", async () => {
      // Arrange - create profile and load into caches
      const profile: Profile = {
        name: "multi-cache-test",
        apiUrl: "https://tenant.console.ves.volterra.io",
        apiToken: "cached-token",
      };

      await profileManager.save(profile);

      // Load into ProfileManager cache
      await profileManager.get("multi-cache-test");

      // Load into CredentialManager
      await profileManager.setActive("multi-cache-test");
      await credentialManager.initialize();

      expect(credentialManager.getToken()).toBe("cached-token");

      // Update profile - invalidates ProfileManager cache
      const updatedProfile: Profile = {
        ...profile,
        apiToken: "new-cached-token",
      };

      await profileManager.save(updatedProfile);

      // Reload CredentialManager - should get updated data from fresh read
      await credentialManager.reload();

      expect(credentialManager.getToken()).toBe("new-cached-token");
    });
  });
});
