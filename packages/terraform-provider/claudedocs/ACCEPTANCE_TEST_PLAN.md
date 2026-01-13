# Acceptance Test Plan for F5XC Terraform Provider

## Executive Summary

This document outlines a comprehensive, phased approach to acceptance testing for the F5XC Terraform Provider. The plan prioritizes **safety first**, starting with the lowest-risk resource to establish the test harness before expanding to more complex resources.

## Recommended Starting Point: `namespace` Resource

### Why `namespace` is the Safest Choice

| Criteria | `namespace` Score | Rationale |
|----------|------------------|-----------|
| **Minimal Fields** | ✅ Excellent | Only requires `name` + `namespace` (system) |
| **No Traffic Impact** | ✅ Excellent | Pure organizational container |
| **No Security Impact** | ✅ Excellent | Doesn't affect policies or access |
| **Fast Operations** | ✅ Excellent | Quick create/read/delete cycles |
| **Easily Reversible** | ✅ Excellent | Delete removes it completely |
| **No Dependencies** | ✅ Excellent | Doesn't require other resources |
| **Isolated** | ✅ Excellent | Doesn't affect other resources |

### Namespace Resource Schema (Minimal Required)

```hcl
resource "f5xc_namespace" "test" {
  name      = "tf-acc-test-namespace"
  namespace = "system"  # Parent namespace (always "system" for namespaces)
}
```

### Optional Fields

- `description` - Human-readable description
- `labels` - Key-value metadata
- `annotations` - Additional metadata
- `disable` - Administrative disable flag

---

## Complete Resource Inventory (144 Resources)

### Safety Tier 1: Configuration-Only (Safest - 23 resources)

These resources only create configuration objects with no runtime impact:

| Resource | Description | Risk Level |
|----------|-------------|------------|
| `namespace` | **RECOMMENDED START** - Organizational container | Minimal |
| `app_type` | Application type definition | Minimal |
| `healthcheck` | Health check configuration (not attached) | Minimal |
| `ip_prefix_set` | IP prefix list definition | Minimal |
| `geo_location_set` | Geographic location set | Minimal |
| `data_type` | Data type definition | Minimal |
| `data_group` | Data group configuration | Minimal |
| `known_label` | Label key definition | Minimal |
| `bgp_asn_set` | BGP ASN set definition | Minimal |
| `filter_set` | Filter set configuration | Minimal |
| `certificate` | Certificate object (storage only) | Minimal |
| `certificate_chain` | Certificate chain storage | Minimal |
| `trusted_ca_list` | CA trust list | Minimal |
| `crl` | Certificate revocation list | Minimal |
| `policer` | Traffic policer definition | Minimal |
| `rate_limiter` | Rate limiter configuration | Minimal |
| `malicious_user_mitigation` | Mitigation rules definition | Minimal |
| `waf_exclusion_policy` | WAF exclusion rules | Minimal |
| `forwarding_class` | QoS class definition | Minimal |
| `workload_flavor` | Workload sizing definition | Minimal |
| `quota` | Resource quota definition | Minimal |
| `report_config` | Reporting configuration | Minimal |
| `contact` | Contact information | Minimal |

### Safety Tier 2: Security Policies (Low Risk - 18 resources)

These create security policies but don't affect traffic until attached:

| Resource | Description | Risk Level |
|----------|-------------|------------|
| `app_firewall` | Application firewall rules | Low |
| `service_policy` | Service access policy | Low |
| `service_policy_rule` | Service policy rule | Low |
| `secret_policy` | Secret access policy | Low |
| `secret_policy_rule` | Secret policy rule | Low |
| `network_policy` | Network security policy | Low |
| `network_policy_rule` | Network policy rule | Low |
| `network_policy_view` | Network policy view | Low |
| `fast_acl` | Fast ACL rules | Low |
| `fast_acl_rule` | Fast ACL rule entry | Low |
| `forward_proxy_policy` | Forward proxy rules | Low |
| `advertise_policy` | Route advertisement policy | Low |
| `enhanced_firewall_policy` | Enhanced firewall rules | Low |
| `protocol_inspection` | Protocol inspection rules | Low |
| `protocol_policer` | Protocol rate limiting | Low |
| `sensitive_data_policy` | PII detection rules | Low |
| `usb_policy` | USB device policy | Low |
| `voltshare_admin_policy` | Admin sharing policy | Low |

### Safety Tier 3: Network Configuration (Medium Risk - 22 resources)

These create network objects but typically require attachment to be active:

| Resource | Description | Risk Level |
|----------|-------------|------------|
| `origin_pool` | Backend server pool | Medium |
| `endpoint` | Service endpoint | Medium |
| `cluster` | Upstream cluster | Medium |
| `route` | Routing entry | Medium |
| `virtual_network` | Virtual network definition | Medium |
| `virtual_site` | Virtual site grouping | Medium |
| `subnet` | Subnet definition | Medium |
| `network_connector` | Network connection | Medium |
| `network_interface` | Interface configuration | Medium |
| `network_firewall` | Network firewall | Medium |
| `nat_policy` | NAT policy | Medium |
| `policy_based_routing` | PBR rules | Medium |
| `proxy` | Proxy configuration | Medium |
| `dns_zone` | DNS zone | Medium |
| `dns_domain` | DNS domain | Medium |
| `dns_lb_pool` | DNS LB pool | Medium |
| `dns_lb_health_check` | DNS health check | Medium |
| `dns_load_balancer` | DNS load balancer | Medium |
| `dns_compliance_checks` | DNS compliance | Medium |
| `bgp` | BGP configuration | Medium |
| `bgp_routing_policy` | BGP routing policy | Medium |
| `tunnel` | Network tunnel | Medium |

### Safety Tier 4: Load Balancers (Medium-High Risk - 8 resources)

These can affect live traffic if misconfigured:

| Resource | Description | Risk Level |
|----------|-------------|------------|
| `http_loadbalancer` | HTTP/HTTPS load balancer | Medium-High |
| `tcp_loadbalancer` | TCP load balancer | Medium-High |
| `udp_loadbalancer` | UDP load balancer | Medium-High |
| `cdn_loadbalancer` | CDN load balancer | Medium-High |
| `cdn_cache_rule` | CDN caching rules | Medium-High |
| `virtual_host` | Virtual host configuration | Medium-High |
| `rate_limiter_policy` | Applied rate limiting | Medium-High |
| `irule` | iRule logic | Medium-High |

### Safety Tier 5: Sites & Infrastructure (High Risk - 18 resources)

These provision actual infrastructure:

| Resource | Description | Risk Level |
|----------|-------------|------------|
| `aws_vpc_site` | AWS VPC site deployment | High |
| `aws_tgw_site` | AWS TGW site | High |
| `azure_vnet_site` | Azure VNet site | High |
| `gcp_vpc_site` | GCP VPC site | High |
| `voltstack_site` | VoltStack site | High |
| `securemesh_site` | Secure mesh site | High |
| `securemesh_site_v2` | Secure mesh v2 | High |
| `k8s_cluster` | Kubernetes cluster | High |
| `virtual_k8s` | Virtual Kubernetes | High |
| `fleet` | Fleet management | High |
| `cloud_credentials` | Cloud provider creds | High |
| `cloud_connect` | Cloud connectivity | High |
| `cloud_link` | Cloud link | High |
| `cloud_elastic_ip` | Cloud elastic IP | High |
| `dc_cluster_group` | DC cluster group | High |
| `site_mesh_group` | Site mesh group | High |
| `nfv_service` | NFV service | High |
| `segment` | Network segment | High |

### Safety Tier 6: Tenant & Access Management (Critical - 15 resources)

These affect multi-tenancy and access control:

| Resource | Description | Risk Level |
|----------|-------------|------------|
| `role` | RBAC role definition | Critical |
| `token` | API token | Critical |
| `api_credential` | API credentials | Critical |
| `tpm_api_key` | TPM API key | Critical |
| `authentication` | Auth configuration | Critical |
| `oidc_provider` | OIDC provider | Critical |
| `user_identification` | User ID rules | Critical |
| `allowed_tenant` | Tenant access | Critical |
| `child_tenant` | Child tenant | Critical |
| `child_tenant_manager` | Child tenant mgmt | Critical |
| `managed_tenant` | Managed tenant | Critical |
| `tenant_configuration` | Tenant config | Critical |
| `tenant_profile` | Tenant profile | Critical |
| `secret_management_access` | Secret access | Critical |
| `registration` | Site registration | Critical |

### Safety Tier 7: API Security & Bot Defense (Medium - 10 resources)

| Resource | Description | Risk Level |
|----------|-------------|------------|
| `api_definition` | API schema definition | Medium |
| `api_discovery` | API discovery config | Medium |
| `api_crawler` | API crawler | Medium |
| `api_testing` | API testing config | Medium |
| `app_api_group` | API group | Medium |
| `app_setting` | App settings | Medium |
| `bot_defense_app_infrastructure` | Bot defense | Medium |
| `apm` | APM configuration | Medium |
| `discovery` | Service discovery | Medium |
| `workload` | Workload definition | Medium |

### Safety Tier 8: Monitoring & Alerting (Low Risk - 7 resources)

| Resource | Description | Risk Level |
|----------|-------------|------------|
| `alert_policy` | Alert rules | Low |
| `alert_receiver` | Alert destinations | Low |
| `log_receiver` | Log collection | Low |
| `global_log_receiver` | Global logging | Low |
| `customer_support` | Support config | Low |
| `ticket_tracking_system` | Ticket integration | Low |
| `tpm_category` | TPM categories | Low |

### Safety Tier 9: Advanced Networking (High Risk - 15 resources)

| Resource | Description | Risk Level |
|----------|-------------|------------|
| `ike_phase1_profile` | IKE phase 1 | High |
| `ike_phase2_profile` | IKE phase 2 | High |
| `ike1` | IKE v1 config | High |
| `ike2` | IKE v2 config | High |
| `srv6_network_slice` | SRv6 slice | High |
| `infraprotect_asn` | ASN protection | High |
| `infraprotect_asn_prefix` | ASN prefix protection | High |
| `infraprotect_deny_list_rule` | Deny list | High |
| `infraprotect_firewall_rule` | Infra firewall | High |
| `infraprotect_firewall_rule_group` | Firewall group | High |
| `infraprotect_internet_prefix_advertisement` | Prefix advert | High |
| `infraprotect_tunnel` | Infra tunnel | High |
| `external_connector` | External conn | High |
| `cminstance` | CM instance | High |
| `bigip_irule` | BIG-IP iRule | High |

### Safety Tier 10: K8s & Container (Medium-High - 8 resources)

| Resource | Description | Risk Level |
|----------|-------------|------------|
| `k8s_cluster_role` | K8s RBAC role | Medium-High |
| `k8s_cluster_role_binding` | K8s role binding | Medium-High |
| `k8s_pod_security_admission` | PSA config | Medium-High |
| `k8s_pod_security_policy` | PSP config | Medium-High |
| `container_registry` | Container registry | Medium-High |
| `code_base_integration` | Code integration | Medium-High |
| `address_allocator` | IP allocation | Medium-High |
| `tpm_manager` | TPM management | Medium-High |

### Remaining Resources (Other categories)

| Resource | Description | Risk Level |
|----------|-------------|------------|
| `addon_subscription` | Add-on subscription | Low |

---

## Phased Testing Approach

### Phase 0: Infrastructure Setup (Current)

**Goal**: Establish test harness with P12 authentication

**Tasks**:
1. ✅ Create unit tests for `internal/client/` (PR #259)
2. ⏳ Update `acctest` package for P12 authentication
3. ⏳ Create single safe test (`namespace`)
4. ⏳ Verify test harness works end-to-end

### Phase 1: Single Safe Test (`namespace`)

**Goal**: Validate test harness with lowest-risk resource

**Test Cases for `namespace`**:
```
1. TestAccNamespaceResource_basic
   - Create namespace with minimal config
   - Verify creation
   - Read back and verify attributes
   - Destroy and verify cleanup

2. TestAccNamespaceResource_withLabels
   - Create namespace with labels
   - Verify labels are set

3. TestAccNamespaceResource_update
   - Create, then update labels/description
   - Verify update applied

4. TestAccNamespaceResource_import
   - Create namespace
   - Import by name
   - Verify imported state matches

5. TestAccNamespaceResource_disappears
   - Create namespace
   - Delete externally
   - Verify Terraform handles gracefully
```

### Phase 2: Tier 1 Resources (Configuration-Only)

**Goal**: Test all 23 configuration-only resources

**Priority Order**:
1. `healthcheck` - Simple, commonly used
2. `ip_prefix_set` - Foundation for policies
3. `app_type` - Foundation for app settings
4. `geo_location_set` - Simple list resource
5. Continue with remaining Tier 1...

### Phase 3: Tier 2-3 Resources (Policies & Network)

**Goal**: Test security policies and network objects

**Approach**:
- Test policies in isolation (not attached to LBs)
- Test network objects that don't affect live traffic
- Use test-specific naming prefixes

### Phase 4: Tier 4 Resources (Load Balancers)

**Goal**: Test load balancer resources

**Approach**:
- Create LBs with test-only domains
- Use non-routable test domains
- Verify CRUD operations
- Clean up immediately after tests

### Phase 5: High-Risk Resources

**Goal**: Test infrastructure provisioning

**Approach**:
- Requires dedicated test cloud credentials
- May need longer timeouts
- Should run in isolated test environment
- Consider cost implications

---

## Test Naming Convention

All test resources will use this naming pattern:
```
tf-acc-test-{resource-type}-{random-suffix}
```

Example: `tf-acc-test-namespace-a1b2c3d4`

This ensures:
- Easy identification of test resources
- Safe cleanup if tests fail
- No collision with production resources

---

## Environment Variables Required

```bash
# Authentication (P12 - primary for testing)
F5XC_API_URL="https://your-tenant.console.ves.volterra.io/api"
F5XC_API_P12_FILE="/path/to/certificate.p12"
F5XC_P12_PASSWORD="your-p12-password"

# Or Token auth (alternative)
F5XC_API_TOKEN="your-api-token"

# Test control
TF_ACC=1                      # Enable acceptance tests
F5XC_TEST_NAMESPACE="system"  # Namespace for tests (default: system)
```

---

## Estimated Test Counts

| Phase | Resources | Tests per Resource | Total Tests |
|-------|-----------|-------------------|-------------|
| Phase 1 | 1 (namespace) | 5 | 5 |
| Phase 2 | 23 | 3-5 | ~90 |
| Phase 3 | 40 | 3-5 | ~160 |
| Phase 4 | 8 | 5-7 | ~50 |
| Phase 5 | 72 | 3-5 | ~290 |
| **Total** | **144** | - | **~595** |

---

## Next Steps

1. **Immediate**: Update `acctest` package for P12 auth
2. **Immediate**: Create `namespace_resource_test.go`
3. **After Validation**: Expand to Phase 2 resources
4. **Progressive**: Continue through phases as confidence builds

---

## Risk Mitigation Strategies

1. **Test Isolation**: All test resources use `tf-acc-test-` prefix
2. **Cleanup on Failure**: Implement robust cleanup in `CheckDestroy`
3. **Timeout Handling**: Generous timeouts with proper context cancellation
4. **Parallel Safety**: Use unique names to allow parallel test execution
5. **Rate Limit Handling**: Implement backoff in test infrastructure
6. **Dry Run Option**: Consider adding `--dry-run` mode for test validation

---

## Document Version

- **Created**: 2024-11-28
- **Last Updated**: 2024-11-28
- **Status**: Active - Phase 0 in progress
