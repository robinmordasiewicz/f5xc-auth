# HttpClient

The `HttpClient` class provides a pre-configured Axios instance for making authenticated API requests to F5 Distributed Cloud.

## Import

```typescript
import { createHttpClient, CredentialManager } from '@robinmordasiewicz/f5xc-auth';
```

## Creating an Instance

```typescript
const credentialManager = new CredentialManager();
await credentialManager.initialize();

const httpClient = createHttpClient(credentialManager, {
  timeout: 30000,
  debug: true
});
```

## Constructor Options

```typescript
interface HttpClientConfig {
  timeout?: number;          // Request timeout in ms (default: 30000)
  headers?: Record<string, string>;  // Custom headers
  debug?: boolean;           // Enable request/response logging
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `timeout` | number | 30000 | Request timeout in milliseconds |
| `headers` | object | {} | Custom headers for all requests |
| `debug` | boolean | false | Enable debug logging |

## Methods

### isAvailable()

```typescript
isAvailable(): boolean
```

Returns `true` if the client has valid credentials and can make requests.

**Example:**

```typescript
if (!httpClient.isAvailable()) {
  console.log('Running in documentation mode - API calls disabled');
}
```

### get()

<span class="api-method api-method-get">GET</span>

```typescript
async get<T>(path: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>>
```

Makes a GET request.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `path` | string | API endpoint path |
| `config` | AxiosRequestConfig | Optional Axios config |

**Example:**

```typescript
const response = await httpClient.get('/web/namespaces');
console.log(response.data);
```

### post()

<span class="api-method api-method-post">POST</span>

```typescript
async post<T>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>>
```

Makes a POST request.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `path` | string | API endpoint path |
| `data` | unknown | Request body |
| `config` | AxiosRequestConfig | Optional Axios config |

**Example:**

```typescript
const response = await httpClient.post('/config/namespaces', {
  metadata: { name: 'my-namespace' },
  spec: {}
});
```

### put()

<span class="api-method api-method-put">PUT</span>

```typescript
async put<T>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>>
```

Makes a PUT request.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `path` | string | API endpoint path |
| `data` | unknown | Request body |
| `config` | AxiosRequestConfig | Optional Axios config |

### delete()

<span class="api-method api-method-delete">DELETE</span>

```typescript
async delete<T>(path: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>>
```

Makes a DELETE request.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `path` | string | API endpoint path |
| `config` | AxiosRequestConfig | Optional Axios config |

### getAxiosInstance()

```typescript
getAxiosInstance(): AxiosInstance | null
```

Returns the underlying Axios instance for advanced usage.

**Example:**

```typescript
const axios = httpClient.getAxiosInstance();
if (axios) {
  // Use Axios directly
  axios.interceptors.request.use(config => {
    console.log('Request:', config.url);
    return config;
  });
}
```

## Response Format

All request methods return an `ApiResponse` object:

```typescript
interface ApiResponse<T> {
  data: T;                    // Response data
  status: number;             // HTTP status code
  headers: Record<string, string>;  // Response headers
  duration: number;           // Request duration in ms
}
```

**Example:**

```typescript
const response = await httpClient.get('/web/namespaces');
console.log(`Status: ${response.status}`);
console.log(`Duration: ${response.duration}ms`);
console.log(`Data:`, response.data);
```

## Error Handling

The client throws typed errors for different failure scenarios:

```typescript
import { F5XCApiError, AuthenticationError } from '@robinmordasiewicz/f5xc-auth';

try {
  const response = await httpClient.get('/web/namespaces');
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Authentication failed:', error.message);
  } else if (error instanceof F5XCApiError) {
    console.error(`API error (${error.status}):`, error.message);
    console.error('Response data:', error.data);
  } else {
    console.error('Unknown error:', error);
  }
}
```

### Error Types

#### AuthenticationError

Thrown when credentials are missing or invalid:

```typescript
class AuthenticationError extends Error {
  constructor(message: string);
}
```

#### F5XCApiError

Thrown for API response errors:

```typescript
class F5XCApiError extends Error {
  status?: number;
  data?: unknown;
  constructor(message: string, status?: number, data?: unknown);
}
```

## TLS Configuration

The client automatically configures TLS based on credentials:

### Custom CA Bundle

```typescript
// Set via environment
export F5XC_CA_BUNDLE=/path/to/ca-bundle.crt

// Or in profile
{
  "name": "enterprise",
  "apiUrl": "https://tenant.console.ves.volterra.io",
  "apiToken": "...",
  "caBundle": "/path/to/ca-bundle.crt"
}
```

### Insecure Mode

!!! danger "Warning"
    Only use for staging/development environments!

```typescript
// Set via environment
export F5XC_TLS_INSECURE=true

// Or in profile
{
  "name": "staging",
  "apiUrl": "https://staging.console.ves.volterra.io",
  "apiToken": "...",
  "tlsInsecure": true
}
```

## Authentication Modes

The client automatically configures authentication based on credentials:

### Token Authentication

```typescript
// Headers set automatically:
// Authorization: APIToken <token>
```

### Certificate Authentication (mTLS)

```typescript
// HTTPS agent configured with:
// - pfx: P12 certificate buffer, or
// - cert/key: Certificate and private key
```

## Complete Example

```typescript
import {
  CredentialManager,
  createHttpClient,
  F5XCApiError,
  AuthenticationError
} from '@robinmordasiewicz/f5xc-auth';

async function listNamespaces() {
  // Initialize credentials
  const cm = new CredentialManager();
  await cm.initialize();

  // Create HTTP client
  const client = createHttpClient(cm, {
    timeout: 60000,
    debug: process.env.DEBUG === 'true'
  });

  // Check availability
  if (!client.isAvailable()) {
    console.log('No credentials configured');
    console.log('Set F5XC_API_URL and F5XC_API_TOKEN to enable API calls');
    return;
  }

  try {
    // Make request
    const response = await client.get<{ items: Array<{ name: string }> }>(
      '/web/namespaces'
    );

    console.log(`Found ${response.data.items?.length || 0} namespaces`);
    console.log(`Request took ${response.duration}ms`);

    response.data.items?.forEach(ns => {
      console.log(`  - ${ns.name}`);
    });

  } catch (error) {
    if (error instanceof AuthenticationError) {
      console.error('Auth error:', error.message);
    } else if (error instanceof F5XCApiError) {
      console.error(`API error ${error.status}:`, error.message);
    } else {
      throw error;
    }
  }
}

listNamespaces();
```

## Related

- [CredentialManager](credential-manager.md) - Credential management
- [Configuration](../getting-started/configuration.md) - HTTP client options
