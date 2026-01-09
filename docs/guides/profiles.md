# Profile Management

This guide covers managing multiple F5 XC profiles for different tenants and environments.

## Overview

Profiles allow you to store and switch between different F5 XC configurations:

- Multiple tenants
- Different environments (dev, staging, production)
- Different authentication methods
- Different default namespaces

## Creating Profiles

### Using Code

```typescript
import { getProfileManager } from '@robinmordasiewicz/f5xc-auth';

const pm = getProfileManager();

// Create a production profile
await pm.save({
  name: 'production',
  apiUrl: 'https://prod.console.ves.volterra.io',
  apiToken: 'prod-token',
  defaultNamespace: 'production'
});

// Create a staging profile
await pm.save({
  name: 'staging',
  apiUrl: 'https://staging.console.ves.volterra.io',
  apiToken: 'staging-token',
  defaultNamespace: 'staging',
  tlsInsecure: true  // For staging environments
});
```

### Manual Creation

Create a JSON file in `~/.config/f5xc/profiles/`:

```json title="~/.config/f5xc/profiles/production.json"
{
  "name": "production",
  "apiUrl": "https://mytenant.console.ves.volterra.io",
  "apiToken": "your-api-token",
  "defaultNamespace": "production"
}
```

Or use YAML format:

```yaml title="~/.config/f5xc/profiles/staging.yaml"
name: staging
api_url: https://staging.console.ves.volterra.io
api_token: staging-token
default_namespace: staging
tls_insecure: true
```

!!! note "YAML Naming"
    YAML files use `snake_case` keys which are automatically converted to `camelCase`.

## Listing Profiles

```typescript
const profiles = await pm.list();

profiles.forEach(profile => {
  const masked = pm.maskProfile(profile);
  console.log(`${profile.name}: ${profile.apiUrl}`);
  console.log(`  Token: ${masked.apiToken}`);
});
```

Output:
```
production: https://prod.console.ves.volterra.io
  Token: ****abcd
staging: https://staging.console.ves.volterra.io
  Token: ****efgh
```

## Switching Profiles

### Set Active Profile

```typescript
const result = await pm.setActive('production');
if (result.success) {
  console.log('Switched to production');
}
```

### Get Current Profile

```typescript
// Get profile name
const name = await pm.getActive();
console.log(`Active profile: ${name}`);

// Get full profile data
const profile = await pm.getActiveProfile();
if (profile) {
  console.log(`Connected to: ${profile.apiUrl}`);
}
```

## Updating Profiles

To update a profile, save it with the same name:

```typescript
const profile = await pm.get('production');
if (profile) {
  // Update the namespace
  profile.defaultNamespace = 'new-namespace';
  await pm.save(profile);
}
```

## Deleting Profiles

```typescript
const result = await pm.delete('old-profile');
if (result.success) {
  console.log('Profile deleted');
} else {
  console.error(result.message);
}
```

!!! warning "Active Profile"
    You cannot delete the currently active profile. Switch to another profile first.

## Profile Validation

Profiles are validated when saved:

### Name Rules

- Alphanumeric characters
- Dashes (`-`) and underscores (`_`)
- Maximum 64 characters

```typescript
// Valid names
'production'
'my-tenant-1'
'staging_env'

// Invalid names
'my profile'      // Spaces not allowed
'profile@1'       // Special characters not allowed
```

### URL Validation

- Must be a valid HTTP or HTTPS URL
- URLs are automatically normalized

```typescript
// These all normalize to the same URL:
'mytenant'
'mytenant.console.ves.volterra.io'
'https://mytenant.console.ves.volterra.io'
'https://mytenant.console.ves.volterra.io/'

// Result: https://mytenant.console.ves.volterra.io/api
```

### Authentication Required

At least one authentication method must be provided:

```typescript
// Valid - has apiToken
{ name: 'p1', apiUrl: '...', apiToken: '...' }

// Valid - has p12Bundle
{ name: 'p2', apiUrl: '...', p12Bundle: '/path/to/cert.p12' }

// Valid - has cert and key
{ name: 'p3', apiUrl: '...', cert: '/path/to/cert.pem', key: '/path/to/key.pem' }

// Invalid - no authentication
{ name: 'p4', apiUrl: '...' }  // Error: Profile must have authentication
```

## Profile Security

### File Permissions

Profile files are created with secure permissions:

- Profile files: `0600` (owner read/write only)
- Config directory: `0700` (owner access only)

### Token Masking

When displaying profiles, tokens are automatically masked:

```typescript
const masked = pm.maskProfile(profile);
console.log(masked.apiToken);  // ****abcd
```

## Common Patterns

### Profile per Environment

```typescript
// Development
await pm.save({
  name: 'dev',
  apiUrl: 'https://dev-tenant.console.ves.volterra.io',
  apiToken: process.env.DEV_TOKEN!,
  defaultNamespace: 'development'
});

// Staging
await pm.save({
  name: 'staging',
  apiUrl: 'https://staging-tenant.console.ves.volterra.io',
  apiToken: process.env.STAGING_TOKEN!,
  defaultNamespace: 'staging',
  tlsInsecure: true
});

// Production
await pm.save({
  name: 'prod',
  apiUrl: 'https://prod-tenant.console.ves.volterra.io',
  apiToken: process.env.PROD_TOKEN!,
  defaultNamespace: 'production'
});
```

### Profile per Tenant

```typescript
// Tenant A
await pm.save({
  name: 'tenant-a',
  apiUrl: 'https://tenant-a.console.ves.volterra.io',
  apiToken: 'token-a',
  defaultNamespace: 'default'
});

// Tenant B
await pm.save({
  name: 'tenant-b',
  apiUrl: 'https://tenant-b.console.ves.volterra.io',
  apiToken: 'token-b',
  defaultNamespace: 'default'
});
```

### Profile Selection Script

```typescript
import { getProfileManager, CredentialManager, createHttpClient } from '@robinmordasiewicz/f5xc-auth';

async function useProfile(name: string) {
  const pm = getProfileManager();

  // Check profile exists
  if (!await pm.exists(name)) {
    throw new Error(`Profile '${name}' not found`);
  }

  // Set active
  await pm.setActive(name);

  // Initialize new credentials
  const cm = new CredentialManager();
  await cm.initialize();

  // Create client
  return createHttpClient(cm);
}

// Usage
const client = await useProfile('production');
const response = await client.get('/web/namespaces');
```
