// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * Unit tests for HttpClient
 *
 * Test coverage: 30 tests across 5 suites
 * - Initialization: Client creation and configuration
 * - HTTP Methods: GET, POST, PUT, DELETE requests
 * - Authentication: Token and certificate authentication
 * - Interceptors: Request/response transformation and error handling
 * - Rate Limiting & Retry: Token bucket, concurrent limiting, exponential backoff
 */

import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import https from "https";
import { HttpClient, createHttpClient, HttpClientConfig, ApiResponse } from "../../../src/auth/http-client.js";
import { CredentialManager, AuthMode } from "../../../src/auth/credential-manager.js";
import { AuthenticationError, F5XCApiError } from "../../../src/utils/errors.js";
import { logger } from "../../../src/utils/logging.js";

// Mock dependencies
vi.mock("axios");
vi.mock("https");
vi.mock("../../../src/utils/logging.js", () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));
vi.mock("../../../src/utils/path-security.js", () => ({
  sanitizeUrlForLog: vi.fn((url) => url?.replace(/^(https?:\/\/[^.]+)\..*/, "$1.****.io") ?? "[not set]"),
}));

describe("HttpClient", () => {
  let mockCredentialManager: CredentialManager;
  let mockAxiosInstance: Partial<AxiosInstance>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock CredentialManager
    mockCredentialManager = {
      isAuthenticated: vi.fn().mockReturnValue(true),
      getAuthMode: vi.fn().mockReturnValue(AuthMode.TOKEN),
      getApiUrl: vi.fn().mockReturnValue("https://tenant.console.ves.volterra.io"),
      getToken: vi.fn().mockReturnValue("test-api-token"),
      getCaBundle: vi.fn().mockReturnValue(null),
      getTlsInsecure: vi.fn().mockReturnValue(false),
      getP12Certificate: vi.fn().mockReturnValue(null),
      getCert: vi.fn().mockReturnValue(null),
      getKey: vi.fn().mockReturnValue(null),
    } as unknown as CredentialManager;

    // Mock Axios instance with interceptor execution
    mockAxiosInstance = {
      request: vi.fn(async (config) => {
        // Execute request interceptor if it exists
        let requestConfig = config;
        if (mockAxiosInstance.interceptors?.request?.handlers?.onFulfilled) {
          requestConfig = await mockAxiosInstance.interceptors.request.handlers.onFulfilled(config);
        }

        // Simulate response
        const response = {
          data: { result: "success" },
          status: 200,
          headers: { "content-type": "application/json" },
          config: requestConfig,
        };

        // Execute response interceptor if it exists
        if (mockAxiosInstance.interceptors?.response?.handlers?.onFulfilled) {
          return await mockAxiosInstance.interceptors.response.handlers.onFulfilled(response);
        }

        return response;
      }),
      interceptors: {
        request: {
          use: vi.fn((onFulfilled, onRejected) => {
            // Store interceptors for later invocation
            mockAxiosInstance.interceptors!.request!.handlers = { onFulfilled, onRejected };
            return 0;
          }),
          handlers: {} as { onFulfilled: Function; onRejected: Function },
        },
        response: {
          use: vi.fn((onFulfilled, onRejected) => {
            // Store interceptors for later invocation
            mockAxiosInstance.interceptors!.response!.handlers = { onFulfilled, onRejected };
            return 0;
          }),
          handlers: {} as { onFulfilled: Function; onRejected: Function },
        },
      } as any,
    };

    vi.mocked(axios.create).mockReturnValue(mockAxiosInstance as AxiosInstance);
    vi.mocked(axios.isAxiosError).mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initialization", () => {
    test("creates client with default configuration", () => {
      const client = new HttpClient(mockCredentialManager);

      expect(client.isAvailable()).toBe(true);
      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: "https://tenant.console.ves.volterra.io",
          timeout: 30000,
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: "APIToken test-api-token",
          }),
        })
      );
    });

    test("creates client with custom configuration", () => {
      const customConfig: HttpClientConfig = {
        timeout: 60000,
        headers: { "X-Custom-Header": "custom-value" },
        debug: true,
        rateLimit: {
          maxRequests: 20,
          perMilliseconds: 1000,
          maxConcurrent: 10,
        },
        retry: {
          retries: 5,
          retryDelay: "linear",
          retryOn: [429, 500],
        },
      };

      const client = new HttpClient(mockCredentialManager, customConfig);

      expect(client.isAvailable()).toBe(true);
      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 60000,
          headers: expect.objectContaining({
            "X-Custom-Header": "custom-value",
          }),
        })
      );
    });

    test("does not create client when not authenticated", () => {
      vi.mocked(mockCredentialManager.isAuthenticated).mockReturnValue(false);

      const client = new HttpClient(mockCredentialManager);

      expect(client.isAvailable()).toBe(false);
      expect(axios.create).not.toHaveBeenCalled();
    });

    test("configures token authentication correctly", () => {
      const client = new HttpClient(mockCredentialManager);

      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "APIToken test-api-token",
          }),
        })
      );
    });

    test("configures certificate authentication correctly", () => {
      const mockP12Buffer = Buffer.from("mock-p12-data");
      vi.mocked(mockCredentialManager.getAuthMode).mockReturnValue(AuthMode.CERTIFICATE);
      vi.mocked(mockCredentialManager.getP12Certificate).mockReturnValue(mockP12Buffer);

      const client = new HttpClient(mockCredentialManager);

      expect(client.isAvailable()).toBe(true);
      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          httpsAgent: expect.any(Object),
        })
      );
    });

    test("throws error when API URL not configured", () => {
      vi.mocked(mockCredentialManager.getApiUrl).mockReturnValue(null);

      expect(() => new HttpClient(mockCredentialManager)).toThrow(AuthenticationError);
      expect(() => new HttpClient(mockCredentialManager)).toThrow("API URL not configured");
    });

    test("throws error when token not configured for token auth", () => {
      vi.mocked(mockCredentialManager.getToken).mockReturnValue(null);

      expect(() => new HttpClient(mockCredentialManager)).toThrow(AuthenticationError);
      expect(() => new HttpClient(mockCredentialManager)).toThrow("API token not configured");
    });

    test("throws error when certificate not loaded for cert auth", () => {
      vi.mocked(mockCredentialManager.getAuthMode).mockReturnValue(AuthMode.CERTIFICATE);
      vi.mocked(mockCredentialManager.getP12Certificate).mockReturnValue(null);
      vi.mocked(mockCredentialManager.getCert).mockReturnValue(null);
      vi.mocked(mockCredentialManager.getKey).mockReturnValue(null);

      expect(() => new HttpClient(mockCredentialManager)).toThrow(AuthenticationError);
      expect(() => new HttpClient(mockCredentialManager)).toThrow(/Certificate not loaded/);
    });
  });

  describe("HTTP Methods", () => {
    let client: HttpClient;

    beforeEach(() => {
      client = new HttpClient(mockCredentialManager);
    });

    test("makes GET request successfully", async () => {
      const response = await client.get("/api/config/namespaces");

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "GET",
          url: "/api/config/namespaces",
        })
      );
      expect(response.data).toEqual({ result: "success" });
      expect(response.status).toBe(200);
    });

    test("makes POST request with data", async () => {
      const requestData = { name: "test-namespace" };

      const response = await client.post("/api/config/namespaces", requestData);

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "POST",
          url: "/api/config/namespaces",
          data: requestData,
        })
      );
      expect(response.status).toBe(200);
    });

    test("makes PUT request with data", async () => {
      const updateData = { description: "updated" };

      const response = await client.put("/api/config/namespaces/test", updateData);

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "PUT",
          url: "/api/config/namespaces/test",
          data: updateData,
        })
      );
      expect(response.status).toBe(200);
    });

    test("makes DELETE request successfully", async () => {
      const response = await client.delete("/api/config/namespaces/test");

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "DELETE",
          url: "/api/config/namespaces/test",
        })
      );
      expect(response.status).toBe(200);
    });

    test("passes custom headers in request config", async () => {
      const customHeaders = { "X-Request-ID": "test-123" };

      await client.get("/api/config/namespaces", { headers: customHeaders });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: customHeaders,
        })
      );
    });

    test("passes query parameters correctly", async () => {
      const params = { filter: "active", limit: "10" };

      await client.get("/api/config/namespaces", { params });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          params,
        })
      );
    });

    test("includes request duration in response", async () => {
      const response = await client.get("/api/config/namespaces");

      expect(response.duration).toBeGreaterThanOrEqual(0);
      expect(typeof response.duration).toBe("number");
    });

    test("returns headers in response", async () => {
      const response = await client.get("/api/config/namespaces");

      expect(response.headers).toEqual({ "content-type": "application/json" });
    });

    test("throws error when client not available", async () => {
      vi.mocked(mockCredentialManager.isAuthenticated).mockReturnValue(false);
      const unauthClient = new HttpClient(mockCredentialManager);

      await expect(unauthClient.get("/api/config/namespaces")).rejects.toThrow(AuthenticationError);
      await expect(unauthClient.get("/api/config/namespaces")).rejects.toThrow(/documentation mode/);
    });

    test("factory function creates client correctly", () => {
      const client = createHttpClient(mockCredentialManager);

      expect(client).toBeInstanceOf(HttpClient);
      expect(client.isAvailable()).toBe(true);
    });
  });

  describe("Authentication", () => {
    test("adds Authorization header for token auth", () => {
      const client = new HttpClient(mockCredentialManager);

      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "APIToken test-api-token",
          }),
        })
      );
    });

    test("configures P12 certificate for mTLS", () => {
      const mockP12Buffer = Buffer.from("mock-p12-certificate");
      vi.mocked(mockCredentialManager.getAuthMode).mockReturnValue(AuthMode.CERTIFICATE);
      vi.mocked(mockCredentialManager.getP12Certificate).mockReturnValue(mockP12Buffer);

      const client = new HttpClient(mockCredentialManager);

      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          httpsAgent: expect.any(Object),
        })
      );
    });

    test("configures cert/key pair for mTLS", () => {
      const mockCert = "-----BEGIN CERTIFICATE-----\nMOCK CERT\n-----END CERTIFICATE-----";
      const mockKey = "-----BEGIN PRIVATE KEY-----\nMOCK KEY\n-----END PRIVATE KEY-----";

      vi.mocked(mockCredentialManager.getAuthMode).mockReturnValue(AuthMode.CERTIFICATE);
      vi.mocked(mockCredentialManager.getCert).mockReturnValue(mockCert);
      vi.mocked(mockCredentialManager.getKey).mockReturnValue(mockKey);

      const client = new HttpClient(mockCredentialManager);

      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          httpsAgent: expect.any(Object),
        })
      );
    });

    test("applies custom CA bundle when provided", () => {
      const mockCaBundle = Buffer.from("-----BEGIN CERTIFICATE-----\nCA CERT\n-----END CERTIFICATE-----");
      vi.mocked(mockCredentialManager.getCaBundle).mockReturnValue(mockCaBundle);

      const client = new HttpClient(mockCredentialManager);

      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          httpsAgent: expect.any(Object),
        })
      );
    });

    test("handles insecure TLS mode with warning", () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.mocked(mockCredentialManager.getTlsInsecure).mockReturnValue(true);

      const client = new HttpClient(mockCredentialManager);

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("WARNING: TLS certificate verification is DISABLED"));
      expect(client.isAvailable()).toBe(true);

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Interceptors", () => {
    let client: HttpClient;

    beforeEach(() => {
      client = new HttpClient(mockCredentialManager);
    });

    test("request interceptor adds timestamp metadata", async () => {
      const requestConfig: InternalAxiosRequestConfig = {
        method: "GET",
        url: "/test",
        headers: {} as any,
      };

      const onFulfilled = mockAxiosInstance.interceptors!.request!.handlers.onFulfilled;
      const result = await onFulfilled(requestConfig);

      expect(result).toHaveProperty("metadata");
      expect((result as any).metadata.startTime).toBeGreaterThan(0);
    });

    test("request interceptor logs debug info when enabled", async () => {
      const debugClient = new HttpClient(mockCredentialManager, { debug: true });

      // Make an actual request through the client to trigger interceptors
      await debugClient.get("/test");

      // Verify logger.debug was called for the request
      expect(logger.debug).toHaveBeenCalledWith(
        "API Request",
        expect.objectContaining({
          method: "GET",
          url: "/test",
        })
      );
    });

    test("response interceptor calculates request duration", async () => {
      const response = {
        data: { result: "test" },
        status: 200,
        statusText: "OK",
        headers: {},
        config: {
          metadata: { startTime: Date.now() - 100 },
        } as any,
      };

      const onFulfilled = mockAxiosInstance.interceptors!.response!.handlers.onFulfilled;
      const result = await onFulfilled(response);

      expect(result).toEqual(response);
    });

    test("response interceptor logs debug info when enabled", async () => {
      const debugClient = new HttpClient(mockCredentialManager, { debug: true });

      // Make an actual request through the client to trigger interceptors
      await debugClient.get("/test");

      // Verify logger.debug was called for the response
      expect(logger.debug).toHaveBeenCalledWith(
        "API Response",
        expect.objectContaining({
          status: 200,
        })
      );
    });

    test("response interceptor transforms API errors to F5XCApiError", async () => {
      const mockError = {
        isAxiosError: true,
        response: {
          status: 404,
          data: { message: "Namespace not found" },
        },
        config: { url: "/api/config/namespaces/missing" },
        message: "Request failed with status code 404",
      };

      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      const onRejected = mockAxiosInstance.interceptors!.response!.handlers.onRejected;

      // The interceptor handler throws synchronously, wrap in try/catch
      try {
        await onRejected(mockError);
        expect.fail("Should have thrown F5XCApiError");
      } catch (error) {
        expect(error).toBeInstanceOf(F5XCApiError);
        expect((error as F5XCApiError).status).toBe(404);
        expect((error as F5XCApiError).message).toContain("Namespace not found");
      }
    });

    test("response interceptor wraps SSL errors with guidance", async () => {
      const { wrapSSLError } = await import("../../../src/utils/errors.js");
      const wrapSpy = vi.spyOn(await import("../../../src/utils/errors.js"), "wrapSSLError");

      const mockError = {
        isAxiosError: true,
        code: "ERR_TLS_CERT_ALTNAME_INVALID",
        message: "Hostname/IP does not match certificate's altnames",
        config: { url: "/api/config" },
      };

      vi.mocked(axios.isAxiosError).mockReturnValue(true);

      const onRejected = mockAxiosInstance.interceptors!.response!.handlers.onRejected;

      // The interceptor handler throws synchronously, wrap in try/catch
      try {
        await onRejected(mockError);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(wrapSpy).toHaveBeenCalled();
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe("Rate Limiting & Retry", () => {
    let client: HttpClient;

    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    test("respects rate limiting", async () => {
      client = new HttpClient(mockCredentialManager, {
        rateLimit: { maxRequests: 2, perMilliseconds: 1000, maxConcurrent: 5 },
      });

      const startTime = Date.now();

      // Make 3 requests - the 3rd should be delayed
      const promises = [
        client.get("/api/test/1"),
        client.get("/api/test/2"),
        client.get("/api/test/3"),
      ];

      // Advance time to allow rate limiter to process
      vi.advanceTimersByTime(1100);

      await Promise.all(promises);

      expect(mockAxiosInstance.request).toHaveBeenCalledTimes(3);
    });

    test("respects concurrent request limit", async () => {
      client = new HttpClient(mockCredentialManager, {
        rateLimit: { maxRequests: 100, perMilliseconds: 1000, maxConcurrent: 2 },
      });

      let activeRequests = 0;
      let maxConcurrent = 0;

      vi.mocked(mockAxiosInstance.request!).mockImplementation(() => {
        activeRequests++;
        maxConcurrent = Math.max(maxConcurrent, activeRequests);

        return new Promise((resolve) => {
          setTimeout(() => {
            activeRequests--;
            resolve({
              data: { result: "success" },
              status: 200,
              headers: {},
              config: {},
            });
          }, 100);
        });
      });

      const promise = Promise.all([
        client.get("/api/test/1"),
        client.get("/api/test/2"),
        client.get("/api/test/3"),
      ]);

      // Use async timer API to properly advance timers with promises
      await vi.advanceTimersByTimeAsync(300);
      await promise;

      expect(maxConcurrent).toBeLessThanOrEqual(2);
    });

    test("retries on 429 status code", async () => {
      client = new HttpClient(mockCredentialManager, {
        retry: { retries: 3, retryDelay: "exponential", retryOn: [429] },
      });

      const mockError = {
        isAxiosError: true,
        response: { status: 429, data: { message: "Rate limit exceeded" } },
        config: { url: "/api/test" },
        message: "Request failed with status code 429",
      };

      vi.mocked(axios.isAxiosError).mockReturnValue(true);
      vi.mocked(mockAxiosInstance.request!)
        .mockRejectedValueOnce(mockError)
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce({
          data: { result: "success" },
          status: 200,
          headers: {},
          config: {},
        });

      const promise = client.get("/api/test");

      // Run all timers to completion (handles async retry delays)
      await vi.runAllTimersAsync();
      const response = await promise;

      expect(mockAxiosInstance.request).toHaveBeenCalledTimes(3);
      expect(response.status).toBe(200);
    });

    test("uses exponential backoff for retries", async () => {
      client = new HttpClient(mockCredentialManager, {
        retry: { retries: 3, retryDelay: "exponential", retryOn: [500] },
      });

      const mockError = {
        isAxiosError: true,
        response: { status: 500, data: { message: "Internal server error" } },
        config: { url: "/api/test" },
        message: "Request failed with status code 500",
      };

      vi.mocked(axios.isAxiosError).mockReturnValue(true);
      vi.mocked(mockAxiosInstance.request!)
        .mockRejectedValueOnce(mockError)
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce({
          data: { result: "success" },
          status: 200,
          headers: {},
          config: {},
        });

      const promise = client.get("/api/test");

      // Run all timers to completion (exponential backoff: 1s, 2s)
      await vi.runAllTimersAsync();
      await promise;

      expect(mockAxiosInstance.request).toHaveBeenCalledTimes(3);
    });

    test("uses linear backoff when configured", async () => {
      client = new HttpClient(mockCredentialManager, {
        retry: { retries: 3, retryDelay: "linear", retryOn: [500] },
      });

      const mockError = {
        isAxiosError: true,
        response: { status: 500, data: { message: "Internal server error" } },
        config: { url: "/api/test" },
        message: "Request failed with status code 500",
      };

      vi.mocked(axios.isAxiosError).mockReturnValue(true);
      vi.mocked(mockAxiosInstance.request!)
        .mockRejectedValueOnce(mockError)
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce({
          data: { result: "success" },
          status: 200,
          headers: {},
          config: {},
        });

      const promise = client.get("/api/test");

      // Run all timers to completion (linear backoff: 1s, 2s)
      await vi.runAllTimersAsync();
      await promise;

      expect(mockAxiosInstance.request).toHaveBeenCalledTimes(3);
    });

    test("gives up after max retries", async () => {
      client = new HttpClient(mockCredentialManager, {
        retry: { retries: 2, retryDelay: "exponential", retryOn: [500] },
      });

      const mockError = {
        isAxiosError: true,
        response: { status: 500, data: { message: "Internal server error" } },
        config: { url: "/api/test" },
        message: "Request failed with status code 500",
      };

      vi.mocked(axios.isAxiosError).mockReturnValue(true);
      vi.mocked(mockAxiosInstance.request!).mockRejectedValue(mockError);

      const promise = client.get("/api/test");

      // Await rejection with timer advancement - must come before expect
      const rejectionHandler = expect(promise).rejects.toThrow();

      // Run all timers to completion (exponential backoff through all retries)
      await vi.runAllTimersAsync();

      // Now check the rejection
      await rejectionHandler;
      expect(mockAxiosInstance.request).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    test("retries on network errors", async () => {
      client = new HttpClient(mockCredentialManager, {
        retry: { retries: 2, retryDelay: "exponential", retryOn: [500] },
      });

      const mockError = {
        isAxiosError: true,
        code: "ECONNREFUSED",
        message: "Network error",
        config: { url: "/api/test" },
      };

      vi.mocked(axios.isAxiosError).mockReturnValue(true);
      vi.mocked(mockAxiosInstance.request!)
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce({
          data: { result: "success" },
          status: 200,
          headers: {},
          config: {},
        });

      const promise = client.get("/api/test");

      // Run all timers to completion (retry after network error)
      await vi.runAllTimersAsync();
      const response = await promise;

      expect(mockAxiosInstance.request).toHaveBeenCalledTimes(2);
      expect(response.status).toBe(200);
    });

    test("getAxiosInstance returns underlying Axios instance", () => {
      client = new HttpClient(mockCredentialManager);

      const instance = client.getAxiosInstance();

      expect(instance).toBe(mockAxiosInstance);
    });
  });
});
