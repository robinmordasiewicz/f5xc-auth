# CredentialManager

Main class for managing authentication and credentials.

---

## Constructor

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

---

## Methods

### `initialize(): Promise<void>`

Initialize the credential manager and load credentials.

```typescript
const credentialManager = new CredentialManager();
await credentialManager.initialize();
```

---

### `isAuthenticated(): boolean`

Check if credentials are loaded and valid.

```typescript
if (credentialManager.isAuthenticated()) {
  console.log('Ready to make API calls');
}
```

---

### `getApiUrl(): string | null`

Get the configured API URL.

```typescript
const apiUrl = credentialManager.getApiUrl();
console.log('API URL:', apiUrl);
```

---

### `getTenant(): string | null`

Extract tenant name from API URL.

```typescript
const tenant = credentialManager.getTenant();
console.log('Tenant:', tenant);
```

---

### `getNamespace(): string | null`

Get the default namespace.

```typescript
const namespace = credentialManager.getNamespace();
console.log('Namespace:', namespace);
```

---

### `getAuthHeaders(): Record<string, string>`

Get authentication headers for API requests.

```typescript
const headers = credentialManager.getAuthHeaders();
// Returns: { 'Authorization': 'APIToken your-token' }
// or: { 'X-Client-Cert': 'base64-encoded-cert', 'X-Client-Key': 'base64-encoded-key' }
```

---

### `getHttpsAgent(): https.Agent | null`

Get configured HTTPS agent with TLS settings.

```typescript
const agent = credentialManager.getHttpsAgent();
// Use with axios or other HTTP libraries
```

---

## See Also

- [Quick Start Guide](../guides/quick-start/) - Get started with basic usage
- [Authentication](../authentication/) - Configure authentication methods
- [HTTP Client Guide](../guides/http-client/) - Use the HTTP client
