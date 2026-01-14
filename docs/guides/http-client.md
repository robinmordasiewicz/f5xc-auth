# HTTP Client

Use the pre-configured HTTP client for F5 Distributed Cloud API calls.

---

## Basic Usage

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

---

## Advanced Configuration

```typescript
const httpClient = createHttpClient(credentialManager, {
  timeout: 30000,           // Request timeout in milliseconds
  debug: true,              // Enable request/response logging
  maxRetries: 3,            // Number of retry attempts (default: 3)
  retryDelay: 1000,         // Delay between retries in ms (default: 1000)
  validateStatus: (status) => status < 500  // Custom status validation
});
```

---

## CRUD Operations

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

---

## Error Handling

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

---

## Custom Headers

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

## See Also

- [Quick Start](quick-start/) - Basic authentication and API calls
- [HTTP Client API](../api/http-client/) - Complete API reference
- [Examples](../examples/) - Real-world usage examples
