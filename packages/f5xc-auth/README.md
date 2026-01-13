# @robinmordasiewicz/f5xc-auth

Shared authentication library for F5 Distributed Cloud MCP servers. Provides XDG-compliant profile management and credential handling.

## Installation

```bash
npm install @robinmordasiewicz/f5xc-auth
```

## Features

- **XDG-compliant profile storage** - Profiles stored in `~/.config/f5xc/profiles/`
- **Multiple authentication methods** - API token, P12 certificate, or cert/key pair
- **Environment variable priority** - Override profile settings with environment variables
- **URL normalization** - Handles various F5XC tenant URL formats
- **TLS configuration** - Custom CA bundles and insecure mode for staging

## Usage

### Basic Authentication

```typescript
import { CredentialManager } from '@robinmordasiewicz/f5xc-auth';

const credentialManager = new CredentialManager();
await credentialManager.initialize();

if (credentialManager.isAuthenticated()) {
  console.log(`Authenticated as: ${credentialManager.getTenant()}`);
  console.log(`API URL: ${credentialManager.getApiUrl()}`);
  console.log(`Namespace: ${credentialManager.getNamespace()}`);
}
```

### Profile Management

```typescript
import { getProfileManager } from '@robinmordasiewicz/f5xc-auth';

const profileManager = getProfileManager();

// List all profiles
const profiles = await profileManager.list();

// Get active profile
const active = await profileManager.getActiveProfile();

// Save a new profile
await profileManager.save({
  name: 'production',
  apiUrl: 'https://mytenant.console.ves.volterra.io',
  apiToken: 'my-api-token',
  defaultNamespace: 'my-namespace'
});

// Switch profiles
await profileManager.setActive('production');
```

### HTTP Client

```typescript
import { CredentialManager, createHttpClient } from '@robinmordasiewicz/f5xc-auth';

const credentialManager = new CredentialManager();
await credentialManager.initialize();

const httpClient = createHttpClient(credentialManager, {
  timeout: 30000,
  debug: true
});

if (httpClient.isAvailable()) {
  const response = await httpClient.get('/web/namespaces');
  console.log(response.data);
}
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `F5XC_API_URL` | F5 XC tenant URL |
| `F5XC_API_TOKEN` | API token for authentication |
| `F5XC_P12_BUNDLE` | Path to P12 certificate bundle |
| `F5XC_CERT` | Path to certificate file |
| `F5XC_KEY` | Path to private key file |
| `F5XC_NAMESPACE` | Default namespace |
| `F5XC_TLS_INSECURE` | Disable TLS verification (staging only) |
| `F5XC_CA_BUNDLE` | Path to custom CA bundle |

Environment variables take priority over profile settings.

## Credential Priority

1. **Environment variables** (highest priority)
2. **Active profile** from `~/.config/f5xc/`
3. **Documentation mode** (no credentials - lowest priority)

## Profile Format

Profiles are stored as JSON files in `~/.config/f5xc/profiles/`:

```json
{
  "name": "production",
  "apiUrl": "https://mytenant.console.ves.volterra.io",
  "apiToken": "your-api-token",
  "defaultNamespace": "my-namespace"
}
```

### Authentication Methods

**API Token:**
```json
{
  "name": "token-auth",
  "apiUrl": "https://mytenant.console.ves.volterra.io",
  "apiToken": "your-api-token"
}
```

**P12 Certificate:**
```json
{
  "name": "p12-auth",
  "apiUrl": "https://mytenant.console.ves.volterra.io",
  "p12Bundle": "/path/to/certificate.p12"
}
```

**Cert + Key:**
```json
{
  "name": "cert-auth",
  "apiUrl": "https://mytenant.console.ves.volterra.io",
  "cert": "/path/to/certificate.pem",
  "key": "/path/to/private-key.pem"
}
```

## Security

- Profile files are created with `0o600` permissions (owner read/write only)
- Config directory uses `0o700` permissions
- Tokens are masked when displayed (showing only last 4 characters)
- TLS insecure mode requires explicit opt-in

## License

MIT
