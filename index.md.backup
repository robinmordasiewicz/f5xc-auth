# f5xc-auth

<div class="hero" markdown>

# f5xc-auth

**Shared authentication library for F5 Distributed Cloud**
XDG-compliant profile management and credential handling for TypeScript/Node.js

<div class="hero-badges">
  <a href="https://www.npmjs.com/package/@robinmordasiewicz/f5xc-auth">
    <img src="https://img.shields.io/npm/v/@robinmordasiewicz/f5xc-auth?style=flat-square&color=4f73ff" alt="npm version">
  </a>
  <a href="https://github.com/robinmordasiewicz/f5xc-auth/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/robinmordasiewicz/f5xc-auth?style=flat-square" alt="license">
  </a>
  <a href="https://github.com/robinmordasiewicz/f5xc-auth">
    <img src="https://img.shields.io/github/stars/robinmordasiewicz/f5xc-auth?style=flat-square" alt="GitHub stars">
  </a>
</div>

</div>

---

## Overview

`@robinmordasiewicz/f5xc-auth` is a TypeScript authentication library designed for F5 Distributed Cloud (XC) applications. It provides a unified interface for credential management, profile storage, and HTTP client configuration.

**Key Benefits:**

- **XDG-compliant storage** - Profiles stored securely in `~/.config/f5xc/profiles/`
- **Multiple auth methods** - API tokens, P12 certificates, or certificate/key pairs
- **Environment priority** - Override profiles with environment variables for CI/CD
- **URL normalization** - Automatic handling of various F5 XC tenant URL formats
- **Pre-configured HTTP** - Axios client with authentication and retry logic
- **Type-safe** - Full TypeScript support with comprehensive type definitions

---

## Installation

### npm

```bash
npm install @robinmordasiewicz/f5xc-auth
```

### yarn

```bash
yarn add @robinmordasiewicz/f5xc-auth
```

### pnpm

```bash
pnpm add @robinmordasiewicz/f5xc-auth
```

**Requirements:**

- Node.js 18 or later
- Valid F5 Distributed Cloud tenant credentials

---

## Quick Start

### Basic Authentication

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

### Making API Calls

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

## Authentication Methods

### Method 1: API Token (Recommended)

API tokens are the simplest authentication method and work for most use cases.

**Using Environment Variables:**

```bash
export F5XC_API_URL="https://mytenant.console.ves.volterra.io"
export F5XC_API_TOKEN="your-api-token-here"
export F5XC_NAMESPACE="my-namespace"  # Optional
```

**Using Profile:**

```typescript
import { getProfileManager } from '@robinmordasiewicz/f5xc-auth';

const profileManager = getProfileManager();

await profileManager.save({
  name: 'production',
  apiUrl: 'https://mytenant.console.ves.volterra.io',
  apiToken: 'your-api-token-here',
  defaultNamespace: 'my-namespace'
});

await profileManager.setActive('production');
```

**Profile File Format** (`~/.config/f5xc/profiles/production.json`):

```json
{
  "name": "production",
  "apiUrl": "https://mytenant.console.ves.volterra.io",
  "apiToken": "your-api-token-here",
  "defaultNamespace": "my-namespace"
}
```

### Method 2: P12 Certificate Bundle

P12 certificates provide enhanced security for production environments.

**Using Environment Variables:**

```bash
export F5XC_API_URL="https://mytenant.console.ves.volterra.io"
export F5XC_P12_BUNDLE="/path/to/certificate.p12"
export F5XC_P12_PASSWORD="certificate-password"  # Optional
```

**Using Profile:**

```typescript
await profileManager.save({
  name: 'production-cert',
  apiUrl: 'https://mytenant.console.ves.volterra.io',
  p12Bundle: '/path/to/certificate.p12',
  p12Password: 'certificate-password'  // Optional
});
```

**Profile File Format:**

```json
{
  "name": "production-cert",
  "apiUrl": "https://mytenant.console.ves.volterra.io",
  "p12Bundle": "/path/to/certificate.p12",
  "p12Password": "certificate-password"
}
```

### Method 3: Certificate + Key Pair

Separate certificate and key files for maximum flexibility.

**Using Environment Variables:**

```bash
export F5XC_API_URL="https://mytenant.console.ves.volterra.io"
export F5XC_CERT="/path/to/certificate.pem"
export F5XC_KEY="/path/to/private-key.pem"
```

**Using Profile:**

```typescript
await profileManager.save({
  name: 'production-pem',
  apiUrl: 'https://mytenant.console.ves.volterra.io',
  cert: '/path/to/certificate.pem',
  key: '/path/to/private-key.pem'
});
```

**Profile File Format:**

```json
{
  "name": "production-pem",
  "apiUrl": "https://mytenant.console.ves.volterra.io",
  "cert": "/path/to/certificate.pem",
  "key": "/path/to/private-key.pem"
}
```

---

## Profile Management

### Listing Profiles

```typescript
import { getProfileManager } from '@robinmordasiewicz/f5xc-auth';

const profileManager = getProfileManager();

// Get all profile names
const profiles = await profileManager.list();
console.log('Available profiles:', profiles);
// Output: ['production', 'staging', 'development']
```

### Getting Active Profile

```typescript
// Get currently active profile
const activeProfile = await profileManager.getActiveProfile();
console.log('Active profile:', activeProfile?.name);

// Check if a profile is active
const isProduction = await profileManager.isActive('production');
console.log('Is production active?', isProduction);
```

### Loading Profile Data

```typescript
// Load specific profile
const profile = await profileManager.load('production');
if (profile) {
  console.log('Profile:', profile.name);
  console.log('API URL:', profile.apiUrl);
  console.log('Namespace:', profile.defaultNamespace);
}
```

### Switching Profiles

```typescript
// Switch to different profile
await profileManager.setActive('staging');
console.log('Switched to staging profile');

// Reinitialize credential manager to use new profile
const credentialManager = new CredentialManager();
await credentialManager.initialize();
```

### Deleting Profiles

```typescript
// Delete a specific profile
await profileManager.delete('old-profile');
console.log('Profile deleted');

// Delete the active profile
await profileManager.deleteActive();
console.log('Active profile deleted');
```

### Complete Profile Management Example

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

## HTTP Client

### Basic Usage

```typescript
import { CredentialManager, createHttpClient } from '@robinmordasiewicz/f5xc-auth';

const credentialManager = new CredentialManager();
await credentialManager.initialize();

const httpClient = createHttpClient(credentialManager);

if (httpClient.isAvailable()) {
  // GET request
  const response = await httpClient.get('/web/namespaces');
  console.log('Namespaces:', response.data);
}
```

### Advanced Configuration

```typescript
const httpClient = createHttpClient(credentialManager, {
  timeout: 30000,           // Request timeout in milliseconds
  debug: true,              // Enable request/response logging
  maxRetries: 3,            // Number of retry attempts (default: 3)
  retryDelay: 1000,         // Delay between retries in ms (default: 1000)
  validateStatus: (status) => status < 500  // Custom status validation
});
```

### CRUD Operations

```typescript
// POST - Create resource
const createResponse = await httpClient.post('/api/config/namespaces/my-ns/http_loadbalancers', {
  metadata: {
    name: 'my-lb',
    namespace: 'my-ns'
  },
  spec: {
    domains: ['example.com'],
    http: {
      port: 80
    }
  }
});

// PUT - Update resource
const updateResponse = await httpClient.put('/api/config/namespaces/my-ns/http_loadbalancers/my-lb', {
  metadata: {
    name: 'my-lb',
    namespace: 'my-ns'
  },
  spec: {
    domains: ['example.com', 'www.example.com'],
    http: {
      port: 80
    }
  }
});

// DELETE - Remove resource
await httpClient.delete('/api/config/namespaces/my-ns/http_loadbalancers/my-lb');
console.log('Load balancer deleted');
```

### Error Handling

```typescript
import { createHttpClient } from '@robinmordasiewicz/f5xc-auth';

async function safeApiCall() {
  const httpClient = createHttpClient(credentialManager);

  if (!httpClient.isAvailable()) {
    console.error('HTTP client not available - check credentials');
    return;
  }

  try {
    const response = await httpClient.get('/web/namespaces');
    console.log('Success:', response.data);
  } catch (error) {
    if (error.response) {
      // Server responded with error status
      console.error('Server error:', error.response.status);
      console.error('Message:', error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error('Network error - no response received');
    } else {
      // Error setting up request
      console.error('Request error:', error.message);
    }
  }
}
```

### Custom Headers

```typescript
// Add custom headers for specific request
const response = await httpClient.get('/web/namespaces', {
  headers: {
    'X-Request-ID': 'unique-request-id',
    'X-Custom-Header': 'custom-value'
  }
});

// Add custom headers to all requests
httpClient.defaults.headers.common['X-Global-Header'] = 'global-value';
```

---

## Environment Variables

Environment variables take highest priority and override profile settings.

| Variable | Description | Example |
|----------|-------------|---------|
| `F5XC_API_URL` | F5 XC tenant API URL | `https://mytenant.console.ves.volterra.io` |
| `F5XC_API_TOKEN` | API authentication token | `your-api-token-here` |
| `F5XC_P12_BUNDLE` | Path to P12 certificate bundle | `/path/to/certificate.p12` |
| `F5XC_P12_PASSWORD` | Password for P12 bundle | `certificate-password` |
| `F5XC_CERT` | Path to certificate PEM file | `/path/to/certificate.pem` |
| `F5XC_KEY` | Path to private key PEM file | `/path/to/private-key.pem` |
| `F5XC_NAMESPACE` | Default namespace for operations | `my-namespace` |
| `F5XC_TLS_INSECURE` | Disable TLS verification (**staging only**) | `true` |
| `F5XC_CA_BUNDLE` | Path to custom CA bundle | `/path/to/ca-bundle.pem` |

### Priority Order

Credentials are resolved in the following order (highest to lowest priority):

1. **Environment variables** - Override everything
2. **Active profile** - From `~/.config/f5xc/profiles/`
3. **Documentation mode** - No credentials (read-only operations)

### CI/CD Example

```bash
#!/bin/bash
# .github/workflows/deploy.yml or similar

export F5XC_API_URL="https://mytenant.console.ves.volterra.io"
export F5XC_API_TOKEN="${{ secrets.F5XC_API_TOKEN }}"
export F5XC_NAMESPACE="production"

node deploy.js
```

### Docker Example

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --production

COPY . .

# Environment variables can be passed at runtime
# docker run -e F5XC_API_URL=... -e F5XC_API_TOKEN=... myapp
CMD ["node", "index.js"]
```

```bash
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    environment:
      - F5XC_API_URL=${F5XC_API_URL}
      - F5XC_API_TOKEN=${F5XC_API_TOKEN}
      - F5XC_NAMESPACE=production
```

---

## API Reference

### CredentialManager

Main class for managing authentication and credentials.

#### Constructor

```typescript
new CredentialManager(options?: CredentialManagerOptions)
```

**Options:**

```typescript
interface CredentialManagerOptions {
  profileName?: string;        // Specific profile to use
  requireAuth?: boolean;       // Throw error if not authenticated (default: false)
  debug?: boolean;             // Enable debug logging (default: false)
}
```

**Example:**

```typescript
// Use default profile
const cm1 = new CredentialManager();

// Use specific profile
const cm2 = new CredentialManager({ profileName: 'production' });

// Require authentication
const cm3 = new CredentialManager({ requireAuth: true });
```

#### Methods

##### `initialize(): Promise<void>`

Initialize the credential manager and load credentials.

```typescript
const credentialManager = new CredentialManager();
await credentialManager.initialize();
```

##### `isAuthenticated(): boolean`

Check if credentials are loaded and valid.

```typescript
if (credentialManager.isAuthenticated()) {
  console.log('Ready to make API calls');
}
```

##### `getApiUrl(): string | null`

Get the configured API URL.

```typescript
const apiUrl = credentialManager.getApiUrl();
console.log('API URL:', apiUrl);
```

##### `getTenant(): string | null`

Extract tenant name from API URL.

```typescript
const tenant = credentialManager.getTenant();
console.log('Tenant:', tenant);
```

##### `getNamespace(): string | null`

Get the default namespace.

```typescript
const namespace = credentialManager.getNamespace();
console.log('Namespace:', namespace);
```

##### `getAuthHeaders(): Record<string, string>`

Get authentication headers for API requests.

```typescript
const headers = credentialManager.getAuthHeaders();
// Returns: { 'Authorization': 'APIToken your-token' }
// or: { 'X-Client-Cert': 'base64-encoded-cert', 'X-Client-Key': 'base64-encoded-key' }
```

##### `getHttpsAgent(): https.Agent | null`

Get configured HTTPS agent with TLS settings.

```typescript
const agent = credentialManager.getHttpsAgent();
// Use with axios or other HTTP libraries
```

### ProfileManager

Manage profile storage and retrieval.

#### Getting Instance

```typescript
import { getProfileManager } from '@robinmordasiewicz/f5xc-auth';

const profileManager = getProfileManager();
```

#### Methods

##### `list(): Promise<string[]>`

List all available profile names.

```typescript
const profiles = await profileManager.list();
// Returns: ['production', 'staging', 'development']
```

##### `load(name: string): Promise<Profile | null>`

Load a specific profile.

```typescript
const profile = await profileManager.load('production');
if (profile) {
  console.log('Loaded profile:', profile.name);
}
```

##### `save(profile: Profile): Promise<void>`

Save a new or updated profile.

```typescript
await profileManager.save({
  name: 'production',
  apiUrl: 'https://mytenant.console.ves.volterra.io',
  apiToken: 'token',
  defaultNamespace: 'my-ns'
});
```

##### `delete(name: string): Promise<void>`

Delete a specific profile.

```typescript
await profileManager.delete('old-profile');
```

##### `getActiveProfile(): Promise<Profile | null>`

Get the currently active profile.

```typescript
const active = await profileManager.getActiveProfile();
console.log('Active:', active?.name);
```

##### `setActive(name: string): Promise<void>`

Set a profile as active.

```typescript
await profileManager.setActive('production');
```

##### `deleteActive(): Promise<void>`

Delete the active profile marker.

```typescript
await profileManager.deleteActive();
```

##### `isActive(name: string): Promise<boolean>`

Check if a specific profile is active.

```typescript
const isActive = await profileManager.isActive('production');
```

### createHttpClient()

Create a pre-configured Axios HTTP client.

```typescript
function createHttpClient(
  credentialManager: CredentialManager,
  options?: HttpClientOptions
): HttpClient
```

**Options:**

```typescript
interface HttpClientOptions {
  timeout?: number;           // Request timeout in ms (default: 30000)
  debug?: boolean;            // Enable debug logging (default: false)
  maxRetries?: number;        // Max retry attempts (default: 3)
  retryDelay?: number;        // Delay between retries in ms (default: 1000)
  validateStatus?: (status: number) => boolean;  // Custom status validation
}
```

**Returns:**

```typescript
interface HttpClient extends AxiosInstance {
  isAvailable(): boolean;     // Check if client is ready
}
```

**Example:**

```typescript
const httpClient = createHttpClient(credentialManager, {
  timeout: 30000,
  debug: true,
  maxRetries: 3
});

if (httpClient.isAvailable()) {
  const response = await httpClient.get('/web/namespaces');
}
```

### Profile Type

```typescript
interface Profile {
  name: string;                      // Profile name
  apiUrl: string;                    // F5 XC API URL
  defaultNamespace?: string;         // Default namespace

  // Authentication (choose one method)
  apiToken?: string;                 // API token
  p12Bundle?: string;                // P12 certificate path
  p12Password?: string;              // P12 password (optional)
  cert?: string;                     // Certificate PEM path
  key?: string;                      // Private key PEM path

  // TLS Options
  tlsInsecure?: boolean;             // Disable TLS verification
  caBundle?: string;                 // Custom CA bundle path
}
```

---

## URL Normalization

The library automatically normalizes various F5 XC URL formats:

```typescript
// All of these are normalized to the correct API URL:

'mytenant.console.ves.volterra.io'
→ 'https://mytenant.console.ves.volterra.io'

'https://mytenant.console.ves.volterra.io'
→ 'https://mytenant.console.ves.volterra.io'

'mytenant.console.ves.volterra.io/web'
→ 'https://mytenant.console.ves.volterra.io'

'https://mytenant.console.ves.volterra.io/web/workspaces'
→ 'https://mytenant.console.ves.volterra.io'
```

**Example:**

```typescript
const credentialManager = new CredentialManager();
await credentialManager.initialize();

// Works with any format
console.log(credentialManager.getApiUrl());
// Always outputs: https://mytenant.console.ves.volterra.io
```

---

## Security

### File Permissions

Profile files are automatically created with secure permissions:

- **Profile files**: `0o600` (owner read/write only)
- **Config directory**: `0o700` (owner read/write/execute only)

```bash
# Verify permissions
ls -la ~/.config/f5xc/profiles/
# Output: -rw------- 1 user user 234 Jan 12 10:00 production.json
```

### Token Masking

API tokens are automatically masked when displayed:

```typescript
const credentialManager = new CredentialManager();
await credentialManager.initialize();

console.log('Token:', credentialManager.getApiToken());
// Output: Token: ****abc123 (only last 4 characters shown)
```

### TLS Verification

TLS verification is **enabled by default**. Only disable for staging/development:

```bash
# ⚠️ Only use in non-production environments
export F5XC_TLS_INSECURE=true
```

```typescript
// In code (not recommended)
await profileManager.save({
  name: 'staging',
  apiUrl: 'https://staging.internal',
  apiToken: 'token',
  tlsInsecure: true  // ⚠️ Disable TLS verification
});
```

### Custom CA Bundles

For enterprise environments with custom certificate authorities:

```bash
export F5XC_CA_BUNDLE="/path/to/corporate-ca-bundle.pem"
```

```typescript
await profileManager.save({
  name: 'enterprise',
  apiUrl: 'https://mytenant.console.ves.volterra.io',
  apiToken: 'token',
  caBundle: '/path/to/corporate-ca-bundle.pem'
});
```

### Best Practices

1. **Never commit credentials** - Use `.gitignore` to exclude profile files
2. **Use environment variables in CI/CD** - Keep secrets in secure vaults
3. **Rotate tokens regularly** - Update API tokens periodically
4. **Use certificate authentication for production** - More secure than API tokens
5. **Enable TLS verification in production** - Only disable for local development
6. **Restrict file permissions** - Ensure profile files are not world-readable

```bash
# .gitignore example
.config/
*.p12
*.pem
*.key
.env
```

---

## Troubleshooting

### Authentication Issues

**Problem:** `Not authenticated` error

```typescript
const credentialManager = new CredentialManager();
await credentialManager.initialize();

if (!credentialManager.isAuthenticated()) {
  console.error('Not authenticated');
}
```

**Solutions:**

1. Check if profile exists:
```bash
ls -la ~/.config/f5xc/profiles/
```

2. Verify active profile:
```typescript
const profileManager = getProfileManager();
const active = await profileManager.getActiveProfile();
console.log('Active profile:', active?.name);
```

3. Set environment variables:
```bash
export F5XC_API_URL="https://mytenant.console.ves.volterra.io"
export F5XC_API_TOKEN="your-token"
```

### Profile Not Found

**Problem:** Profile doesn't exist or can't be loaded

```typescript
const profile = await profileManager.load('production');
if (!profile) {
  console.error('Profile not found');
}
```

**Solutions:**

1. List available profiles:
```typescript
const profiles = await profileManager.list();
console.log('Available profiles:', profiles);
```

2. Create the profile:
```typescript
await profileManager.save({
  name: 'production',
  apiUrl: 'https://mytenant.console.ves.volterra.io',
  apiToken: 'your-token'
});
```

### HTTP Client Not Available

**Problem:** `httpClient.isAvailable()` returns false

**Solutions:**

1. Check authentication:
```typescript
if (!credentialManager.isAuthenticated()) {
  console.error('Credential manager not authenticated');
}
```

2. Verify credentials:
```typescript
console.log('API URL:', credentialManager.getApiUrl());
console.log('Tenant:', credentialManager.getTenant());
```

3. Check network connectivity:
```bash
curl -I https://mytenant.console.ves.volterra.io
```

### TLS Certificate Errors

**Problem:** `UNABLE_TO_VERIFY_LEAF_SIGNATURE` or similar TLS errors

**Solutions:**

1. For staging/development only:
```bash
export F5XC_TLS_INSECURE=true
```

2. For enterprise with custom CA:
```bash
export F5XC_CA_BUNDLE="/path/to/ca-bundle.pem"
```

3. Update Node.js certificates:
```bash
npm install -g node
```

### Permission Errors

**Problem:** `EACCES: permission denied` when accessing profiles

**Solutions:**

1. Check directory permissions:
```bash
ls -la ~/.config/f5xc/
```

2. Fix permissions:
```bash
chmod 700 ~/.config/f5xc
chmod 600 ~/.config/f5xc/profiles/*.json
```

3. Check ownership:
```bash
chown -R $USER:$USER ~/.config/f5xc
```

### API Request Failures

**Problem:** API requests fail with 401 or 403

**Solutions:**

1. Verify token is valid:
```bash
# Test with curl
curl -H "Authorization: APIToken YOUR_TOKEN" \
  https://mytenant.console.ves.volterra.io/web/namespaces
```

2. Check token hasn't expired:
```typescript
// Tokens don't expire but can be revoked
// Generate new token in F5 XC console if needed
```

3. Verify namespace access:
```typescript
const namespace = credentialManager.getNamespace();
console.log('Using namespace:', namespace);
```

### Debug Mode

Enable debug logging to troubleshoot issues:

```typescript
const credentialManager = new CredentialManager({ debug: true });
await credentialManager.initialize();

const httpClient = createHttpClient(credentialManager, { debug: true });
```

**Debug output includes:**

- Credential resolution process
- Profile loading steps
- HTTP request/response details
- Authentication header information (tokens masked)

---

## Complete Examples

### Example 1: Simple CLI Tool

```typescript
#!/usr/bin/env node
import { CredentialManager, createHttpClient } from '@robinmordasiewicz/f5xc-auth';

async function main() {
  // Initialize credentials
  const credentialManager = new CredentialManager();
  await credentialManager.initialize();

  if (!credentialManager.isAuthenticated()) {
    console.error('❌ Not authenticated. Set F5XC_API_URL and F5XC_API_TOKEN');
    process.exit(1);
  }

  console.log(`✓ Authenticated as: ${credentialManager.getTenant()}`);

  // Create HTTP client
  const httpClient = createHttpClient(credentialManager);

  if (!httpClient.isAvailable()) {
    console.error('❌ HTTP client not available');
    process.exit(1);
  }

  // List namespaces
  const response = await httpClient.get('/web/namespaces');
  const namespaces = response.data.items.map((item: any) => item.name);

  console.log('\nAvailable Namespaces:');
  namespaces.forEach((ns: string) => console.log(`  - ${ns}`));
}

main().catch(console.error);
```

### Example 2: Profile Switcher

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

### Example 3: Multi-Tenant Management

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

### Example 4: Resource Monitor

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

## Testing

### Unit Tests

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CredentialManager, getProfileManager } from '@robinmordasiewicz/f5xc-auth';

describe('CredentialManager', () => {
  let credentialManager: CredentialManager;

  beforeEach(() => {
    credentialManager = new CredentialManager();
  });

  it('should initialize without errors', async () => {
    await expect(credentialManager.initialize()).resolves.not.toThrow();
  });

  it('should detect authentication status', async () => {
    await credentialManager.initialize();
    const isAuth = credentialManager.isAuthenticated();
    expect(typeof isAuth).toBe('boolean');
  });
});
```

### Integration Tests

```typescript
import { describe, it, expect } from 'vitest';
import { CredentialManager, createHttpClient } from '@robinmordasiewicz/f5xc-auth';

describe('API Integration', () => {
  it('should fetch namespaces', async () => {
    const credentialManager = new CredentialManager();
    await credentialManager.initialize();

    if (!credentialManager.isAuthenticated()) {
      console.log('Skipping - not authenticated');
      return;
    }

    const httpClient = createHttpClient(credentialManager);
    const response = await httpClient.get('/web/namespaces');

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('items');
  });
});
```

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/my-feature`
3. **Make your changes** with tests
4. **Run tests**: `npm test`
5. **Submit a pull request**

### Development Setup

```bash
# Clone repository
git clone https://github.com/robinmordasiewicz/f5xc-auth.git
cd f5xc-auth

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Lint
npm run lint
```

---

## License

This project is licensed under the **MIT License**.

Copyright (c) 2026 Robin Mordasiewicz

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

## Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/robinmordasiewicz/f5xc-auth/issues)
- **Documentation**: [https://robinmordasiewicz.github.io/f5xc-auth/](https://robinmordasiewicz.github.io/f5xc-auth/)
- **npm Package**: [@robinmordasiewicz/f5xc-auth](https://www.npmjs.com/package/@robinmordasiewicz/f5xc-auth)

---

<div class="footer-note" markdown>
**Built with ❤️ for the F5 Distributed Cloud community**
</div>
