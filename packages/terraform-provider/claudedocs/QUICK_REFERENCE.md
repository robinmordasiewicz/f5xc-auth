# F5XC Terraform Provider - Quick Reference Guide

## Project Overview
- **Framework**: HashiCorp Terraform Plugin Framework v1.16.1
- **Language**: Go 1.24.0
- **Scale**: 144 resources + 144 data sources + 300+ documentation files
- **Architecture**: DRY code generation from OpenAPI specs
- **Status**: Community-maintained, actively developed

---

## Essential Commands

### Build & Test
```bash
make build              # Build binary
make test              # Unit tests
make lint              # Lint code
make testacc           # Acceptance tests (requires F5XC credentials)
```

### Code Generation
```bash
make generate          # Generate from OpenAPI specs
make docs             # Generate Terraform documentation
SPEC_DIR=/path make generate  # Specify spec directory
```

### Code Organization
```
internal/
├── provider/          # 144+ resources & data sources (auto-generated)
├── client/            # API HTTP client (auto-generated types)
├── acctest/           # Test infrastructure & utilities
├── blindfold/         # Encryption library (manually maintained)
├── functions/         # Provider functions (manually maintained)
├── validators/        # Custom Terraform validators
└── [other utilities]

tools/
├── generate-all-schemas.go    # Main generator (creates resources/types)
├── transform-docs.go          # Doc post-processor
└── [15+ other generators]
```

---

## Critical Rules

### Rule 1: NEVER Manually Edit Generated Files
- **Generated files**: `*_resource.go`, `*_data_source.go`, `*_types.go`, `docs/*.md`
- **Solution**: Always fix the **generator tool**, not the generated file
- **Example**: Bug in resource code → Fix `tools/generate-all-schemas.go` → Regenerate all

### Rule 2: GitHub Workflow
1. Create issue first: `gh issue create --title "feat: ..."`
2. Create branch from issue: `gh issue develop <number> --checkout`
3. Commit with issue reference: `git commit -m "feat: ... Closes #<number>"`
4. PR with closing keyword: `Closes #<number>`

### Rule 3: Constitution Enforcement
- **CI checks** block PRs with manually-edited generated files
- **Pre-commit hooks** block commits of generated files
- **Branch protection** requires CI passes

---

## Acceptance Test Setup

### Environment Variables (P12 Auth - Recommended)
```bash
export F5XC_API_P12_FILE="/path/to/cert.p12"
export F5XC_P12_PASSWORD="password"
export F5XC_API_URL="https://console.ves.volterra.io"
export TF_ACC=1
```

### Running Tests
```bash
# All tests
make testacc

# Specific test
TF_ACC=1 go test -v ./internal/provider -run TestAccNamespaceResource_basic

# Clean up resources
make sweep                          # All test prefixes
make sweep-resource RESOURCE=f5xc_namespace  # Specific type
```

---

## File Classifications

### Auto-Generated (Do NOT Edit)
| Files | Tool | When |
|-------|------|------|
| `internal/provider/*_resource.go` | generate-all-schemas.go | Tool or spec changes |
| `internal/provider/*_data_source.go` | generate-all-schemas.go | Tool or spec changes |
| `internal/client/*_types.go` | generate-client-types.go | Tool or spec changes |
| `internal/provider/provider.go` | register-resources.go | Tool or spec changes |
| `docs/resources/*.md` | tfplugindocs | Tool or spec changes |
| `examples/resources/*/*.tf` | generate-examples.go | Tool or spec changes |

### Manually Maintained (Safe to Edit)
| Files | Purpose |
|-------|---------|
| `internal/functions/*` | Provider functions |
| `internal/blindfold/*` | Encryption library |
| `internal/provider/functions_registration.go` | Function registration |
| `internal/provider/resource_base.go` | Base utilities |
| `examples/functions/*/*.tf` | Function examples |
| `docs/index.md` | Provider overview |

---

## Architecture Patterns

### Resource Implementation
```go
type MyResource struct {
    client *client.Client
}

// Required methods:
func (r *MyResource) Metadata(...) { /* type name */ }
func (r *MyResource) Schema(...) { /* attributes + blocks */ }
func (r *MyResource) Configure(...) { /* inject client */ }
func (r *MyResource) Create(...) { /* API POST */ }
func (r *MyResource) Read(...) { /* API GET */ }
func (r *MyResource) Update(...) { /* API PUT */ }
func (r *MyResource) Delete(...) { /* API DELETE */ }
func (r *MyResource) ImportState(...) { /* import support */ }
```

### Client CRUD Methods
```go
// Pattern: Create{ResourceType}
client.CreateNamespace(ctx, namespace, &Namespace{...})

// Pattern: Get{ResourceType}
client.GetNamespace(ctx, namespace, name)

// Pattern: Update{ResourceType}
client.UpdateNamespace(ctx, namespace, &Namespace{...})

// Pattern: Delete{ResourceType}
client.DeleteNamespace(ctx, namespace, name)

// Pattern: List{ResourceTypes}
client.ListNamespaces(ctx, namespace)
```

### Authentication Methods
1. **API Token** (default):
   ```bash
   export F5XC_API_TOKEN="token"
   ```

2. **P12 Certificate** (automated tests):
   ```bash
   export F5XC_API_P12_FILE="/path/cert.p12"
   export F5XC_P12_PASSWORD="password"
   ```

3. **PEM Certificate**:
   ```bash
   export F5XC_API_CERT="/path/cert.crt"
   export F5XC_API_KEY="/path/key.key"
   export F5XC_API_CA_CERT="/path/ca.crt"  # Optional
   ```

---

## CI/CD Workflows

### Main Orchestrator: `on-merge.yml`
Runs on push to main, handles all automation:
1. Detect changes (specs, code, tools)
2. Build & test
3. If regeneration needed: Generate & create PR
4. If complete: Tag & release

### PR Validation: `ci.yml`
Runs on PRs, prevents bad code:
- Build & test
- Linting (golangci-lint)
- Constitution check (no generated file edits)

### Spec Sync: `sync-openapi.yml`
Scheduled (twice daily):
- Downloads latest F5XC OpenAPI specs
- Creates PR if changed

---

## Custom Tools (.claude/)

### Agent: terraform-test-developer
Custom persona for acceptance test development

### Skill: terraform-provider-testing
Comprehensive guidance for:
- Modern assertion patterns (ConfigPlanChecks, ConfigStateChecks)
- State validation with knownvalue
- Import testing
- Parallel test execution
- Test cleanup strategies

### Skill: github-issue-workflow
Enforces:
- Issue-first development
- Branch naming conventions
- Commit message standards
- PR linking

### Skill: terraform-registry-inspector
Validates documentation rendering on Terraform Registry

---

## Common Tasks

### Adding a New Resource
1. Create GitHub issue
2. Download/update OpenAPI specs
3. `SPEC_DIR=/path make generate`
4. Generator creates: `*_resource.go`, `*_data_source.go`, examples
5. Write acceptance tests in `*_resource_test.go`
6. `make testacc` to validate
7. Create PR

### Fixing a Generator Bug
1. Identify the generator tool (e.g., `generate-all-schemas.go`)
2. Fix the bug in the tool
3. `SPEC_DIR=/path make generate`
4. Verify fixes in generated files
5. Commit only the tool change
6. CI/CD regenerates all resources with fix

### Running Local Development
```bash
# Build locally
make build

# Install locally for Terraform
make install

# Run acceptance test
TF_ACC=1 go test -v ./internal/provider -run TestAccNamespaceResource

# Check your changes
git status
git diff internal/provider/namespace_resource.go  # Should show what changed
```

---

## Configuration

### Makefile Targets
```
make build              Build provider binary
make test              Run unit tests
make lint              Run linters
make fmt               Format code
make generate          Generate from OpenAPI specs
make docs             Generate Terraform documentation
make clean            Remove build artifacts
make install          Install locally for testing
make testacc          Run acceptance tests
make sweep            Clean up test resources
make help             Show all targets
```

### Linting Rules (.golangci.yml)
- **Enabled**: errcheck, govet, ineffassign, staticcheck, unused
- **Excluded**: tools directory, test error handling
- **Timeout**: 5 minutes

### GoReleaser (.goreleaser.yml)
- **Platforms**: Linux, macOS, Windows, FreeBSD
- **Architectures**: amd64, 386, arm, arm64
- **Output**: Zip archives with checksums

---

## Project Statistics

| Metric | Value |
|--------|-------|
| Resources | 144 |
| Data Sources | 144 |
| Test Files | 140+ |
| Documentation Files | 300+ |
| Auto-Generated Lines | ~282,000 |
| Generator Tools | 16+ |
| CI/CD Workflows | 7 |
| Go Version | 1.24.0 |
| Framework Version | v1.16.1 |

---

## Key Principles

1. **DRY**: Single source of truth from OpenAPI specs
2. **One-way generation**: OpenAPI → Go code (never reverse)
3. **Constitution first**: Prevent manual generated file edits
4. **Orchestrated CI/CD**: Prevent cascading automation
5. **Modern Terraform patterns**: Plugin Framework v1, modern assertions
6. **Multi-auth**: Token, P12, and PEM certificates
7. **Comprehensive testing**: Acceptance + unit tests
8. **Transparent development**: Issue → Branch → PR → Merge → Release

---

## Resources

- **Framework Docs**: https://developer.hashicorp.com/terraform/plugin/framework
- **Testing SDK**: https://github.com/hashicorp/terraform-plugin-testing
- **Provider Registry**: https://registry.terraform.io/providers/robinmordasiewicz/f5xc/latest
- **F5 XC API Docs**: https://docs.cloud.f5.com/
- **Project Repository**: https://github.com/robinmordasiewicz/terraform-provider-f5xc

