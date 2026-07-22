# Tasks: MCP Registry Connector — Productization & Air-Gapped Support

> **RHDHPLAN-1510 Consolidation (2026-07-08):** Epic RHIDP-15315 (OCI Skill Registry Connector) was closed — scope absorbed by RHIDP-15294 (RHDHPLAN-1507). This connector continues under RHIDP-15313 with 3 stories (RHIDP-15317, 15318, 15319).
>
> **Cross-connector dependencies (RHIDP-15316):**
>
> - RHIDP-15318 (TLS/auth hardening) is blocked by RHIDP-15265 (endpoint/credential config schema) and RHIDP-15329 (shared CA bundle utility)
> - RHIDP-15319 (annotation enrichment) is blocked by RHDHPLAN-1507 SDK (RHIDP-15258)
> - RHIDP-15317 (mirror endpoint) has no cross-connector blockers

## 1. Mirror Endpoint Configuration (P0) — RHIDP-15317

- [ ] 1.1 Add `catalog.providers.mcpRegistry.endpoint` config schema in `config.d.ts`
- [ ] 1.2 Implement endpoint configuration loading from app-config
- [ ] 1.3 Add environment variable override support (`MCP_REGISTRY_ENDPOINT`)
- [ ] 1.4 Implement endpoint URL validation (schema, host, port)
- [ ] 1.5 Add endpoint fallback logic (app-config > env var > default public endpoint)
- [ ] 1.6 Implement startup endpoint validation health check
- [ ] 1.7 Add endpoint configuration logging at connector startup
- [ ] 1.8 Add security warning for non-HTTPS endpoints
- [ ] 1.9 Implement HTTP client configuration with mirror endpoint URL
- [ ] 1.10 Add Prometheus metrics for endpoint request count, latency, error rate
- [ ] 1.11 Add Prometheus metric for public endpoint violation detection
- [ ] 1.12 Write integration test: zero outbound traffic to public endpoint when mirror configured
- [ ] 1.13 Write integration test: all HTTP requests target configured mirror endpoint
- [ ] 1.14 Write integration test: DNS resolution targets only mirror endpoint domain
- [ ] 1.15 Write integration test: mirror endpoint unreachable handling with retry backoff
- [ ] 1.16 Write integration test: invalid endpoint URL handling at startup
- [ ] 1.17 Write integration test: non-HTTPS endpoint warning logging
- [ ] 1.18 Write integration test: endpoint configuration override precedence (app-config > env var)
- [ ] 1.19 Add documentation: mirror endpoint configuration examples
- [ ] 1.20 Add documentation: zero-internet validation and monitoring

## 2. TLS and Credential Hardening (P0) — RHIDP-15318

- [ ] 2.1 Integrate shared CA bundle utility from RHIDP-15316 (`loadCaBundle()`)
- [ ] 2.2 Add `catalog.providers.mcpRegistry.tls.caFile` config schema
- [ ] 2.3 Implement custom CA bundle loading from file path
- [ ] 2.4 Add graceful degradation: invalid CA bundle falls back to system CA bundle
- [ ] 2.5 Add warning logging for invalid/unreadable/malformed CA bundle files
- [ ] 2.6 Implement HTTPS agent configuration with custom CA bundle
- [ ] 2.7 Enforce TLS certificate validation (`rejectUnauthorized: true`)
- [ ] 2.8 Add `catalog.providers.mcpRegistry.auth.secretRef` config schema
- [ ] 2.9 Implement Kubernetes Secret reading via Backstage Kubernetes client
- [ ] 2.10 Implement credential extraction from Secret (`username`/`password` or `token`)
- [ ] 2.11 Implement HTTP Basic Auth for username/password credentials
- [ ] 2.12 Implement Bearer token authentication for token credentials
- [ ] 2.13 Implement Secret data caching with 5-minute TTL
- [ ] 2.14 Implement cache invalidation on HTTP 401 Unauthorized response
- [ ] 2.15 Add error handling: missing Secret, missing credential keys, invalid Secret data
- [ ] 2.16 Add per-connector TLS configuration isolation (multiple instances with different CA bundles)
- [ ] 2.17 Add Prometheus metrics for TLS validation success/failure per endpoint
- [ ] 2.18 Add Prometheus metrics for authentication success/failure per endpoint
- [ ] 2.19 Write integration test: custom CA bundle TLS validation
- [ ] 2.20 Write integration test: invalid CA bundle graceful degradation
- [ ] 2.21 Write integration test: Kubernetes Secret-based authentication (Basic Auth)
- [ ] 2.22 Write integration test: Kubernetes Secret-based authentication (Bearer token)
- [ ] 2.23 Write integration test: missing Secret error handling
- [ ] 2.24 Write integration test: missing credential keys error handling
- [ ] 2.25 Write integration test: Secret cache invalidation on auth failure
- [ ] 2.26 Write integration test: per-connector TLS configuration isolation
- [ ] 2.27 Add documentation: custom CA bundle configuration and troubleshooting
- [ ] 2.28 Add documentation: Kubernetes Secret-based authentication setup
- [ ] 2.29 Add documentation: Secret rotation procedures

## 3. Annotation Enrichment (P1) — RHIDP-15319

- [ ] 3.1 Implement `RhdhMcpRegistryProviderWrapper` class wrapping upstream connector
- [ ] 3.2 Implement entity emission interception before `applyMutation`
- [ ] 3.3 Implement annotation enrichment logic (`enrichWithAiAssetAnnotations()`)
- [ ] 3.4 Add `rhdh.io/ai-asset-category: "mcp-server"` annotation population
- [ ] 3.5 Add `rhdh.io/ai-asset-source: "mcp-registry"` annotation population
- [ ] 3.6 Implement version metadata extraction from MCP server manifest
- [ ] 3.7 Add `rhdh.io/ai-asset-version` annotation population (extracted or "unknown")
- [ ] 3.8 Add graceful degradation: enrichment failure logs warning, emits entity without annotations
- [ ] 3.9 Add preservation logic: do not overwrite existing AI Asset annotations
- [ ] 3.10 Add DEBUG-level logging for enriched entities
- [ ] 3.11 Integrate with RHDHPLAN-1507's SDK validation layer
- [ ] 3.12 Add Prometheus metrics for enrichment success/failure rate
- [ ] 3.13 Add Prometheus metrics for version extraction success/failure rate
- [ ] 3.14 Add Prometheus metrics for enrichment latency (p50, p95, p99)
- [ ] 3.15 Write unit test: annotation population with all required fields
- [ ] 3.16 Write unit test: version metadata extraction from manifest
- [ ] 3.17 Write unit test: version placeholder for missing metadata
- [ ] 3.18 Write unit test: enrichment failure graceful degradation
- [ ] 3.19 Write unit test: existing annotation preservation
- [ ] 3.20 Write integration test: SDK validation integration with enriched entities
- [ ] 3.21 Write integration test: enrichment performance (1000 entities under 5s)
- [ ] 3.22 Add documentation: AI Asset annotation scheme and semantics
- [ ] 3.23 Add documentation: SDK validation integration and error handling

## 4. Integration Testing (P1)

- [ ] 4.1 Set up test harness for zero-internet validation (network traffic monitoring)
- [ ] 4.2 Implement mock mirror registry server for integration tests
- [ ] 4.3 Implement mock Kubernetes Secret API for integration tests
- [ ] 4.4 Write end-to-end test: connector startup with mirror endpoint configuration
- [ ] 4.5 Write end-to-end test: entity discovery and ingestion from mock mirror registry
- [ ] 4.6 Write end-to-end test: custom CA bundle TLS validation against mock registry
- [ ] 4.7 Write end-to-end test: Kubernetes Secret authentication against mock registry
- [ ] 4.8 Write end-to-end test: annotation enrichment in full pipeline
- [ ] 4.9 Write end-to-end test: SDK validation integration in full pipeline
- [ ] 4.10 Write end-to-end test: Prometheus metrics collection and validation
- [ ] 4.11 Add smoke test: connector with default public endpoint (no mirror)
- [ ] 4.12 Add smoke test: connector with invalid configuration (fails to start)

## 5. Packaging and Documentation (P2)

- [ ] 5.1 Create `plugins/boost-backend-module-mcp-registry/` package scaffold
- [ ] 5.2 Add `package.json` with dependencies (`@backstage/backend-plugin-api`, `@red-hat-developer-hub/backstage-plugin-boost-connector-utils`, etc.)
- [ ] 5.3 Add `config.d.ts` schema definition for app-config
- [ ] 5.4 Implement `mcpRegistryModule` as Backstage backend module (`createBackendModule`)
- [ ] 5.5 Implement `RhdhMcpRegistryProviderWrapper` class
- [ ] 5.6 Add module registration in `src/module.ts`
- [ ] 5.7 Add TypeScript build configuration (`tsconfig.json`)
- [ ] 5.8 Add ESLint configuration (`.eslintrc.js`)
- [ ] 5.9 Add Jest test configuration (`jest.config.js`)
- [ ] 5.10 Package connector as RHDH dynamic plugin (export configuration)
- [ ] 5.11 Write README.md: overview, features, installation
- [ ] 5.12 Write CONFIGURATION.md: app-config examples for mirror endpoint, TLS, auth
- [ ] 5.13 Write TROUBLESHOOTING.md: common issues and remediation steps
- [ ] 5.14 Write MIGRATION.md: upgrading from upstream connector to productized version
- [ ] 5.15 Add air-gapped deployment template with mirror endpoint, CA bundle, Secret auth
- [ ] 5.16 Add Prometheus monitoring dashboard template (Grafana JSON)
- [ ] 5.17 Add alert rule examples (PrometheusRule YAML)
- [ ] 5.18 Add example Kubernetes manifests: Secret for credentials, ConfigMap for CA bundle
- [ ] 5.19 Add CHANGELOG.md with initial release notes

## 6. Cross-References and Dependencies (P2)

- [ ] 6.1 Verify dependency on RHDHPLAN-393 (upstream MCP Registry entity provider)
- [ ] 6.2 Verify dependency on RHIDP-15316 (cross-connector shared infrastructure: `loadCaBundle()` utility)
- [ ] 6.3 Verify dependency on RHDHPLAN-1507 (AI catalog entity model: annotation scheme, SDK validation)
- [ ] 6.4 Add cross-reference links in documentation to related changes
- [ ] 6.5 Coordinate with RHDHPLAN-1507 for annotation schema updates
- [ ] 6.6 Coordinate with RHIDP-15316 for shared CA bundle utility API changes
