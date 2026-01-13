# F5 Distributed Cloud Monorepo

Unified monorepo combining F5 Distributed Cloud authentication, Terraform provider, and API MCP server.

## Packages

This monorepo contains three main packages:

### 1. [@robinmordasiewicz/f5xc-auth](./packages/f5xc-auth/)

Shared authentication library for F5 Distributed Cloud MCP servers. Provides XDG-compliant profile management and credential handling.

- **NPM**: `@robinmordasiewicz/f5xc-auth`
- **Features**: API token, P12 certificate, cert/key authentication, profile management, URL normalization
- **Directory**: `packages/f5xc-auth/`

### 2. [@robinmordasiewicz/f5xc-api-mcp](./packages/f5xc-api-mcp/)

MCP (Model Context Protocol) server that exposes F5 Distributed Cloud APIs to AI assistants. Enables natural language interaction with F5XC infrastructure through Claude, VS Code, and other MCP-compatible tools.

- **NPM**: `@robinmordasiewicz/f5xc-api-mcp`
- **Features**: 1500+ API tools, domain-based documentation, dual-mode operation (docs + execution), curl examples
- **Directory**: `packages/f5xc-api-mcp/`

### 3. [Terraform Provider for F5 Distributed Cloud](./packages/terraform-provider/)

Community Terraform provider for F5 Distributed Cloud (version 3.0.0 - clean break release).

- **Registry**: `robinmordasiewicz/f5xc`
- **Features**: API v2 based, 98+ resources available, import support, pre-release clean break
- **Directory**: `packages/terraform-provider/`
- **Language**: Go

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 7.0.0 (for workspace support)
- Go >= 1.22 (for Terraform provider development)

### Installation

Clone the repository:

```bash
git clone https://github.com/robinmordasiewicz/f5xc.git
cd f5xc
```

Install dependencies for all packages:

```bash
npm install
```

### Development

Run tests across all packages:

```bash
npm test
```

Build all packages:

```bash
npm run build
```

Lint all packages:

```bash
npm run lint
```

### Working with Individual Packages

Change into a package directory and work as normal:

```bash
cd packages/f5xc-auth
npm install
npm run build
npm test
```

## Architecture

The monorepo structure uses npm workspaces to manage three interdependent components:

```
f5xc/
├── packages/
│   ├── f5xc-auth/              # Core authentication library (TypeScript)
│   ├── f5xc-api-mcp/           # MCP server wrapper (TypeScript)
│   └── terraform-provider/     # Terraform provider (Go)
├── package.json                # Workspace root configuration
├── README.md                   # This file
└── .github/                    # GitHub workflows
```

## Authentication Flow

1. **f5xc-auth**: Handles credential management and profile storage
2. **f5xc-api-mcp**: Uses f5xc-auth for API authentication
3. **terraform-provider**: Can use f5xc-auth patterns for credential handling

## Documentation

- [f5xc-auth Documentation](./packages/f5xc-auth/docs/)
- [f5xc-api-mcp Documentation](./packages/f5xc-api-mcp/)
- [Terraform Provider Documentation](./packages/terraform-provider/)

## License

MIT - See individual package LICENSE files for details.

## Contributing

See [Contributing Guidelines](./packages/f5xc-auth/docs/contributing.md) in the f5xc-auth package.

## Support

- **Issues**: [GitHub Issues](https://github.com/robinmordasiewicz/f5xc/issues)
- **F5 Distributed Cloud Docs**: https://docs.cloud.f5.com/
- **Terraform Registry**: https://registry.terraform.io/providers/robinmordasiewicz/f5xc/

## Author

Robin Mordasiewicz
