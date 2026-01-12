# Troubleshooting

Common issues and solutions for the f5xc-auth library.

---

## Authentication Issues

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

---

## Profile Not Found

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

---

## HTTP Client Not Available

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

---

## TLS Certificate Errors

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

---

## Permission Errors

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

---

## API Request Failures

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

---

## Debug Mode

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

## See Also

- [Authentication](authentication/) - Configure credentials properly
- [CredentialManager API](api/credential-manager/) - API documentation
- [ProfileManager API](api/profile-manager/) - Profile management API
- [Environment Variables](guides/environment-variables/) - Environment configuration
