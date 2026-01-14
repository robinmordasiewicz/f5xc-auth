# ProfileManager

Manage profile storage and retrieval.

---

## Getting Instance

```typescript
import { getProfileManager } from '@robinmordasiewicz/f5xc-auth';

const profileManager = getProfileManager();
```

---

## Methods

### `list(): Promise<string[]>`

List all available profile names.

```typescript
const profiles = await profileManager.list();
// Returns: ['production', 'staging', 'development']
```

---

### `load(name: string): Promise<Profile | null>`

Load a specific profile.

```typescript
const profile = await profileManager.load('production');
if (profile) {
  console.log('Loaded profile:', profile.name);
}
```

---

### `save(profile: Profile): Promise<void>`

Save a new or updated profile.

```typescript
await profileManager.save({
  name: 'production',
  apiUrl: 'https://mytenant.console.ves.volterra.io',
  apiToken: 'token',
  defaultNamespace: 'my-ns'
});
```

---

### `delete(name: string): Promise<void>`

Delete a specific profile.

```typescript
await profileManager.delete('old-profile');
```

---

### `getActiveProfile(): Promise<Profile | null>`

Get the currently active profile.

```typescript
const active = await profileManager.getActiveProfile();
console.log('Active:', active?.name);
```

---

### `setActive(name: string): Promise<void>`

Set a profile as active.

```typescript
await profileManager.setActive('production');
```

---

### `deleteActive(): Promise<void>`

Delete the active profile marker.

```typescript
await profileManager.deleteActive();
```

---

### `isActive(name: string): Promise<boolean>`

Check if a specific profile is active.

```typescript
const isActive = await profileManager.isActive('production');
```

---

## See Also

- [Profile Management Guide](../guides/profile-management/) - Usage examples
- [Authentication](../authentication/) - Configure authentication methods
- [Profile Switcher Example](../examples/profile-switcher/) - Real-world example
