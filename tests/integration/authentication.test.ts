// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import axios, { AxiosInstance } from "axios";
import { CredentialManager, AuthMode } from "../../src/auth/credential-manager.js";
import { HttpClient } from "../../src/auth/http-client.js";
import { getProfileManager } from "../../src/profile/index.js";
import type { Profile } from "../../src/profile/types.js";
import MockAdapter from "axios-mock-adapter";

// Mock dependencies
vi.mock("axios");
vi.mock("fs/promises");
vi.mock("../../src/utils/logging.js");
vi.mock("../../src/profile/index.js");
vi.mock("../../src/utils/path-security.js");

describe("Authentication Workflow Integration Tests", () => {
  let credentialManager: CredentialManager;
  let mockAxios: MockAdapter;
  let mockAxiosInstance: AxiosInstance;
  let mockProfileManager: any;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    // Save and clear environment
    originalEnv = { ...process.env };
    delete process.env.F5XC_API_URL;
    delete process.env.F5XC_API_TOKEN;
    delete process.env.F5XC_P12_BUNDLE;
    delete process.env.F5XC_CERT;
    delete process.env.F5XC_KEY;

    // Reset mocks
    vi.clearAllMocks();

    // Get the real axios module before mocking
    const realAxios = await vi.importActual<typeof import("axios")>("axios");

    // Create a real axios instance and wrap it with MockAdapter
    mockAxiosInstance = realAxios.default.create();
    mockAxios = new MockAdapter(mockAxiosInstance);

    // Mock axios.create to apply config and return our mocked instance
    vi.mocked(axios.create).mockImplementation((config) => {
      // Apply the config (especially headers) to our mock instance
      if (config?.headers) {
        mockAxiosInstance.defaults.headers = {
          ...mockAxiosInstance.defaults.headers,
          ...config.headers,
          common: {
            ...(mockAxiosInstance.defaults.headers as any).common,
            ...(config.headers as any).common,
          },
        };
      }
      if (config?.baseURL) {
        mockAxiosInstance.defaults.baseURL = config.baseURL;
      }
      return mockAxiosInstance;
    });

    // Setup profile manager mock
    const profileModule = await import("../../src/profile/index.js");
    mockProfileManager = {
      getActiveProfile: vi.fn().mockResolvedValue(null),
      get: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue({ success: true }),
      setActive: vi.fn().mockResolvedValue({ success: true }),
    };
    vi.mocked(profileModule.getProfileManager).mockReturnValue(mockProfileManager);

    // Setup path security mocks
    const pathSecurity = await import("../../src/utils/path-security.js");
    vi.mocked(pathSecurity.validateFilePath).mockImplementation((path) => path);
    vi.mocked(pathSecurity.validateFilePaths).mockImplementation((paths) => paths);
    vi.mocked(pathSecurity.sanitizePathForLog).mockImplementation((path) =>
      path ? path.split("/").pop() ?? path : "[not set]"
    );

    // Initialize credential manager (HttpClient will be created in each test after initializing)
    credentialManager = new CredentialManager();
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
    mockAxios.reset();
    vi.clearAllMocks();
  });

  describe("Environment Variable Authentication", () => {
    test("complete flow: env vars → credentials → HTTP client → API call", async () => {
      // Arrange - set environment variables
      process.env.F5XC_API_URL = "tenant.console.ves.volterra.io";
      process.env.F5XC_API_TOKEN = "env-token-12345";

      mockAxios.onGet("/api/config/namespaces").reply(200, {
        items: [{ name: "default" }, { name: "system" }],
      });

      // Act - initialize credentials and create HTTP client
      await credentialManager.initialize();
      const httpClient = new HttpClient(credentialManager);
      const response = await httpClient.get("/api/config/namespaces");

      // Assert - verify authentication flow
      expect(credentialManager.getAuthMode()).toBe(AuthMode.TOKEN);
      expect(credentialManager.getToken()).toBe("env-token-12345");
      expect(response.status).toBe(200);
      expect(response.data.items).toHaveLength(2);

      // Verify Authorization header was set
      expect(mockAxios.history.get[0].headers?.Authorization).toBe("APIToken env-token-12345");
    });

    test("error handling: invalid env vars → graceful fallback", async () => {
      // Arrange - no environment variables set
      mockAxios.onGet("/api/config/namespaces").reply(401, {
        error: "Unauthorized",
      });

      // Act - initialize with no credentials
      await credentialManager.initialize();

      // Assert - should have no auth
      expect(credentialManager.getAuthMode()).toBe(AuthMode.NONE);
      expect(credentialManager.isAuthenticated()).toBe(false);

      // Try to create HTTP client - should fail gracefully (no credentials available)
      const httpClient = new HttpClient(credentialManager);
      await expect(httpClient.get("/api/config/namespaces")).rejects.toThrow(
        "HTTP client not available - server is in documentation mode"
      );
    });
  });

  describe("Profile-Based Authentication", () => {
    test("token auth: profile → credentials → HTTP request with Authorization header", async () => {
      // Arrange - profile with token auth
      const profile: Profile = {
        name: "token-profile",
        apiUrl: "tenant.console.ves.volterra.io",
        apiToken: "profile-token-67890",
      };
      mockProfileManager.getActiveProfile.mockResolvedValue(profile);

      mockAxios.onGet("/api/config/namespaces/system").reply(200, {
        name: "system",
        metadata: { uid: "system-123" },
      });

      // Act - initialize and make request
      await credentialManager.initialize();
      const httpClient = new HttpClient(credentialManager);
      const response = await httpClient.get("/api/config/namespaces/system");

      // Assert - verify token authentication
      expect(credentialManager.getAuthMode()).toBe(AuthMode.TOKEN);
      expect(credentialManager.getToken()).toBe("profile-token-67890");
      expect(credentialManager.getActiveProfile()).toBe("token-profile");
      expect(response.status).toBe(200);
      expect(response.data.name).toBe("system");

      // Verify Authorization header
      expect(mockAxios.history.get[0].headers?.Authorization).toBe(
        "APIToken profile-token-67890"
      );
    });

    test("P12 auth: profile → certificate loading → mTLS HTTP request", async () => {
      // Arrange - profile with P12 certificate
      const profile: Profile = {
        name: "p12-profile",
        apiUrl: "tenant.console.ves.volterra.io",
        p12Bundle: "/path/to/cert.p12",
        p12Password: "test-password",
      };
      mockProfileManager.getActiveProfile.mockResolvedValue(profile);

      const fsPromises = await import("fs/promises");
      vi.mocked(fsPromises.readFile).mockResolvedValue(Buffer.from("mock-p12-data"));

      mockAxios.onGet("/api/config/namespaces").reply(200, {
        items: [{ name: "default" }],
      });

      // Act - initialize and make request
      await credentialManager.initialize();
      const httpClient = new HttpClient(credentialManager);
      const response = await httpClient.get("/api/config/namespaces");

      // Assert - verify certificate authentication
      expect(credentialManager.getAuthMode()).toBe(AuthMode.CERTIFICATE);
      expect(credentialManager.getActiveProfile()).toBe("p12-profile");
      expect(response.status).toBe(200);

      // Verify certificate was loaded (password is not stored, only used during load)
      const credentials = credentialManager.getCredentials();
      expect(credentials.p12Certificate).toBeDefined();
      expect(credentials.p12Certificate).toEqual(Buffer.from("mock-p12-data"));
    });

    test("cert/key auth: profile → certificate pair → mTLS HTTP request", async () => {
      // Arrange - profile with cert/key pair
      const profile: Profile = {
        name: "certkey-profile",
        apiUrl: "tenant.console.ves.volterra.io",
        cert: "/path/to/cert.pem",
        key: "/path/to/key.pem",
      };
      mockProfileManager.getActiveProfile.mockResolvedValue(profile);

      const fsPromises = await import("fs/promises");
      vi.mocked(fsPromises.readFile)
        .mockResolvedValueOnce("-----BEGIN CERTIFICATE-----\nmock-cert\n-----END CERTIFICATE-----")
        .mockResolvedValueOnce("-----BEGIN PRIVATE KEY-----\nmock-key\n-----END PRIVATE KEY-----");

      mockAxios.onGet("/api/config/namespaces").reply(200, {
        items: [{ name: "default" }],
      });

      // Act - initialize and make request
      await credentialManager.initialize();
      const httpClient = new HttpClient(credentialManager);
      const response = await httpClient.get("/api/config/namespaces");

      // Assert - verify certificate authentication
      expect(credentialManager.getAuthMode()).toBe(AuthMode.CERTIFICATE);
      expect(credentialManager.getActiveProfile()).toBe("certkey-profile");
      expect(response.status).toBe(200);

      // Verify certificates were loaded
      const credentials = credentialManager.getCredentials();
      expect(credentials.cert).toBeDefined();
      expect(credentials.key).toBeDefined();
      expect(credentials.cert).toContain("BEGIN CERTIFICATE");
      expect(credentials.key).toContain("BEGIN PRIVATE KEY");
    });
  });

  describe("Profile Switching", () => {
    test("switch profiles → credentials reload → new auth headers applied", async () => {
      // Arrange - start with first profile
      const profile1: Profile = {
        name: "profile-one",
        apiUrl: "tenant1.console.ves.volterra.io",
        apiToken: "token-one",
      };
      const profile2: Profile = {
        name: "profile-two",
        apiUrl: "tenant2.console.ves.volterra.io",
        apiToken: "token-two",
      };

      mockProfileManager.getActiveProfile.mockResolvedValueOnce(profile1);
      mockAxios.onGet("/api/config/namespaces").reply(200, { items: [] });

      // Act - initialize with first profile
      await credentialManager.initialize();
      const httpClient = new HttpClient(credentialManager);
      await httpClient.get("/api/config/namespaces");

      // Assert first profile
      expect(credentialManager.getToken()).toBe("token-one");
      expect(mockAxios.history.get[0].headers?.Authorization).toBe("APIToken token-one");

      // Switch to second profile
      mockProfileManager.getActiveProfile.mockResolvedValueOnce(profile2);
      mockProfileManager.get.mockResolvedValue(profile2);
      await credentialManager.reload();
      const httpClient2 = new HttpClient(credentialManager);
      await httpClient2.get("/api/config/namespaces");

      // Assert second profile
      expect(credentialManager.getToken()).toBe("token-two");
      expect(mockAxios.history.get[1].headers?.Authorization).toBe("APIToken token-two");
    });

    test("active profile deleted → fallback to env vars", async () => {
      // Arrange - start with profile, then delete it
      const profile: Profile = {
        name: "temp-profile",
        apiUrl: "tenant.console.ves.volterra.io",
        apiToken: "profile-token",
      };
      mockProfileManager.getActiveProfile.mockResolvedValueOnce(profile);
      mockAxios.onGet("/api/config/namespaces").reply(200, { items: [] });

      // Act - initialize with profile
      await credentialManager.initialize();
      const httpClient = new HttpClient(credentialManager);

      // Make first request with profile token
      await httpClient.get("/api/config/namespaces");
      expect(credentialManager.getToken()).toBe("profile-token");
      expect(mockAxios.history.get[0].headers?.Authorization).toBe("APIToken profile-token");

      // Delete active profile (simulate)
      mockProfileManager.getActiveProfile.mockResolvedValueOnce(null);
      process.env.F5XC_API_URL = "tenant.console.ves.volterra.io";
      process.env.F5XC_API_TOKEN = "env-fallback-token";

      // Reload credentials
      await credentialManager.reload();
      const httpClient2 = new HttpClient(credentialManager);
      await httpClient2.get("/api/config/namespaces");

      // Assert - should fall back to environment variable
      expect(credentialManager.getToken()).toBe("env-fallback-token");
      expect(mockAxios.history.get[1].headers?.Authorization).toBe(
        "APIToken env-fallback-token"
      );
    });
  });

  describe("Credential Refresh", () => {
    test("reload refreshes credentials and updates HTTP client", async () => {
      // Arrange - initial profile
      const initialProfile: Profile = {
        name: "refresh-profile",
        apiUrl: "tenant.console.ves.volterra.io",
        apiToken: "old-token",
      };
      mockProfileManager.getActiveProfile.mockResolvedValue(initialProfile);
      mockAxios.onGet("/api/config/namespaces").reply(200, { items: [] });

      // Act - initialize and make request with old token
      await credentialManager.initialize();
      const httpClient = new HttpClient(credentialManager);
      await httpClient.get("/api/config/namespaces");
      expect(mockAxios.history.get[0].headers?.Authorization).toBe("APIToken old-token");

      // Update profile with new token
      const updatedProfile: Profile = {
        ...initialProfile,
        apiToken: "new-refreshed-token",
      };
      mockProfileManager.getActiveProfile.mockResolvedValue(updatedProfile);
      mockProfileManager.get.mockResolvedValue(updatedProfile);

      // Reload credentials
      await credentialManager.reload();
      const httpClient2 = new HttpClient(credentialManager);
      await httpClient2.get("/api/config/namespaces");

      // Assert - should use new token
      expect(credentialManager.getToken()).toBe("new-refreshed-token");
      expect(mockAxios.history.get[1].headers?.Authorization).toBe(
        "APIToken new-refreshed-token"
      );
    });
  });
});
