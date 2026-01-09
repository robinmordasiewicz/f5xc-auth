# Installation

## Package Manager

=== "npm"

    ```bash
    npm install @robinmordasiewicz/f5xc-auth
    ```

=== "yarn"

    ```bash
    yarn add @robinmordasiewicz/f5xc-auth
    ```

=== "pnpm"

    ```bash
    pnpm add @robinmordasiewicz/f5xc-auth
    ```

## Requirements

| Requirement | Version |
|-------------|---------|
| Node.js | >= 18.0.0 |
| TypeScript | >= 5.0 (optional) |

## Dependencies

The library has minimal dependencies:

- **axios** - HTTP client for API requests
- **yaml** - YAML parsing for configuration files

## TypeScript Support

Full TypeScript support is included out of the box. Type definitions are bundled with the package.

```typescript
import type { Profile, ProfileConfig } from '@robinmordasiewicz/f5xc-auth';
```

## ESM Module

This package is distributed as an ES Module. Ensure your project is configured for ESM:

```json title="package.json"
{
  "type": "module"
}
```

Or use the `.mjs` extension for your files.

## Verify Installation

After installation, verify the package is working:

```typescript
import { CredentialManager } from '@robinmordasiewicz/f5xc-auth';

const cm = new CredentialManager();
console.log('f5xc-auth installed successfully!');
```

## Next Steps

Continue to the [Quick Start Guide](quickstart.md) to learn basic usage.
