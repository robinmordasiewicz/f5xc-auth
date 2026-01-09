/**
 * URL Normalization Unit Tests
 *
 * Tests for normalizeApiUrl(), normalizeTenantUrl(), and extractTenantFromUrl()
 */

import { describe, it, expect } from "vitest";
import {
  normalizeApiUrl,
  normalizeTenantUrl,
  extractTenantFromUrl,
} from "../credential-manager.js";

describe("normalizeApiUrl", () => {
  describe("protocol handling", () => {
    it("should add https:// when missing", () => {
      expect(normalizeApiUrl("tenant.console.ves.volterra.io")).toBe(
        "https://tenant.console.ves.volterra.io/api"
      );
    });

    it("should preserve existing https://", () => {
      expect(normalizeApiUrl("https://tenant.console.ves.volterra.io")).toBe(
        "https://tenant.console.ves.volterra.io/api"
      );
    });

    it("should preserve http:// for localhost", () => {
      expect(normalizeApiUrl("http://localhost:8080")).toBe(
        "http://localhost:8080/api"
      );
    });

    it("should add https:// to staging URL without protocol", () => {
      expect(normalizeApiUrl("nferreira.staging.volterra.us")).toBe(
        "https://nferreira.staging.volterra.us/api"
      );
    });
  });

  describe("staging URLs", () => {
    it("should handle staging.volterra.us with protocol", () => {
      expect(normalizeApiUrl("https://nferreira.staging.volterra.us")).toBe(
        "https://nferreira.staging.volterra.us/api"
      );
    });

    it("should handle staging.volterra.us without protocol", () => {
      expect(normalizeApiUrl("nferreira.staging.volterra.us")).toBe(
        "https://nferreira.staging.volterra.us/api"
      );
    });

    it("should handle staging with /api suffix", () => {
      expect(normalizeApiUrl("nferreira.staging.volterra.us/api")).toBe(
        "https://nferreira.staging.volterra.us/api"
      );
    });

    it("should handle staging with https:// and /api suffix", () => {
      expect(normalizeApiUrl("https://nferreira.staging.volterra.us/api")).toBe(
        "https://nferreira.staging.volterra.us/api"
      );
    });
  });

  describe("console URLs", () => {
    it("should handle console.ves.volterra.io without protocol", () => {
      expect(normalizeApiUrl("f5-amer-ent.console.ves.volterra.io")).toBe(
        "https://f5-amer-ent.console.ves.volterra.io/api"
      );
    });

    it("should handle console.ves.volterra.io with protocol", () => {
      expect(normalizeApiUrl("https://f5-amer-ent.console.ves.volterra.io")).toBe(
        "https://f5-amer-ent.console.ves.volterra.io/api"
      );
    });

    it("should handle console URL with /api suffix", () => {
      expect(
        normalizeApiUrl("https://f5-amer-ent.console.ves.volterra.io/api")
      ).toBe("https://f5-amer-ent.console.ves.volterra.io/api");
    });

    it("should handle console URL without protocol but with /api suffix", () => {
      expect(normalizeApiUrl("f5-amer-ent.console.ves.volterra.io/api")).toBe(
        "https://f5-amer-ent.console.ves.volterra.io/api"
      );
    });

    it("should handle staging console URLs", () => {
      expect(
        normalizeApiUrl("tenant.staging.console.ves.volterra.io")
      ).toBe("https://tenant.staging.console.ves.volterra.io/api");
    });
  });

  describe("production short-form URLs", () => {
    it("should convert tenant.volterra.us to console.ves with protocol", () => {
      expect(normalizeApiUrl("https://tenant.volterra.us")).toBe(
        "https://tenant.console.ves.volterra.io/api"
      );
    });

    it("should convert tenant.volterra.us to console.ves without protocol", () => {
      expect(normalizeApiUrl("tenant.volterra.us")).toBe(
        "https://tenant.console.ves.volterra.io/api"
      );
    });
  });

  describe("edge cases", () => {
    it("should trim leading whitespace", () => {
      expect(normalizeApiUrl("  tenant.console.ves.volterra.io")).toBe(
        "https://tenant.console.ves.volterra.io/api"
      );
    });

    it("should trim trailing whitespace", () => {
      expect(normalizeApiUrl("tenant.console.ves.volterra.io  ")).toBe(
        "https://tenant.console.ves.volterra.io/api"
      );
    });

    it("should trim both leading and trailing whitespace", () => {
      expect(normalizeApiUrl("  tenant.console.ves.volterra.io  ")).toBe(
        "https://tenant.console.ves.volterra.io/api"
      );
    });

    it("should handle empty string", () => {
      expect(normalizeApiUrl("")).toBe("");
    });

    it("should handle whitespace-only string", () => {
      expect(normalizeApiUrl("   ")).toBe("");
    });

    it("should handle trailing slashes", () => {
      expect(normalizeApiUrl("https://tenant.console.ves.volterra.io/")).toBe(
        "https://tenant.console.ves.volterra.io/api"
      );
    });

    it("should handle multiple trailing slashes", () => {
      expect(normalizeApiUrl("https://tenant.console.ves.volterra.io///")).toBe(
        "https://tenant.console.ves.volterra.io/api"
      );
    });

    it("should handle /api/ with trailing slash", () => {
      expect(
        normalizeApiUrl("https://tenant.console.ves.volterra.io/api/")
      ).toBe("https://tenant.console.ves.volterra.io/api");
    });
  });
});

describe("normalizeTenantUrl", () => {
  it("should return URL without /api suffix for console URL", () => {
    expect(normalizeTenantUrl("tenant.console.ves.volterra.io")).toBe(
      "https://tenant.console.ves.volterra.io"
    );
  });

  it("should return URL without /api suffix for staging URL", () => {
    expect(normalizeTenantUrl("nferreira.staging.volterra.us")).toBe(
      "https://nferreira.staging.volterra.us"
    );
  });

  it("should strip /api from URLs that already have it", () => {
    expect(
      normalizeTenantUrl("https://tenant.console.ves.volterra.io/api")
    ).toBe("https://tenant.console.ves.volterra.io");
  });

  it("should handle protocol-less URL with /api suffix", () => {
    expect(normalizeTenantUrl("tenant.console.ves.volterra.io/api")).toBe(
      "https://tenant.console.ves.volterra.io"
    );
  });

  it("should handle empty string", () => {
    expect(normalizeTenantUrl("")).toBe("");
  });

  it("should handle whitespace-only string", () => {
    expect(normalizeTenantUrl("   ")).toBe("");
  });

  it("should trim whitespace and normalize", () => {
    expect(normalizeTenantUrl("  tenant.console.ves.volterra.io  ")).toBe(
      "https://tenant.console.ves.volterra.io"
    );
  });
});

describe("extractTenantFromUrl", () => {
  it("should extract tenant from console URL", () => {
    expect(
      extractTenantFromUrl("https://f5-amer-ent.console.ves.volterra.io/api")
    ).toBe("f5-amer-ent");
  });

  it("should extract tenant from staging URL", () => {
    expect(
      extractTenantFromUrl("https://nferreira.staging.volterra.us/api")
    ).toBe("nferreira");
  });

  it("should extract tenant from URL without /api", () => {
    expect(
      extractTenantFromUrl("https://mycompany.console.ves.volterra.io")
    ).toBe("mycompany");
  });

  it("should return null for malformed URL", () => {
    expect(extractTenantFromUrl("not-a-valid-url")).toBe(null);
  });

  it("should return null for empty string", () => {
    expect(extractTenantFromUrl("")).toBe(null);
  });

  it("should handle tenant with hyphens", () => {
    expect(
      extractTenantFromUrl("https://my-company-name.console.ves.volterra.io/api")
    ).toBe("my-company-name");
  });

  it("should handle tenant with numbers", () => {
    expect(
      extractTenantFromUrl("https://company123.console.ves.volterra.io/api")
    ).toBe("company123");
  });
});
