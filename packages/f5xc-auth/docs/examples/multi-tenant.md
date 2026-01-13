# Multi-Tenant Management

Manage resources across multiple F5 Distributed Cloud tenants.

---

## Code

```typescript
import { getProfileManager, CredentialManager, createHttpClient } from '@robinmordasiewicz/f5xc-auth';

interface TenantInfo {
  name: string;
  url: string;
  namespaceCount: number;
}

async function getAllTenantInfo(): Promise<TenantInfo[]> {
  const profileManager = getProfileManager();
  const profiles = await profileManager.list();
  const results: TenantInfo[] = [];

  for (const profileName of profiles) {
    // Load profile
    await profileManager.setActive(profileName);
    const credentialManager = new CredentialManager();
    await credentialManager.initialize();

    if (!credentialManager.isAuthenticated()) {
      console.warn(`⚠️  Skipping ${profileName} - not authenticated`);
      continue;
    }

    // Get tenant info
    const httpClient = createHttpClient(credentialManager);
    if (httpClient.isAvailable()) {
      try {
        const response = await httpClient.get('/web/namespaces');
        results.push({
          name: profileName,
          url: credentialManager.getApiUrl()!,
          namespaceCount: response.data.items.length
        });
      } catch (error) {
        console.error(`❌ Failed to query ${profileName}`);
      }
    }
  }

  return results;
}

// Usage
getAllTenantInfo().then(info => {
  console.log('\nTenant Summary:');
  info.forEach(tenant => {
    console.log(`  ${tenant.name}: ${tenant.namespaceCount} namespaces`);
  });
}).catch(console.error);
```

---

## See Also

- [Profile Management Guide](../guides/profile-management/) - Manage multiple profiles
- [HTTP Client Guide](../guides/http-client/) - Make API calls
- [ProfileManager API](../api/profile-manager/) - API documentation
