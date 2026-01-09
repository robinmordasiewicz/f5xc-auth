# API Reference

Complete API documentation for `@robinmordasiewicz/f5xc-auth`.

## Overview

The library exports three main components:

| Component | Description |
|-----------|-------------|
| [CredentialManager](credential-manager.md) | Manages authentication state and credential resolution |
| [ProfileManager](profile-manager.md) | Handles profile CRUD operations and storage |
| [HttpClient](http-client.md) | Pre-configured Axios client with auth headers |

## Quick Reference

### Imports

```typescript
// Main exports
import {
  CredentialManager,
  createHttpClient,
  getProfileManager
} from '@robinmordasiewicz/f5xc-auth';

// Types
import type {
  Profile,
  ProfileConfig,
  ProfileResult,
  Credentials,
  AuthMode,
  HttpClientConfig,
  ApiResponse
} from '@robinmordasiewicz/f5xc-auth';

// Utility functions
import {
  normalizeApiUrl,
  normalizeTenantUrl,
  extractTenantFromUrl
} from '@robinmordasiewicz/f5xc-auth';
```

### Authentication Modes

```typescript
enum AuthMode {
  NONE = "none",           // Documentation mode
  TOKEN = "token",         // API token authentication
  CERTIFICATE = "certificate"  // mTLS authentication
}
```

## Module Structure

```
@robinmordasiewicz/f5xc-auth
├── CredentialManager     # Auth state management
│   ├── initialize()
│   ├── isAuthenticated()
│   ├── getAuthMode()
│   ├── getApiUrl()
│   ├── getTenant()
│   └── ...
├── ProfileManager        # Profile storage
│   ├── list()
│   ├── get()
│   ├── save()
│   ├── delete()
│   ├── setActive()
│   └── ...
├── HttpClient           # API requests
│   ├── get()
│   ├── post()
│   ├── put()
│   ├── delete()
│   └── ...
└── Utilities
    ├── normalizeApiUrl()
    ├── normalizeTenantUrl()
    └── extractTenantFromUrl()
```

## Environment Variables

| Variable | Type | Description |
|----------|------|-------------|
| `F5XC_API_URL` | string | F5 XC tenant URL |
| `F5XC_API_TOKEN` | string | API token |
| `F5XC_P12_BUNDLE` | string | Path to P12 certificate |
| `F5XC_CERT` | string | Path to certificate file |
| `F5XC_KEY` | string | Path to private key file |
| `F5XC_NAMESPACE` | string | Default namespace |
| `F5XC_TLS_INSECURE` | boolean | Disable TLS verification |
| `F5XC_CA_BUNDLE` | string | Path to custom CA bundle |

## Error Types

```typescript
// API request errors
class F5XCApiError extends Error {
  status?: number;
  data?: unknown;
}

// Authentication errors
class AuthenticationError extends Error {}

// SSL/TLS errors (wrapped with guidance)
class SSLError extends Error {}
```

## Next Steps

- [CredentialManager](credential-manager.md) - Full credential management API
- [ProfileManager](profile-manager.md) - Profile storage and switching
- [HttpClient](http-client.md) - Making authenticated API requests
