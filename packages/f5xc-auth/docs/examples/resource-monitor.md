# Resource Monitor

Monitor resources with automatic API pagination and token refresh.

---

## Code

```typescript
import { CredentialManager, createHttpClient } from '@robinmordasiewicz/f5xc-auth';

async function monitorResources(namespace: string) {
  const credentialManager = new CredentialManager();
  await credentialManager.initialize();

  const httpClient = createHttpClient(credentialManager, { timeout: 10000 });

  if (!httpClient.isAvailable()) {
    throw new Error('HTTP client not available');
  }

  // Monitor different resource types
  const resourceTypes = [
    'http_loadbalancers',
    'origin_pools',
    'healthchecks'
  ];

  for (const resourceType of resourceTypes) {
    try {
      const response = await httpClient.get(
        `/api/config/namespaces/${namespace}/${resourceType}`
      );

      const count = response.data.items?.length || 0;
      console.log(`${resourceType}: ${count} resources`);

    } catch (error: any) {
      console.error(`Failed to query ${resourceType}:`, error.message);
    }
  }
}

// Usage
monitorResources('my-namespace').catch(console.error);
```

---

## See Also

- [HTTP Client Guide](../guides/http-client/) - Advanced HTTP client usage
- [Quick Start](../guides/quick-start/) - Get started with basics
- [Troubleshooting](../troubleshooting/) - Common issues and solutions
