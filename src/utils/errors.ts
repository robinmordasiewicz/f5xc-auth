/**
 * Error classes for f5xc-auth
 *
 * Provides typed error classes for different error scenarios.
 */

/**
 * Base error class for F5XC errors
 */
export class F5XCError extends Error {
  /** Error code for categorization */
  readonly code: string;
  /** Additional error context */
  readonly context?: Record<string, unknown>;

  constructor(message: string, code: string, context?: Record<string, unknown>) {
    super(message);
    this.name = "F5XCError";
    this.code = code;
    this.context = context;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, F5XCError);
    }
  }

  /**
   * Convert error to JSON representation
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
    };
  }
}

/**
 * Authentication-related errors
 */
export class AuthenticationError extends F5XCError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "AUTH_ERROR", context);
    this.name = "AuthenticationError";
  }
}

/**
 * API request/response errors
 */
export class F5XCApiError extends F5XCError {
  /** HTTP status code */
  readonly status?: number;
  /** Raw API response */
  readonly response?: unknown;

  constructor(
    message: string,
    status?: number,
    response?: unknown,
    context?: Record<string, unknown>
  ) {
    super(message, "API_ERROR", context);
    this.name = "F5XCApiError";
    this.status = status;
    this.response = response;
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      status: this.status,
      response: this.response,
    };
  }
}

/**
 * Configuration errors
 */
export class ConfigurationError extends F5XCError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "CONFIG_ERROR", context);
    this.name = "ConfigurationError";
  }
}

/**
 * SSL/TLS certificate validation errors
 */
export class SSLCertificateError extends F5XCError {
  /** The hostname that failed validation */
  readonly hostname?: string;
  /** Certificate details if available */
  readonly certInfo?: {
    subject?: string;
    altNames?: string[];
    issuer?: string;
  };

  constructor(
    message: string,
    hostname?: string,
    certInfo?: SSLCertificateError["certInfo"],
    context?: Record<string, unknown>
  ) {
    super(message, "SSL_CERT_ERROR", context);
    this.name = "SSLCertificateError";
    this.hostname = hostname;
    this.certInfo = certInfo;
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      hostname: this.hostname,
      certInfo: this.certInfo,
    };
  }
}

/**
 * Detect and wrap SSL certificate errors with actionable guidance
 *
 * @param error - Original error to analyze
 * @param apiUrl - Optional API URL for context
 * @returns Wrapped SSLCertificateError with helpful guidance or original error
 */
export function wrapSSLError(error: unknown, apiUrl?: string): Error {
  if (!(error instanceof Error)) {
    return error instanceof Error ? error : new Error(String(error));
  }

  const message = error.message.toLowerCase();
  let hostname: string | undefined;

  try {
    if (apiUrl) {
      hostname = new URL(apiUrl).hostname;
    }
  } catch {
    // Invalid URL, ignore
  }

  // Check for hostname/altname mismatch (the staging certificate issue)
  if (message.includes("altnames") || (message.includes("hostname") && message.includes("match"))) {
    const isStaging = hostname?.includes(".staging.");

    let guidance = `SSL Certificate Error: The server certificate does not cover hostname "${hostname ?? "unknown"}".`;

    if (isStaging) {
      guidance += `

This is a known issue with F5 XC staging environments. The wildcard certificate
*.console.ves.volterra.io does not match multi-level subdomains like
tenant.staging.console.ves.volterra.io.

SOLUTIONS:
1. (Recommended) Set F5XC_CA_BUNDLE=/path/to/custom-ca.crt
2. (Development only) Set F5XC_TLS_INSECURE=true to bypass verification
   WARNING: Never use insecure mode in production!

Example:
  export F5XC_TLS_INSECURE=true`;
    } else {
      guidance += `

SOLUTIONS:
1. Verify the API URL is correct: ${apiUrl ?? "not set"}
2. If using a custom CA, set F5XC_CA_BUNDLE=/path/to/ca-bundle.crt
3. Check if the certificate has expired or is self-signed`;
    }

    return new SSLCertificateError(guidance, hostname, undefined, {
      originalError: error.message,
      apiUrl,
    });
  }

  // Check for self-signed certificates
  if (message.includes("self signed") || message.includes("self-signed")) {
    return new SSLCertificateError(
      `SSL Certificate Error: Self-signed certificate detected.

SOLUTIONS:
1. (Recommended) Add your CA certificate: F5XC_CA_BUNDLE=/path/to/ca.crt
2. (Development only) Set F5XC_TLS_INSECURE=true to bypass verification`,
      hostname,
      undefined,
      { originalError: error.message, apiUrl }
    );
  }

  // Check for expired certificates
  if (message.includes("expired") || message.includes("not yet valid")) {
    return new SSLCertificateError(
      `SSL Certificate Error: Certificate has expired or is not yet valid.

Contact your F5 XC administrator to renew the certificate.`,
      hostname,
      undefined,
      { originalError: error.message, apiUrl }
    );
  }

  // Generic SSL error
  if (
    message.includes("certificate") ||
    message.includes("ssl") ||
    message.includes("tls") ||
    message.includes("unable to verify")
  ) {
    return new SSLCertificateError(
      `SSL/TLS Error: ${error.message}

If this is a staging environment, you may need to:
1. Set F5XC_CA_BUNDLE=/path/to/ca.crt for custom CA
2. Set F5XC_TLS_INSECURE=true to disable verification (development only)`,
      hostname,
      undefined,
      { originalError: error.message, apiUrl }
    );
  }

  // Not an SSL error, return original
  return error;
}
