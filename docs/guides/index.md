# Guides

Practical guides for using `@robinmordasiewicz/f5xc-auth` in different scenarios.

## Available Guides

<div class="feature-grid" markdown>

<div class="feature-card" markdown>

### [Authentication Methods](authentication.md)

Learn about the different ways to authenticate with F5 Distributed Cloud: API tokens, P12 certificates, and certificate/key pairs.

</div>

<div class="feature-card" markdown>

### [Profile Management](profiles.md)

Manage multiple F5 XC profiles for different tenants and environments. Learn to switch between profiles seamlessly.

</div>

<div class="feature-card" markdown>

### [Environment Variables](environment.md)

Configure authentication through environment variables for CI/CD pipelines and containerized deployments.

</div>

<div class="feature-card" markdown>

### [Security Best Practices](security.md)

Security considerations for credential storage, TLS configuration, and production deployments.

</div>

</div>

## Common Scenarios

### Local Development

For local development, create a profile with your F5 XC credentials:

```typescript
import { getProfileManager } from '@robinmordasiewicz/f5xc-auth';

const pm = getProfileManager();
await pm.save({
  name: 'dev',
  apiUrl: 'https://mytenant.console.ves.volterra.io',
  apiToken: 'your-token'
});
await pm.setActive('dev');
```

### CI/CD Pipelines

Use environment variables in CI/CD pipelines:

```yaml
# GitHub Actions example
env:
  F5XC_API_URL: ${{ secrets.F5XC_API_URL }}
  F5XC_API_TOKEN: ${{ secrets.F5XC_API_TOKEN }}
```

### Multiple Tenants

Switch between different F5 XC tenants:

```typescript
const pm = getProfileManager();

// List available profiles
const profiles = await pm.list();

// Switch to a different tenant
await pm.setActive('production');
```

### Enterprise Environments

For enterprise environments with custom CA certificates:

```typescript
await pm.save({
  name: 'enterprise',
  apiUrl: 'https://internal.tenant.com',
  apiToken: 'your-token',
  caBundle: '/etc/pki/tls/certs/enterprise-ca.crt'
});
```
