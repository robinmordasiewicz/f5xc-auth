# Security Best Practices

This guide covers security considerations when using `f5xc-auth`.

## Credential Storage

### Profile Files

Profile files are stored with secure permissions:

- **Profile files**: `0600` (owner read/write only)
- **Config directory**: `0700` (owner access only)

```bash
ls -la ~/.config/f5xc/profiles/
# -rw------- 1 user user 245 Jan 1 12:00 production.json
```

### Never Commit Credentials

Add to your `.gitignore`:

```gitignore
# F5XC credentials
.config/f5xc/
*.p12
*.pem

# Environment files
.env
.env.local
.env.*.local
```

### Use Environment Variables in CI/CD

Never hardcode credentials in scripts or configs:

```yaml
# Good - use secrets
env:
  F5XC_API_TOKEN: ${{ secrets.F5XC_API_TOKEN }}

# Bad - hardcoded
env:
  F5XC_API_TOKEN: "actual-token-value"  # Never do this!
```

## Token Management

### Token Best Practices

1. **Set expiration dates** - Don't use permanent tokens
2. **Rotate regularly** - Regenerate tokens periodically
3. **Use minimal scope** - Request only needed permissions
4. **One token per environment** - Don't share tokens across environments

### Token Rotation

```typescript
import { getProfileManager } from '@robinmordasiewicz/f5xc-auth';

async function rotateToken(profileName: string, newToken: string) {
  const pm = getProfileManager();
  const profile = await pm.get(profileName);

  if (profile) {
    profile.apiToken = newToken;
    await pm.save(profile);
    console.log(`Token rotated for profile: ${profileName}`);
  }
}
```

### Token Masking

The library automatically masks tokens when displaying:

```typescript
const masked = pm.maskProfile(profile);
console.log(masked.apiToken);  // ****abcd (last 4 chars only)
```

## TLS Security

### Custom CA Bundles

For enterprise environments with internal CAs:

```json
{
  "name": "enterprise",
  "apiUrl": "https://internal.tenant.com",
  "apiToken": "...",
  "caBundle": "/etc/pki/tls/certs/enterprise-ca.crt"
}
```

Or via environment:

```bash
export F5XC_CA_BUNDLE="/etc/pki/tls/certs/enterprise-ca.crt"
```

### Insecure Mode Warnings

!!! danger "Never use in production"
    TLS insecure mode disables certificate verification, making connections vulnerable to MITM attacks.

When insecure mode is enabled, the library outputs a warning:

```
⚠️  WARNING: TLS certificate verification is DISABLED
   URL: https://staging.tenant.com
   This should ONLY be used for staging/development environments!
   Consider using F5XC_CA_BUNDLE for a more secure solution.
```

### When to Use Insecure Mode

Only in these specific scenarios:

- Local development with self-signed certificates
- Staging environments with temporary certificates
- Testing and CI pipelines with mock servers

### Better Alternatives

Instead of insecure mode, consider:

1. **Custom CA bundle** - Add your CA to `F5XC_CA_BUNDLE`
2. **System trust store** - Add CA to system certificates
3. **Proper certificates** - Request valid certificates for staging

## Certificate Security

### P12 Certificate Handling

```typescript
// P12 files are read into memory, not stored in profiles
// The path is stored, file is read at runtime
{
  "p12Bundle": "/secure/path/certificate.p12"
}
```

### Certificate File Permissions

Ensure certificate files have restricted permissions:

```bash
chmod 600 /path/to/certificate.p12
chmod 600 /path/to/cert.pem
chmod 600 /path/to/key.pem
```

### Certificate Storage Locations

| Environment | Recommended Location |
|-------------|---------------------|
| Linux | `/etc/ssl/private/` or `~/.ssl/` |
| macOS | `~/Library/Security/` or `~/.ssl/` |
| Container | `/run/secrets/` (Docker secrets) |

## Error Handling

### Don't Expose Credentials in Errors

```typescript
try {
  await client.get('/api/endpoint');
} catch (error) {
  // Good - don't log credentials
  console.error('API request failed:', error.message);

  // Bad - might expose sensitive data
  console.error('Full error:', error);  // Could contain auth headers
}
```

### Secure Logging

```typescript
import { logger } from '@robinmordasiewicz/f5xc-auth';

// The library's logger already masks sensitive data
logger.info('Credentials loaded', {
  mode: cm.getAuthMode(),
  tenant: cm.getTenant(),
  // Token is NOT logged
});
```

## Production Checklist

### Before Deployment

- [ ] No hardcoded credentials in code
- [ ] No credentials in version control
- [ ] TLS insecure mode disabled
- [ ] Token expiration set appropriately
- [ ] Certificate permissions restricted
- [ ] Environment variables use secrets management
- [ ] Custom CA bundle configured (if needed)

### Runtime Security

- [ ] Credentials loaded from secure source
- [ ] Errors don't expose sensitive data
- [ ] Logging doesn't include credentials
- [ ] Token rotation process documented
- [ ] Incident response plan for credential leak

## Secrets Management Integration

### HashiCorp Vault

```typescript
import Vault from 'node-vault';

const vault = Vault({ endpoint: 'https://vault.example.com' });

async function loadFromVault() {
  const secret = await vault.read('secret/data/f5xc');

  process.env.F5XC_API_URL = secret.data.data.api_url;
  process.env.F5XC_API_TOKEN = secret.data.data.api_token;

  // Now initialize f5xc-auth
  const cm = new CredentialManager();
  await cm.initialize();
  return cm;
}
```

### AWS Secrets Manager

```typescript
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({ region: 'us-east-1' });

async function loadFromAWS() {
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: 'f5xc/credentials' })
  );

  const secret = JSON.parse(response.SecretString!);

  process.env.F5XC_API_URL = secret.api_url;
  process.env.F5XC_API_TOKEN = secret.api_token;

  const cm = new CredentialManager();
  await cm.initialize();
  return cm;
}
```

### Kubernetes Secrets

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: f5xc-credentials
  annotations:
    # For external secrets operator
    external-secrets.io/refresh-interval: "1h"
type: Opaque
stringData:
  F5XC_API_URL: "https://tenant.console.ves.volterra.io"
  F5XC_API_TOKEN: "your-api-token"
```

## Incident Response

### If Credentials Are Leaked

1. **Immediately rotate** - Generate new token in F5 XC Console
2. **Update all references** - Update profiles and environment variables
3. **Audit access** - Review F5 XC audit logs for unauthorized access
4. **Identify source** - Determine how leak occurred
5. **Prevent recurrence** - Implement controls to prevent future leaks

### Audit Logging

Monitor F5 XC audit logs for:

- Unusual API access patterns
- Access from unexpected IP addresses
- Failed authentication attempts
- High-frequency API calls
