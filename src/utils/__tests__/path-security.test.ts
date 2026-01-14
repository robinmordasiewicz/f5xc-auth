// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

import { describe, test, expect } from "vitest";
import {
  validateFilePath,
  validateFilePaths,
  sanitizePathForLog,
  PathValidationError,
} from "../path-security.js";

describe("PathValidationError", () => {
  test("creates error with message and path", () => {
    const error = new PathValidationError("Test error", "/test/path");
    expect(error.message).toBe("Test error");
    expect(error.path).toBe("/test/path");
    expect(error.name).toBe("PathValidationError");
    expect(error).toBeInstanceOf(Error);
  });
});

describe("validateFilePath", () => {
  describe("basic validation", () => {
    test("validates valid absolute path", () => {
      const path = "/home/user/.config/f5xc/cert.pem";
      const result = validateFilePath(path);
      expect(result).toBe(path);
    });

    test("converts relative path to absolute", () => {
      const result = validateFilePath("cert.pem");
      expect(result).toContain("cert.pem");
      expect(result.startsWith("/")).toBe(true);
    });

    test("normalizes path without traversal patterns", () => {
      const result = validateFilePath("/home/user/.config/./f5xc/cert.pem");
      expect(result).toBe("/home/user/.config/f5xc/cert.pem");
    });

    test("handles path with multiple slashes", () => {
      const result = validateFilePath("/home///user/.config//f5xc/cert.pem");
      expect(result).toBe("/home/user/.config/f5xc/cert.pem");
    });
  });

  describe("security checks", () => {
    test("blocks directory traversal with ..", () => {
      expect(() => {
        validateFilePath("../../../../etc/passwd");
      }).toThrow(PathValidationError);
    });

    test("blocks directory traversal with ../", () => {
      expect(() => {
        validateFilePath("../../../etc/passwd");
      }).toThrow(PathValidationError);
    });

    test("blocks directory traversal with ..\\ (Windows)", () => {
      expect(() => {
        validateFilePath("..\\..\\..\\windows\\system32\\config\\sam");
      }).toThrow(PathValidationError);
    });

    test("blocks path with null byte", () => {
      expect(() => {
        validateFilePath("/path/to/file\0.pem");
      }).toThrow(PathValidationError);
      expect(() => {
        validateFilePath("/path/to/file\0.pem");
      }).toThrow("Path contains null byte");
    });

    test("throws error for empty string", () => {
      expect(() => {
        validateFilePath("");
      }).toThrow(PathValidationError);
      expect(() => {
        validateFilePath("");
      }).toThrow("Path must be a non-empty string");
    });

    test("throws error for non-string input", () => {
      expect(() => {
        validateFilePath(null as any);
      }).toThrow(PathValidationError);

      expect(() => {
        validateFilePath(undefined as any);
      }).toThrow(PathValidationError);

      expect(() => {
        validateFilePath(123 as any);
      }).toThrow(PathValidationError);
    });
  });

  describe("base directory restriction", () => {
    test("allows path within base directory", () => {
      const baseDir = "/home/user/.config/f5xc";
      const filePath = "/home/user/.config/f5xc/cert.pem";
      const result = validateFilePath(filePath, baseDir);
      expect(result).toBe(filePath);
    });

    test("allows path equal to base directory", () => {
      const baseDir = "/home/user/.config/f5xc";
      const result = validateFilePath(baseDir, baseDir);
      expect(result).toBe(baseDir);
    });

    test("blocks path outside base directory", () => {
      const baseDir = "/home/user/.config/f5xc";
      const filePath = "/etc/passwd";

      expect(() => {
        validateFilePath(filePath, baseDir);
      }).toThrow(PathValidationError);
      expect(() => {
        validateFilePath(filePath, baseDir);
      }).toThrow("outside allowed directory");
    });

    test("blocks path that escapes base directory", () => {
      const baseDir = "/home/user/.config/f5xc";
      const filePath = "/home/user/.config/f5xc/../../.ssh/id_rsa";

      expect(() => {
        validateFilePath(filePath, baseDir);
      }).toThrow(PathValidationError);
    });

    test("handles relative base directory", () => {
      const baseDir = "config/f5xc";
      const filePath = "config/f5xc/cert.pem";
      const result = validateFilePath(filePath, baseDir);
      expect(result).toContain("config/f5xc/cert.pem");
    });
  });

  describe("real-world attack vectors", () => {
    test("blocks classic directory traversal", () => {
      const attacks = [
        "../../../../etc/passwd",
        "../../../etc/shadow",
        "..\\..\\..\\windows\\system32\\config\\sam",
        "/etc/../etc/passwd",
        "/./../etc/passwd",
      ];

      for (const attack of attacks) {
        expect(() => {
          validateFilePath(attack);
        }).toThrow(PathValidationError);
      }
    });

    test("blocks all paths with .. patterns (security policy)", () => {
      // Even if the path normalizes to something safe, we reject all .. patterns
      const pathWithTraversal = "/home/user/../user/.config/cert.pem";
      expect(() => {
        validateFilePath(pathWithTraversal);
      }).toThrow(PathValidationError);
      expect(() => {
        validateFilePath(pathWithTraversal);
      }).toThrow("directory traversal");
    });
  });
});

describe("validateFilePaths", () => {
  test("validates multiple paths", () => {
    const paths = [
      "/home/user/.config/f5xc/cert.pem",
      "/home/user/.config/f5xc/key.pem",
    ];
    const results = validateFilePaths(paths);
    expect(results).toEqual(paths);
  });

  test("returns empty array for empty input", () => {
    const results = validateFilePaths([]);
    expect(results).toEqual([]);
  });

  test("throws on first invalid path", () => {
    const paths = [
      "/home/user/.config/f5xc/cert.pem",
      "../../../../etc/passwd",
      "/home/user/.config/f5xc/key.pem",
    ];

    expect(() => {
      validateFilePaths(paths);
    }).toThrow(PathValidationError);
  });

  test("validates all paths with base directory", () => {
    const baseDir = "/home/user/.config/f5xc";
    const paths = [
      "/home/user/.config/f5xc/cert.pem",
      "/home/user/.config/f5xc/key.pem",
    ];
    const results = validateFilePaths(paths, baseDir);
    expect(results).toEqual(paths);
  });

  test("blocks paths outside base directory", () => {
    const baseDir = "/home/user/.config/f5xc";
    const paths = [
      "/home/user/.config/f5xc/cert.pem",
      "/etc/passwd",
    ];

    expect(() => {
      validateFilePaths(paths, baseDir);
    }).toThrow(PathValidationError);
  });
});

describe("sanitizePathForLog", () => {
  describe("basic sanitization", () => {
    test("returns only filename", () => {
      const path = "/home/user/.ssh/private/client.pem";
      const result = sanitizePathForLog(path);
      expect(result).toBe("client.pem");
    });

    test("includes parent directory when requested", () => {
      const path = "/home/user/.ssh/private/client.pem";
      const result = sanitizePathForLog(path, true);
      expect(result).toBe("private/client.pem");
    });

    test("handles paths with backslashes", () => {
      const path = "C:\\Users\\user\\Documents\\cert.pem";
      const result = sanitizePathForLog(path);
      // On Unix systems, backslashes are not path separators
      // So this returns the whole string as a filename
      expect(result).toContain("cert.pem");
    });

    test("handles Unix-style parent paths", () => {
      const path = "/home/user/documents/certs/cert.pem";
      const result = sanitizePathForLog(path, true);
      expect(result).toBe("certs/cert.pem");
    });
  });

  describe("edge cases", () => {
    test("returns placeholder for null", () => {
      const result = sanitizePathForLog(null);
      expect(result).toBe("[not set]");
    });

    test("returns placeholder for undefined", () => {
      const result = sanitizePathForLog(undefined);
      expect(result).toBe("[not set]");
    });

    test("returns placeholder for empty string", () => {
      const result = sanitizePathForLog("");
      expect(result).toBe("[not set]");
    });

    test("handles single filename", () => {
      const result = sanitizePathForLog("cert.pem");
      expect(result).toBe("cert.pem");
    });

    test("handles single filename with parent", () => {
      const result = sanitizePathForLog("cert.pem", true);
      expect(result).toBe("cert.pem");
    });

    test("handles root path", () => {
      const result = sanitizePathForLog("/cert.pem");
      expect(result).toBe("cert.pem");
    });
  });

  describe("security aspects", () => {
    test("removes sensitive directory paths", () => {
      const sensitivePaths = [
        { path: "/home/username/.ssh/id_rsa", filename: "id_rsa" },
        { path: "/Users/username/.aws/credentials", filename: "credentials" },
        { path: "/opt/config/api_keys/production.key", filename: "production.key" },
      ];

      for (const { path, filename } of sensitivePaths) {
        const result = sanitizePathForLog(path);
        expect(result).toBe(filename);
        expect(result).not.toContain("username");
        expect(result).not.toContain(".ssh");
        expect(result).not.toContain(".aws");
        expect(result).not.toContain("/");
      }
    });

    test("prevents directory structure disclosure", () => {
      const path = "/var/www/secure/application/config/database.yml";
      const result = sanitizePathForLog(path);
      expect(result).toBe("database.yml");
      expect(result).not.toContain("/var/www");
      expect(result).not.toContain("secure");
      expect(result).not.toContain("application");
    });
  });
});
