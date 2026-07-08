# Tasks: RHOAI Entity-Provider Connector

> **RHDHPLAN-1510 Consolidation (2026-07-08):** Epic RHIDP-15315 (OCI Skill Registry Connector) was closed — scope absorbed by RHIDP-15294 (RHDHPLAN-1507). This connector continues under RHIDP-15314 with 4 stories (RHIDP-15320, 15321, 15322, 15323).
>
> **Cross-connector dependencies (RHIDP-15316):**
>
> - RHIDP-15323 (deployment config) is blocked by RHIDP-15265 (endpoint/credential config schema) and RHIDP-15329 (shared CA bundle utility)
> - RHIDP-15320 (Model Registry source) is blocked by RHDHPLAN-1507 SDK (RHIDP-15258) for annotation scheme
> - RHIDP-15322 (MCP catalog source) is blocked by RHDHPLAN-1507 SDK (RHIDP-15258) for annotation scheme
> - RHIDP-15321 (version normalization) has no cross-connector blockers

## 1. Model Registry Source (P0) — RHIDP-15320, RHIDP-15321

- [ ] 1.1 Define Kubeflow API response types (`RegisteredModel`, `ModelVersion`) with Zod schemas
- [ ] 1.2 Implement `KubeflowApiClient` in `src/providers/modelRegistry/client.ts` with typed fetch and pagination support
- [ ] 1.3 Implement `RhoaiModelRegistryProvider` extending `EntityProvider` from `@backstage/plugin-catalog-node`
- [ ] 1.4 Implement entity mapper: `RegisteredModel` → Resource with `spec.type: ai-model` in `src/providers/modelRegistry/mapper.ts`
- [ ] 1.5 Implement entity mapper: `ModelVersion` → Component with `spec.type: model-server` in `src/providers/modelRegistry/mapper.ts`
- [ ] 1.6 Implement version normalization utility in `src/utils/versionNormalizer.ts` (semantic version parsing, `latest` handling, pre-release suffix preservation)
- [ ] 1.7 Add `rhdh.io/ai-asset-version` annotation population in ModelVersion mapper
- [ ] 1.8 Add `rhdh.io/ai-model-family` annotation population in RegisteredModel mapper
- [ ] 1.9 Add `rhdh.io/parent-ai-model` reference in ModelVersion mapper pointing to RegisteredModel entity
- [ ] 1.10 Add `rhdh.io/container-image` and `rhdh.io/image-digest` annotations when ModelVersion includes container image
- [ ] 1.11 Implement `connect()` method with Kubeflow API connectivity validation
- [ ] 1.12 Implement `read()` method using `applyMutation` for full sync
- [ ] 1.13 Implement pagination handling in `KubeflowApiClient` (support `nextPageToken`)
- [ ] 1.14 Implement API error handling with fallback to cached entity list
- [ ] 1.15 Add standard RHDH annotations to all emitted entities (source-location, managed-by-location, connector-type, last-sync-time)

## 2. MCP Catalog Source (P1) — RHIDP-15322

- [ ] 2.1 Define RHOAI MCP catalog API response types with Zod schemas (`McpServer`, `McpCapabilities`)
- [ ] 2.2 Implement `McpCatalogApiClient` in `src/providers/mcpCatalog/client.ts` with typed fetch
- [ ] 2.3 Implement `RhoaiMcpCatalogProvider` extending `EntityProvider`
- [ ] 2.4 Implement entity mapper: MCP catalog entry → Resource with `spec.type: mcp-server` in `src/providers/mcpCatalog/mapper.ts`
- [ ] 2.5 Add `rhdh.io/mcp-protocol-version`, `rhdh.io/mcp-endpoint`, `rhdh.io/mcp-capabilities` annotations in mapper
- [ ] 2.6 Implement `connect()` method with graceful 404 handling and `mcpApiAvailable` flag
- [ ] 2.7 Implement `read()` method that returns empty array when `mcpApiAvailable` is false
- [ ] 2.8 Implement retry logic: every 10th refresh cycle, retry API connection if previously unavailable
- [ ] 2.9 Implement API response schema validation with Zod and version mismatch warnings
- [ ] 2.10 Add `rhdh.io/api-version-mismatch` annotation when API version differs from expected
- [ ] 2.11 Add standard RHDH annotations to all emitted MCP server entities
- [ ] 2.12 Implement logging for API availability transitions (unavailable → available, vice versa)

## 3. Deployment Configuration (P0) — RHIDP-15323

- [ ] 3.1 Define Zod config schema for `catalog.providers.rhoai.modelRegistry` (enabled, endpoint, auth.secretRef, tls.caBundle)
- [ ] 3.2 Define Zod config schema for `catalog.providers.rhoai.mcpCatalog` (enabled, endpoint, auth.secretRef, tls.caBundle)
- [ ] 3.3 Implement config validation in module startup (missing endpoint, invalid URL)
- [ ] 3.4 Implement per-source enable/disable toggle: skip provider registration when `enabled: false`
- [ ] 3.5 Implement K8s Secret loader utility in `src/utils/secretLoader.ts` (supports `token` and `username`/`password` keys)
- [ ] 3.6 Integrate shared CA bundle utility from RHIDP-15316 (reuse cross-connector CA loading)
- [ ] 3.7 Implement Secret refresh on each `refresh()` cycle (no credential caching across cycles)
- [ ] 3.8 Implement CA bundle fallback to system CA when custom bundle is missing or fails to load
- [ ] 3.9 Add startup logging for each source: enabled/disabled status, endpoint URL, Secret ref
- [ ] 3.10 Add error logging for missing/invalid config without crashing catalog backend

## 4. Module Scaffolding (P0)

- [ ] 4.1 Create `plugins/catalog-backend-module-rhoai/` package directory
- [ ] 4.2 Create `package.json` with Backstage backend module role and dependencies
- [ ] 4.3 Create module entry point: `src/module.ts` with `createBackendModule({ pluginId: 'catalog', moduleId: 'rhoai' })`
- [ ] 4.4 Register `RhoaiModelRegistryProvider` via `catalogModule.addEntityProvider()` when enabled
- [ ] 4.5 Register `RhoaiMcpCatalogProvider` via `catalogModule.addEntityProvider()` when enabled
- [ ] 4.6 Add module to `backend/src/index.ts` via `.add(import('path/to/module'))`
- [ ] 4.7 Configure TypeScript build in `tsconfig.json`
- [ ] 4.8 Add ESLint and Prettier configuration

## 5. Testing (P1)

- [ ] 5.1 Unit tests for `KubeflowApiClient`: pagination, error handling, response parsing
- [ ] 5.2 Unit tests for `McpCatalogApiClient`: 404 handling, schema validation, version mismatch
- [ ] 5.3 Unit tests for RegisteredModel mapper: entity structure, annotation population
- [ ] 5.4 Unit tests for ModelVersion mapper: entity structure, version normalization, parent reference
- [ ] 5.5 Unit tests for MCP server mapper: entity structure, capabilities annotation
- [ ] 5.6 Unit tests for version normalization utility: semantic versions, `latest`, pre-release, invalid versions
- [ ] 5.7 Integration test for `RhoaiModelRegistryProvider`: full sync, incremental refresh
- [ ] 5.8 Integration test for `RhoaiMcpCatalogProvider`: graceful degradation, retry logic
- [ ] 5.9 Integration test for config validation: missing endpoint, invalid URL, disabled source
- [ ] 5.10 Integration test for K8s Secret loading: bearer token, basic auth, missing Secret, credential rotation
- [ ] 5.11 Integration test for CA bundle loading: custom bundle, system fallback, missing file

## 6. Documentation (P1)

- [ ] 6.1 Write README.md for `catalog-backend-module-rhoai` package
- [ ] 6.2 Document app-config schema with examples (Model Registry only, MCP catalog only, both, cross-cluster)
- [ ] 6.3 Document K8s Secret format and required keys (`token` vs. `username`/`password`)
- [ ] 6.4 Document CA bundle setup for self-signed certificates
- [ ] 6.5 Document entity type mapping (RegisteredModel → ai-model, ModelVersion → model-server, MCP server → mcp-server)
- [ ] 6.6 Document annotation scheme cross-reference to RHDHPLAN-1507's `ai-catalog-entity-model`
- [ ] 6.7 Add troubleshooting section: MCP API unavailable, authentication failures, CA bundle errors

## 7. Packaging (P2)

- [ ] 7.1 Configure module for RHDH dynamic plugin export (`.backstage/export-dynamic-plugin-config.yaml`)
- [ ] 7.2 Add module to workspace build scripts
- [ ] 7.3 Create container image build configuration for OCI export
- [ ] 7.4 Create `dynamic-plugins.yaml` example for RHDH deployment
- [ ] 7.5 Add module to CI/CD pipeline for automated builds and testing

## 8. Cross-References (P1)

- [ ] 8.1 Reference RHDHPLAN-1507's `ai-catalog-entity-model` change for annotation scheme (`rhdh.io/ai-asset-version`, `rhdh.io/ai-model-family`)
- [ ] 8.2 Reference RHIDP-15316 for shared CA bundle utility and cross-connector infrastructure
- [ ] 8.3 Reference `redhat-ai-dev/model-catalog-bridge` for entity mapping patterns (prior art)
- [ ] 8.4 Reference `agent-creation-discovery/catalog-entities` spec for entity type strategy (Resource vs. Component)
