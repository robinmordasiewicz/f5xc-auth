# F5XC Terraform Provider - Test Resource Categorization

## Overview

This document categorizes all 144 resources in the terraform-provider-f5xc provider by safety risk for acceptance testing development.

**Analysis Date**: 2025-11-28
**Total Resources**: 144
**Tests Completed**: 2 (namespace, healthcheck)

## Risk Distribution Summary

| Risk Level | Count | Percentage | Description |
|------------|-------|------------|-------------|
| LOW (GREEN) | 65 | 45.1% | Safe for CI/CD, namespace-scoped, no external deps |
| MEDIUM (YELLOW) | 57 | 39.6% | References other resources, moderate complexity |
| HIGH (RED) | 22 | 15.3% | Cloud infra, tenant ops, external side effects |

---

## LOW RISK (GREEN) - 65 Resources

Safe for automated testing in CI/CD pipelines. Namespace-scoped, self-contained CRUD operations with no external dependencies.

### Already Tested (2)
| Resource | Status | Tests |
|----------|--------|-------|
| `namespace` | DONE | 13 tests |
| `healthcheck` | DONE | 13 tests |

### Priority 1 - Simple Flat Resources (8)
Minimal fields, no nested blocks - ideal next candidates.

| Resource | Complexity | Dependencies | Notes |
|----------|------------|--------------|-------|
| `ip_prefix_set` | Very Low | None | Simple list of IP prefixes |
| `bgp_asn_set` | Very Low | None | Simple list of ASNs |
| `geo_location_set` | Very Low | None | Simple location list |
| `data_group` | Low | None | Key-value data |
| `data_type` | Low | None | Data type definitions |
| `filter_set` | Low | None | Filter definitions |
| `policer` | Low | None | Traffic policer |
| `forwarding_class` | Low | None | QoS class definitions |

### Priority 2 - Security/Policy Resources (15)
Namespace-scoped security configurations.

| Resource | Complexity | Dependencies | Notes |
|----------|------------|--------------|-------|
| `app_firewall` | Medium | None | WAF rules |
| `rate_limiter` | Medium | None | Rate limiting config |
| `rate_limiter_policy` | Medium | rate_limiter (optional) | Rate limit policies |
| `malicious_user_mitigation` | Medium | None | Bot defense |
| `user_identification` | Medium | None | User ID rules |
| `waf_exclusion_policy` | Medium | None | WAF exceptions |
| `sensitive_data_policy` | Medium | None | Data masking |
| `forward_proxy_policy` | Medium | None | Proxy rules |
| `network_policy` | Medium | None | Network rules |
| `network_policy_rule` | Medium | network_policy | Individual rules |
| `service_policy` | High | None | Complex rule sets |
| `service_policy_rule` | High | service_policy | Individual rules |
| `enhanced_firewall_policy` | Medium | None | L3/L4 firewall |
| `fast_acl` | Medium | None | Fast ACL rules |
| `fast_acl_rule` | Medium | fast_acl | Individual ACL rules |

### Priority 3 - Certificate/PKI Resources (6)
Certificate and trust management.

| Resource | Complexity | Dependencies | Notes |
|----------|------------|--------------|-------|
| `certificate` | Medium | None | TLS certificates |
| `certificate_chain` | Medium | None | Cert chains |
| `trusted_ca_list` | Medium | None | CA trust lists |
| `crl` | Medium | None | Revocation lists |
| `secret_policy` | Medium | None | Secret access policy |
| `secret_policy_rule` | Medium | secret_policy | Policy rules |

### Priority 4 - DNS Resources (6)
DNS management without zone delegation.

| Resource | Complexity | Dependencies | Notes |
|----------|------------|--------------|-------|
| `dns_lb_health_check` | Low | None | DNS health checks |
| `dns_lb_pool` | Medium | dns_lb_health_check (opt) | DNS LB pools |
| `dns_load_balancer` | Medium | dns_lb_pool (opt) | DNS load balancer |
| `dns_domain` | Medium | None | Domain config |
| `dns_zone` | Medium | None | Zone config |
| `dns_compliance_checks` | Low | None | DNS compliance |

### Priority 5 - Load Balancer Resources (6)
Load balancer configurations.

| Resource | Complexity | Dependencies | Notes |
|----------|------------|--------------|-------|
| `origin_pool` | High | healthcheck (optional) | Backend pools |
| `http_loadbalancer` | High | origin_pool (optional) | HTTP/HTTPS LB |
| `tcp_loadbalancer` | High | origin_pool (optional) | TCP LB |
| `udp_loadbalancer` | High | origin_pool (optional) | UDP LB |
| `cdn_loadbalancer` | High | origin_pool (optional) | CDN LB |
| `cdn_cache_rule` | Medium | cdn_loadbalancer | Cache rules |

### Priority 6 - Logging/Monitoring (4)
Observability configurations.

| Resource | Complexity | Dependencies | Notes |
|----------|------------|--------------|-------|
| `log_receiver` | Medium | None | Log forwarding |
| `report_config` | Low | None | Report settings |
| `alert_policy` | Medium | alert_receiver (opt) | Alert rules |
| `protocol_inspection` | Medium | None | Deep inspection |

### Priority 7 - Network Configuration (10)
Network and routing resources.

| Resource | Complexity | Dependencies | Notes |
|----------|------------|--------------|-------|
| `virtual_network` | Medium | None | Virtual networks |
| `virtual_site` | Medium | None | Site abstraction |
| `virtual_host` | Medium | None | Virtual hosts |
| `subnet` | Medium | virtual_network | Subnets |
| `route` | Medium | None | Routing entries |
| `nat_policy` | Medium | None | NAT rules |
| `network_connector` | Medium | None | Network connectors |
| `segment` | Medium | None | Network segments |
| `advertise_policy` | Medium | None | Route advertisement |
| `policy_based_routing` | Medium | None | PBR rules |

### Priority 8 - Other Namespace Resources (8)
Miscellaneous namespace-scoped resources.

| Resource | Complexity | Dependencies | Notes |
|----------|------------|--------------|-------|
| `endpoint` | Low | None | Service endpoints |
| `proxy` | Medium | None | Proxy config |
| `irule` | Medium | None | iRules |
| `bigip_irule` | Medium | None | BIG-IP iRules |
| `protocol_policer` | Medium | None | Protocol rate limits |
| `usb_policy` | Low | None | USB policies |
| `workload` | Medium | None | Workload definitions |
| `workload_flavor` | Low | None | Workload flavors |

---

## MEDIUM RISK (YELLOW) - 57 Resources

Requires careful testing. May reference other resources, have optional cloud integrations, or moderate complexity.

### API Management (7)
| Resource | Risk Factor | Dependencies |
|----------|-------------|--------------|
| `api_definition` | References schemas | None |
| `api_discovery` | May discover external APIs | None |
| `api_crawler` | Crawls external URLs | External URLs |
| `api_testing` | Tests external APIs | External endpoints |
| `api_credential` | Stores credentials | None |
| `app_api_group` | Groups API definitions | api_definition |
| `app_setting` | App configuration | Various |

### Kubernetes Resources (6)
| Resource | Risk Factor | Dependencies |
|----------|-------------|--------------|
| `k8s_cluster` | Cluster configuration | Site resources |
| `k8s_cluster_role` | RBAC roles | k8s_cluster |
| `k8s_cluster_role_binding` | RBAC bindings | k8s_cluster_role |
| `k8s_pod_security_policy` | Pod security | k8s_cluster |
| `k8s_pod_security_admission` | Admission control | k8s_cluster |
| `virtual_k8s` | Virtual K8s | Site resources |

### BGP/Routing (4)
| Resource | Risk Factor | Dependencies |
|----------|-------------|--------------|
| `bgp` | Network routing changes | Site resources |
| `bgp_routing_policy` | Routing policy | bgp |
| `policy_based_routing` | PBR rules | network resources |
| `srv6_network_slice` | SRv6 configuration | network resources |

### Site/Infrastructure Config (12)
| Resource | Risk Factor | Dependencies |
|----------|-------------|--------------|
| `fleet` | Fleet management | Sites |
| `cluster` | Cluster config | Sites |
| `dc_cluster_group` | DC clustering | Sites |
| `site_mesh_group` | Site mesh | Sites |
| `network_interface` | Interface config | Sites |
| `network_firewall` | Site firewall | Sites |
| `external_connector` | External connectivity | Sites |
| `tunnel` | Tunnel config | Sites |
| `infraprotect_tunnel` | InfraProtect tunnel | Sites |
| `nfv_service` | NFV services | Sites |
| `discovery` | Service discovery | Sites |
| `container_registry` | Registry config | Sites |

### VPN/IPSec (4)
| Resource | Risk Factor | Dependencies |
|----------|-------------|--------------|
| `ike1` | IKE Phase 1 | None |
| `ike2` | IKE Phase 2 | ike1 |
| `ike_phase1_profile` | IKE profiles | None |
| `ike_phase2_profile` | IKE profiles | ike_phase1_profile |

### InfraProtect (6)
| Resource | Risk Factor | Dependencies |
|----------|-------------|--------------|
| `infraprotect_asn` | ASN config | None |
| `infraprotect_asn_prefix` | ASN prefixes | infraprotect_asn |
| `infraprotect_deny_list_rule` | Deny rules | None |
| `infraprotect_firewall_rule` | Firewall rules | None |
| `infraprotect_firewall_rule_group` | Rule groups | infraprotect_firewall_rule |
| `infraprotect_internet_prefix_advertisement` | Prefix ads | None |

### Identity/Auth (6)
| Resource | Risk Factor | Dependencies |
|----------|-------------|--------------|
| `authentication` | Auth config | May need OIDC |
| `oidc_provider` | OIDC setup | External IdP |
| `role` | RBAC roles | None |
| `quota` | Resource quotas | None |
| `secret_management_access` | Secret access | None |
| `registration` | Site registration | Sites |

### Cloud Integration (Optional) (6)
| Resource | Risk Factor | Dependencies |
|----------|-------------|--------------|
| `cloud_link` | Cloud linking | Optional cloud creds |
| `cloud_connect` | Cloud connectivity | Optional cloud creds |
| `cloud_elastic_ip` | Elastic IPs | Cloud sites |
| `address_allocator` | IP allocation | Cloud resources |
| `cminstance` | CM instances | Cloud resources |
| `voltshare_admin_policy` | Voltshare | Sites |

### Other Medium Risk (6)
| Resource | Risk Factor | Dependencies |
|----------|-------------|--------------|
| `app_type` | App classification | None |
| `network_policy_view` | Policy views | network_policy |
| `contact` | Contact info | None |
| `bot_defense_app_infrastructure` | Bot defense | Sites |
| `code_base_integration` | Code integration | External repos |
| `tpm_category` | TPM categories | None |

---

## HIGH RISK (RED) - 22 Resources

Requires special test environments, cloud credentials, or creates external side effects.

### Cloud Site Deployments (6)
**RISK: Creates real cloud infrastructure with cost implications**

| Resource | Cloud | Dependencies | Notes |
|----------|-------|--------------|-------|
| `aws_vpc_site` | AWS | AWS credentials | Creates VPCs, subnets, instances |
| `aws_tgw_site` | AWS | AWS credentials | Creates Transit Gateway |
| `azure_vnet_site` | Azure | Azure credentials | Creates VNets, subnets |
| `gcp_vpc_site` | GCP | GCP credentials | Creates VPCs, subnets |
| `securemesh_site` | Any | Cloud credentials | Site mesh deployment |
| `securemesh_site_v2` | Any | Cloud credentials | Site mesh v2 |
| `voltstack_site` | Any | Physical/VM | Voltstack deployment |

### Cloud Credentials (1)
**RISK: Stores sensitive cloud provider credentials**

| Resource | Risk Factor | Notes |
|----------|-------------|-------|
| `cloud_credentials` | Stores AWS/Azure/GCP creds | Security sensitive |

### Tenant Management (6)
**RISK: System-level operations affecting billing and isolation**

| Resource | Risk Factor | Notes |
|----------|-------------|-------|
| `child_tenant` | Creates sub-tenants | Billing implications |
| `child_tenant_manager` | Tenant management | Admin operations |
| `managed_tenant` | MSP tenants | Multi-tenant ops |
| `allowed_tenant` | Tenant access | Cross-tenant |
| `tenant_configuration` | Tenant settings | System-wide |
| `tenant_profile` | Tenant profiles | System-wide |

### External Integrations (5)
**RISK: Creates external side effects (tickets, notifications, etc.)**

| Resource | Risk Factor | Notes |
|----------|-------------|-------|
| `alert_receiver` | Sends alerts | External notifications |
| `global_log_receiver` | Global logging | External log systems |
| `customer_support` | Support tickets | Creates real tickets |
| `ticket_tracking_system` | Ticketing | External systems |
| `apm` | APM integration | External APM |

### Access Tokens (4)
**RISK: Creates authentication tokens with security implications**

| Resource | Risk Factor | Notes |
|----------|-------------|-------|
| `token` | API tokens | Security sensitive |
| `tpm_api_key` | TPM API keys | Security sensitive |
| `tpm_manager` | TPM management | Admin operations |
| `addon_subscription` | Subscriptions | Billing implications |

---

## Testing Roadmap

### Phase 1: Foundation (Current)
- [x] namespace (13 tests) - DONE
- [x] healthcheck (13 tests) - DONE

### Phase 2: Simple Flat Resources
Priority order for next tests:
1. `ip_prefix_set` - Simplest next candidate
2. `bgp_asn_set` - Similar pattern
3. `geo_location_set` - Similar pattern
4. `data_group` - Key-value pattern
5. `policer` - Simple config

### Phase 3: Security/Policy Resources
1. `app_firewall` - WAF testing
2. `rate_limiter` - Rate limiting
3. `user_identification` - User ID
4. `waf_exclusion_policy` - WAF exceptions

### Phase 4: Certificate Resources
1. `certificate` - TLS certs
2. `trusted_ca_list` - CA lists
3. `secret_policy` - Secret access

### Phase 5: DNS Resources
1. `dns_lb_health_check` - DNS health
2. `dns_lb_pool` - DNS pools
3. `dns_load_balancer` - DNS LB

### Phase 6: Load Balancer Resources
1. `origin_pool` - Backend pools
2. `http_loadbalancer` - HTTP LB
3. `tcp_loadbalancer` - TCP LB

### Phase 7: Network Resources
1. `virtual_network` - VNets
2. `virtual_site` - VSites
3. `route` - Routing

### Phase 8: Medium Risk Resources
- Test in staging environments
- Ensure proper cleanup
- Document dependencies

### Phase 9: High Risk Resources
- Requires dedicated test accounts
- Cloud credentials in CI secrets
- Careful cost monitoring
- Tenant isolation

---

## Test Development Guidelines

### For LOW RISK Resources
```go
// Standard test pattern - safe for CI/CD
resource.ParallelTest(t, resource.TestCase{
    PreCheck:                 func() { acctest.PreCheck(t) },
    ProtoV6ProviderFactories: acctest.ProtoV6ProviderFactories,
    ExternalProviders: map[string]resource.ExternalProvider{
        "time": {Source: "hashicorp/time"},
    },
    CheckDestroy: acctest.Check{Resource}Destroyed,
    Steps: []resource.TestStep{...},
})
```

### For MEDIUM RISK Resources
```go
// Add dependency checks and cleanup
resource.Test(t, resource.TestCase{  // Non-parallel for ordering
    PreCheck: func() {
        acctest.PreCheck(t)
        acctest.PreCheckDependencies(t, []string{"dependency_resource"})
    },
    // ... test steps with explicit ordering
})
```

### For HIGH RISK Resources
```go
// Skip in CI, require explicit opt-in
func TestAccCloudSite(t *testing.T) {
    if os.Getenv("TF_ACC_CLOUD_TESTS") != "1" {
        t.Skip("Skipping cloud site test - set TF_ACC_CLOUD_TESTS=1")
    }
    // ... cloud-specific tests
}
```

---

## Metrics

| Metric | Value |
|--------|-------|
| Total Resources | 144 |
| Tests Completed | 2 (1.4%) |
| LOW RISK Remaining | 63 |
| MEDIUM RISK Remaining | 57 |
| HIGH RISK Remaining | 22 |
| Estimated Tests Needed | ~1,800+ (13 tests avg per resource) |
