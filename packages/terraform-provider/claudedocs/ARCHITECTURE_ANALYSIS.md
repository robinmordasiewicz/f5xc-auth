# F5 Distributed Cloud Terraform Provider - Comprehensive Architecture Analysis

**Repository**: `/Users/r.mordasiewicz/GIT/robinmordasiewicz/terraform-provider-f5xc`  
**Language**: Go 1.24.0  
**Framework**: HashiCorp Terraform Plugin Framework v1.16.1  
**License**: MPL-2.0  
**Status**: Community-driven, actively maintained

---

## 1. PROJECT STRUCTURE

### Directory Layout

```
terraform-provider-f5xc/
├── main.go                          # Provider entry point with version injection
├── go.mod / go.sum                  # Dependency management
├── Makefile                         # Build automation
├── .goreleaser.yml                  # Release configuration
├── .golangci.yml                    # Linting configuration
├── .pre-commit-config.yaml          # Pre-commit hooks
│
├── internal/
│   ├── provider/                    # Terraform resource/data source implementations (585 files)
│   │   ├── provider.go              # Generated - provider registration & configuration
│   │   ├── functions_registration.go # Manually maintained - provider function registration
│   │   ├── resource_base.go         # Base resource utilities
│   │   ├── provider_helpers.go      # Helper functions
│   │   ├── [144]_resource.go        # Generated resource implementations
│   │   ├── [144]_data_source.go     # Generated data source implementations
│   │   ├── [xxx]_resource_test.go   # Acceptance tests
│   │   └── [xxx]_data_source_test.go# Data source tests
│   │
│   ├── client/                      # F5XC API client (HTTP communication layer)
│   │   ├── client.go                # Main HTTP client with auth support (P12, PEM, Token)
│   │   ├── list_operations.go       # List/pagination operations
│   │   ├── [xxx]_types.go           # Generated type definitions from OpenAPI specs
│   │   └── client_test.go           # Client unit tests
│   │
│   ├── acctest/                     # Acceptance testing utilities
│   │   ├── acctest.go               # Test setup, auth handling, provider factories
│   │   ├── sweep.go                 # Resource cleanup for failed tests
│   │   ├── sweep_test.go            # Sweep test runner
│   │   ├── tracker.go               # Track created resources for cleanup
│   │   ├── rate_limit.go            # Rate limiting for API tests
│   │   ├── certificates.go          # Certificate generation for tests
│   │   └── certificates_test.go     # Certificate tests
│   │
│   ├── blindfold/                   # F5XC Secret Management encryption library
│   │   ├── seal.go                  # Main encryption/sealing logic
│   │   ├── policy.go                # Secret policy handling
│   │   ├── publickey.go             # Public key loading
│   │   ├── types.go                 # Type definitions
│   │   ├── doc.go                   # Package documentation
│   │   └── seal_test.go             # Unit tests
│   │
│   ├── functions/                   # Manually maintained - Provider-defined functions
│   │   ├── blindfold.go             # Encryption function implementation
│   │   ├── blindfold_file.go        # File encryption function
│   │   └── doc.go                   # Documentation
│   │
│   ├── validators/                  # Custom Terraform validators
│   │   └── validators.go            # Name, namespace, and custom validation logic
│   │
│   ├── planmodifiers/               # Custom plan modifiers
│   │   └── planmodifiers.go         # State management modifiers
│   │
│   ├── timeouts/                    # Timeout configuration
│   │   └── timeouts.go              # Configurable timeout blocks
│   │
│   ├── stateupgraders/              # State migration for schema changes
│   │   └── stateupgraders.go        # Version-based state upgrades
│   │
│   ├── privatestate/                # Private state metadata storage
│   │   └── privatestate.go          # Internal state management
│   │
│   └── errors/                      # Custom error types
│       └── errors.go                # Error handling utilities
│
├── tools/                           # Code generation utilities
│   ├── generate-all-schemas.go      # Main generator: Creates resources/data sources/client types
│   ├── generate-resources.go        # Resource file generator
│   ├── generate-client-types.go     # Client type definitions generator
│   ├── generate-examples.go         # Terraform example file generator
│   ├── generate-datasource-examples.go # Data source examples
│   ├── generate-datasource-tests.go # Auto-generates acceptance test templates
│   ├── transform-docs.go            # Doc post-processor (OneOf grouping)
│   ├── register-resources.go        # Provider registration generator
│   ├── fix-client-types.go          # Client type fixer
│   ├── upgrade-resources.go         # Resource upgrader
│   ├── calculate-terraform-version.go # Version calculator
│   ├── add-client-types.sh          # Shell wrapper script
│   └── batch-generate.sh            # Batch generation orchestration
│
├── docs/                            # Generated and manually maintained documentation
│   ├── index.md                     # Provider overview (manually maintained)
│   ├── resources/                   # Generated resource documentation (auto-generated by tfplugindocs)
│   │   └── [144]_*.md              # Generated from code + transform-docs.go
│   ├── data-sources/                # Generated data source documentation
│   │   └── [144]_*.md              # Generated from code
│   ├── functions/                   # Generated function documentation
│   │   ├── blindfold.md            # Auto-generated
│   │   └── blindfold_file.md       # Auto-generated
│   └── specifications/
│       └── api/                     # OpenAPI specifications
│           └── docs-cloud-f5-com.*.ves-swagger.json # Downloaded from F5
│
├── examples/                        # Example Terraform configurations
│   ├── resources/                   # Generated resource examples
│   │   ├── f5xc_namespace/
│   │   │   └── resource.tf          # Auto-generated from generator
│   │   └── [144 more resources]/
│   ├── data-sources/                # Generated data source examples
│   │   └── [144 data sources]/
│   └── functions/                   # Manually maintained function examples
│       ├── blindfold/
│       │   └── function.tf          # Source for doc generation
│       └── blindfold_file/
│           └── function.tf          # Source for doc generation
│
├── .github/workflows/               # CI/CD automation (orchestrated pattern)
│   ├── ci.yml                       # PR validation (build, test, lint, constitution check)
│   ├── on-merge.yml                 # MAIN ORCHESTRATOR - Merge automation
│   ├── sync-openapi.yml             # Scheduled OpenAPI spec sync
│   ├── _build-test.yml              # Reusable: Build and test
│   ├── _generate-docs.yml           # Reusable: Documentation generation
│   ├── _generate-provider.yml       # Reusable: Provider code generation
│   └── _tag-release.yml             # Reusable: Version tagging and release
│
├── .claude/
│   ├── agents/
│   │   └── terraform-test-developer.md # Custom agent for testing workflows
│   ├── skills/
│   │   ├── terraform-provider-testing/ # Comprehensive testing skill
│   │   ├── github-issue-workflow/      # GitHub issue workflow skill
│   │   └── terraform-registry-inspector/ # Registry documentation validation
│   └── settings.local.json
│
├── claudedocs/                      # Analysis and documentation (Claude-generated)
│
└── .serena/                         # Session memory for Claude Code
    └── memories/                    # Persistent project context
```

### Scale

| Metric | Count |
|--------|-------|
| Resource implementations | 144 (+ 144 data sources) |
| Total Go files in provider | 585+ |
| Auto-generated resource lines | ~282,000 |
| Generators/tools | 13+ |
| CI/CD workflows | 7 |
| Test files | 140+ |
| Documentation files | 300+ |

---

## 2. BUILD AND TEST COMMANDS

### Build Commands

```bash
# Standard build
make build
# Produces: terraform-provider-f5xc binary

# Build with version tagging
go build -ldflags="-X main.version=1.0.0" -o terraform-provider-f5xc .

# Install locally for testing (requires VERSION and Go environment)
make install

# Release build (cross-platform, handled by goreleaser)
goreleaser release --snapshot --clean
```

### Test Commands

```bash
# Run all unit tests
make test
# Runs: go test -v -race ./internal/...

# Run linters
make lint
# Runs: golangci-lint run --timeout=5m ./internal/... .

# Format code
make fmt
# Runs: gofmt -s -w .

# Run acceptance tests (requires credentials)
make testacc
# Runs: TF_ACC=1 go test -v -timeout 120m ./internal/provider/...

# Cleanup test resources (prefix-based, shared tenant warning)
make sweep
# Runs: TF_ACC=1 go test ./internal/acctest -v -sweep=all -timeout 30m

# Cleanup specific resource type
make sweep-resource RESOURCE=f5xc_namespace
```

### Generate Commands

```bash
# Generate schemas from OpenAPI specs
make generate
# Runs: go run tools/generate-all-schemas.go --spec-dir=<SPEC_DIR>

# Generate documentation
make docs
# Runs: tfplugindocs generate && go run tools/transform-docs.go

# Generate schemas with specific spec directory
SPEC_DIR=/tmp/specs make generate

# Full regeneration (clean + generate)
make regenerate

# Verify no uncommitted changes from generation
make verify-generate
```

### Acceptance Test Environment Variables

**Token Authentication**:
```bash
export F5XC_API_TOKEN="your-api-token"
export F5XC_API_URL="https://console.ves.volterra.io"  # or your tenant
export TF_ACC=1
```

**P12 Certificate Authentication** (Recommended for automated tests):
```bash
export F5XC_API_P12_FILE="/path/to/certificate.p12"
export F5XC_P12_PASSWORD="certificate-password"
export F5XC_API_URL="https://console.ves.volterra.io"
export TF_ACC=1
```

**PEM Certificate Authentication**:
```bash
export F5XC_API_CERT="/path/to/client.crt"
export F5XC_API_KEY="/path/to/client.key"
export F5XC_API_CA_CERT="/path/to/ca.crt"  # Optional
export F5XC_API_URL="https://console.ves.volterra.io"
export TF_ACC=1
```

### Linting Configuration

**File**: `/Users/r.mordasiewicz/GIT/robinmordasiewicz/terraform-provider-f5xc/.golangci.yml`

```yaml
version: "2"
run:
  timeout: 5m

linters:
  default: none
  enable:
    - errcheck          # Check for unchecked errors
    - govet             # Go vet analysis
    - ineffassign       # Detect ineffectual assignments
    - staticcheck       # StaticCheck analysis
    - unused            # Detect unused code
  
  exclusions:
    paths:
      - tools           # Exclude tools directory from linting
    rules:
      - path: _test\.go # Exclude test files from errcheck
        linters:
          - errcheck
```

**CI/CD Integration**:
- Runs on all PRs via `ci.yml` workflow
- Enforces linting before merge via branch protection rules
- Generates violations that block PR approval

---

## 3. CODE GENERATION ARCHITECTURE

### Overview

The provider uses a **DRY (Don't Repeat Yourself) generation pattern** where OpenAPI specifications are converted into Terraform resources, client types, and documentation. Generation is **one-way**: from OpenAPI → Go code.

### Generation Pipeline

```
F5 OpenAPI Specs (JSON)
    ↓
generate-all-schemas.go (Main orchestrator)
    ├─→ generate-resources.go (Resource file creation)
    ├─→ generate-client-types.go (Client type generation)
    ├─→ generate-examples.go (Example Terraform files)
    └─→ register-resources.go (Provider registration updates)
    ↓
Generated Files (auto-generated, NOT for manual edit)
├─→ internal/provider/*_resource.go (144 files)
├─→ internal/provider/*_data_source.go (144 files)
├─→ internal/client/*_types.go
├─→ internal/provider/provider.go (resource registration)
└─→ examples/resources/*/*.tf

Post-Processing
    ↓
go run tools/transform-docs.go (OneOf grouping for docs)
    ↓
tfplugindocs generate (Terraform plugin documentation)
    ↓
docs/resources/*.md (Final documentation)
```

### Main Generator: `generate-all-schemas.go`

**Location**: `/Users/r.mordasiewicz/GIT/robinmordasiewicz/terraform-provider-f5xc/tools/generate-all-schemas.go`

**Key Functions**:
- Discovers OpenAPI specs: `docs-cloud-f5-com.*.ves-swagger.json`
- Extracts schemas from F5XC API definitions
- Generates one resource + one data source per API endpoint
- Creates client type definitions for API communication
- Updates provider registration with new resources
- Supports OneOf fields (mutually exclusive properties)

**Command**:
```bash
go run tools/generate-all-schemas.go \
  --spec-dir=/tmp/specs \
  --dry-run              # Optional: preview changes
  --verbose              # Optional: detailed output
```

**Environment Variable**:
```bash
F5XC_SPEC_DIR=/path/to/specs make generate
```

### Generator-Specific Tools

| Tool | Purpose | Input | Output |
|------|---------|-------|--------|
| `generate-resources.go` | Resource file generation | Schema definitions | `*_resource.go` files |
| `generate-client-types.go` | Client type generation | OpenAPI specs | `*_types.go` files |
| `generate-examples.go` | Example file generation | Schema definitions | `examples/resources/*.tf` |
| `generate-datasource-examples.go` | Data source examples | Schema definitions | Data source examples |
| `generate-datasource-tests.go` | Test template generation | Schema definitions | Test scaffolding |
| `transform-docs.go` | Doc post-processing | Generated `*.md` | Enhanced docs with OneOf |
| `register-resources.go` | Provider registration | Resource list | `provider.go` updates |

### Auto-Generated vs. Manually Maintained

**NEVER commit manually-edited generated files** - Always fix the generator instead.

#### Auto-Generated Files (DO NOT EDIT DIRECTLY)

| Path | Generator | CI/CD Trigger |
|------|-----------|---------------|
| `internal/provider/*_resource.go` | generate-all-schemas.go | Any tool or spec change |
| `internal/provider/*_data_source.go` | generate-all-schemas.go | Any tool or spec change |
| `internal/provider/provider.go` | register-resources.go | Any tool or spec change |
| `internal/client/*_types.go` | generate-client-types.go | Any tool or spec change |
| `docs/resources/*.md` | tfplugindocs + transform-docs.go | Any tool or spec change |
| `docs/data-sources/*.md` | tfplugindocs | Any tool or spec change |
| `examples/resources/*/*.tf` | generate-examples.go | Any tool or spec change |
| `examples/data-sources/*/*.tf` | generate-examples.go | Any tool or spec change |

#### Manually Maintained (Can Edit Directly)

| Path | Purpose | Notes |
|------|---------|-------|
| `internal/functions/blindfold.go` | Encryption function | Source code - edit freely |
| `internal/functions/blindfold_file.go` | File encryption function | Source code - edit freely |
| `internal/blindfold/*` | Encryption library | Source code - edit freely |
| `internal/provider/functions_registration.go` | Function registration | Register new functions |
| `internal/provider/resource_base.go` | Base resource utilities | Shared resource code |
| `internal/provider/provider_helpers.go` | Helper functions | Custom utilities |
| `examples/functions/*/*.tf` | Function examples | Source for doc generation |
| `docs/index.md` | Provider overview | Manual documentation |
| `templates/functions.md.tmpl` | Function doc template | Controls doc generation |

### Generator Preservation Lists

In `tools/generate-all-schemas.go`:

```go
var manuallyMaintainedFiles = map[string]bool{
    "functions_registration.go": true,
}

var manuallyMaintainedDirs = []string{
    "internal/functions",
    "internal/blindfold",
}
```

These directories are **preserved** during regeneration.

### Generation Workflow

1. **Developer modifies OpenAPI specs** in `docs/specifications/api/`
2. **Push to GitHub** triggers `sync-openapi.yml` (scheduled) or manual updates
3. **on-merge.yml orchestrator detects changes**:
   - Runs build & test
   - Detects if generation needed
   - Runs generators
   - Creates consolidated PR with all changes
   - Single version tag created
4. **PR reviewed and merged** - regenerated code is now deployed

### Preventing Manual Edits (Constitution Enforcement)

The repository includes enforcement mechanisms:

**Layer 1: Pre-commit hooks** (`scripts/check-no-generated-files.sh`)
- Blocks commits containing manually-edited generated files
- Check patterns from `.gitignore` and generator output

**Layer 2: CI checks** (`ci.yml` → `check-constitution` job)
- Fails PRs containing generated file modifications
- Blocks merge to main

**Layer 3: Branch protection**
- Requires CI checks to pass before merge
- Prevents bypass via `--no-verify`

---

## 4. ARCHITECTURE PATTERNS

### Resource Implementation Pattern

**File Template**: `internal/provider/{resource_name}_resource.go`

```go
// Generated by generate-all-schemas.go - DO NOT EDIT

package provider

import (
    "context"
    "fmt"
    
    "github.com/hashicorp/terraform-plugin-framework/resource"
    "github.com/hashicorp/terraform-plugin-framework/types"
    
    "github.com/f5xc/terraform-provider-f5xc/internal/client"
)

// Ensure resource implements required interfaces
var (
    _ resource.Resource                   = &NamespaceResource{}
    _ resource.ResourceWithConfigure      = &NamespaceResource{}
    _ resource.ResourceWithImportState    = &NamespaceResource{}
)

func NewNamespaceResource() resource.Resource {
    return &NamespaceResource{}
}

type NamespaceResource struct {
    client *client.Client
}

// NamespaceResourceModel - TFSdk schema bindings
type NamespaceResourceModel struct {
    Name        types.String `tfsdk:"name"`
    Namespace   types.String `tfsdk:"namespace"`
    Annotations types.Map    `tfsdk:"annotations"`
    Labels      types.Map    `tfsdk:"labels"`
    Description types.String `tfsdk:"description"`
    ID          types.String `tfsdk:"id"`
}

// Metadata - Resource type name
func (r *NamespaceResource) Metadata(ctx context.Context, 
    req resource.MetadataRequest, 
    resp *resource.MetadataResponse) {
    resp.TypeName = req.ProviderTypeName + "_namespace"
}

// Schema - Define attributes and nested blocks
func (r *NamespaceResource) Schema(ctx context.Context, 
    req resource.SchemaRequest, 
    resp *resource.SchemaResponse) {
    // Schema definition with descriptions, validators, plan modifiers
}

// Configure - Inject client
func (r *NamespaceResource) Configure(ctx context.Context, 
    req resource.ConfigureRequest, 
    resp *resource.ConfigureResponse) {
    r.client = req.ProviderData.(*client.Client)
}

// Create - API call to create resource
func (r *NamespaceResource) Create(ctx context.Context, 
    req resource.CreateRequest, 
    resp *resource.CreateResponse) {
    // Parse config, call API, update state
}

// Read - API call to read resource
func (r *NamespaceResource) Read(ctx context.Context, 
    req resource.ReadRequest, 
    resp *resource.ReadResponse) {
    // Get state ID, call API, update state
}

// Update - API call to update resource
func (r *NamespaceResource) Update(ctx context.Context, 
    req resource.UpdateRequest, 
    resp *resource.UpdateResponse) {
    // Compare states, call API, update state
}

// Delete - API call to delete resource
func (r *NamespaceResource) Delete(ctx context.Context, 
    req resource.DeleteRequest, 
    resp *resource.DeleteResponse) {
    // Get state ID, call API
}

// ImportState - Support terraform import
func (r *NamespaceResource) ImportState(ctx context.Context, 
    req resource.ImportStateRequest, 
    resp *resource.ImportStateResponse) {
    // Parse import ID, call Read
}
```

**Key Features**:
- Implements `resource.Resource` interface
- Implements `resource.ResourceWithConfigure` for client injection
- Implements `resource.ResourceWithImportState` for import support
- CRUD methods: Create, Read, Update, Delete
- Schema validation with custom validators
- Plan modifiers for immutable fields (RequiresReplace)
- Timeout support via `timeouts.Value` block
- State upgrade support for schema changes

### Client/API Interaction Pattern

**File**: `internal/client/client.go`

**Features**:
- **HTTP Client wrapper** for F5XC API communication
- **Three authentication methods**:
  - API Token: `Authorization: APIToken {token}`
  - P12 Certificate: `LoadP12Certificate()` → TLS config
  - PEM Certificate: `NewClientWithCert()`
- **Retry logic**: Exponential backoff with configurable retries
- **Rate limiting**: Automatic delays for 429 responses
- **Error handling**: Custom error types with classification

**CRUD Method Pattern**:
```go
// Client CRUD methods follow consistent pattern

type Client struct {
    BaseURL      string
    APIToken     string
    HTTPClient   *http.Client
    MaxRetries   int
    RetryWaitMin time.Duration
    RetryWaitMax time.Duration
}

// Create - POST to /api/{namespace}/{resource_type}
func (c *Client) CreateNamespace(ctx context.Context, 
    namespace string, 
    obj *Namespace) (*Namespace, error) {
    // Marshal to JSON
    // POST request with retry
    // Unmarshal response
    // Return created resource
}

// Read - GET from /api/{namespace}/{resource_type}/{name}
func (c *Client) GetNamespace(ctx context.Context, 
    namespace, name string) (*Namespace, error) {
    // GET request
    // 404 handling (not found)
    // Return resource
}

// Update - PUT to /api/{namespace}/{resource_type}/{name}
func (c *Client) UpdateNamespace(ctx context.Context, 
    namespace string, 
    obj *Namespace) (*Namespace, error) {
    // Merge existing with updates
    // PUT request
    // Return updated resource
}

// Delete - DELETE to /api/{namespace}/{resource_type}/{name}
func (c *Client) DeleteNamespace(ctx context.Context, 
    namespace, name string) error {
    // DELETE request
    // 404 handling (already deleted)
}

// List - GET from /api/{namespace}/{resource_type} with pagination
func (c *Client) ListNamespaces(ctx context.Context, 
    namespace string) ([]*Namespace, error) {
    // Pagination loop
    // Collect all results
    // Return list
}
```

### Provider-Defined Functions

**Location**: `internal/functions/`

Two utility functions for F5XC Secret Management:

#### `blindfold` - Encrypt plaintext

```go
// Function signature
provider::f5xc::blindfold(plaintext, policy_name, namespace) -> string

// Implementation: internal/functions/blindfold.go
// Uses: internal/blindfold/seal.go for encryption
// Requires: Existing SecretPolicy in namespace
```

#### `blindfold_file` - Encrypt file contents

```go
// Function signature
provider::f5xc::blindfold_file(path, policy_name, namespace) -> string

// Implementation: internal/functions/blindfold_file.go
// Uses: internal/blindfold/seal.go for encryption
// Requires: Valid file path, SecretPolicy in namespace
```

**Registration**: `internal/provider/functions_registration.go` (manually maintained)

---

## 5. ACCEPTANCE TESTING

### Test Infrastructure (`internal/acctest/`)

| File | Purpose |
|------|---------|
| `acctest.go` | Core test setup, auth, provider factories |
| `sweep.go` | Resource cleanup for failed tests |
| `tracker.go` | Track created resources (per-test cleanup) |
| `rate_limit.go` | Rate limiting for API tests |
| `certificates.go` | Certificate generation for P12/PEM tests |

### Test Pattern

**File Template**: `internal/provider/{resource_name}_resource_test.go`

```go
package provider

import (
    "testing"
    
    "github.com/hashicorp/terraform-plugin-testing/helper/resource"
    "github.com/hashicorp/terraform-plugin-testing/plancheck"
    "github.com/hashicorp/terraform-plugin-testing/statecheck"
    "github.com/hashicorp/terraform-plugin-testing/tfjsonpath"
    "github.com/hashicorp/terraform-plugin-testing/knownvalue"
)

func TestAccNamespaceResource_basic(t *testing.T) {
    t.Parallel()  // Run tests in parallel
    
    rName := acctest.RandomWithPrefix("tf-acc-test")
    resourceName := "f5xc_namespace.test"
    
    resource.ParallelTest(t, resource.TestCase{
        PreCheck:                 func() { testAccPreCheck(t) },
        ProtoV6ProviderFactories: acctest.ProtoV6ProviderFactories,
        CheckDestroy:             testAccCheckNamespaceDestroy,
        Steps: []resource.TestStep{
            {
                // CREATE step
                Config: testAccNamespaceConfig_basic(rName),
                ConfigPlanChecks: resource.ConfigPlanChecks{
                    PreApply: []plancheck.PlanCheck{
                        plancheck.ExpectResourceAction(resourceName, 
                            plancheck.ResourceActionCreate),
                    },
                },
                ConfigStateChecks: []statecheck.StateCheck{
                    statecheck.ExpectKnownValue(resourceName,
                        tfjsonpath.New("name"), 
                        knownvalue.StringExact(rName)),
                },
            },
            {
                // IMPORT step
                ResourceName:      resourceName,
                ImportState:       true,
                ImportStateVerify: true,
            },
        },
    })
}

// Helper: Terraform configuration
func testAccNamespaceConfig_basic(name string) string {
    return fmt.Sprintf(`
resource "f5xc_namespace" "test" {
  name      = %[1]q
  namespace = "system"
  
  labels = {
    test = "true"
  }
}
`, name)
}

// Helper: Destroy check
func testAccCheckNamespaceDestroy(s *terraform.State) error {
    client := testAccProvider.Meta().(*client.Client)
    
    for _, rs := range s.RootModule().Resources {
        if rs.Type != "f5xc_namespace" {
            continue
        }
        
        _, err := client.GetNamespace(context.Background(),
            rs.Primary.Attributes["namespace"],
            rs.Primary.Attributes["name"])
        
        if err == nil {
            return fmt.Errorf("resource still exists")
        }
        if !errors.IsNotFound(err) {
            return err
        }
    }
    
    return nil
}
```

### Test Execution

```bash
# Run all acceptance tests (requires credentials)
TF_ACC=1 go test -v -timeout 120m ./internal/provider/...

# Run specific test
TF_ACC=1 go test -v -timeout 30m ./internal/provider \
  -run TestAccNamespaceResource_basic

# Run tests in parallel
TF_ACC=1 go test -v -timeout 120m -parallel 4 ./internal/provider/...
```

### Test Cleanup

**Two strategies**:

1. **Automatic per-test cleanup** (Recommended):
```go
defer acctest.CleanupTracked()  // Only deletes resources THIS test created
```

2. **Prefix-based sweep** (Shared tenant warning):
```bash
make sweep                              # All test resources
make sweep-resource RESOURCE=f5xc_namespace  # Specific type
```

---

## 6. CI/CD AUTOMATION

### Orchestration Architecture

The repository uses a **DRY orchestrator pattern** to prevent cascading effects and race conditions.

```
GitHub Events
    ↓
┌─────────────────┬────────────────┐
│ Push to main    │ PR to main      │
└────────┬────────┴────────┬────────┘
         │                 │
         ▼                 ▼
    on-merge.yml    ci.yml (Reusable workflows)
    (Main          ├─→ _build-test.yml
     orchestrator)  ├─→ constitution check
                    └─→ lint, test
                    
    on-merge flow:
    ├─ detect-changes
    ├─ build-test (_build-test.yml)
    ├─ Decide: regeneration needed?
    │   ├─ Yes: generate-provider, generate-docs
    │   │        → Create consolidated PR
    │   │        → Skip tagging (wait for PR merge)
    │   └─ No: tag-release immediately
    ├─ CI on auto-PR runs again
    ├─ Auto-PR merged
    └─ tag-release on bot commit
```

### Workflow Files

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **ci.yml** | PR to main, push to feature/* | PR validation (lint, test, constitution) |
| **on-merge.yml** | Push to main | Orchestrator for regen, tagging, release |
| **sync-openapi.yml** | Scheduled (twice daily) | Download latest OpenAPI specs from F5 |
| **_build-test.yml** | Reusable | Build, lint, test (used by ci + on-merge) |
| **_generate-docs.yml** | Reusable | Documentation generation |
| **_generate-provider.yml** | Reusable | Provider code generation |
| **_tag-release.yml** | Reusable | Version tagging and GitHub release |

### Constitution Check (ci.yml)

Prevents manual edits of generated files:

```yaml
check-constitution:
  # Skip for auto-generated branches
  if: |
    !startsWith(github.head_ref, 'auto-generate/') &&
    !startsWith(github.head_ref, 'auto-regenerate/')
  
  steps:
    - Check for manually-edited generated files
    - Fail if: docs/resources/*.md, docs/data-sources/*.md,
                internal/provider/*_resource.go, etc.
    - Allow: Source code, generators, examples
```

### Key Design Decisions

1. **Single orchestrator** (on-merge.yml) prevents cascading failures
2. **Detect-changes job** identifies what changed
3. **Conditional tagging** - Only tag when content is complete
4. **Bot commit detection** - Different handling for automated commits
5. **Consolidated PR** - All regeneration in one PR, not multiple
6. **Reusable workflows** - Reduce duplication between ci + on-merge

---

## 7. CUSTOM AGENTS AND SKILLS

### Available in `.claude/`

#### Agent: `terraform-test-developer.md`
**Purpose**: Custom development persona for comprehensive test implementation

**Capabilities**:
- Acceptance test pattern generation
- Test scaffolding for new resources
- State validation strategy design
- Error condition testing

#### Skill: `terraform-provider-testing` (Comprehensive)
**Location**: `.claude/skills/terraform-provider-testing/`

**Components**:
- `SKILL.md` - Main skill documentation
- `native-terraform-testing.md` - Native Terraform testing patterns
- `acceptance-testing-patterns.md` - Modern assertion patterns
- `ci-cd-integration.md` - CI/CD testing workflows
- `test-harness-templates.md` - Reusable test templates
- `debugging-with-delve.md` - Debugger integration
- `go-provider-development.md` - Go-specific patterns

**Expertise Areas**:
- Modern ConfigPlanChecks/ConfigStateChecks patterns
- Known value assertions with tfjsonpath
- State upgrade testing
- Import validation
- Parallel test execution
- Resource cleanup strategies

#### Skill: `github-issue-workflow`
**Location**: `.claude/skills/github-issue-workflow/`

**Purpose**: Issue-first GitHub development workflow enforcement

**Enforces**:
- Create GitHub Issue before branch
- Branch naming with issue number
- Conventional commit messages
- PR linking to issue with "Closes #"
- Constitution rule compliance

#### Skill: `terraform-registry-inspector`
**Location**: `.claude/skills/terraform-registry-inspector/`

**Purpose**: Validate documentation rendering on Terraform Registry

**Capabilities**:
- Check version availability
- Navigate resource/data-source docs
- Find source code links
- Compare against Azure RM standard

---

## 8. KEY DEPENDENCIES

### Direct Dependencies

```
github.com/hashicorp/terraform-plugin-framework v1.16.1
  → Core provider SDK with modern plugin framework

github.com/hashicorp/terraform-plugin-framework-timeouts v0.7.0
  → Configurable timeout support

github.com/hashicorp/terraform-plugin-framework-validators v0.19.0
  → Built-in validators for common patterns

github.com/hashicorp/terraform-plugin-log v0.10.0
  → Structured logging for providers

github.com/hashicorp/terraform-plugin-testing v1.13.3
  → Acceptance test framework

golang.org/x/crypto v0.45.0
  → P12 certificate handling via pkcs12 package

golang.org/x/text v0.31.0
  → Unicode and text handling
```

### Code Generation Dependencies

```
github.com/hashicorp/terraform-plugin-docs/cmd/tfplugindocs
  → Generates docs from schema + examples

github.com/stretchr/testify (implicit via testing framework)
  → Assertions in tests
```

---

## 9. ENVIRONMENT AND RELEASE

### Environment Variables (Build)

```bash
# Override default spec directory for generation
F5XC_SPEC_DIR=/path/to/specs

# Override binary name
BINARY_NAME=custom-name

# Override version
VERSION=1.2.3
```

### Release Process (GoReleaser)

**File**: `.goreleaser.yml`

**Flow**:
1. `git tag v1.2.3` triggers release on GitHub Actions
2. GoReleaser builds cross-platform binaries:
   - Linux (amd64, 386, arm, arm64)
   - macOS (amd64, arm64)
   - Windows (amd64, 386)
   - FreeBSD (amd64)
3. Creates checksums and manifests
4. Publishes to GitHub Releases
5. Terraform Registry discovery via manifest

**Binary naming**: `terraform-provider-f5xc_v1.2.3_linux_amd64`

---

## 10. COMMON WORKFLOWS

### Adding a New Resource Type

1. **Create GitHub Issue** describing the F5XC resource
2. **Download or update OpenAPI specs** in `docs/specifications/api/`
3. **Run generator**:
   ```bash
   SPEC_DIR=/path/to/specs make generate
   ```
4. **Generator creates automatically**:
   - `internal/provider/{resource_name}_resource.go`
   - `internal/client/{resource_name}_types.go`
   - `examples/resources/f5xc_{resource_name}/`
   - Documentation stubs
5. **Add acceptance tests**:
   - Copy `internal/provider/{resource_name}_resource_test.go`
   - Implement test cases
   - Add cleanup logic
6. **Run tests**:
   ```bash
   TF_ACC=1 go test -v ./internal/provider/...
   ```
7. **Create PR** with all changes
8. **CI validates** and creates consolidated regeneration PR if needed

### Fixing a Generator Bug

1. **Identify issue** in generated code
2. **FIX THE GENERATOR**, not the generated file
3. **Example**: Bug in `*_resource.go` → Fix `tools/generate-all-schemas.go`
4. **Re-run generator**:
   ```bash
   go run tools/generate-all-schemas.go --spec-dir=/path/to/specs
   ```
5. **Verify fixes**:
   ```bash
   git diff internal/provider/
   ```
6. **Run tests** to verify fix
7. **Commit only generator changes**:
   ```bash
   git add tools/generate-all-schemas.go
   git commit -m "fix(generator): correct ImportState handling for namespace/name"
   ```
8. **CI regenerates all resources** with fix

### Running Local Tests

```bash
# Set up credentials
export F5XC_API_P12_FILE=/path/to/cert.p12
export F5XC_P12_PASSWORD=password
export F5XC_API_URL=https://console.ves.volterra.io
export TF_ACC=1

# Run all tests
make testacc

# Run specific test
go test -v -timeout 30m ./internal/provider \
  -run TestAccNamespaceResource_basic

# Run with output
go test -v -timeout 30m ./internal/provider \
  -run TestAccNamespaceResource \
  -test.v

# Debug with Delve
dlv test ./internal/provider -- -test.run TestAccNamespaceResource_basic
(dlv) break TestAccNamespaceResource_basic
(dlv) continue
```

---

## Summary

This Terraform provider follows **modern Go and Terraform development practices**:

✅ **DRY Code Generation** - Single source of truth from OpenAPI specs  
✅ **Sophisticated CI/CD** - Orchestrated automation preventing cascades  
✅ **Constitution Enforcement** - Prevents generator bypass  
✅ **Comprehensive Testing** - Acceptance + unit tests with modern patterns  
✅ **Multi-Auth Support** - Token, P12, and PEM certificates  
✅ **140+ Resource Types** - Covering F5XC API surface  
✅ **Reusable Skills** - Custom testing, workflow, and validation expertise  
✅ **Session Persistence** - Claude Code memory for context continuation  

**Key Design Philosophy**: *"Generators maintain consistency; only fix bugs once at the source"*

