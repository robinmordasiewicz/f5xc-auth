# Authentication Methods

This guide covers the different authentication methods supported by `f5xc-auth`.

## Overview

F5 Distributed Cloud supports three authentication methods:

| Method | Use Case | Security Level |
|--------|----------|----------------|
| **API Token** | Most common, easy to manage | High |
| **P12 Certificate** | Legacy, certificate-based | Very High |
| **Cert + Key** | mTLS with separate files | Very High |

## API Token Authentication

API tokens are the most common and recommended authentication method.

### Getting an API Token

1. Log in to your F5 XC Console
2. Navigate to **Administration** > **Personal Management** > **Credentials**
3. Click **Add Credentials**
4. Select **API Token**
5. Set an expiration date and click **Generate**
6. Copy the token immediately (it won't be shown again)

### Using API Tokens

=== "Profile"

    ```json
    {
      "name": "production",
      "apiUrl": "https://mytenant.console.ves.volterra.io",
      "apiToken": "your-api-token-here"
    }
    ```

=== "Environment Variable"

    ```bash
    export F5XC_API_URL="https://mytenant.console.ves.volterra.io"
    export F5XC_API_TOKEN="your-api-token-here"
    ```

=== "Code"

    ```typescript
    import { getProfileManager } from '@robinmordasiewicz/f5xc-auth';

    const pm = getProfileManager();
    await pm.save({
      name: 'my-profile',
      apiUrl: 'https://mytenant.console.ves.volterra.io',
      apiToken: 'your-api-token-here'
    });
    ```

### Token Best Practices

- Set appropriate expiration dates
- Rotate tokens regularly
- Use different tokens for different environments
- Never commit tokens to version control

## P12 Certificate Authentication

P12 (PKCS#12) certificates provide certificate-based mTLS authentication.

### Getting a P12 Certificate

1. Log in to your F5 XC Console
2. Navigate to **Administration** > **Personal Management** > **Credentials**
3. Click **Add Credentials**
4. Select **API Certificate**
5. Download the P12 file and note the password (if any)

### Using P12 Certificates

=== "Profile"

    ```json
    {
      "name": "cert-auth",
      "apiUrl": "https://mytenant.console.ves.volterra.io",
      "p12Bundle": "/path/to/certificate.p12"
    }
    ```

=== "Environment Variable"

    ```bash
    export F5XC_API_URL="https://mytenant.console.ves.volterra.io"
    export F5XC_P12_BUNDLE="/path/to/certificate.p12"
    ```

!!! note "Password Support"
    F5 XC P12 certificates typically don't require a password. If your P12 file has a password, you may need to extract the cert/key separately.

## Certificate + Key Authentication

For mTLS with separate certificate and private key files.

### Extracting from P12

If you have a P12 file, you can extract the certificate and key:

```bash
# Extract certificate
openssl pkcs12 -in certificate.p12 -clcerts -nokeys -out cert.pem

# Extract private key
openssl pkcs12 -in certificate.p12 -nocerts -nodes -out key.pem
```

### Using Cert + Key

=== "Profile"

    ```json
    {
      "name": "mtls-auth",
      "apiUrl": "https://mytenant.console.ves.volterra.io",
      "cert": "/path/to/cert.pem",
      "key": "/path/to/key.pem"
    }
    ```

=== "Environment Variable"

    ```bash
    export F5XC_API_URL="https://mytenant.console.ves.volterra.io"
    export F5XC_CERT="/path/to/cert.pem"
    export F5XC_KEY="/path/to/key.pem"
    ```

## Authentication Priority

When multiple authentication methods are configured, they're used in this order:

1. **API Token** (if both token and certificate are provided)
2. **P12 Certificate**
3. **Cert + Key pair**

## Checking Authentication Status

```typescript
import { CredentialManager, AuthMode } from '@robinmordasiewicz/f5xc-auth';

const cm = new CredentialManager();
await cm.initialize();

console.log('Authenticated:', cm.isAuthenticated());
console.log('Auth Mode:', cm.getAuthMode());

switch (cm.getAuthMode()) {
  case AuthMode.TOKEN:
    console.log('Using API token authentication');
    break;
  case AuthMode.CERTIFICATE:
    console.log('Using certificate authentication');
    break;
  case AuthMode.NONE:
    console.log('No authentication (documentation mode)');
    break;
}
```

## Fallback Behavior

The library supports automatic fallback when a certificate fails to load:

```typescript
// If P12 certificate fails to load but apiToken is also provided,
// the library will fall back to token authentication
{
  "name": "fallback-profile",
  "apiUrl": "https://tenant.console.ves.volterra.io",
  "p12Bundle": "/path/to/certificate.p12",  // Primary
  "apiToken": "backup-token"                  // Fallback
}
```

## Troubleshooting

### Token Authentication Issues

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Invalid or expired token | Regenerate token in F5 XC Console |
| Token not recognized | Wrong format | Ensure token starts with correct prefix |

### Certificate Authentication Issues

| Error | Cause | Solution |
|-------|-------|----------|
| Certificate not found | Wrong path | Verify file path exists |
| Invalid certificate | Corrupt or wrong format | Re-download from F5 XC Console |
| TLS handshake failure | Certificate/key mismatch | Verify cert and key are paired |

### Debug Mode

Enable debug mode to see authentication details:

```typescript
const client = createHttpClient(cm, { debug: true });
```

Or set the environment variable:

```bash
export DEBUG=true
```
