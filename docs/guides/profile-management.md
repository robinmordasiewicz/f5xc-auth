# Profile Management

Manage multiple authentication profiles for different tenants and environments.

---

## Listing Profiles

```typescript
import { getProfileManager } from '@robinmordasiewicz/f5xc-auth';

const profileManager = getProfileManager();

// Get all profile names
const profiles = await profileManager.list();
console.log('Available profiles:', profiles);
// Output: ['production', 'staging', 'development']
```

---

## Getting Active Profile

```typescript
// Get currently active profile
const activeProfile = await profileManager.getActiveProfile();
console.log('Active profile:', activeProfile?.name);

// Check if a profile is active
const isProduction = await profileManager.isActive('production');
console.log('Is production active?', isProduction);
```

---

## Loading Profile Data

```typescript
// Load specific profile
const profile = await profileManager.load('production');
if (profile) {
  console.log('Profile:', profile.name);
  console.log('API URL:', profile.apiUrl);
  console.log('Namespace:', profile.defaultNamespace);
}
```

---

## Switching Profiles

```typescript
// Switch to different profile
await profileManager.setActive('staging');
console.log('Switched to staging profile');

// Reinitialize credential manager to use new profile
const credentialManager = new CredentialManager();
await credentialManager.initialize();
```

---

## Deleting Profiles

```typescript
// Delete a specific profile
await profileManager.delete('old-profile');
console.log('Profile deleted');

// Delete the active profile
await profileManager.deleteActive();
console.log('Active profile deleted');
```

---

## Complete Profile Management Example

```typescript
import { getProfileManager, CredentialManager } from '@robinmordasiewicz/f5xc-auth';

async function manageProfiles() {
  const profileManager = getProfileManager();

  // Create production profile
  await profileManager.save({
    name: 'production',
    apiUrl: 'https://prod.console.ves.volterra.io',
    apiToken: 'prod-token',
    defaultNamespace: 'prod-namespace'
  });

  // Create staging profile
  await profileManager.save({
    name: 'staging',
    apiUrl: 'https://staging.console.ves.volterra.io',
    apiToken: 'staging-token',
    defaultNamespace: 'staging-namespace'
  });

  // List all profiles
  const profiles = await profileManager.list();
  console.log('Available profiles:', profiles);

  // Switch to production
  await profileManager.setActive('production');

  // Use the active profile
  const credentialManager = new CredentialManager();
  await credentialManager.initialize();
  console.log('Using profile:', credentialManager.getTenant());
}

manageProfiles().catch(console.error);
```

---

## See Also

- [Authentication](../authentication/) - Configure authentication methods
- [ProfileManager API](../api/profile-manager/) - Complete API reference
- [Examples](../examples/profile-switcher/) - Profile switching example
