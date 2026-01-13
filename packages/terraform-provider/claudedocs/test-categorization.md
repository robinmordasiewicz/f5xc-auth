# Test Categorization for terraform-provider-f5xc

This document categorizes the acceptance tests based on their external dependencies.

## Summary

| Category | Count | Status |
|----------|-------|--------|
| Safe Tests (No External Dependencies) | 18 | Ready to Run |
| Cloud Credential Tests | 0* | N/A |
| Licensed Feature Tests | 0 | N/A |

*Note: `cloud_credentials_resource_test.go` creates F5XC credential configurations using mock ARNs - it does NOT require actual AWS/Azure/GCP access.

---

## Category 1: SAFE TESTS (No External Dependencies)

These tests only require F5XC API access (P12 certificate authentication) and can be run immediately.

### Test Files

| Test File | Resource | Tests | Status |
|-----------|----------|-------|--------|
| `namespace_resource_test.go` | f5xc_namespace | ~14 | Verified |
| `alert_receiver_resource_test.go` | f5xc_alert_receiver | 14 | Verified |
| `network_connector_resource_test.go` | f5xc_network_connector | 14 | Verified |
| `alert_policy_resource_test.go` | f5xc_alert_policy | ~14 | Ready |
| `bgp_asn_set_resource_test.go` | f5xc_bgp_asn_set | ~14 | Ready |
| `cloud_credentials_resource_test.go` | f5xc_cloud_credentials | 14 | Ready* |
| `data_group_resource_test.go` | f5xc_data_group | ~14 | Ready |
| `data_type_resource_test.go` | f5xc_data_type | ~14 | Ready |
| `filter_set_resource_test.go` | f5xc_filter_set | ~14 | Ready |
| `forwarding_class_resource_test.go` | f5xc_forwarding_class | ~14 | Ready |
| `geo_location_set_resource_test.go` | f5xc_geo_location_set | ~14 | Ready |
| `healthcheck_resource_test.go` | f5xc_healthcheck | ~14 | Ready |
| `http_loadbalancer_resource_test.go` | f5xc_http_loadbalancer | 3 | Ready |
| `ip_prefix_set_resource_test.go` | f5xc_ip_prefix_set | ~14 | Ready |
| `malicious_user_mitigation_resource_test.go` | f5xc_malicious_user_mitigation | 14 | Ready |
| `policer_resource_test.go` | f5xc_policer | ~14 | Ready |
| `rate_limiter_resource_test.go` | f5xc_rate_limiter | ~14 | Ready |
| `user_identification_resource_test.go` | f5xc_user_identification | ~14 | Ready |

*The `cloud_credentials_resource_test.go` creates credential configuration objects in F5XC using mock ARNs (e.g., `arn:aws:iam::123456789012:role/TestRole`). It does NOT connect to AWS/Azure/GCP.

### Run Command

```bash
# Run all safe tests
TF_ACC=1 go test ./internal/provider/ -v -timeout 60m

# Run individual test file
TF_ACC=1 go test ./internal/provider/ -v -run TestAccNamespaceResource -timeout 30m
TF_ACC=1 go test ./internal/provider/ -v -run TestAccAlertReceiverResource -timeout 30m
TF_ACC=1 go test ./internal/provider/ -v -run TestAccNetworkConnectorResource -timeout 30m
```

---

## Category 2: CLOUD CREDENTIAL TESTS (AWS/Azure/GCP Required)

These tests require actual cloud provider credentials to provision cloud infrastructure.

### Resources Requiring Cloud Credentials

| Resource File | Resource | Cloud Provider | Status |
|---------------|----------|----------------|--------|
| `aws_vpc_site_resource.go` | f5xc_aws_vpc_site | AWS | No test file |
| `aws_tgw_site_resource.go` | f5xc_aws_tgw_site | AWS | No test file |
| `azure_vnet_site_resource.go` | f5xc_azure_vnet_site | Azure | No test file |
| `gcp_vpc_site_resource.go` | f5xc_gcp_vpc_site | GCP | No test file |
| `cloud_connect_resource.go` | f5xc_cloud_connect | Multi-cloud | No test file |
| `cloud_link_resource.go` | f5xc_cloud_link | Multi-cloud | No test file |

### Environment Variables Required

```bash
# AWS
export AWS_ACCESS_KEY_ID="..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_REGION="us-east-1"

# Azure
export ARM_CLIENT_ID="..."
export ARM_CLIENT_SECRET="..."
export ARM_SUBSCRIPTION_ID="..."
export ARM_TENANT_ID="..."

# GCP
export GOOGLE_PROJECT="..."
export GOOGLE_CREDENTIALS="..."
```

### Future Development

When creating tests for these resources, consider:
1. Use test fixtures with mock cloud responses where possible
2. Implement skip conditions for missing credentials
3. Use smaller instance sizes for cost optimization
4. Implement proper cleanup to avoid orphaned cloud resources

---

## Category 3: LICENSED FEATURE TESTS (Additional F5XC Licensing Required)

These tests require specific F5XC feature licenses beyond the base platform.

### Bot Defense (Advanced Bot Protection)

| Resource File | Resource | License Required |
|---------------|----------|------------------|
| `bot_defense_app_infrastructure_resource.go` | f5xc_bot_defense_app_infrastructure | Bot Defense |

### Infrastructure Protection (Routed DDoS)

| Resource File | Resource | License Required |
|---------------|----------|------------------|
| `infraprotect_asn_resource.go` | f5xc_infraprotect_asn | Infrastructure Protection |
| `infraprotect_asn_prefix_resource.go` | f5xc_infraprotect_asn_prefix | Infrastructure Protection |
| `infraprotect_deny_list_rule_resource.go` | f5xc_infraprotect_deny_list_rule | Infrastructure Protection |
| `infraprotect_firewall_rule_resource.go` | f5xc_infraprotect_firewall_rule | Infrastructure Protection |
| `infraprotect_firewall_rule_group_resource.go` | f5xc_infraprotect_firewall_rule_group | Infrastructure Protection |
| `infraprotect_internet_prefix_advertisement_resource.go` | f5xc_infraprotect_internet_prefix_advertisement | Infrastructure Protection |
| `infraprotect_tunnel_resource.go` | f5xc_infraprotect_tunnel | Infrastructure Protection |

### Future Development

When creating tests for these resources:
1. Implement skip conditions for missing licenses
2. Document license requirements clearly
3. Consider creating integration test suites per license tier

---

## Test Infrastructure Files

| Test File | Purpose |
|-----------|---------|
| `provider_test.go` | Provider configuration tests |
| `sweep_test.go` | Resource cleanup utilities |

---

## Running Tests

### Prerequisites

1. F5XC API credentials (P12 certificate)
2. Environment variables configured:

```bash
export F5XC_API_URL="https://your-tenant.console.ves.volterra.io"
export F5XC_API_P12_FILE="/path/to/api-creds.p12"
export F5XC_P12_PASSWORD="your-password"
export TF_ACC=1
```

### Run All Safe Tests

```bash
TF_ACC=1 go test ./internal/provider/ -v -timeout 60m
```

### Run Specific Resource Tests

```bash
# Pattern: TestAcc<ResourceName>Resource_*
TF_ACC=1 go test ./internal/provider/ -v -run "TestAccNamespaceResource" -timeout 30m
TF_ACC=1 go test ./internal/provider/ -v -run "TestAccAlertReceiverResource" -timeout 30m
```

### Run Tests with Verbose Output

```bash
TF_ACC=1 go test ./internal/provider/ -v -run "TestAccAlertReceiverResource" -timeout 30m 2>&1 | tee test-output.log
```

---

## Known Issues and Fixes Applied

### Update Method ID Bug (Fixed in 3 resources)

The following resources have been fixed to handle the Update method ID preservation:

- `alert_receiver_resource.go` - Fixed
- `network_connector_resource.go` - Fixed
- `cloud_credentials_resource.go` - Fixed

**Pattern to fix in remaining ~142 resources:**
```go
// Change this:
data.ID = types.StringValue(updated.Metadata.Name)

// To this:
data.ID = types.StringValue(data.Name.ValueString())
```

### 404 Handling (Fixed in 3 resources)

The following resources have been fixed to handle 404 errors in Read/Delete methods:

- `alert_receiver_resource.go` - Fixed
- `network_connector_resource.go` - Fixed
- `cloud_credentials_resource.go` - Fixed

---

## Next Steps

1. **Immediate**: Run all safe tests to validate resource implementations
2. **Short-term**: Fix Update method ID bug in code generator
3. **Medium-term**: Create tests for cloud credential resources
4. **Long-term**: Create tests for licensed feature resources

---

*Last Updated: 2025-11-28*
