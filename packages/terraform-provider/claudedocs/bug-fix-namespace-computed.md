# Bug Fix: Namespace Computed Attribute in Object References

**Date**: 2026-01-12
**Issue**: Provider produced inconsistent state for `healthcheck[0].namespace`
**Status**: ✅ FIXED

---

## Problem Description

When creating an `f5xc_origin_pool` resource with a healthcheck reference, Terraform reported a state inconsistency error:

```
Error: Provider produced inconsistent result after apply

When applying changes to f5xc_origin_pool.this, provider
produced an unexpected new value:
.healthcheck[0].namespace: was null, but now cty.StringVal("system").
```

### Impact

- Resources created successfully but marked as "tainted" in state
- Unnecessary resource replacements on subsequent applies
- Workaround required: explicit namespace in healthcheck references

### Root Cause

The generator (`tools/generate-all-schemas.go` line 1193) had special handling for F5XC Object Reference fields (name, namespace, tenant, uid, kind) to mark them as `Computed` with `UseStateForUnknown` plan modifier.

**The bug**: The condition only checked for `tenant`, `uid`, and `kind` - **it was missing `namespace`**:

```go
// BEFORE (bug):
if (propNameLower == "tenant" || propNameLower == "uid" || propNameLower == "kind") && !attr.Required {
```

This meant:
- ✅ `tenant` field: Optional + Computed + UseStateForUnknown
- ✅ `uid` field: Optional + Computed + UseStateForUnknown
- ✅ `kind` field: Optional + Computed + UseStateForUnknown
- ❌ `namespace` field: Optional only (missing Computed!)

When the F5XC API returned the inherited namespace value (even though we didn't explicitly set it), Terraform saw this as inconsistent:
1. **Plan**: namespace = null (not in config, not marked as computed)
2. **Apply**: API returns namespace = "system"
3. **Terraform**: "Expected null but got 'system' - inconsistent!"

---

## Fix

**File**: `tools/generate-all-schemas.go`
**Line**: 1193

Added `namespace` to the Object Reference computed attribute check:

```go
// AFTER (fixed):
if (propNameLower == "namespace" || propNameLower == "tenant" || propNameLower == "uid" || propNameLower == "kind") && !attr.Required {
    attr.Computed = true
    attr.Optional = true
    attr.PlanModifier = "UseStateForUnknown"
}
```

Also updated the comment on line 1187 to reflect the fix:

```go
// Mark 'namespace', 'tenant', 'uid', and 'kind' fields as Computed in nested Object Reference blocks.
```

---

## Generated Code Changes

**Before** (`internal/provider/origin_pool_resource.go:1209`):

```go
"namespace": schema.StringAttribute{
    MarkdownDescription: "When a configuration object(e.g. Virtual_host) refers to another(e.g route) then namespace will hold the referred object's(e.g. Route's) namespace.",
    Optional:            true,  // ❌ Missing Computed: true
},
```

**After** (fixed):

```go
"namespace": schema.StringAttribute{
    MarkdownDescription: "When a configuration object(e.g. Virtual_host) refers to another(e.g route) then namespace will hold the referred object's(e.g. Route's) namespace.",
    Optional:            true,
    Computed:            true,  // ✅ Fixed!
    PlanModifiers: []planmodifier.String{
        stringplanmodifier.UseStateForUnknown(),  // ✅ Fixed!
    },
},
```

---

## Verification

### Test Configuration

Created test with NO explicit namespace in healthcheck reference:

```hcl
resource "f5xc_origin_pool" "this" {
  name      = "bugfix-test-pool"
  namespace = "system"

  # ...

  healthcheck {
    name = f5xc_healthcheck.this.name
    # namespace intentionally omitted to test fix
  }
}
```

### Results

**Terraform Plan**:
```hcl
healthcheck {
    name      = "bugfix-test-health"
    namespace = (known after apply)  // ✅ Marked as computed!
    tenant    = (known after apply)
}
```

**Terraform Apply**:
```
Apply complete! Resources: 3 added, 0 changed, 0 destroyed.
```
✅ No "Provider produced inconsistent result" error

**Terraform State**:
```hcl
healthcheck {
    name      = "bugfix-test-health"
    namespace = "system"  // ✅ Computed by API
    tenant    = "nferreira-cuxnbbdn"
}
```

**Terraform Plan (after apply)**:
```
No changes. Your infrastructure matches the configuration.
```
✅ No drift detected

---

## Impact Analysis

### Resources Affected

All F5XC resources with Object Reference fields that include namespace:
- `f5xc_origin_pool.healthcheck[].namespace`
- `f5xc_http_loadbalancer.*.pool[].namespace`
- `f5xc_virtual_host.*.route[].namespace`
- And many more (~100+ reference locations across all resources)

### Before/After Comparison

| Scenario | Before Fix | After Fix |
|----------|-----------|-----------|
| **No explicit namespace** | ❌ Error: inconsistent state | ✅ Works: computed by API |
| **Explicit namespace** | ✅ Works | ✅ Works (no change) |
| **State drift** | ❌ Resource marked tainted | ✅ No drift |
| **Subsequent applies** | ❌ Unnecessary replacements | ✅ No changes |

### Compatibility

**Backward Compatible**: Yes

- Existing configurations with explicit namespace continue to work
- Existing configurations without explicit namespace now work correctly
- No breaking changes to user configurations

---

## Related Issues

- Original V1 code removal verification that discovered this bug
- Similar pattern exists for `tenant`, `uid`, `kind` (already working correctly)
- Comment in code already documented all 5 fields but implementation was missing `namespace`

---

## Lessons Learned

1. **Test with Real Resources**: CI passing doesn't mean end-to-end functionality works
2. **Comments vs Code**: Comment said "kind, name, namespace, tenant, uid" but code only had 3 of 5
3. **Generated Code Review**: When fixing generators, verify the generated output
4. **User Feedback Matters**: User's insistence on fixing bugs (not documenting) led to proper fix

---

## Recommendation

**Merge this fix immediately**. It:
- ✅ Fixes a real bug affecting production usage
- ✅ No breaking changes
- ✅ Verified with end-to-end testing
- ✅ Improves user experience (no workarounds needed)
- ✅ Applies to all resources with Object Reference fields

---

**Files Changed**:
1. `tools/generate-all-schemas.go` (1 line fix + 1 comment update)
2. All generated resource files (`internal/provider/*_resource.go`) - regenerated automatically

**Testing**:
- ✅ Generator runs without errors (98 resources)
- ✅ Provider builds successfully (43MB binary)
- ✅ Terraform plan/apply works without inconsistency errors
- ✅ State management correct (no drift)
- ✅ Resources create and destroy cleanly
