# Getting Started

This guide will help you install and configure `@robinmordasiewicz/f5xc-auth` for your F5 Distributed Cloud projects.

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18** or later installed
- **npm** or **yarn** package manager
- **F5 Distributed Cloud** tenant access with valid credentials

## What You'll Learn

1. [Installation](installation.md) - How to install the package
2. [Quick Start](quickstart.md) - Basic usage and first steps
3. [Configuration](configuration.md) - Profile setup and environment variables

## Overview

The `f5xc-auth` library provides three main components:

| Component | Purpose |
|-----------|---------|
| **CredentialManager** | Manages authentication state and credential resolution |
| **ProfileManager** | Handles profile CRUD operations and storage |
| **HttpClient** | Pre-configured Axios client with auth headers |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Your Application                    │
├─────────────────────────────────────────────────────┤
│                    f5xc-auth                         │
│  ┌──────────────┬──────────────┬──────────────────┐ │
│  │ Credential   │   Profile    │    HTTP          │ │
│  │ Manager      │   Manager    │    Client        │ │
│  └──────┬───────┴──────┬───────┴────────┬─────────┘ │
│         │              │                │           │
│         ▼              ▼                ▼           │
│  ┌──────────────────────────────────────────────┐  │
│  │           ~/.config/f5xc/profiles/           │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Credential Priority

The library resolves credentials in the following order:

1. **Environment Variables** (highest priority)
2. **Active Profile** from `~/.config/f5xc/`
3. **Documentation Mode** (no credentials - lowest priority)

This allows you to override profile settings in CI/CD pipelines while maintaining local development profiles.

## Next Steps

Start with the [Installation Guide](installation.md) to add the package to your project.
