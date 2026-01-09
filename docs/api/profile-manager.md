# ProfileManager

The `ProfileManager` class handles profile CRUD operations with secure XDG-compliant file storage.

## Import

```typescript
import { getProfileManager } from '@robinmordasiewicz/f5xc-auth';
```

## Getting the Instance

The `ProfileManager` uses a singleton pattern. Use `getProfileManager()` to get the shared instance:

```typescript
const profileManager = getProfileManager();
```

## Methods

### list()

```typescript
async list(): Promise<Profile[]>
```

Lists all saved profiles, sorted alphabetically by name.

**Returns:** `Profile[]`

**Example:**

```typescript
const profiles = await profileManager.list();
profiles.forEach(p => console.log(p.name));
```

### get()

```typescript
async get(name: string): Promise<Profile | null>
```

Gets a profile by name. Supports both JSON and YAML profile files.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Profile name |

**Returns:** `Profile | null`

**Example:**

```typescript
const profile = await profileManager.get('production');
if (profile) {
  console.log(profile.apiUrl);
}
```

### save()

```typescript
async save(profile: Profile): Promise<ProfileResult>
```

Saves a new profile or updates an existing one.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `profile` | Profile | Profile data to save |

**Returns:** `ProfileResult`

**Validation Rules:**

- Name: alphanumeric, dashes, underscores only (max 64 chars)
- API URL: Must be valid HTTP/HTTPS URL
- Authentication: At least one auth method required

**Example:**

```typescript
const result = await profileManager.save({
  name: 'production',
  apiUrl: 'https://mytenant.console.ves.volterra.io',
  apiToken: 'my-api-token',
  defaultNamespace: 'my-namespace'
});

if (result.success) {
  console.log(result.message);
} else {
  console.error('Failed:', result.message);
}
```

### delete()

```typescript
async delete(name: string): Promise<ProfileResult>
```

Deletes a profile by name.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Profile name to delete |

**Returns:** `ProfileResult`

!!! note
    Cannot delete the currently active profile. Switch to another profile first.

**Example:**

```typescript
const result = await profileManager.delete('old-profile');
if (!result.success) {
  console.error(result.message);
}
```

### setActive()

```typescript
async setActive(name: string): Promise<ProfileResult>
```

Sets a profile as the active profile.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Profile name to activate |

**Returns:** `ProfileResult`

**Example:**

```typescript
const result = await profileManager.setActive('production');
if (result.success) {
  console.log('Switched to production profile');
}
```

### getActive()

```typescript
async getActive(): Promise<string | null>
```

Gets the name of the currently active profile.

**Returns:** `string | null`

**Example:**

```typescript
const activeName = await profileManager.getActive();
console.log(`Active profile: ${activeName || 'none'}`);
```

### getActiveProfile()

```typescript
async getActiveProfile(): Promise<Profile | null>
```

Gets the full profile data for the active profile.

**Returns:** `Profile | null`

**Example:**

```typescript
const profile = await profileManager.getActiveProfile();
if (profile) {
  console.log(`Connected to: ${profile.apiUrl}`);
}
```

### exists()

```typescript
async exists(name: string): Promise<boolean>
```

Checks if a profile exists.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Profile name to check |

**Returns:** `boolean`

### maskProfile()

```typescript
maskProfile(profile: Profile): Record<string, string>
```

Returns a profile with sensitive fields masked for display.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `profile` | Profile | Profile to mask |

**Returns:** `Record<string, string>`

**Example:**

```typescript
const profile = await profileManager.get('production');
if (profile) {
  const masked = profileManager.maskProfile(profile);
  console.log(masked);
  // { name: 'production', apiUrl: '...', apiToken: '****abcd' }
}
```

## Types

### Profile

```typescript
interface Profile {
  name: string;
  apiUrl: string;
  apiToken?: string;
  p12Bundle?: string;
  cert?: string;
  key?: string;
  defaultNamespace?: string;
  tlsInsecure?: boolean;
  caBundle?: string;
}
```

### ProfileResult

```typescript
interface ProfileResult {
  success: boolean;
  message: string;
  profile?: Profile;
  profiles?: Profile[];
}
```

### ProfileConfig

```typescript
interface ProfileConfig {
  configDir: string;
  profilesDir: string;
  activeProfileFile: string;
}
```

## Storage Location

Profiles are stored in XDG-compliant directories:

| Platform | Location |
|----------|----------|
| Linux/macOS | `~/.config/f5xc/profiles/` |
| Windows | `%APPDATA%\f5xc\profiles\` |

### File Format

Profiles are stored as JSON files with `0600` permissions:

```json
{
  "name": "production",
  "apiUrl": "https://mytenant.console.ves.volterra.io",
  "apiToken": "your-api-token",
  "defaultNamespace": "my-namespace"
}
```

YAML format is also supported for reading:

```yaml
name: production
api_url: https://mytenant.console.ves.volterra.io
api_token: your-api-token
default_namespace: my-namespace
```

## Complete Example

```typescript
import { getProfileManager } from '@robinmordasiewicz/f5xc-auth';

async function manageProfiles() {
  const pm = getProfileManager();

  // List existing profiles
  const profiles = await pm.list();
  console.log('Existing profiles:', profiles.map(p => p.name));

  // Create a new profile
  const saveResult = await pm.save({
    name: 'staging',
    apiUrl: 'https://staging.console.ves.volterra.io',
    apiToken: process.env.STAGING_TOKEN!,
    defaultNamespace: 'test'
  });

  if (!saveResult.success) {
    console.error('Failed to save:', saveResult.message);
    return;
  }

  // Set as active
  await pm.setActive('staging');

  // Get current active profile
  const active = await pm.getActiveProfile();
  if (active) {
    const masked = pm.maskProfile(active);
    console.log('Active profile:', masked);
  }
}

manageProfiles();
```

## Related

- [CredentialManager](credential-manager.md) - Using credentials
- [Configuration Guide](../getting-started/configuration.md) - Profile format details
