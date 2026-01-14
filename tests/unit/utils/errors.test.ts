// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

import { describe, test, expect, vi } from "vitest";
import {
  F5XCError,
  AuthenticationError,
  F5XCApiError,
  ConfigurationError,
  SSLCertificateError,
  wrapSSLError,
} from "../../../src/utils/errors.js";

describe("F5XCError", () => {
  describe("Base Error Class", () => {
    test("creates error with message and code", () => {
      const error = new F5XCError("Test error", "TEST_ERROR");

      expect(error.message).toBe("Test error");
      expect(error.code).toBe("TEST_ERROR");
      expect(error.name).toBe("F5XCError");
    });

    test("creates error with context", () => {
      const context = { userId: 123, action: "login" };
      const error = new F5XCError("Test error", "TEST_ERROR", context);

      expect(error.context).toEqual(context);
    });

    test("captures stack trace", () => {
      const error = new F5XCError("Test error", "TEST_ERROR");

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("F5XCError");
    });

    test("toJSON() serializes error correctly", () => {
      const context = { detail: "test" };
      const error = new F5XCError("Test message", "TEST_CODE", context);

      const json = error.toJSON();

      expect(json).toEqual({
        name: "F5XCError",
        message: "Test message",
        code: "TEST_CODE",
        context,
      });
    });

    test("is instance of Error", () => {
      const error = new F5XCError("Test error", "TEST_ERROR");

      expect(error instanceof Error).toBe(true);
      expect(error instanceof F5XCError).toBe(true);
    });
  });
});

describe("AuthenticationError", () => {
  test("creates authentication error with proper code", () => {
    const error = new AuthenticationError("Invalid credentials");

    expect(error.message).toBe("Invalid credentials");
    expect(error.code).toBe("AUTH_ERROR");
    expect(error.name).toBe("AuthenticationError");
  });

  test("includes context when provided", () => {
    const context = { attemptedUsername: "user@example.com" };
    const error = new AuthenticationError("Login failed", context);

    expect(error.context).toEqual(context);
  });

  test("inherits from F5XCError", () => {
    const error = new AuthenticationError("Test");

    expect(error instanceof F5XCError).toBe(true);
    expect(error instanceof Error).toBe(true);
  });
});

describe("F5XCApiError", () => {
  test("creates API error with status code", () => {
    const error = new F5XCApiError("Request failed", 500);

    expect(error.message).toBe("Request failed");
    expect(error.code).toBe("API_ERROR");
    expect(error.name).toBe("F5XCApiError");
    expect(error.status).toBe(500);
  });

  test("includes response data", () => {
    const response = { error: "Internal server error" };
    const error = new F5XCApiError("Request failed", 500, response);

    expect(error.response).toEqual(response);
  });

  test("toJSON() includes status and response", () => {
    const response = { message: "Not found" };
    const context = { url: "/api/test" };
    const error = new F5XCApiError("Request failed", 404, response, context);

    const json = error.toJSON();

    expect(json).toEqual({
      name: "F5XCApiError",
      message: "Request failed",
      code: "API_ERROR",
      context,
      status: 404,
      response,
    });
  });

  test("handles undefined status and response", () => {
    const error = new F5XCApiError("Network error");

    expect(error.status).toBeUndefined();
    expect(error.response).toBeUndefined();
  });
});

describe("ConfigurationError", () => {
  test("creates configuration error with proper code", () => {
    const error = new ConfigurationError("Invalid config");

    expect(error.message).toBe("Invalid config");
    expect(error.code).toBe("CONFIG_ERROR");
    expect(error.name).toBe("ConfigurationError");
  });

  test("includes context when provided", () => {
    const context = { configFile: ".env", missingKey: "API_KEY" };
    const error = new ConfigurationError("Missing API key", context);

    expect(error.context).toEqual(context);
  });
});

describe("SSLCertificateError", () => {
  test("creates SSL error with hostname", () => {
    const error = new SSLCertificateError("Certificate mismatch", "tenant.example.com");

    expect(error.message).toBe("Certificate mismatch");
    expect(error.code).toBe("SSL_CERT_ERROR");
    expect(error.name).toBe("SSLCertificateError");
    expect(error.hostname).toBe("tenant.example.com");
  });

  test("includes certificate info", () => {
    const certInfo = {
      subject: "CN=example.com",
      altNames: ["example.com", "*.example.com"],
      issuer: "CN=Let's Encrypt",
    };
    const error = new SSLCertificateError("Invalid cert", "example.com", certInfo);

    expect(error.certInfo).toEqual(certInfo);
  });

  test("toJSON() includes hostname and certInfo", () => {
    const certInfo = { subject: "CN=test.com" };
    const context = { connectionAttempts: 3 };
    const error = new SSLCertificateError("SSL error", "test.com", certInfo, context);

    const json = error.toJSON();

    expect(json).toEqual({
      name: "SSLCertificateError",
      message: "SSL error",
      code: "SSL_CERT_ERROR",
      context,
      hostname: "test.com",
      certInfo,
    });
  });
});

describe("wrapSSLError", () => {
  describe("Hostname Mismatch Detection", () => {
    test("detects hostname/altnames mismatch", () => {
      const originalError = new Error(
        "Hostname/IP does not match certificate's altnames"
      );
      const apiUrl = "https://tenant.console.ves.volterra.io/api";

      const wrapped = wrapSSLError(originalError, apiUrl);

      expect(wrapped instanceof SSLCertificateError).toBe(true);
      expect(wrapped.message).toContain("SSL Certificate Error");
      expect(wrapped.message).toContain("tenant.console.ves.volterra.io");
    });

    test("provides staging-specific guidance for staging URLs", () => {
      const originalError = new Error("Hostname does not match certificate");
      const apiUrl = "https://tenant.staging.console.ves.volterra.io/api";

      const wrapped = wrapSSLError(originalError, apiUrl) as SSLCertificateError;

      expect(wrapped.message).toContain("staging environments");
      expect(wrapped.message).toContain("F5XC_CA_BUNDLE");
      expect(wrapped.message).toContain("F5XC_TLS_INSECURE");
      expect(wrapped.hostname).toBe("tenant.staging.console.ves.volterra.io");
    });

    test("provides generic guidance for non-staging URLs", () => {
      const originalError = new Error("Hostname does not match certificate");
      const apiUrl = "https://tenant.prod.example.com/api";

      const wrapped = wrapSSLError(originalError, apiUrl) as SSLCertificateError;

      expect(wrapped.message).toContain("Verify the API URL is correct");
      expect(wrapped.message).toContain("F5XC_CA_BUNDLE");
      expect(wrapped.message).not.toContain("staging");
    });
  });

  describe("Self-Signed Certificate Detection", () => {
    test("detects self-signed certificate error", () => {
      const originalError = new Error("self signed certificate");
      const apiUrl = "https://example.com/api";

      const wrapped = wrapSSLError(originalError, apiUrl) as SSLCertificateError;

      expect(wrapped instanceof SSLCertificateError).toBe(true);
      expect(wrapped.message).toContain("Self-signed certificate detected");
      expect(wrapped.message).toContain("F5XC_CA_BUNDLE");
    });

    test("detects self-signed with hyphen variant", () => {
      const originalError = new Error("self-signed certificate in chain");
      const apiUrl = "https://example.com/api";

      const wrapped = wrapSSLError(originalError, apiUrl);

      expect(wrapped instanceof SSLCertificateError).toBe(true);
      expect(wrapped.message).toContain("Self-signed");
    });
  });

  describe("Expired Certificate Detection", () => {
    test("detects expired certificate", () => {
      const originalError = new Error("certificate has expired");
      const apiUrl = "https://example.com/api";

      const wrapped = wrapSSLError(originalError, apiUrl) as SSLCertificateError;

      expect(wrapped instanceof SSLCertificateError).toBe(true);
      expect(wrapped.message).toContain("expired or is not yet valid");
      expect(wrapped.message).toContain("F5 XC administrator");
    });

    test("detects not yet valid certificate", () => {
      const originalError = new Error("certificate is not yet valid");
      const apiUrl = "https://example.com/api";

      const wrapped = wrapSSLError(originalError, apiUrl);

      expect(wrapped instanceof SSLCertificateError).toBe(true);
      expect(wrapped.message).toContain("not yet valid");
    });
  });

  describe("Generic SSL Error Detection", () => {
    test("detects generic certificate error", () => {
      const originalError = new Error("certificate verify failed");
      const apiUrl = "https://example.com/api";

      const wrapped = wrapSSLError(originalError, apiUrl);

      expect(wrapped instanceof SSLCertificateError).toBe(true);
      expect(wrapped.message).toContain("SSL/TLS Error");
    });

    test("detects SSL keyword", () => {
      const originalError = new Error("ssl handshake failed");

      const wrapped = wrapSSLError(originalError);

      expect(wrapped instanceof SSLCertificateError).toBe(true);
    });

    test("detects TLS keyword", () => {
      const originalError = new Error("tls connection failed");

      const wrapped = wrapSSLError(originalError);

      expect(wrapped instanceof SSLCertificateError).toBe(true);
    });

    test("detects unable to verify", () => {
      const originalError = new Error("unable to verify the first certificate");

      const wrapped = wrapSSLError(originalError);

      expect(wrapped instanceof SSLCertificateError).toBe(true);
    });
  });

  describe("Non-SSL Error Handling", () => {
    test("returns original error for non-SSL errors", () => {
      const originalError = new Error("Network timeout");

      const wrapped = wrapSSLError(originalError);

      expect(wrapped).toBe(originalError);
      expect(wrapped instanceof SSLCertificateError).toBe(false);
    });

    test("handles non-Error objects", () => {
      const notAnError = "Some string error";

      const wrapped = wrapSSLError(notAnError);

      expect(wrapped instanceof Error).toBe(true);
      expect(wrapped.message).toBe("Some string error");
    });

    test("handles undefined apiUrl", () => {
      const originalError = new Error("Hostname does not match certificate");

      const wrapped = wrapSSLError(originalError) as SSLCertificateError;

      expect(wrapped.hostname).toBeUndefined();
      expect(wrapped.message).toContain("unknown");
    });

    test("handles invalid apiUrl", () => {
      const originalError = new Error("Hostname does not match certificate");
      const invalidUrl = "not-a-valid-url";

      const wrapped = wrapSSLError(originalError, invalidUrl) as SSLCertificateError;

      expect(wrapped.hostname).toBeUndefined();
    });
  });

  describe("Context Preservation", () => {
    test("preserves original error message in context", () => {
      const originalError = new Error("certificate expired");
      const apiUrl = "https://example.com/api";

      const wrapped = wrapSSLError(originalError, apiUrl) as SSLCertificateError;

      expect(wrapped.context?.originalError).toBe("certificate expired");
      expect(wrapped.context?.apiUrl).toBe(apiUrl);
    });

    test("includes apiUrl in context when provided", () => {
      const originalError = new Error("self signed certificate");
      const apiUrl = "https://staging.example.com/api";

      const wrapped = wrapSSLError(originalError, apiUrl) as SSLCertificateError;

      expect(wrapped.context?.apiUrl).toBe(apiUrl);
    });
  });
});
