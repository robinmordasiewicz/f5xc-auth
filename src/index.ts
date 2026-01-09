/**
 * @robinmordasiewicz/f5xc-auth
 *
 * Shared authentication library for F5 Distributed Cloud MCP servers.
 * Provides XDG-compliant profile management and credential handling.
 *
 * @example
 * ```typescript
 * import { CredentialManager, ProfileManager, getProfileManager } from '@robinmordasiewicz/f5xc-auth';
 *
 * // Initialize credentials
 * const credentialManager = new CredentialManager();
 * await credentialManager.initialize();
 *
 * if (credentialManager.isAuthenticated()) {
 *   console.log(`Authenticated as: ${credentialManager.getTenant()}`);
 * }
 *
 * // Manage profiles
 * const profileManager = getProfileManager();
 * const profiles = await profileManager.list();
 * ```
 */

// Auth module
export {
  CredentialManager,
  AuthMode,
  AUTH_ENV_VARS,
  normalizeApiUrl,
  normalizeTenantUrl,
  extractTenantFromUrl,
  type Credentials,
} from "./auth/credential-manager.js";

export {
  HttpClient,
  createHttpClient,
  type HttpClientConfig,
  type ApiResponse,
} from "./auth/http-client.js";

// Profile module
export {
  ProfileManager,
  getProfileManager,
  type Profile,
  type ProfileConfig,
  type ProfileResult,
  type ProfileValidationError,
} from "./profile/index.js";

// Config module
export { paths, getConfigDir, getStateDir } from "./config/paths.js";

// Utils module
export {
  logger,
  createLogger,
  LogLevel,
  type LoggerConfig,
} from "./utils/logging.js";

export {
  F5XCError,
  AuthenticationError,
  F5XCApiError,
  ConfigurationError,
  SSLCertificateError,
  wrapSSLError,
} from "./utils/errors.js";
