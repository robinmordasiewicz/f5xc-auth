# Simple CLI Tool

A basic command-line tool for making F5 XC API calls.

---

## Code

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

---

## See Also

- [Quick Start Guide](../guides/quick-start/) - Get started with basics
- [CredentialManager API](../api/credential-manager/) - API documentation
- [HTTP Client Guide](../guides/http-client/) - HTTP client usage
