# Profile Switcher

Switch between different profiles to manage multiple tenants.

---

## Code

```typescript
import { getProfileManager, CredentialManager, createHttpClient } from '@robinmordasiewicz/f5xc-auth';

async function switchAndTest(profileName: string) {
  const profileManager = getProfileManager();

  // Switch profile
  await profileManager.setActive(profileName);
  console.log(`Switched to: ${profileName}`);

  // Initialize with new profile
  const credentialManager = new CredentialManager();
  await credentialManager.initialize();

  // Test connection
  const httpClient = createHttpClient(credentialManager);
  if (httpClient.isAvailable()) {
    const response = await httpClient.get('/web/namespaces');
    console.log(`✓ Connected to: ${credentialManager.getTenant()}`);
    console.log(`✓ Namespaces: ${response.data.items.length}`);
  }
}

// Usage
switchAndTest('production').catch(console.error);
```

---

## See Also

- [Profile Management Guide](../guides/profile-management/) - Profile operations
- [ProfileManager API](../api/profile-manager/) - API documentation
- [Authentication](../authentication/) - Configure profiles
