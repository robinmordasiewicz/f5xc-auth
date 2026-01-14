// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * Path validation utilities to prevent directory traversal attacks
 *
 * @module path-security
 * @since 1.2.0
 * @packageDocumentation
 */

import { resolve, normalize, isAbsolute, basename } from "path";

/**
 * Error thrown when path validation fails
 */
export class PathValidationError extends Error {
  constructor(message: string, public readonly path: string) {
    super(message);
    this.name = "PathValidationError";
  }
}

/**
 * Validates and normalizes a file path to prevent directory traversal attacks.
 *
 * Security checks performed:
 * - Ensures path is a non-empty string
 * - Normalizes path (resolves .., ., removes duplicate slashes)
 * - Resolves to absolute path
 * - Checks for null bytes (common in path traversal attacks)
 * - Optionally restricts to allowed base directory
 * - Detects suspicious patterns (directory traversal attempts)
 *
 * @param filePath - Path to validate
 * @param allowedBaseDir - Optional base directory to restrict access
 * @returns Normalized absolute path
 * @throws {PathValidationError} If path is invalid or outside allowed directory
 *
 * @example
 * ```typescript
 * // Allow any absolute path
 * validateFilePath("/home/user/.config/f5xc/cert.pem")
 * // Returns: "/home/user/.config/f5xc/cert.pem"
 *
 * // Restrict to base directory
 * validateFilePath("cert.pem", "/home/user/.config/f5xc")
 * // Returns: "/home/user/.config/f5xc/cert.pem"
 *
 * // Block directory traversal
 * validateFilePath("../../../../etc/passwd")
 * // Throws: PathValidationError
 * ```
 */
export function validateFilePath(
  filePath: string,
  allowedBaseDir?: string
): string {
  if (!filePath || typeof filePath !== "string") {
    throw new PathValidationError("Path must be a non-empty string", filePath);
  }

  // Normalize path (resolves .., ., removes duplicate slashes)
  const normalizedPath = normalize(filePath);

  // Resolve to absolute path
  const absolutePath = resolve(normalizedPath);

  // Check for null bytes (common in path traversal attacks)
  if (absolutePath.includes("\0")) {
    throw new PathValidationError("Path contains null byte", filePath);
  }

  // If base directory specified, ensure path is within it
  if (allowedBaseDir) {
    const normalizedBase = resolve(normalize(allowedBaseDir));

    if (!absolutePath.startsWith(normalizedBase + "/") && absolutePath !== normalizedBase) {
      throw new PathValidationError(
        `Path "${filePath}" is outside allowed directory "${allowedBaseDir}"`,
        filePath
      );
    }
  }

  // Additional checks for suspicious patterns in original input
  const suspiciousPatterns = [
    { pattern: /\.\.[\/\\]/g, description: "directory traversal (..)"},
  ];

  for (const { pattern, description } of suspiciousPatterns) {
    if (pattern.test(filePath)) {
      throw new PathValidationError(
        `Path contains suspicious pattern: ${description}`,
        filePath
      );
    }
  }

  return absolutePath;
}

/**
 * Validates multiple file paths (useful for cert/key pairs)
 *
 * @param paths - Array of paths to validate
 * @param allowedBaseDir - Optional base directory to restrict access
 * @returns Array of normalized absolute paths
 * @throws {PathValidationError} If any path is invalid
 *
 * @example
 * ```typescript
 * const [certPath, keyPath] = validateFilePaths([
 *   "/home/user/.config/f5xc/cert.pem",
 *   "/home/user/.config/f5xc/key.pem"
 * ]);
 * ```
 */
export function validateFilePaths(
  paths: string[],
  allowedBaseDir?: string
): string[] {
  return paths.map(path => validateFilePath(path, allowedBaseDir));
}

/**
 * Sanitizes a file path for logging by removing directory structure.
 * Only includes filename and optionally parent directory.
 *
 * @param filePath - Full file path
 * @param includeParent - Include parent directory name (default: false)
 * @returns Sanitized path safe for logging
 *
 * @example
 * ```typescript
 * sanitizePathForLog("/home/user/.ssh/private/client.pem")
 * // Returns: "client.pem"
 *
 * sanitizePathForLog("/home/user/.ssh/private/client.pem", true)
 * // Returns: "private/client.pem"
 * ```
 */
export function sanitizePathForLog(
  filePath: string | null | undefined,
  includeParent = false
): string {
  if (!filePath) return "[not set]";

  try {
    if (includeParent) {
      const parts = filePath.split(/[/\\]/);
      if (parts.length >= 2) {
        return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
      }
    }

    return basename(filePath);
  } catch {
    return "[invalid path]";
  }
}

/**
 * Sanitizes API URL for logging by removing sensitive query parameters
 * and masking parts of the hostname.
 *
 * @param url - Full API URL
 * @returns Sanitized URL safe for logging
 *
 * @example
 * ```typescript
 * sanitizeUrlForLog("https://tenant123.console.ves.volterra.io/api/config?token=secret")
 * // Returns: "https://ten***.console.ves.volterra.io/api/config"
 *
 * sanitizeUrlForLog(null)
 * // Returns: "[not set]"
 * ```
 */
export function sanitizeUrlForLog(url: string | null | undefined): string {
  if (!url) return "[not set]";

  try {
    const parsed = new URL(url);

    // Mask middle part of hostname (tenant name)
    const hostParts = parsed.hostname.split(".");
    if (hostParts.length > 0 && hostParts[0].length > 3) {
      hostParts[0] = hostParts[0].substring(0, 3) + "***";
    }

    // Remove query parameters and hash (may contain sensitive data)
    return `${parsed.protocol}//${hostParts.join(".")}${parsed.pathname}`;
  } catch {
    return "[invalid URL]";
  }
}
