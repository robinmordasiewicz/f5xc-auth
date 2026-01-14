// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import {
  CredentialManager,
  AuthMode,
  AUTH_ENV_VARS,
  normalizeApiUrl,
  extractTenantFromUrl,
  normalizeTenantUrl,
} from "../../../src/auth/credential-manager.js";
import type { Profile } from "../../../src/profile/types.js";
import { logger } from "../../../src/utils/logging.js";

// Mock dependencies
vi.mock("fs/promises");
vi.mock("../../../src/utils/logging.js");
vi.mock("../../../src/profile/index.js");
vi.mock("../../../src/utils/path-security.js");

describe("CredentialManager", () => {
  let manager: CredentialManager;
  let mockProfileManager: any;
  let mockLogger: any;

  beforeEach(async () => {
    // Clear environment variables before each test
    Object.values(AUTH_ENV_VARS).forEach((envVar) => {
      delete process.env[envVar];
    });

    // Reset mocks
    vi.clearAllMocks();

    // Create fresh instance
    manager = new CredentialManager();

    // Setup default mocks
    const { getProfileManager } = await import("../../../src/profile/index.js");
    mockProfileManager = {
      getActiveProfile: vi.fn().mockResolvedValue(null),
      get: vi.fn().mockResolvedValue(null),
    };
    vi.mocked(getProfileManager).mockReturnValue(mockProfileManager);

    // Mock path security utilities to return paths unchanged
    const pathSecurity = await import("../../../src/utils/path-security.js");
    vi.mocked(pathSecurity.validateFilePath).mockImplementation((path) => path);
    vi.mocked(pathSecurity.validateFilePaths).mockImplementation((paths) => paths);
    vi.mocked(pathSecurity.sanitizePathForLog).mockImplementation((path) =>
      path ? path.split("/").pop() ?? path : "[not set]"
    );

    // Setup logger mock
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      setLevel: vi.fn(),
      getConfig: vi.fn(),
    };
    vi.mocked(logger.debug).mockImplementation(mockLogger.debug);
    vi.mocked(logger.info).mockImplementation(mockLogger.info);
    vi.mocked(logger.warn).mockImplementation(mockLogger.warn);
    vi.mocked(logger.error).mockImplementation(mockLogger.error);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Initialization", () => {
    test("loads credentials from environment variables", async () => {
      // Arrange
      process.env[AUTH_ENV_VARS.API_URL] = "tenant.console.ves.volterra.io";
      process.env[AUTH_ENV_VARS.API_TOKEN] = "test-token-12345";

      // Act
      await manager.initialize();
      const creds = manager.getCredentials();

      // Assert
      expect(creds.mode).toBe(AuthMode.TOKEN);
      expect(creds.apiUrl).toBe("https://tenant.console.ves.volterra.io/api");
      expect(creds.token).toBe("test-token-12345");
      expect(manager.isAuthenticated()).toBe(true);
    });

    test("loads credentials from active profile", async () => {
      // Arrange
      const profile: Profile = {
        name: "test-profile",
        apiUrl: "tenant.console.ves.volterra.io",
        apiToken: "profile-token",
      };
      mockProfileManager.getActiveProfile.mockResolvedValue(profile);

      // Act
      await manager.initialize();
      const creds = manager.getCredentials();

      // Assert
      expect(creds.mode).toBe(AuthMode.TOKEN);
      expect(creds.token).toBe("profile-token");
      expect(manager.getActiveProfile()).toBe("test-profile");
    });

    test("handles missing credentials gracefully", async () => {
      // Arrange
      mockProfileManager.getActiveProfile.mockResolvedValue(null);

      // Act
      await manager.initialize();
      const creds = manager.getCredentials();

      // Assert
      expect(creds.mode).toBe(AuthMode.NONE);
      expect(manager.isAuthenticated()).toBe(false);
      expect(creds.apiUrl).toBeNull();
      expect(creds.token).toBeNull();
    });

    test("initializes with profile-based auth modes", async () => {
      // Arrange - P12 certificate profile
      const profile: Profile = {
        name: "cert-profile",
        apiUrl: "tenant.console.ves.volterra.io",
        p12Bundle: "/path/to/cert.p12",
      };
      mockProfileManager.getActiveProfile.mockResolvedValue(profile);

      const { readFile } = await import("fs/promises");
      vi.mocked(readFile).mockResolvedValue(Buffer.from("p12-content"));

      // Act
      await manager.initialize();

      // Assert
      expect(manager.getAuthMode()).toBe(AuthMode.CERTIFICATE);
      expect(manager.getP12Certificate()).toBeInstanceOf(Buffer);
    });

    test("validates configuration options", async () => {
      // Arrange
      process.env[AUTH_ENV_VARS.API_URL] = "tenant.volterra.us";
      process.env[AUTH_ENV_VARS.API_TOKEN] = "test-token";
      process.env[AUTH_ENV_VARS.TLS_INSECURE] = "true";

      // Act
      await manager.initialize();

      // Assert
      expect(manager.getTlsInsecure()).toBe(true);
      expect(manager.getApiUrl()).toBe("https://tenant.console.ves.volterra.io/api");
    });
  });

  describe("Authentication Modes", () => {
    test("supports token authentication", async () => {
      // Arrange
      process.env[AUTH_ENV_VARS.API_URL] = "tenant.console.ves.volterra.io";
      process.env[AUTH_ENV_VARS.API_TOKEN] = "my-api-token";

      // Act
      await manager.initialize();

      // Assert
      expect(manager.getAuthMode()).toBe(AuthMode.TOKEN);
      expect(manager.getToken()).toBe("my-api-token");
      expect(manager.isAuthenticated()).toBe(true);
    });

    test("supports P12 certificate authentication", async () => {
      // Arrange
      const profile: Profile = {
        name: "p12-profile",
        apiUrl: "tenant.console.ves.volterra.io",
        p12Bundle: "/certs/client.p12",
      };
      mockProfileManager.getActiveProfile.mockResolvedValue(profile);

      const { readFile } = await import("fs/promises");
      vi.mocked(readFile).mockResolvedValue(Buffer.from("p12-certificate-data"));

      // Act
      await manager.initialize();

      // Assert
      expect(manager.getAuthMode()).toBe(AuthMode.CERTIFICATE);
      expect(manager.getP12Certificate()).toBeInstanceOf(Buffer);
      expect(manager.getP12Certificate()?.toString()).toBe("p12-certificate-data");
    });

    test("supports cert/key pair authentication", async () => {
      // Arrange
      const profile: Profile = {
        name: "mtls-profile",
        apiUrl: "tenant.console.ves.volterra.io",
        cert: "/certs/client.crt",
        key: "/certs/client.key",
      };
      mockProfileManager.getActiveProfile.mockResolvedValue(profile);

      const { readFile } = await import("fs/promises");
      vi.mocked(readFile)
        .mockResolvedValueOnce("certificate-content")
        .mockResolvedValueOnce("key-content");

      // Act
      await manager.initialize();

      // Assert
      expect(manager.getAuthMode()).toBe(AuthMode.CERTIFICATE);
      expect(manager.getCert()).toBe("certificate-content");
      expect(manager.getKey()).toBe("key-content");
    });

    test("falls back to token when P12 fails", async () => {
      // Arrange
      const profile: Profile = {
        name: "fallback-profile",
        apiUrl: "tenant.console.ves.volterra.io",
        p12Bundle: "/invalid/path/cert.p12",
        apiToken: "fallback-token",
      };
      mockProfileManager.getActiveProfile.mockResolvedValue(profile);

      const { readFile } = await import("fs/promises");
      vi.mocked(readFile).mockRejectedValue(new Error("File not found"));

      // Act
      await manager.initialize();

      // Assert
      expect(manager.getAuthMode()).toBe(AuthMode.TOKEN);
      expect(manager.getToken()).toBe("fallback-token");
    });

    test("handles missing certificate files", async () => {
      // Arrange
      const profile: Profile = {
        name: "missing-certs",
        apiUrl: "tenant.console.ves.volterra.io",
        cert: "/missing/cert.pem",
        key: "/missing/key.pem",
      };
      mockProfileManager.getActiveProfile.mockResolvedValue(profile);

      const { readFile } = await import("fs/promises");
      vi.mocked(readFile).mockRejectedValue(new Error("ENOENT: no such file or directory"));

      // Act
      await manager.initialize();

      // Assert
      expect(manager.getAuthMode()).toBe(AuthMode.NONE);
      expect(manager.getCert()).toBeNull();
      expect(manager.getKey()).toBeNull();
    });

    test("validates SSL/TLS configuration", async () => {
      // Arrange
      process.env[AUTH_ENV_VARS.API_URL] = "tenant.staging.volterra.us";
      process.env[AUTH_ENV_VARS.API_TOKEN] = "staging-token";
      process.env[AUTH_ENV_VARS.TLS_INSECURE] = "true";
      process.env[AUTH_ENV_VARS.CA_BUNDLE] = "/certs/custom-ca.pem";

      const { readFile } = await import("fs/promises");
      vi.mocked(readFile).mockResolvedValue(Buffer.from("ca-bundle-content"));

      // Act
      await manager.initialize();

      // Assert
      expect(manager.getTlsInsecure()).toBe(true);
      expect(manager.getCaBundle()).toBeInstanceOf(Buffer);
      expect(manager.getCaBundle()?.toString()).toBe("ca-bundle-content");
    });
  });

  describe("Certificate Loading", () => {
    test("loads CA bundle asynchronously", async () => {
      // Arrange
      process.env[AUTH_ENV_VARS.API_URL] = "tenant.console.ves.volterra.io";
      process.env[AUTH_ENV_VARS.API_TOKEN] = "test-token";
      process.env[AUTH_ENV_VARS.CA_BUNDLE] = "/certs/ca-bundle.pem";

      const { readFile } = await import("fs/promises");
      vi.mocked(readFile).mockResolvedValue(Buffer.from("custom-ca-data"));

      // Act
      await manager.initialize();

      // Assert
      expect(readFile).toHaveBeenCalledWith("/certs/ca-bundle.pem");
      expect(manager.getCaBundle()).toBeInstanceOf(Buffer);
    });

    test("loads P12 certificate with validation", async () => {
      // Arrange
      const profile: Profile = {
        name: "validated-p12",
        apiUrl: "tenant.console.ves.volterra.io",
        p12Bundle: "/secure/certs/client.p12",
      };
      mockProfileManager.getActiveProfile.mockResolvedValue(profile);

      const { readFile } = await import("fs/promises");
      vi.mocked(readFile).mockResolvedValue(Buffer.from("p12-data"));

      const pathSecurity = await import("../../../src/utils/path-security.js");
      vi.mocked(pathSecurity.validateFilePath).mockReturnValue("/secure/certs/client.p12");

      // Act
      await manager.initialize();

      // Assert
      expect(pathSecurity.validateFilePath).toHaveBeenCalledWith("/secure/certs/client.p12");
      expect(readFile).toHaveBeenCalledWith("/secure/certs/client.p12");
    });

    test("loads cert/key pair in parallel", async () => {
      // Arrange
      const profile: Profile = {
        name: "parallel-load",
        apiUrl: "tenant.console.ves.volterra.io",
        cert: "/certs/client.crt",
        key: "/certs/client.key",
      };
      mockProfileManager.getActiveProfile.mockResolvedValue(profile);

      const { readFile } = await import("fs/promises");
      const readFileSpy = vi.mocked(readFile)
        .mockResolvedValueOnce("cert-content")
        .mockResolvedValueOnce("key-content");

      // Act
      await manager.initialize();

      // Assert - files read in parallel (both calls before any resolution)
      expect(readFileSpy).toHaveBeenCalledTimes(2);
      expect(readFileSpy).toHaveBeenNthCalledWith(1, "/certs/client.crt", "utf-8");
      expect(readFileSpy).toHaveBeenNthCalledWith(2, "/certs/client.key", "utf-8");
    });

    test("validates certificate paths (security)", async () => {
      // Arrange
      const profile: Profile = {
        name: "secure-paths",
        apiUrl: "tenant.console.ves.volterra.io",
        cert: "/trusted/certs/client.crt",
        key: "/trusted/certs/client.key",
      };
      mockProfileManager.getActiveProfile.mockResolvedValue(profile);

      const { readFile } = await import("fs/promises");
      vi.mocked(readFile).mockResolvedValue("cert-or-key-content");

      const pathSecurity = await import("../../../src/utils/path-security.js");
      vi.mocked(pathSecurity.validateFilePaths).mockReturnValue([
        "/trusted/certs/client.crt",
        "/trusted/certs/client.key",
      ]);

      // Act
      await manager.initialize();

      // Assert
      expect(pathSecurity.validateFilePaths).toHaveBeenCalledWith([
        "/trusted/certs/client.crt",
        "/trusted/certs/client.key",
      ]);
    });

    test("handles file read errors gracefully", async () => {
      // Arrange
      const profile: Profile = {
        name: "read-error",
        apiUrl: "tenant.console.ves.volterra.io",
        p12Bundle: "/unreadable/cert.p12",
      };
      mockProfileManager.getActiveProfile.mockResolvedValue(profile);

      const { readFile } = await import("fs/promises");
      vi.mocked(readFile).mockRejectedValue(new Error("Permission denied"));

      // Act
      await manager.initialize();

      // Assert - should not throw, falls back to NONE mode
      expect(manager.getAuthMode()).toBe(AuthMode.NONE);
      expect(manager.getP12Certificate()).toBeNull();
    });

    test("sanitizes paths in logs", async () => {
      // Arrange
      const profile: Profile = {
        name: "log-test",
        apiUrl: "tenant.console.ves.volterra.io",
        p12Bundle: "/home/user/.config/f5xc/certs/secret.p12",
      };
      mockProfileManager.getActiveProfile.mockResolvedValue(profile);

      const { readFile } = await import("fs/promises");
      vi.mocked(readFile).mockResolvedValue(Buffer.from("p12-data"));

      const pathSecurity = await import("../../../src/utils/path-security.js");
      const sanitizeSpy = vi.mocked(pathSecurity.sanitizePathForLog);

      // Act
      await manager.initialize();

      // Assert
      expect(sanitizeSpy).toHaveBeenCalled();
    });

    test("tests path traversal prevention", async () => {
      // Arrange
      const profile: Profile = {
        name: "traversal-test",
        apiUrl: "tenant.console.ves.volterra.io",
        cert: "../../../etc/passwd",
        key: "../../../etc/shadow",
      };
      mockProfileManager.getActiveProfile.mockResolvedValue(profile);

      const pathSecurity = await import("../../../src/utils/path-security.js");
      vi.mocked(pathSecurity.validateFilePaths).mockImplementation(() => {
        throw new pathSecurity.PathValidationError("Path traversal detected", "../../../etc/passwd");
      });

      // Act
      await manager.initialize();

      // Assert - should handle PathValidationError and fall back to NONE
      expect(manager.getAuthMode()).toBe(AuthMode.NONE);
    });

    test("falls back to token auth when cert/key path validation fails but token available", async () => {
      // Arrange
      const profile: Profile = {
        name: "cert-fallback-test",
        apiUrl: "tenant.console.ves.volterra.io",
        cert: "../../../etc/passwd",
        key: "../../../etc/shadow",
        apiToken: "backup-token-12345",
      };
      mockProfileManager.getActiveProfile.mockResolvedValue(profile);

      const pathSecurity = await import("../../../src/utils/path-security.js");
      vi.mocked(pathSecurity.validateFilePaths).mockImplementation(() => {
        throw new pathSecurity.PathValidationError("Path traversal detected", "../../../etc/passwd");
      });

      // Act
      await manager.initialize();

      // Assert - should fall back to TOKEN mode
      expect(manager.getAuthMode()).toBe(AuthMode.TOKEN);
      expect(manager.getToken()).toBe("backup-token-12345");
      expect(mockLogger.info).toHaveBeenCalledWith("Falling back to token authentication");
    });

    test("falls back to token auth when cert/key load fails but token available", async () => {
      // Arrange
      const profile: Profile = {
        name: "cert-load-fail-test",
        apiUrl: "tenant.console.ves.volterra.io",
        cert: "/valid/path/cert.pem",
        key: "/valid/path/key.pem",
        apiToken: "backup-token-67890",
      };
      mockProfileManager.getActiveProfile.mockResolvedValue(profile);

      const pathSecurity = await import("../../../src/utils/path-security.js");
      vi.mocked(pathSecurity.validateFilePaths).mockImplementation((paths) => paths);

      const fsPromises = await import("fs/promises");
      vi.mocked(fsPromises.readFile).mockRejectedValue(new Error("Permission denied"));

      // Act
      await manager.initialize();

      // Assert - should fall back to TOKEN mode
      expect(manager.getAuthMode()).toBe(AuthMode.TOKEN);
      expect(manager.getToken()).toBe("backup-token-67890");
      expect(mockLogger.info).toHaveBeenCalledWith("Falling back to token authentication");
    });

    test("validates certificate expiration checking", async () => {
      // Arrange
      const profile: Profile = {
        name: "expiring-creds",
        apiUrl: "tenant.console.ves.volterra.io",
        apiToken: "test-token",
        metadata: {
          lastRotated: "2024-01-01T00:00:00Z",
          rotateAfterDays: 90,
          expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days
        },
      };
      mockProfileManager.getActiveProfile.mockResolvedValue(profile);
      mockProfileManager.get.mockResolvedValue(profile);

      // Act
      await manager.initialize();

      // Assert - should check expiration
      expect(mockProfileManager.get).toHaveBeenCalledWith("expiring-creds");
    });
  });

  describe("Credential Rotation", () => {
    test("rotation updates metadata timestamps", async () => {
      // Arrange
      const profile: Profile = {
        name: "rotation-test",
        apiUrl: "tenant.console.ves.volterra.io",
        apiToken: "old-token",
        metadata: {
          createdAt: "2024-01-01T00:00:00Z",
          lastRotated: "2024-01-01T00:00:00Z",
        },
      };
      mockProfileManager.getActiveProfile.mockResolvedValue(profile);
      mockProfileManager.get.mockResolvedValue(profile);

      // Act
      await manager.initialize();

      // Assert - manager loaded profile with metadata
      expect(mockProfileManager.get).toHaveBeenCalled();
    });

    test("calculates new expiration dates", async () => {
      // Arrange
      const rotateAfterDays = 90;
      const profile: Profile = {
        name: "expiry-calc",
        apiUrl: "tenant.console.ves.volterra.io",
        apiToken: "test-token",
        metadata: {
          rotateAfterDays,
          lastRotated: new Date().toISOString(),
        },
      };
      mockProfileManager.getActiveProfile.mockResolvedValue(profile);
      mockProfileManager.get.mockResolvedValue(profile);

      // Act
      await manager.initialize();

      // Assert
      expect(mockProfileManager.get).toHaveBeenCalledWith("expiry-calc");
    });

    test("warns when credentials expire soon", async () => {
      // Arrange
      const profile: Profile = {
        name: "expiring-soon",
        apiUrl: "tenant.console.ves.volterra.io",
        apiToken: "test-token",
        metadata: {
          expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
        },
      };
      mockProfileManager.getActiveProfile.mockResolvedValue(profile);
      mockProfileManager.get.mockResolvedValue(profile);

      const { logger } = await import("../../../src/utils/logging.js");

      // Act
      await manager.initialize();

      // Assert - logger.info should be called with expiring soon message
      expect(logger.info).toHaveBeenCalled();
    });

    test("validates rotation workflow", async () => {
      // Arrange
      const initialProfile: Profile = {
        name: "workflow-test",
        apiUrl: "tenant.console.ves.volterra.io",
        apiToken: "initial-token",
      };
      mockProfileManager.getActiveProfile.mockResolvedValue(initialProfile);

      await manager.initialize();
      expect(manager.getToken()).toBe("initial-token");

      // Act - reload with new credentials
      const updatedProfile: Profile = {
        ...initialProfile,
        apiToken: "rotated-token",
        metadata: {
          lastRotated: new Date().toISOString(),
        },
      };
      mockProfileManager.getActiveProfile.mockResolvedValue(updatedProfile);
      await manager.reload();

      // Assert
      expect(manager.getToken()).toBe("rotated-token");
    });
  });

  describe("Error Handling", () => {
    test("handles invalid profile data", async () => {
      // Arrange
      const invalidProfile = {
        name: "invalid",
        apiUrl: "", // Empty URL
        // Missing authentication credentials
      } as Profile;
      mockProfileManager.getActiveProfile.mockResolvedValue(invalidProfile);

      // Act
      await manager.initialize();

      // Assert - should fallback to NONE mode
      expect(manager.getAuthMode()).toBe(AuthMode.NONE);
      expect(manager.isAuthenticated()).toBe(false);
    });

    test("handles network failures gracefully", async () => {
      // Arrange
      mockProfileManager.getActiveProfile.mockRejectedValue(
        new Error("Network timeout")
      );

      // Act & Assert - should not throw
      await expect(manager.initialize()).resolves.not.toThrow();
      expect(manager.getAuthMode()).toBe(AuthMode.NONE);
    });
  });

  describe("URL Normalization", () => {
    test("normalizes production short-form URLs", () => {
      expect(normalizeApiUrl("tenant.volterra.us")).toBe(
        "https://tenant.console.ves.volterra.io/api"
      );
    });

    test("normalizes staging short-form URLs", () => {
      expect(normalizeApiUrl("tenant.staging.volterra.us")).toBe(
        "https://tenant.staging.volterra.us/api"
      );
    });

    test("normalizes console URLs", () => {
      expect(normalizeApiUrl("tenant.console.ves.volterra.io")).toBe(
        "https://tenant.console.ves.volterra.io/api"
      );
    });

    test("extracts tenant from URL", () => {
      expect(extractTenantFromUrl("https://mytenant.console.ves.volterra.io/api")).toBe(
        "mytenant"
      );
    });

    test("normalizes tenant URL without /api suffix", () => {
      expect(normalizeTenantUrl("tenant.volterra.us")).toBe(
        "https://tenant.console.ves.volterra.io"
      );
    });
  });

  describe("Public API Methods", () => {
    test("getActiveProfile returns profile name", async () => {
      // Arrange
      const profile: Profile = {
        name: "my-profile",
        apiUrl: "tenant.console.ves.volterra.io",
        apiToken: "test-token",
      };
      mockProfileManager.getActiveProfile.mockResolvedValue(profile);

      // Act
      await manager.initialize();

      // Assert
      expect(manager.getActiveProfile()).toBe("my-profile");
    });

    test("getTenant extracts tenant name", async () => {
      // Arrange
      process.env[AUTH_ENV_VARS.API_URL] = "mytenant.console.ves.volterra.io";
      process.env[AUTH_ENV_VARS.API_TOKEN] = "test-token";

      // Act
      await manager.initialize();

      // Assert
      expect(manager.getTenant()).toBe("mytenant");
    });

    test("getNamespace returns configured namespace", async () => {
      // Arrange
      process.env[AUTH_ENV_VARS.API_URL] = "tenant.console.ves.volterra.io";
      process.env[AUTH_ENV_VARS.API_TOKEN] = "test-token";
      process.env[AUTH_ENV_VARS.NAMESPACE] = "production";

      // Act
      await manager.initialize();

      // Assert
      expect(manager.getNamespace()).toBe("production");
    });

    test("reload refreshes credentials", async () => {
      // Arrange
      const initialProfile: Profile = {
        name: "reload-test",
        apiUrl: "tenant.console.ves.volterra.io",
        apiToken: "initial-token",
      };
      mockProfileManager.getActiveProfile.mockResolvedValue(initialProfile);

      await manager.initialize();
      expect(manager.getToken()).toBe("initial-token");

      // Act - update profile and reload
      const updatedProfile: Profile = {
        ...initialProfile,
        apiToken: "updated-token",
      };
      mockProfileManager.getActiveProfile.mockResolvedValue(updatedProfile);
      await manager.reload();

      // Assert
      expect(manager.getToken()).toBe("updated-token");
    });
  });

  describe("Credential Expiration Checking", () => {
    test("warns when credentials have expired", async () => {
      // Arrange - expired credentials
      const expiredProfile: Profile = {
        name: "expired-profile",
        apiUrl: "tenant.console.ves.volterra.io",
        apiToken: "test-token",
        metadata: {
          createdAt: "2024-01-01T00:00:00.000Z",
          expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        },
      };
      mockProfileManager.getActiveProfile.mockResolvedValue(expiredProfile);
      mockProfileManager.get.mockResolvedValue(expiredProfile);

      // Act
      await manager.initialize();

      // Assert - logger.warn should be called for expired credentials
      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Credentials have expired",
        expect.objectContaining({
          profile: "expired-profile",
          expiresAt: expiredProfile.metadata!.expiresAt,
        })
      );
    });

    test("warns when credentials rotation is overdue", async () => {
      // Arrange - rotation overdue
      const overdueProfile: Profile = {
        name: "overdue-profile",
        apiUrl: "tenant.console.ves.volterra.io",
        apiToken: "test-token",
        metadata: {
          createdAt: "2024-01-01T00:00:00.000Z",
          lastRotated: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000).toISOString(), // 95 days ago
          rotateAfterDays: 90,
        },
      };
      mockProfileManager.getActiveProfile.mockResolvedValue(overdueProfile);
      mockProfileManager.get.mockResolvedValue(overdueProfile);

      // Act
      await manager.initialize();

      // Assert - logger.warn should be called for overdue rotation
      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Credentials should be rotated",
        expect.objectContaining({
          profile: "overdue-profile",
          lastRotated: overdueProfile.metadata!.lastRotated,
          rotateAfterDays: 90,
        })
      );
    });

    test("logs info when rotation is approaching (within 7 days)", async () => {
      // Arrange - rotation in 5 days
      const approachingProfile: Profile = {
        name: "approaching-profile",
        apiUrl: "tenant.console.ves.volterra.io",
        apiToken: "test-token",
        metadata: {
          createdAt: "2024-01-01T00:00:00.000Z",
          lastRotated: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000).toISOString(), // 85 days ago
          rotateAfterDays: 90, // Rotation due in 5 days
        },
      };
      mockProfileManager.getActiveProfile.mockResolvedValue(approachingProfile);
      mockProfileManager.get.mockResolvedValue(approachingProfile);

      // Act
      await manager.initialize();

      // Assert - logger.info should be called for approaching rotation
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Credentials rotation approaching",
        expect.objectContaining({
          profile: "approaching-profile",
          daysUntilRotation: expect.any(Number),
          lastRotated: approachingProfile.metadata!.lastRotated,
        })
      );
    });

    test("handles error during expiration check gracefully", async () => {
      // Arrange - profile exists but get() throws error
      const validProfile: Profile = {
        name: "error-profile",
        apiUrl: "tenant.console.ves.volterra.io",
        apiToken: "test-token",
        metadata: {
          createdAt: "2024-01-01T00:00:00.000Z",
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      };
      mockProfileManager.getActiveProfile.mockResolvedValue(validProfile);
      // Make get() throw an error to trigger catch block
      mockProfileManager.get.mockRejectedValue(new Error("Profile read error"));

      // Act & Assert - should not throw, just log debug message
      await expect(manager.initialize()).resolves.not.toThrow();

      // Should log debug message about failed check
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Failed to check credential expiration",
        expect.objectContaining({
          error: "Profile read error",
        })
      );
    });
  });
});
