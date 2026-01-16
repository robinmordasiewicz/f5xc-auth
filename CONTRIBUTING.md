# Contributing to f5xc-auth

## Automated Release Process

This project uses **semantic-release** for automated versioning and publishing. Commits to the `main` branch automatically trigger version bumps and npm releases based on commit message format.

## Commit Message Format

Use **Conventional Commits** format for all commits:

| Type | Description | Version Bump |
|------|-------------|--------------|
| `feat:` | New feature | Minor (0.x.0) |
| `fix:` | Bug fix | Patch (0.0.x) |
| `docs:` | Documentation only | None |
| `test:` | Tests only | None |
| `chore:` | Build/tooling changes | None |

**Examples:**
```bash
feat: add P12 certificate authentication
fix: resolve profile loading race condition
docs: update authentication guide
test: add integration tests for profile rotation
chore: update dependencies
```

## Breaking Changes

To trigger a **major version** bump (x.0.0), add `BREAKING CHANGE:` in the commit footer:

```bash
feat: redesign profile API

BREAKING CHANGE: ProfileManager.load() now returns Promise<Profile> instead of Profile
```

## Development Workflow

1. **Clone and install**:
   ```bash
   git clone https://github.com/robinmordasiewicz/f5xc-auth.git
   cd f5xc-auth
   npm install
   ```

2. **Make changes**: Follow existing code patterns and TypeScript best practices

3. **Run tests**: Ensure all tests pass before committing
   ```bash
   npm test              # Run all tests
   npm run test:unit     # Unit tests only
   npm run test:integration  # Integration tests
   npm run test:coverage # Generate coverage report
   ```

4. **Commit with conventional format**: Your commit message determines the release version

## Full Documentation

For comprehensive guidelines including:
- Detailed testing strategies
- Code style standards
- Security considerations
- Architecture patterns

See **[docs/contributing.md](./docs/contributing.md)** (298 lines)
