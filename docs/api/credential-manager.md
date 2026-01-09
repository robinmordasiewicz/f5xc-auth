# CredentialManager

The `CredentialManager` class handles authentication credential resolution and state management.

## Import

```typescript
import { CredentialManager, AuthMode } from '@robinmordasiewicz/f5xc-auth';
```

## Constructor

```typescript
const credentialManager = new CredentialManager();
```

Creates a new `CredentialManager` instance. Credentials are not loaded until `initialize()` is called.

## Methods

### initialize()

```typescript
async initialize(): Promise<void>
```

Loads credentials from environment variables or active profile. Must be called before accessing credentials.

**Example:**

```typescript
const cm = new CredentialManager();
await cm.initialize();
```

### isAuthenticated()

```typescript
isAuthenticated(): boolean
```

Returns `true` if valid credentials are loaded.

**Returns:** `boolean`

**Example:**

```typescript
if (cm.isAuthenticated()) {
  // Make API calls
}
```

### getAuthMode()

```typescript
getAuthMode(): AuthMode
```

Returns the current authentication mode.

**Returns:** `AuthMode` - One of:

- `AuthMode.NONE` - No authentication (documentation mode)
- `AuthMode.TOKEN` - API token authentication
- `AuthMode.CERTIFICATE` - Certificate/mTLS authentication

**Example:**

```typescript
const mode = cm.getAuthMode();
if (mode === AuthMode.TOKEN) {
  console.log('Using API token authentication');
}
```

### getApiUrl()

```typescript
getApiUrl(): string | null
```

Returns the normalized API URL with `/api` suffix.

**Returns:** `string | null`

**Example:**

```typescript
const apiUrl = cm.getApiUrl();
// Returns: "https://tenant.console.ves.volterra.io/api"
```

### getTenant()

```typescript
getTenant(): string | null
```

Extracts the tenant name from the API URL.

**Returns:** `string | null`

**Example:**

```typescript
const tenant = cm.getTenant();
// Returns: "tenant"
```

### getNamespace()

```typescript
getNamespace(): string | null
```

Returns the default namespace.

**Returns:** `string | null`

### getToken()

```typescript
getToken(): string | null
```

Returns the API token (for token authentication).

**Returns:** `string | null`

!!! warning "Security"
    Do not log or expose the token in application output.

### getP12Certificate()

```typescript
getP12Certificate(): Buffer | null
```

Returns the P12 certificate buffer (for certificate authentication).

**Returns:** `Buffer | null`

### getCert() / getKey()

```typescript
getCert(): string | null
getKey(): string | null
```

Returns certificate and private key content (for mTLS with separate files).

**Returns:** `string | null`

### getTlsInsecure()

```typescript
getTlsInsecure(): boolean
```

Returns whether TLS certificate verification is disabled.

**Returns:** `boolean`

!!! danger "Warning"
    Only use TLS insecure mode for staging/development environments.

### getCaBundle()

```typescript
getCaBundle(): Buffer | null
```

Returns the custom CA bundle for TLS verification.

**Returns:** `Buffer | null`

### getActiveProfile()

```typescript
getActiveProfile(): string | null
```

Returns the name of the active profile, or `null` if credentials are from environment variables.

**Returns:** `string | null`

### getCredentials()

```typescript
getCredentials(): Readonly<Credentials>
```

Returns a read-only copy of all credentials.

**Returns:** `Readonly<Credentials>`

### reload()

```typescript
async reload(): Promise<void>
```

Reloads credentials from environment/profile. Useful when credentials change during runtime.

**Example:**

```typescript
// After environment changes
await cm.reload();
```

## Credential Priority

Credentials are resolved in this order:

1. **Environment Variables** (highest priority)
2. **Active Profile** from `~/.config/f5xc/`
3. **Documentation Mode** (no credentials - lowest)

## Types

### AuthMode

```typescript
enum AuthMode {
  NONE = "none",
  TOKEN = "token",
  CERTIFICATE = "certificate"
}
```

### Credentials

```typescript
interface Credentials {
  mode: AuthMode;
  apiUrl: string | null;
  token: string | null;
  p12Certificate: Buffer | null;
  cert: string | null;
  key: string | null;
  namespace: string | null;
  tlsInsecure: boolean;
  caBundle: Buffer | null;
}
```

## Complete Example

```typescript
import { CredentialManager, AuthMode } from '@robinmordasiewicz/f5xc-auth';

async function checkAuth() {
  const cm = new CredentialManager();
  await cm.initialize();

  console.log('Authentication Status:');
  console.log(`  Mode: ${cm.getAuthMode()}`);
  console.log(`  Authenticated: ${cm.isAuthenticated()}`);

  if (cm.isAuthenticated()) {
    console.log(`  Tenant: ${cm.getTenant()}`);
    console.log(`  API URL: ${cm.getApiUrl()}`);
    console.log(`  Namespace: ${cm.getNamespace() || 'default'}`);

    const profile = cm.getActiveProfile();
    if (profile) {
      console.log(`  Profile: ${profile}`);
    } else {
      console.log('  Source: Environment variables');
    }
  }
}

checkAuth();
```

## Related

- [ProfileManager](profile-manager.md) - Managing stored profiles
- [HttpClient](http-client.md) - Making authenticated requests
