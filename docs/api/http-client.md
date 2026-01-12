# HTTP Client

Create a pre-configured Axios HTTP client for F5 Distributed Cloud API calls.

---

## Function Signature

```typescript
function createHttpClient(
  credentialManager: CredentialManager,
  options?: HttpClientOptions
): HttpClient
```

---

## Options

```typescript
interface HttpClientOptions {
  timeout?: number;           // Request timeout in ms (default: 30000)
  debug?: boolean;            // Enable debug logging (default: false)
  maxRetries?: number;        // Max retry attempts (default: 3)
  retryDelay?: number;        // Delay between retries in ms (default: 1000)
  validateStatus?: (status: number) => boolean;  // Custom status validation
}
```

---

## Returns

```typescript
interface HttpClient extends AxiosInstance {
  isAvailable(): boolean;     // Check if client is ready
}
```

---

## Example

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

---

## See Also

- [HTTP Client Guide](../guides/http-client/) - Detailed usage guide
- [Quick Start](../guides/quick-start/) - Get started quickly
- [Examples](../examples/) - Real-world usage examples
