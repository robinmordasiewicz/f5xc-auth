# Quick Start

This guide walks you through basic usage of `f5xc-auth` to authenticate with F5 Distributed Cloud.

## Basic Authentication

The simplest way to authenticate is using the `CredentialManager`:

```typescript
import { CredentialManager } from '@robinmordasiewicz/f5xc-auth';

async function main() {
  const credentialManager = new CredentialManager();
  await credentialManager.initialize();

  if (credentialManager.isAuthenticated()) {
    console.log(`Tenant: ${credentialManager.getTenant()}`);
    console.log(`API URL: ${credentialManager.getApiUrl()}`);
    console.log(`Namespace: ${credentialManager.getNamespace()}`);
  } else {
    console.log('Not authenticated');
  }
}

main();
```

## Create Your First Profile

Profiles store your F5 XC credentials. Create one using the `ProfileManager`:

```typescript
import { getProfileManager } from '@robinmordasiewicz/f5xc-auth';

async function createProfile() {
  const profileManager = getProfileManager();

  await profileManager.save({
    name: 'my-tenant',
    apiUrl: 'https://mytenant.console.ves.volterra.io',
    apiToken: 'your-api-token-here',
    defaultNamespace: 'default'
  });

  // Set as active profile
  await profileManager.setActive('my-tenant');

  console.log('Profile created and activated!');
}

createProfile();
```

## Make API Requests

Use the HTTP client to make authenticated requests:

```typescript
import { CredentialManager, createHttpClient } from '@robinmordasiewicz/f5xc-auth';

async function fetchNamespaces() {
  const credentialManager = new CredentialManager();
  await credentialManager.initialize();

  const httpClient = createHttpClient(credentialManager);

  if (httpClient.isAvailable()) {
    const response = await httpClient.get('/web/namespaces');
    console.log('Namespaces:', response.data);
  }
}

fetchNamespaces();
```

## Using Environment Variables

You can authenticate using environment variables instead of profiles:

```bash
export F5XC_API_URL="https://mytenant.console.ves.volterra.io"
export F5XC_API_TOKEN="your-api-token"
export F5XC_NAMESPACE="default"
```

Then in your code:

```typescript
import { CredentialManager } from '@robinmordasiewicz/f5xc-auth';

const credentialManager = new CredentialManager();
await credentialManager.initialize();

// Credentials are automatically loaded from environment
console.log(credentialManager.isAuthenticated()); // true
```

## Complete Example

Here's a complete example that checks authentication and makes a request:

```typescript
import {
  CredentialManager,
  createHttpClient,
  getProfileManager
} from '@robinmordasiewicz/f5xc-auth';

async function main() {
  // Initialize credential manager
  const credentialManager = new CredentialManager();
  await credentialManager.initialize();

  // Check authentication status
  if (!credentialManager.isAuthenticated()) {
    console.log('No credentials found. Creating profile...');

    const profileManager = getProfileManager();
    await profileManager.save({
      name: 'demo',
      apiUrl: process.env.F5XC_API_URL || 'https://demo.console.ves.volterra.io',
      apiToken: process.env.F5XC_API_TOKEN || 'your-token',
      defaultNamespace: 'default'
    });
    await profileManager.setActive('demo');

    // Re-initialize to pick up new profile
    await credentialManager.initialize();
  }

  // Create HTTP client
  const httpClient = createHttpClient(credentialManager);

  if (httpClient.isAvailable()) {
    try {
      // Fetch namespaces
      const response = await httpClient.get('/web/namespaces');
      console.log('Available namespaces:', response.data.items?.length || 0);
    } catch (error) {
      console.error('API request failed:', error.message);
    }
  }
}

main();
```

## Next Steps

- [Configuration](configuration.md) - Learn about all configuration options
- [Authentication Methods](../guides/authentication.md) - Explore different auth methods
- [API Reference](../api/index.md) - Full API documentation
