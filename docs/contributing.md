# Contributing

Thank you for your interest in contributing to f5xc-auth!

---

## 🚀 Automated Release Process

This project uses **100% automated CI/CD** for releases. No manual intervention required!

### How It Works

1. **Merge PR to main** → Automated release workflow triggers
2. **Analyze commits** → Determines version bump based on conventional commits
3. **Run tests & build** → Ensures quality before release
4. **Update version** → Automatically increments package.json
5. **Generate changelog** → Creates/updates CHANGELOG.md
6. **Create GitHub release** → Publishes release notes
7. **Publish to npm** → Pushes package to npmjs.com
8. **Commit changes** → Updates version files back to main

### What This Means for Contributors

- ✅ **Use conventional commits** (required for automated versioning)
- ✅ **Merge PRs to main** (triggers the automation)
- ❌ **Never manually bump versions** (automation handles this)
- ❌ **Never manually create releases** (automation handles this)
- ❌ **Never manually publish to npm** (automation handles this)

---

## 📝 Conventional Commits

All commits must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Commit Types

| Type | Description | Version Bump | Example |
|------|-------------|--------------|---------|
| `feat` | New feature | **Minor** (1.x.0) | `feat: add certificate validation` |
| `feat(auth)` | Auth feature | **Minor** (1.x.0) | `feat(auth): add JWT support` |
| `fix` | Bug fix | **Patch** (1.0.x) | `fix: resolve token expiration issue` |
| `fix(auth)` | Auth bug fix | **Patch** (1.0.x) | `fix(auth): handle null tenant` |
| `docs` | Documentation | **Patch** (1.0.x) | `docs: update authentication guide` |
| `perf` | Performance improvement | **Patch** (1.0.x) | `perf: optimize HTTP client caching` |
| `refactor` | Code refactoring | **Patch** (1.0.x) | `refactor: simplify profile loading logic` |
| `style` | Code style | **Patch** (1.0.x) | `style: fix formatting` |
| `test` | Tests only | **No release** | `test: add profile manager tests` |
| `test(auth)` | Auth tests | **Patch** (1.0.x) | `test(auth): add credential tests` |
| `chore` | Maintenance | **No release** | `chore: update dependencies` |
| `chore(auth)` | Auth maintenance | **Patch** (1.0.x) | `chore(auth): update auth logic` |
| `ci` | CI/CD changes | **No release** | `ci: update release workflow` |
| `build` | Build system | **No release** | `build: update TypeScript config` |
| `build(auth)` | Auth build | **Patch** (1.0.x) | `build(auth): compile auth module` |

### Breaking Changes

For breaking changes (major version bump), add `BREAKING CHANGE:` in the commit footer:

```
feat: redesign authentication API

BREAKING CHANGE: The `authenticate()` method now returns a Promise<AuthResult> instead of boolean
```

This will trigger a **Major** version bump (x.0.0).

### Auth Scope Rule (Special Behavior)

**Important**: Any commit with scope `(auth)` will **always trigger a release**, regardless of type.

This ensures that any changes to authentication code are immediately released:

| Commit | Normal Behavior | With `(auth)` Scope |
|--------|----------------|---------------------|
| `test: add tests` | No release | No release |
| `test(auth): add auth tests` | No release | **Patch release** (1.0.x) |
| `chore: update deps` | No release | No release |
| `chore(auth): refactor auth code` | No release | **Patch release** (1.0.x) |
| `build: update config` | No release | No release |
| `build(auth): update auth build` | No release | **Patch release** (1.0.x) |

**Why?** The auth module is critical for security and functionality. Any changes to it should be immediately available to users, even if it's just test additions or internal refactoring.

**When to use `(auth)` scope:**
- Changes to `src/auth/` directory
- Changes affecting authentication logic
- Security-related updates
- Credential management modifications

### Examples

**Good commits:**
```bash
feat: add support for custom CA bundles
feat(auth): add JWT token validation
fix: handle undefined namespace in profile
fix(auth): resolve credential loading race condition
docs: add troubleshooting section for TLS errors
perf: reduce HTTP client initialization time
test(auth): add comprehensive auth flow tests
chore(auth): refactor credential manager internals
```

**Bad commits:**
```bash
update code              # ❌ No type
fixed bug                # ❌ No type, vague description
WIP                      # ❌ Not conventional format
feat add new feature     # ❌ Missing colon
```

---

## 🔄 Development Workflow

### 1. Create Feature Branch

```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Write code following project conventions
- Add/update tests
- Update documentation if needed

### 3. Commit with Conventional Format

```bash
git add .
git commit -m "feat: add new authentication method"
```

### 4. Push and Create PR

```bash
git push origin feature/your-feature-name
gh pr create --title "feat: add new authentication method" --body "Description of changes"
```

### 5. Merge PR

Once approved and CI passes:
```bash
gh pr merge <pr-number> --merge
```

### 6. Automation Takes Over

The release workflow automatically:
- Analyzes all commits since last release
- Determines version bump
- Runs tests and builds
- Creates release and publishes to npm
- Updates CHANGELOG.md
- Creates GitHub release with notes

---

## 🧪 Testing Locally

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Type check
npm run typecheck

# Build
npm run build
```

---

## 📦 Release Examples

### Patch Release (1.0.x)

Commits:
```
fix: resolve profile loading issue
docs: update API documentation
```

Result: `1.0.1` → `1.0.2`

### Minor Release (1.x.0)

Commits:
```
feat: add JWT token support
feat: add profile export functionality
fix: handle expired certificates
```

Result: `1.0.2` → `1.1.0`

### Major Release (x.0.0)

Commit:
```
feat: redesign authentication API

BREAKING CHANGE: Complete API redesign. See migration guide.
```

Result: `1.1.0` → `2.0.0`

### Auth-Scoped Patch Release (1.0.x)

Even infrastructure commits to auth code trigger releases:

Commits:
```
test(auth): add credential validation tests
chore(auth): refactor token handling
```

Result: `1.0.1` → `1.0.2`

**Why this matters**: Auth changes need immediate availability for security and stability, even if they're just tests or internal improvements.

---

## 🎯 Pull Request Guidelines

### PR Title

Use conventional commit format:
```
feat: add custom CA bundle support
fix: resolve token refresh issue
docs: update quick start guide
```

### PR Description

Include:
- Summary of changes
- Motivation and context
- Testing performed
- Breaking changes (if any)
- Related issues

### Before Submitting

- [ ] Tests pass (`npm test`)
- [ ] Type check passes (`npm run typecheck`)
- [ ] Build succeeds (`npm run build`)
- [ ] Commit messages follow conventional format
- [ ] Documentation updated (if needed)
- [ ] No manual version changes in package.json

---

## 🔐 Secrets Configuration

For maintainers only:

Required GitHub repository secrets:
- `NPM_TOKEN` - npm authentication token with publish access
- `GITHUB_TOKEN` - Automatically provided by GitHub Actions

---

## 📚 Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [semantic-release](https://github.com/semantic-release/semantic-release)
- [Keep a Changelog](https://keepachangelog.com/)

---

## ❓ Questions?

Open an issue or discussion on GitHub!
