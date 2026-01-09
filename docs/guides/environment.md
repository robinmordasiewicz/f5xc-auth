# Environment Variables

This guide covers using environment variables to configure authentication for CI/CD pipelines and containerized deployments.

## Overview

Environment variables provide a flexible way to configure credentials without storing them in files. They take priority over profile settings.

## Available Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `F5XC_API_URL` | Yes | F5 XC tenant URL |
| `F5XC_API_TOKEN` | Conditional | API token (if using token auth) |
| `F5XC_P12_BUNDLE` | Conditional | Path to P12 certificate |
| `F5XC_CERT` | Conditional | Path to certificate file |
| `F5XC_KEY` | Conditional | Path to private key file |
| `F5XC_NAMESPACE` | No | Default namespace |
| `F5XC_TLS_INSECURE` | No | Disable TLS verification |
| `F5XC_CA_BUNDLE` | No | Path to custom CA bundle |

## Basic Usage

### API Token

```bash
export F5XC_API_URL="https://mytenant.console.ves.volterra.io"
export F5XC_API_TOKEN="your-api-token"
export F5XC_NAMESPACE="my-namespace"  # Optional
```

### P12 Certificate

```bash
export F5XC_API_URL="https://mytenant.console.ves.volterra.io"
export F5XC_P12_BUNDLE="/path/to/certificate.p12"
```

### Certificate + Key

```bash
export F5XC_API_URL="https://mytenant.console.ves.volterra.io"
export F5XC_CERT="/path/to/cert.pem"
export F5XC_KEY="/path/to/key.pem"
```

## CI/CD Integration

### GitHub Actions

```yaml title=".github/workflows/deploy.yml"
name: Deploy
on: push

jobs:
  deploy:
    runs-on: ubuntu-latest
    env:
      F5XC_API_URL: ${{ secrets.F5XC_API_URL }}
      F5XC_API_TOKEN: ${{ secrets.F5XC_API_TOKEN }}
      F5XC_NAMESPACE: ${{ vars.F5XC_NAMESPACE }}

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run deployment
        run: npm run deploy
```

### GitLab CI

```yaml title=".gitlab-ci.yml"
variables:
  F5XC_API_URL: $F5XC_API_URL
  F5XC_API_TOKEN: $F5XC_API_TOKEN

deploy:
  stage: deploy
  script:
    - npm ci
    - npm run deploy
```

### Jenkins

```groovy title="Jenkinsfile"
pipeline {
    agent any

    environment {
        F5XC_API_URL = credentials('f5xc-api-url')
        F5XC_API_TOKEN = credentials('f5xc-api-token')
    }

    stages {
        stage('Deploy') {
            steps {
                sh 'npm ci'
                sh 'npm run deploy'
            }
        }
    }
}
```

## Docker Integration

### Dockerfile

```dockerfile title="Dockerfile"
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

# Credentials passed at runtime, not build time
CMD ["node", "dist/index.js"]
```

### Docker Compose

```yaml title="docker-compose.yml"
services:
  app:
    build: .
    environment:
      - F5XC_API_URL=${F5XC_API_URL}
      - F5XC_API_TOKEN=${F5XC_API_TOKEN}
      - F5XC_NAMESPACE=${F5XC_NAMESPACE:-default}
```

### Docker Run

```bash
docker run -e F5XC_API_URL="https://tenant.console.ves.volterra.io" \
           -e F5XC_API_TOKEN="your-token" \
           myapp
```

## Kubernetes Integration

### Secret

```yaml title="secret.yaml"
apiVersion: v1
kind: Secret
metadata:
  name: f5xc-credentials
type: Opaque
stringData:
  F5XC_API_URL: "https://mytenant.console.ves.volterra.io"
  F5XC_API_TOKEN: "your-api-token"
```

### Deployment

```yaml title="deployment.yaml"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  template:
    spec:
      containers:
        - name: app
          image: myapp:latest
          envFrom:
            - secretRef:
                name: f5xc-credentials
          env:
            - name: F5XC_NAMESPACE
              value: "production"
```

## Priority Order

Environment variables override profile settings:

1. **Environment Variables** (highest priority)
2. **Active Profile**
3. **Documentation Mode** (lowest priority)

This allows you to:

```bash
# Use staging credentials even with production profile active
F5XC_API_URL="https://staging.console.ves.volterra.io" \
F5XC_API_TOKEN="staging-token" \
npm run test
```

## TLS Configuration

### Custom CA Bundle

For environments with custom certificate authorities:

```bash
export F5XC_CA_BUNDLE="/etc/pki/tls/certs/custom-ca.crt"
```

### Insecure Mode (Staging Only)

!!! danger "Warning"
    Only use for staging/development environments!

```bash
export F5XC_TLS_INSECURE="true"
```

## Validation in Code

Check if credentials come from environment:

```typescript
import { CredentialManager } from '@robinmordasiewicz/f5xc-auth';

const cm = new CredentialManager();
await cm.initialize();

// getActiveProfile() returns null when using env vars
if (!cm.getActiveProfile()) {
  console.log('Using credentials from environment variables');
} else {
  console.log(`Using profile: ${cm.getActiveProfile()}`);
}
```

## Troubleshooting

### Variable Not Set

```typescript
if (!process.env.F5XC_API_URL) {
  console.error('F5XC_API_URL is not set');
  process.exit(1);
}
```

### Variable Verification Script

```typescript
const required = ['F5XC_API_URL'];
const authOptions = ['F5XC_API_TOKEN', 'F5XC_P12_BUNDLE', 'F5XC_CERT'];

// Check required
for (const v of required) {
  if (!process.env[v]) {
    console.error(`Missing required: ${v}`);
    process.exit(1);
  }
}

// Check at least one auth method
const hasAuth = authOptions.some(v => process.env[v]);
if (!hasAuth) {
  console.error('No authentication configured');
  console.error(`Set one of: ${authOptions.join(', ')}`);
  process.exit(1);
}
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Variables not loaded | Ensure shell profile exports them |
| Variables empty in Docker | Check docker-compose or K8s config |
| CI variables not visible | Check secret/variable scope |
| Token expired | Regenerate in F5 XC Console |
