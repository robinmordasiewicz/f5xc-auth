# Quick Start

Get started with f5xc-auth in minutes.

---

## Basic Authentication

The simplest way to get started is with the `CredentialManager`:

```typescript
import { CredentialManager } from '@robinmordasiewicz/f5xc-auth';

// Initialize credential manager
const credentialManager = new CredentialManager();
await credentialManager.initialize();

// Check authentication status
if (credentialManager.isAuthenticated()) {
  console.log(`✓ Authenticated as: ${credentialManager.getTenant()}`);
  console.log(`✓ API URL: ${credentialManager.getApiUrl()}`);
  console.log(`✓ Namespace: ${credentialManager.getNamespace()}`);
} else {
  console.error('❌ Not authenticated. Please configure credentials.');
}
```

---

## Making API Calls

Use the `createHttpClient` function to get a pre-configured Axios instance:

```typescript
import { CredentialManager, createHttpClient } from '@robinmordasiewicz/f5xc-auth';

const credentialManager = new CredentialManager();
await credentialManager.initialize();

const httpClient = createHttpClient(credentialManager, {
  timeout: 30000,
  debug: true // Enable request/response logging
});

if (httpClient.isAvailable()) {
  // List all namespaces
  const response = await httpClient.get('/web/namespaces');
  console.log('Namespaces:', response.data);

  // Get specific namespace details
  const nsResponse = await httpClient.get('/web/namespaces/my-namespace');
  console.log('Namespace details:', nsResponse.data);
}
```

---

## Next Steps

- [Configure Authentication](../authentication/) - Set up your credentials
- [Profile Management](profile-management/) - Manage multiple profiles
- [HTTP Client Guide](http-client/) - Learn HTTP client features
- [Environment Variables](environment-variables/) - Configure via environment

---

## See Also

- [CredentialManager API](../api/credential-manager/) - Complete API reference
- [HTTP Client API](../api/http-client/) - HTTP client documentation
- [Examples](../examples/) - Real-world code examples
