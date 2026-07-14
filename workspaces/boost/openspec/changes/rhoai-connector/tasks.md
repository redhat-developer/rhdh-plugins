# Tasks: RHOAI MCP Catalog Connector

> **RHDHPLAN-1510 Consolidation (2026-07-08):** Epic RHIDP-15315 (OCI Skill Registry Connector) was closed — scope absorbed by RHIDP-15294 (RHDHPLAN-1507). This connector continues under RHIDP-15314 with stories RHIDP-15321 (version normalization), RHIDP-15322 (MCP catalog source), and RHIDP-15323 (deployment config).
>
> **Stakeholder Alignment (2026-07-13):** Model Registry integration (Kubeflow API) is handled under RHDHPLAN-404, not this connector. RHIDP-15320 (Model Registry source) is no longer in scope for RHIDP-15314. RHIDP-15321 (version normalization) remains in scope — applies to MCP server entity version annotations.
>
> **Cross-connector dependencies (RHIDP-15316):**
>
> - RHIDP-15323 (deployment config) is blocked by RHIDP-15265 (endpoint/credential config schema) and RHIDP-15329 (shared CA bundle utility)
> - RHIDP-15322 (MCP catalog source) is blocked by RHDHPLAN-1507 SDK (RHIDP-15258) for annotation scheme

## 1. MCP Catalog Source — RHIDP-15322

- [ ] 1.1 Define RHOAI MCP catalog API response types with Zod schemas (`McpServer`, `McpCapabilities`)
- [ ] 1.2 Implement `McpCatalogApiClient` in `src/providers/mcpCatalog/client.ts` with typed fetch
- [ ] 1.3 Implement `RhoaiMcpCatalogProvider` extending `EntityProvider`
- [ ] 1.4 Implement entity mapper: MCP catalog entry → API with `spec.type: mcp-server` in `src/providers/mcpCatalog/mapper.ts`
- [ ] 1.5 Add `rhdh.io/mcp-protocol-version`, `rhdh.io/mcp-endpoint`, `rhdh.io/mcp-capabilities` annotations in mapper
- [ ] 1.6 Implement `connect()` method with graceful 404 handling and `mcpApiAvailable` flag
- [ ] 1.7 Implement `read()` method that returns empty array when `mcpApiAvailable` is false
- [ ] 1.8 Implement retry logic: every 10th refresh cycle, retry API connection if previously unavailable
- [ ] 1.9 Implement API response schema validation with Zod and version mismatch warnings
- [ ] 1.10 Add `rhdh.io/api-version-mismatch` annotation when API version differs from expected
- [ ] 1.11 Add standard RHDH annotations to all emitted MCP server entities
- [ ] 1.12 Implement logging for API availability transitions (unavailable → available, vice versa)

## 2. Deployment Configuration — RHIDP-15323

- [ ] 2.1 Define Zod config schema for `catalog.providers.rhoai.mcpCatalog` (enabled, endpoint, auth.secretRef, tls.caBundle)
- [ ] 2.2 Implement config validation in module startup (missing endpoint, invalid URL)
- [ ] 2.3 Implement enable/disable toggle: skip provider registration when `enabled: false`
- [ ] 2.4 Implement K8s Secret loader utility in `src/utils/secretLoader.ts` (supports `token` and `username`/`password` keys)
- [ ] 2.5 Integrate shared CA bundle utility from RHIDP-15316 (reuse cross-connector CA loading)
- [ ] 2.6 Implement Secret refresh on each `refresh()` cycle (no credential caching across cycles)
- [ ] 2.7 Implement CA bundle fallback to system CA when custom bundle is missing or fails to load
- [ ] 2.8 Add startup logging: enabled/disabled status, endpoint URL, Secret ref
- [ ] 2.9 Add error logging for missing/invalid config without crashing catalog backend

## 3. Module Scaffolding

- [ ] 3.1 Create `plugins/catalog-backend-module-rhoai/` package directory
- [ ] 3.2 Create `package.json` with Backstage backend module role and dependencies
- [ ] 3.3 Create module entry point: `src/module.ts` with `createBackendModule({ pluginId: 'catalog', moduleId: 'rhoai' })`
- [ ] 3.4 Register `RhoaiMcpCatalogProvider` via `catalogModule.addEntityProvider()` when enabled
- [ ] 3.5 Add module to `backend/src/index.ts` via `.add(import('path/to/module'))`
- [ ] 3.6 Configure TypeScript build in `tsconfig.json`
- [ ] 3.7 Add ESLint and Prettier configuration

## 4. Testing

- [ ] 4.1 Unit tests for `McpCatalogApiClient`: 404 handling, schema validation, version mismatch
- [ ] 4.2 Unit tests for MCP server mapper: entity structure, capabilities annotation
- [ ] 4.3 Integration test for `RhoaiMcpCatalogProvider`: graceful degradation, retry logic
- [ ] 4.4 Integration test for config validation: missing endpoint, invalid URL, disabled source
- [ ] 4.5 Integration test for K8s Secret loading: bearer token, basic auth, missing Secret, credential rotation
- [ ] 4.6 Integration test for CA bundle loading: custom bundle, system fallback, missing file

## 5. Documentation

- [ ] 5.1 Write README.md for `catalog-backend-module-rhoai` package
- [ ] 5.2 Document app-config schema with examples (MCP catalog, cross-cluster)
- [ ] 5.3 Document K8s Secret format and required keys (`token` vs. `username`/`password`)
- [ ] 5.4 Document CA bundle setup for self-signed certificates
- [ ] 5.5 Document entity type mapping (MCP server → API with `spec.type: mcp-server`)
- [ ] 5.6 Document annotation scheme cross-reference to RHDHPLAN-1507's `ai-catalog-entity-model`
- [ ] 5.7 Add troubleshooting section: MCP API unavailable, authentication failures, CA bundle errors

## 6. Packaging

- [ ] 6.1 Configure module for RHDH dynamic plugin export (`.backstage/export-dynamic-plugin-config.yaml`)
- [ ] 6.2 Add module to workspace build scripts
- [ ] 6.3 Create container image build configuration for OCI export
- [ ] 6.4 Create `dynamic-plugins.yaml` example for RHDH deployment
- [ ] 6.5 Add module to CI/CD pipeline for automated builds and testing

## 7. Version Normalization — RHIDP-15321

- [ ] 7.1 Define version normalization rules: extract version string from MCP server manifest metadata
- [ ] 7.2 Implement `normalizeVersion(rawVersion: string): string` utility — semver normalization, strip `v` prefix, handle `latest`/`nightly` tags
- [ ] 7.3 Populate `rhdh.io/ai-asset-version` annotation with normalized version on all emitted MCP server entities
- [ ] 7.4 Handle missing version metadata: set `rhdh.io/ai-asset-version: "unknown"` with DEBUG log
- [ ] 7.5 Handle invalid version strings (empty, malformed): set `rhdh.io/ai-asset-version: "unknown"` with WARNING log
- [ ] 7.6 Unit tests for version normalization: semver, pre-release, `v`-prefix stripping, missing/invalid
- [ ] 7.7 Integration test: emitted entities carry correct `rhdh.io/ai-asset-version` annotation

## 8. Cross-References

- [ ] 8.1 Reference RHDHPLAN-1507's `ai-catalog-entity-model` change for annotation scheme
- [ ] 8.2 Reference RHIDP-15316 for shared CA bundle utility and cross-connector infrastructure
- [ ] 8.3 Reference RHDHPLAN-404 for Model Registry integration (Kubeflow API — handled separately)
