# Configuration

This guide covers all configuration options for `f5xc-auth`.

## Profile Location

Profiles are stored in XDG-compliant directories:

| Platform | Location |
|----------|----------|
| Linux | `~/.config/f5xc/profiles/` |
| macOS | `~/.config/f5xc/profiles/` |
| Windows | `%APPDATA%\f5xc\profiles\` |

## Profile Schema

A profile is a JSON file with the following structure:

```json
{
  "name": "production",
  "apiUrl": "https://mytenant.console.ves.volterra.io",
  "apiToken": "your-api-token",
  "defaultNamespace": "my-namespace",
  "tlsInsecure": false,
  "caBundle": "/path/to/ca-bundle.crt"
}
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Unique profile identifier |
| `apiUrl` | string | F5 XC tenant URL |

### Authentication Fields

You must provide one of the following authentication methods:

=== "API Token"

    ```json
    {
      "name": "token-auth",
      "apiUrl": "https://mytenant.console.ves.volterra.io",
      "apiToken": "your-api-token"
    }
    ```

=== "P12 Certificate"

    ```json
    {
      "name": "p12-auth",
      "apiUrl": "https://mytenant.console.ves.volterra.io",
      "p12Bundle": "/path/to/certificate.p12"
    }
    ```

=== "Cert + Key"

    ```json
    {
      "name": "cert-auth",
      "apiUrl": "https://mytenant.console.ves.volterra.io",
      "cert": "/path/to/certificate.pem",
      "key": "/path/to/private-key.pem"
    }
    ```

### Optional Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `defaultNamespace` | string | - | Default namespace for API operations |
| `tlsInsecure` | boolean | `false` | Disable TLS verification (staging only) |
| `caBundle` | string | - | Path to custom CA bundle |

## Environment Variables

Environment variables override profile settings:

| Variable | Description | Example |
|----------|-------------|---------|
| `F5XC_API_URL` | Tenant URL | `https://mytenant.console.ves.volterra.io` |
| `F5XC_API_TOKEN` | API token | `your-api-token` |
| `F5XC_P12_BUNDLE` | P12 certificate path | `/path/to/cert.p12` |
| `F5XC_CERT` | Certificate file path | `/path/to/cert.pem` |
| `F5XC_KEY` | Private key file path | `/path/to/key.pem` |
| `F5XC_NAMESPACE` | Default namespace | `my-namespace` |
| `F5XC_TLS_INSECURE` | Disable TLS verification | `true` |
| `F5XC_CA_BUNDLE` | Custom CA bundle path | `/path/to/ca-bundle.crt` |

### Priority Order

1. **Environment Variables** (highest)
2. **Active Profile**
3. **Documentation Mode** (no credentials)

## URL Normalization

The library automatically normalizes various URL formats:

| Input | Normalized Output |
|-------|-------------------|
| `mytenant` | `https://mytenant.console.ves.volterra.io` |
| `mytenant.console.ves.volterra.io` | `https://mytenant.console.ves.volterra.io` |
| `https://mytenant.console.ves.volterra.io/` | `https://mytenant.console.ves.volterra.io` |

## Security Configuration

### File Permissions

Profile files are created with secure permissions:

- **Profile files**: `0600` (owner read/write only)
- **Config directory**: `0700` (owner access only)

### Token Masking

When displaying credentials, tokens are masked to show only the last 4 characters:

```
Token: ****-****-****-abcd
```

### TLS Configuration

!!! warning "Insecure Mode"
    Only enable `tlsInsecure` for staging/development environments. Never use in production.

For enterprise environments with custom CA certificates:

```json
{
  "name": "enterprise",
  "apiUrl": "https://mytenant.console.ves.volterra.io",
  "apiToken": "your-token",
  "caBundle": "/etc/pki/tls/certs/enterprise-ca.crt"
}
```

## HTTP Client Configuration

The HTTP client accepts additional options:

```typescript
import { createHttpClient } from '@robinmordasiewicz/f5xc-auth';

const httpClient = createHttpClient(credentialManager, {
  timeout: 30000,      // Request timeout in ms
  debug: true,         // Enable debug logging
  retries: 3,          // Number of retry attempts
  retryDelay: 1000     // Delay between retries in ms
});
```

## Next Steps

- [Authentication Methods](../guides/authentication.md) - Detailed auth method guide
- [Profile Management](../guides/profiles.md) - Advanced profile operations
- [API Reference](../api/index.md) - Complete API documentation
