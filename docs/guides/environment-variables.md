# Environment Variables

Configure authentication using environment variables for CI/CD workflows.

---

## Environment Variables Reference

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

---

## Priority Order

Credentials are resolved in the following order (highest to lowest priority):

1. **Environment variables** - Override everything
2. **Active profile** - From `~/.config/f5xc/profiles/`
3. **Documentation mode** - No credentials (read-only operations)

---

## CI/CD Example

```bash
#!/bin/bash
# .github/workflows/deploy.yml or similar

export F5XC_API_URL="https://mytenant.console.ves.volterra.io"
export F5XC_API_TOKEN="${{ secrets.F5XC_API_TOKEN }}"
export F5XC_NAMESPACE="production"

node deploy.js
```

---

## Docker Example

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

```yaml
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

## See Also

- [Authentication](../authentication/) - Configure authentication methods
- [Profile Management](profile-management/) - Manage profiles
- [CredentialManager API](../api/credential-manager/) - API documentation
