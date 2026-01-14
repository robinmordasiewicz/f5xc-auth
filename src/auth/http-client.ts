// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * Authenticated HTTP Client for F5 Distributed Cloud API
 *
 * Provides a configured Axios client for making authenticated API requests.
 * Supports both API token and P12 certificate (mTLS) authentication.
 */

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import https from "https";
import { CredentialManager, AuthMode } from "./credential-manager.js";
import { logger } from "../utils/logging.js";
import { F5XCApiError, AuthenticationError, wrapSSLError } from "../utils/errors.js";
import { sanitizeUrlForLog } from "../utils/path-security.js";

/**
 * HTTP client configuration options
 */
export interface HttpClientConfig {
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Custom headers to include in all requests */
  headers?: Record<string, string>;
  /** Enable request/response logging */
  debug?: boolean;
  /** Rate limiting configuration */
  rateLimit?: {
    /** Maximum requests per time window */
    maxRequests?: number;
    /** Time window in milliseconds */
    perMilliseconds?: number;
    /** Maximum concurrent requests */
    maxConcurrent?: number;
  };
  /** Retry configuration */
  retry?: {
    /** Number of retry attempts */
    retries?: number;
    /** Retry delay strategy: 'exponential' or 'linear' */
    retryDelay?: "exponential" | "linear";
    /** HTTP status codes to retry on */
    retryOn?: number[];
  };
}

/**
 * Default HTTP client configuration
 */
const DEFAULT_CONFIG: Required<HttpClientConfig> = {
  timeout: 30000, // 30 seconds
  headers: {},
  debug: false,
  rateLimit: {
    maxRequests: 10,
    perMilliseconds: 1000,
    maxConcurrent: 5,
  },
  retry: {
    retries: 3,
    retryDelay: "exponential",
    retryOn: [429, 500, 502, 503, 504],
  },
};

/**
 * API response wrapper with metadata
 */
export interface ApiResponse<T = unknown> {
  /** Response data */
  data: T;
  /** HTTP status code */
  status: number;
  /** Response headers */
  headers: Record<string, string>;
  /** Request duration in milliseconds */
  duration: number;
}

/**
 * Token Bucket Rate Limiter
 * Implements token bucket algorithm for rate limiting requests
 */
class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number;
  private readonly refillRate: number; // tokens per second

  constructor(capacity: number, refillRate: number) {
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  /**
   * Consume tokens and wait if necessary
   * @param tokens Number of tokens to consume (default: 1)
   * @returns Promise that resolves when tokens are available
   */
  async consume(tokens: number = 1): Promise<void> {
    this.refill();

    if (this.tokens < tokens) {
      const waitTime = ((tokens - this.tokens) / this.refillRate) * 1000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.refill();
    }

    this.tokens -= tokens;
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const tokensToAdd = elapsed * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}

/**
 * Concurrent request limiter
 * Limits the number of concurrent requests
 */
class ConcurrentLimiter {
  private active = 0;
  private queue: Array<() => void> = [];

  constructor(private readonly maxConcurrent: number) {}

  /**
   * Acquire a slot for request execution
   * @returns Promise that resolves when slot is available
   */
  async acquire(): Promise<void> {
    if (this.active < this.maxConcurrent) {
      this.active++;
      return;
    }

    return new Promise(resolve => {
      this.queue.push(resolve);
    });
  }

  /**
   * Release a slot after request completion
   */
  release(): void {
    this.active--;
    const next = this.queue.shift();
    if (next) {
      this.active++;
      next();
    }
  }
}

/**
 * HTTP Client for F5XC API
 *
 * Creates and manages an authenticated Axios instance for making
 * API requests to F5 Distributed Cloud.
 */
export class HttpClient {
  private client: AxiosInstance | null = null;
  private credentialManager: CredentialManager;
  private config: Required<HttpClientConfig>;
  private rateLimiter: TokenBucket;
  private concurrentLimiter: ConcurrentLimiter;

  /**
   * Creates an HTTP client for F5 Distributed Cloud API requests.
   *
   * The client automatically:
   * - Injects authentication credentials from the credential manager
   * - Adds required headers (User-Agent, Content-Type)
   * - Configures SSL/TLS settings (including custom CA and insecure mode)
   * - Applies rate limiting (10 req/sec, 5 concurrent by default)
   * - Implements retry logic with exponential backoff (3 retries)
   * - Transforms responses to typed ApiResponse objects
   * - Handles common error scenarios with actionable guidance
   *
   * @param credentialManager - Manages authentication credentials and profiles.
   *   Must be initialized before creating the HTTP client.
   * @param config - Optional HTTP client configuration
   * @param config.timeout - Request timeout in milliseconds (default: 30000)
   * @param config.headers - Additional headers to include in all requests
   * @param config.debug - Enable request/response logging (default: false)
   * @param config.rateLimit - Rate limiting configuration
   * @param config.rateLimit.maxRequests - Maximum requests per time window (default: 10)
   * @param config.rateLimit.perMilliseconds - Time window in milliseconds (default: 1000)
   * @param config.rateLimit.maxConcurrent - Maximum concurrent requests (default: 5)
   * @param config.retry - Retry configuration
   * @param config.retry.retries - Number of retry attempts (default: 3)
   * @param config.retry.retryDelay - Retry delay strategy: 'exponential' or 'linear' (default: 'exponential')
   * @param config.retry.retryOn - HTTP status codes to retry on (default: [429, 500, 502, 503, 504])
   *
   * @example Basic usage
   * ```typescript
   * const cm = new CredentialManager();
   * await cm.initialize();
   *
   * const client = new HttpClient(cm);
   * const response = await client.get("/api/config/namespaces");
   * console.log(response.data);
   * ```
   *
   * @example Custom configuration
   * ```typescript
   * const client = new HttpClient(cm, {
   *   timeout: 60000,
   *   headers: { "X-Custom-Header": "value" },
   *   rateLimit: {
   *     maxRequests: 20,
   *     perMilliseconds: 1000,
   *     maxConcurrent: 10
   *   }
   * });
   * ```
   *
   * @example With request options
   * ```typescript
   * const response = await client.get<Namespace[]>(
   *   "/api/config/namespaces/system/virtual-hosts",
   *   { params: { filter: "active" } }
   * );
   * ```
   *
   * @example Custom retry configuration
   * ```typescript
   * const client = new HttpClient(cm, {
   *   retry: {
   *     retries: 5,
   *     retryDelay: "linear",
   *     retryOn: [429, 500, 503]
   *   }
   * });
   * ```
   *
   * @throws {AuthenticationError} If credentials are invalid or missing when making requests
   * @throws {F5XCApiError} For API request failures (4xx, 5xx status codes)
   * @throws {SSLCertificateError} For SSL/TLS certificate validation failures
   * @throws {NetworkError} For network connectivity issues
   */
  constructor(credentialManager: CredentialManager, config: HttpClientConfig = {}) {
    this.credentialManager = credentialManager;
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      rateLimit: { ...DEFAULT_CONFIG.rateLimit, ...config.rateLimit },
      retry: { ...DEFAULT_CONFIG.retry, ...config.retry },
    };

    // Initialize rate limiters with guaranteed non-undefined values
    const maxRequests = this.config.rateLimit.maxRequests!;
    const perMilliseconds = this.config.rateLimit.perMilliseconds!;
    const maxConcurrent = this.config.rateLimit.maxConcurrent!;

    const refillRate = maxRequests / (perMilliseconds / 1000);
    this.rateLimiter = new TokenBucket(maxRequests, refillRate);
    this.concurrentLimiter = new ConcurrentLimiter(maxConcurrent);

    if (this.credentialManager.isAuthenticated()) {
      this.client = this.createClient();
    }
  }

  /**
   * Build HTTPS agent options from credential manager TLS configuration
   * Handles SSL/TLS configuration including insecure mode and custom CA
   */
  private buildHttpsAgentOptions(): https.AgentOptions {
    const options: https.AgentOptions = {
      rejectUnauthorized: true, // Secure default
    };

    // Check for custom CA bundle
    const caBundle = this.credentialManager.getCaBundle();
    if (caBundle) {
      options.ca = caBundle;
      logger.info("Using custom CA bundle for TLS verification");
    }

    // Check for insecure mode (staging/development ONLY)
    const tlsInsecure = this.credentialManager.getTlsInsecure();
    if (tlsInsecure) {
      options.rejectUnauthorized = false;

      // Output to stderr for maximum visibility (always shown, even if logs are filtered)
      const apiUrl = this.credentialManager.getApiUrl() ?? "unknown";
      console.error("\n\x1b[33m⚠️  WARNING: TLS certificate verification is DISABLED\x1b[0m");
      console.error(`   URL: ${sanitizeUrlForLog(apiUrl)}`);
      console.error("   This should ONLY be used for staging/development environments!");
      console.error("   Consider using F5XC_CA_BUNDLE for a more secure solution.\n");

      logger.warn(
        "TLS certificate verification DISABLED - this is insecure and should only be used for staging/development"
      );
    }

    return options;
  }

  /**
   * Create configured Axios client
   */
  private createClient(): AxiosInstance {
    const authMode = this.credentialManager.getAuthMode();
    const baseURL = this.credentialManager.getApiUrl();

    if (!baseURL) {
      throw new AuthenticationError("API URL not configured");
    }

    const axiosConfig: AxiosRequestConfig = {
      baseURL,
      timeout: this.config.timeout,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...this.config.headers,
      },
    };

    // Get TLS configuration options
    const tlsOptions = this.buildHttpsAgentOptions();

    // Configure authentication
    if (authMode === AuthMode.TOKEN) {
      const token = this.credentialManager.getToken();
      if (!token) {
        throw new AuthenticationError("API token not configured");
      }
      axiosConfig.headers = {
        ...axiosConfig.headers,
        Authorization: `APIToken ${token}`,
      };

      // Apply TLS configuration for token auth (needed for custom CA or insecure mode)
      if (tlsOptions.ca || !tlsOptions.rejectUnauthorized) {
        axiosConfig.httpsAgent = new https.Agent(tlsOptions);
      }
    } else if (authMode === AuthMode.CERTIFICATE) {
      const p12Buffer = this.credentialManager.getP12Certificate();
      const cert = this.credentialManager.getCert();
      const key = this.credentialManager.getKey();

      if (p12Buffer) {
        // Create HTTPS agent with P12 certificate for mTLS
        // F5XC P12 certificates typically don't require a password
        axiosConfig.httpsAgent = new https.Agent({
          ...tlsOptions,
          pfx: p12Buffer,
        });
      } else if (cert && key) {
        // Create HTTPS agent with separate cert/key for mTLS
        axiosConfig.httpsAgent = new https.Agent({
          ...tlsOptions,
          cert,
          key,
        });
      } else {
        throw new AuthenticationError(
          "Certificate not loaded - provide P12 bundle or cert/key pair"
        );
      }
    }

    const client = axios.create(axiosConfig);

    // Add request interceptor for logging
    client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Add request timestamp for duration calculation
        (config as InternalAxiosRequestConfig & { metadata: { startTime: number } }).metadata = {
          startTime: Date.now(),
        };

        if (this.config.debug) {
          logger.debug("API Request", {
            method: config.method?.toUpperCase(),
            url: config.url,
            baseURL: config.baseURL,
          });
        }

        return config;
      },
      (error: unknown) => {
        logger.error("Request interceptor error", { error });
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging and error handling
    client.interceptors.response.use(
      (response: AxiosResponse) => {
        const config = response.config as InternalAxiosRequestConfig & {
          metadata?: { startTime: number };
        };
        const duration = config.metadata ? Date.now() - config.metadata.startTime : 0;

        if (this.config.debug) {
          logger.debug("API Response", {
            status: response.status,
            url: response.config.url,
            duration: `${duration}ms`,
          });
        }

        return response;
      },
      (error: unknown) => {
        if (axios.isAxiosError(error)) {
          // Check for SSL/TLS certificate errors first
          const errorCode = error.code?.toLowerCase() ?? "";
          const errorMessage = error.message.toLowerCase();

          if (
            errorCode === "err_tls_cert_altname_invalid" ||
            errorCode === "unable_to_verify_leaf_signature" ||
            errorCode === "depth_zero_self_signed_cert" ||
            errorCode === "cert_has_expired" ||
            errorMessage.includes("certificate") ||
            errorMessage.includes("altnames") ||
            errorMessage.includes("self signed")
          ) {
            // Wrap SSL error with actionable guidance
            throw wrapSSLError(error, baseURL);
          }

          const status = error.response?.status;
          const message = error.response?.data?.message ?? error.message;

          logger.error("API Error", {
            status,
            message,
            url: sanitizeUrlForLog(error.config?.url),
          });

          // Transform to F5XC API error
          throw new F5XCApiError(message, status, error.response?.data);
        }

        throw error;
      }
    );

    logger.info("HTTP client created", {
      baseURL,
      authMode,
      timeout: this.config.timeout,
    });

    return client;
  }

  /**
   * Check if the client is available (authenticated mode)
   */
  isAvailable(): boolean {
    return this.client !== null;
  }

  /**
   * Make a GET request
   */
  async get<T = unknown>(path: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>("GET", path, undefined, config);
  }

  /**
   * Make a POST request
   */
  async post<T = unknown>(
    path: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>("POST", path, data, config);
  }

  /**
   * Make a PUT request
   */
  async put<T = unknown>(
    path: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>("PUT", path, data, config);
  }

  /**
   * Make a DELETE request
   */
  async delete<T = unknown>(path: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>("DELETE", path, undefined, config);
  }

  /**
   * Make a generic request with rate limiting and retry logic
   */
  private async request<T>(
    method: string,
    path: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    if (!this.client) {
      throw new AuthenticationError(
        "HTTP client not available - server is in documentation mode. " +
          "Set F5XC_API_URL and F5XC_API_TOKEN (or F5XC_P12_BUNDLE for certificate auth) to enable API execution."
      );
    }

    // Apply rate limiting
    await this.rateLimiter.consume(1);

    // Apply concurrent request limiting
    await this.concurrentLimiter.acquire();

    try {
      return await this.executeWithRetry<T>(method, path, data, config);
    } finally {
      this.concurrentLimiter.release();
    }
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry<T>(
    method: string,
    path: string,
    data?: unknown,
    config?: AxiosRequestConfig,
    attempt: number = 0
  ): Promise<ApiResponse<T>> {
    const startTime = Date.now();

    try {
      const response = await this.client!.request<T>({
        method,
        url: path,
        data,
        ...config,
      });

      const duration = Date.now() - startTime;

      return {
        data: response.data,
        status: response.status,
        headers: response.headers as Record<string, string>,
        duration,
      };
    } catch (error) {
      const shouldRetry = this.shouldRetryRequest(error, attempt);

      if (shouldRetry) {
        const delay = this.calculateRetryDelay(attempt);
        logger.debug(`Retrying request after ${delay}ms (attempt ${attempt + 1}/${this.config.retry.retries})`);

        await new Promise(resolve => setTimeout(resolve, delay));
        return this.executeWithRetry<T>(method, path, data, config, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Determine if request should be retried
   */
  private shouldRetryRequest(error: unknown, attempt: number): boolean {
    const retries = this.config.retry.retries!;
    const retryOn = this.config.retry.retryOn!;

    if (attempt >= retries) {
      return false;
    }

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status && retryOn.includes(status)) {
        return true;
      }

      // Retry on network errors
      if (!error.response && error.code !== "ECONNABORTED") {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate retry delay based on strategy
   */
  private calculateRetryDelay(attempt: number): number {
    const baseDelay = 1000; // 1 second
    const retryDelay = this.config.retry.retryDelay!;

    if (retryDelay === "exponential") {
      // Exponential backoff: 1s, 2s, 4s, 8s, etc.
      return baseDelay * Math.pow(2, attempt);
    } else {
      // Linear backoff: 1s, 2s, 3s, 4s, etc.
      return baseDelay * (attempt + 1);
    }
  }

  /**
   * Get the underlying Axios instance
   */
  getAxiosInstance(): AxiosInstance | null {
    return this.client;
  }
}

/**
 * Create HTTP client from credential manager
 */
export function createHttpClient(
  credentialManager: CredentialManager,
  config?: HttpClientConfig
): HttpClient {
  return new HttpClient(credentialManager, config);
}
