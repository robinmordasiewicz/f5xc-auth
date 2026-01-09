# f5xc-auth

<div class="hero" markdown>

# f5xc-auth

Shared authentication library for F5 Distributed Cloud MCP servers.
XDG-compliant profile management and credential handling.

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

## Overview

`@robinmordasiewicz/f5xc-auth` provides a unified authentication layer for F5 Distributed Cloud (F5 XC) applications. It handles credential management, profile storage, and HTTP client configuration following XDG Base Directory specifications.

## Features

<div class="feature-grid" markdown>

<div class="feature-card" markdown>

### :material-folder-key: XDG-Compliant Storage

Profiles stored in `~/.config/f5xc/profiles/` following XDG Base Directory specification for cross-platform compatibility.

</div>

<div class="feature-card" markdown>

### :material-key-chain: Multiple Auth Methods

Support for API tokens, P12 certificate bundles, and certificate/key pairs for flexible authentication options.

</div>

<div class="feature-card" markdown>

### :material-cog: Environment Variables

Override profile settings with environment variables for CI/CD pipelines and containerized deployments.

</div>

<div class="feature-card" markdown>

### :material-link: URL Normalization

Automatically handles various F5 XC tenant URL formats, normalizing them for consistent API access.

</div>

<div class="feature-card" markdown>

### :material-shield-lock: TLS Configuration

Custom CA bundles for enterprise environments and insecure mode for staging/development.

</div>

<div class="feature-card" markdown>

### :material-api: HTTP Client

Pre-configured Axios HTTP client with automatic authentication header injection and retry logic.

</div>

</div>

## Quick Install

```bash
npm install @robinmordasiewicz/f5xc-auth
```

## Basic Usage

```typescript
import { CredentialManager } from '@robinmordasiewicz/f5xc-auth';

const credentialManager = new CredentialManager();
await credentialManager.initialize();

if (credentialManager.isAuthenticated()) {
  console.log(`Authenticated as: ${credentialManager.getTenant()}`);
  console.log(`API URL: ${credentialManager.getApiUrl()}`);
}
```

## Requirements

- **Node.js**: 18 or later
- **F5 Distributed Cloud**: Valid tenant credentials

## Getting Help

- [Getting Started Guide](getting-started/index.md) - Installation and initial setup
- [API Reference](api/index.md) - Complete API documentation
- [GitHub Issues](https://github.com/robinmordasiewicz/f5xc-auth/issues) - Report bugs or request features

## License

This project is licensed under the MIT License. See the [LICENSE](https://github.com/robinmordasiewicz/f5xc-auth/blob/main/LICENSE) file for details.
