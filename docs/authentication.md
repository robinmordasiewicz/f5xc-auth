# Authentication

Configure authentication credentials for F5 Distributed Cloud using one of three supported methods.

---

## Authentication Methods

### Method 1: API Token (Recommended)

API tokens are the simplest authentication method and work for most use cases.

**Using Environment Variables:**

```bash
export F5XC_API_URL="https://mytenant.console.ves.volterra.io"
export F5XC_API_TOKEN="your-api-token-here"
export F5XC_NAMESPACE="my-namespace"  # Optional
```

**Using Profile:**

```typescript
import { getProfileManager } from '@robinmordasiewicz/f5xc-auth';

const profileManager = getProfileManager();

await profileManager.save({
  name: 'production',
  apiUrl: 'https://mytenant.console.ves.volterra.io',
  apiToken: 'your-api-token-here',
  defaultNamespace: 'my-namespace'
});

await profileManager.setActive('production');
```

**Profile File Format** (`~/.config/f5xc/profiles/production.json`):

```json
{
  "name": "production",
  "apiUrl": "https://mytenant.console.ves.volterra.io",
  "apiToken": "your-api-token-here",
  "defaultNamespace": "my-namespace"
}
```

### Method 2: P12 Certificate Bundle

P12 certificates provide enhanced security for production environments.

**Using Environment Variables:**

```bash
export F5XC_API_URL="https://mytenant.console.ves.volterra.io"
export F5XC_P12_BUNDLE="/path/to/certificate.p12"
export F5XC_P12_PASSWORD="certificate-password"  # Optional
```

**Using Profile:**

```typescript
await profileManager.save({
  name: 'production-cert',
  apiUrl: 'https://mytenant.console.ves.volterra.io',
  p12Bundle: '/path/to/certificate.p12',
  p12Password: 'certificate-password'  // Optional
});
```

**Profile File Format:**

```json
{
  "name": "production-cert",
  "apiUrl": "https://mytenant.console.ves.volterra.io",
  "p12Bundle": "/path/to/certificate.p12",
  "p12Password": "certificate-password"
}
```

### Method 3: Certificate + Key Pair

Separate certificate and key files for maximum flexibility.

**Using Environment Variables:**

```bash
export F5XC_API_URL="https://mytenant.console.ves.volterra.io"
export F5XC_CERT="/path/to/certificate.pem"
export F5XC_KEY="/path/to/private-key.pem"
```

**Using Profile:**

```typescript
await profileManager.save({
  name: 'production-pem',
  apiUrl: 'https://mytenant.console.ves.volterra.io',
  cert: '/path/to/certificate.pem',
  key: '/path/to/private-key.pem'
});
```

**Profile File Format:**

```json
{
  "name": "production-pem",
  "apiUrl": "https://mytenant.console.ves.volterra.io",
  "cert": "/path/to/certificate.pem",
  "key": "/path/to/private-key.pem"
}
```

---

## URL Normalization

The library automatically normalizes various F5 XC URL formats:

```typescript
// All of these are normalized to the correct API URL:

'mytenant.console.ves.volterra.io'
→ 'https://mytenant.console.ves.volterra.io'

'https://mytenant.console.ves.volterra.io'
→ 'https://mytenant.console.ves.volterra.io'

'mytenant.console.ves.volterra.io/web'
→ 'https://mytenant.console.ves.volterra.io'

'https://mytenant.console.ves.volterra.io/web/workspaces'
→ 'https://mytenant.console.ves.volterra.io'
```

**Example:**

```typescript
const credentialManager = new CredentialManager();
await credentialManager.initialize();

// Works with any format
console.log(credentialManager.getApiUrl());
// Always outputs: https://mytenant.console.ves.volterra.io
```

---

## Security

### File Permissions

Profile files are automatically created with secure permissions:

- **Profile files**: `0o600` (owner read/write only)
- **Config directory**: `0o700` (owner read/write/execute only)

```bash
# Verify permissions
ls -la ~/.config/f5xc/profiles/
# Output: -rw------- 1 user user 234 Jan 12 10:00 production.json
```

### Token Masking

API tokens are automatically masked when displayed:

```typescript
const credentialManager = new CredentialManager();
await credentialManager.initialize();

console.log('Token:', credentialManager.getApiToken());
// Output: Token: ****abc123 (only last 4 characters shown)
```

### TLS Verification

TLS verification is **enabled by default**. Only disable for staging/development:

```bash
# ⚠️ Only use in non-production environments
export F5XC_TLS_INSECURE=true
```

```typescript
// In code (not recommended)
await profileManager.save({
  name: 'staging',
  apiUrl: 'https://staging.internal',
  apiToken: 'token',
  tlsInsecure: true  // ⚠️ Disable TLS verification
});
```

### Custom CA Bundles

For enterprise environments with custom certificate authorities:

```bash
export F5XC_CA_BUNDLE="/path/to/corporate-ca-bundle.pem"
```

```typescript
await profileManager.save({
  name: 'enterprise',
  apiUrl: 'https://mytenant.console.ves.volterra.io',
  apiToken: 'token',
  caBundle: '/path/to/corporate-ca-bundle.pem'
});
```

### Best Practices

1. **Never commit credentials** - Use `.gitignore` to exclude profile files
2. **Use environment variables in CI/CD** - Keep secrets in secure vaults
3. **Rotate tokens regularly** - Update API tokens periodically
4. **Use certificate authentication for production** - More secure than API tokens
5. **Enable TLS verification in production** - Only disable for local development
6. **Restrict file permissions** - Ensure profile files are not world-readable

```bash
# .gitignore example
.config/
*.p12
*.pem
*.key
.env
```

---

## See Also

- [Quick Start Guide](guides/quick-start/) - Get started with basic authentication
- [Profile Management Guide](guides/profile-management/) - Manage multiple profiles
- [Environment Variables](guides/environment-variables/) - Full environment variable reference
- [CredentialManager API](api/credential-manager/) - Complete API documentation
