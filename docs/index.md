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

## Getting Started

<div class="features-grid">
  <a href="authentication/" class="feature-card">
    <div class="feature-card-header">
      <h3>Authentication</h3>
    </div>
    <p>Configure authentication with API tokens, P12 certificates, or certificate/key pairs</p>
  </a>

  <a href="guides/quick-start/" class="feature-card">
    <div class="feature-card-header">
      <h3>Quick Start</h3>
    </div>
    <p>Get started with basic authentication and API calls</p>
  </a>

  <a href="guides/" class="feature-card">
    <div class="feature-card-header">
      <h3>Guides</h3>
    </div>
    <p>Practical guides for common workflows and features</p>
  </a>

  <a href="api/" class="feature-card">
    <div class="feature-card-header">
      <h3>API Reference</h3>
    </div>
    <p>Complete API documentation for all classes and functions</p>
  </a>

  <a href="examples/" class="feature-card">
    <div class="feature-card-header">
      <h3>Examples</h3>
    </div>
    <p>Real-world code examples demonstrating library usage</p>
  </a>

  <a href="troubleshooting/" class="feature-card">
    <div class="feature-card-header">
      <h3>Troubleshooting</h3>
    </div>
    <p>Common issues and solutions with debug mode tips</p>
  </a>
</div>

---

## Next Steps

- **New users**: Start with [Authentication](authentication/) to configure your credentials
- **Developers**: Explore [Guides](guides/) for common workflows
- **API integration**: Check the [API Reference](api/) for detailed documentation
- **Need help**: Visit [Troubleshooting](troubleshooting/) for solutions to common issues
