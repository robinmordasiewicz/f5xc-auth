# f5xc-auth

[![npm version](https://img.shields.io/npm/v/@robinmordasiewicz/f5xc-auth)](https://www.npmjs.com/package/@robinmordasiewicz/f5xc-auth)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Authentication library for F5 Distributed Cloud with XDG-compliant profile management.

## Installation

```bash
npm install @robinmordasiewicz/f5xc-auth
```

## Quick Start

```typescript
import { HttpClient, ProfileManager } from '@robinmordasiewicz/f5xc-auth';

// Load profile
const profile = await ProfileManager.load('my-profile');

// Create authenticated HTTP client
const client = await HttpClient.create(profile);

// Make API call
const response = await client.get('/api/v1/namespace');
```

## Features

- **Multiple auth methods** - API tokens, P12 certificates, cert/key pairs
- **XDG-compliant storage** - Profiles in `~/.config/f5xc/profiles/`
- **Environment override** - Use env vars for CI/CD contexts
- **URL normalization** - Automatic tenant URL handling
- **Pre-configured HTTP** - Axios client with auth and retry logic
- **TypeScript** - Full type safety and IntelliSense support

## Documentation

Full documentation: **https://robinmordasiewicz.github.io/f5xc-auth/**

- [Authentication Guide](https://robinmordasiewicz.github.io/f5xc-auth/authentication/)
- [API Reference](https://robinmordasiewicz.github.io/f5xc-auth/api/)
- [Examples](https://robinmordasiewicz.github.io/f5xc-auth/examples/)

## Requirements

Node.js >= 18

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines and automated release process.

## License

MIT - see [LICENSE](./LICENSE)
