# Tasks: AI Catalog Entity Model

> **RHDHPLAN-1507 Consolidation (2026-07-08):** Tasks are grouped by surviving epic ownership.
> Annotation stories RHIDP-15256/15257 consolidated into RHIDP-15255.
> Delta sync (group 5) merged into SDK (group 2). Air-gapped (group 7) moved to RHIDP-15316.
> Error resilience tasks (RHIDP-15269) consolidated into RHIDP-15330 under RHIDP-15316.

## 1. Annotation Scheme Definition and Validation (P0) — _RHIDP-15258_

- [ ] 1.1 Define `rhdh.io/ai-asset-category` annotation constant and allowed values enum (`agent`, `skill`, `rule`, `skill-bundle`, `mcp-server`, `ai-model`, `model-server`) in SDK package (RHIDP-15255)
- [ ] 1.2 Define `rhdh.io/ai-asset-version` annotation constant in SDK package (RHIDP-15255)
- [ ] 1.3 Define `rhdh.io/ai-asset-source` annotation constant in SDK package (RHIDP-15255)
- [ ] 1.4 Implement `normalizeAIAssetVersion(sourceVersion: string): string` utility with all four normalization rules (semver pass-through, date-based, commit hash, fallback) (RHIDP-15255)
- [ ] 1.5 Add unit tests for `normalizeAIAssetVersion()` covering all normalization rules (RHIDP-15255)
- [ ] 1.6 Implement CatalogProcessor validator rejecting entities with missing/invalid `rhdh.io/ai-asset-category`, `rhdh.io/ai-asset-version`, or `rhdh.io/ai-asset-source` annotations — gated to entities carrying any `rhdh.io/ai-asset-*` annotation (RHIDP-15255)
- [ ] 1.7 Add unit tests for CatalogProcessor validator covering valid and invalid annotation values (RHIDP-15255)

## 2. Entity Provider SDK Package Scaffolding (P0) — _RHIDP-15258_

> **Cross-connector dependencies:** RHIDP-15260 is blocked by RHIDP-15265 (endpoint/credential config schema), RHIDP-15329 (shared CA bundle utility), and RHIDP-15330 (error isolation contract). The SDK must export the configuration schema, CA bundle utility, and error-handling guarantees defined by those stories.

- [ ] 2.1 Create `@boost/entity-provider-sdk` package with `package.json`, `tsconfig.json`, `README.md`, `CHANGELOG.md` (RHIDP-15260)
- [ ] 2.2 Define `AIAssetEntityProvider` TypeScript interface with required methods: `connect()`, `* entities()`, `getProviderName()`, `getProviderId()` (RHIDP-15259)
- [ ] 2.3 Define optional `delta(cursor?: string)` method for incremental sync pattern (RHIDP-15259)
- [ ] 2.4 Export annotation constants: `AI_ASSET_CATEGORY_ANNOTATION`, `AI_ASSET_VERSION_ANNOTATION`, `AI_ASSET_SOURCE_ANNOTATION` (RHIDP-15260)
- [ ] 2.5 Implement `validateAIAssetEntity(entity: Entity): void` utility throwing on missing/invalid annotations (RHIDP-15260)
- [ ] 2.6 Add unit tests for `validateAIAssetEntity()` covering all validation rules (RHIDP-15260)
- [ ] 2.7 Publish SDK package to npm registry with semver versioning (RHIDP-15260)
- [ ] 2.8 Implement `DeltaSyncManager` class wrapping `applyMutation({ type: 'delta' })` API (RHIDP-15262)
- [ ] 2.9 Add `applyDelta({ added, updated, removed, nextCursor })` method translating connector deltas to catalog mutations (RHIDP-15262)
- [ ] 2.10 Implement sync cursor persistence using catalog database (provider-scoped key-value pairs) (RHIDP-15262)
- [ ] 2.11 Implement `getCursor(providerId): string | undefined` method retrieving last persisted cursor (RHIDP-15262)
- [ ] 2.12 Implement fallback to full refresh when cursor invalid or missing (RHIDP-15262)
- [ ] 2.13 Add unit tests for delta sync framework covering cursor persistence, fallback, mutation translation (RHIDP-15262)

## 3. Neo4j Sync Adapter Interface (P0) — _RHIDP-15258_

- [ ] 3.1 Define `Neo4jSyncAdapter` TypeScript interface with methods: `createNode()`, `updateNode()`, `deleteNode()`, `createRelationship()` (RHIDP-15303)
- [ ] 3.2 Define `RelationshipType` union type with constants: `DEPENDS_ON`, `USES_TOOL`, `BELONGS_TO`, `SIMILAR_TO`, `IMPLEMENTED_BY`, `INCLUDES` (RHIDP-15303)
- [ ] 3.3 Export `Neo4jSyncAdapter` interface from SDK package (RHIDP-15303)
- [ ] 3.4 Add JSDoc documentation to interface explaining when to use each method and relationship type (RHIDP-15303)

## 4. SkillBundle Metadata Schema (P0) — _RHIDP-15258_

- [ ] 4.1 Define `SkillBundleMetadata` TypeScript type with fields: `name`, `version`, `description?`, `author?`, `tags?`, `runtime?`, `mcp?` (RHIDP-15303)
- [ ] 4.2 Export `SkillBundleMetadata` type from SDK package (RHIDP-15303)
- [ ] 4.3 Add JSDoc documentation with example skillcard.yaml structure (RHIDP-15303)

## 5. Provider Implementations (P1) — _RHIDP-15258_

- [ ] 5.1 Update Kagenti provider to emit entities with all three required annotations (RHIDP-15255)
- [ ] 5.2 Update LlamaStack provider to emit entities with all three required annotations (RHIDP-15255)
- [ ] 5.3 Verify Kagenti provider compiles against SDK interface without errors (RHIDP-15259)
- [ ] 5.4 Verify LlamaStack provider compiles against SDK interface without errors (RHIDP-15259)

## 6. Air-Gapped Deployment Support (P1) — _Moved to RHIDP-15316 (RHDHPLAN-1510)_

- [ ] 6.1 Add custom CA bundle support via `NODE_EXTRA_CA_CERTS` environment variable for all providers (RHIDP-15329)
- [ ] 6.2 Add custom CA bundle support via explicit `caCertPath` app-config field + `https.Agent` configuration (RHIDP-15329)
- [ ] 6.3 Implement startup validation rejecting plaintext credentials with descriptive error message (RHIDP-15265)
- [ ] 6.4 Add `$env` reference support for all credential fields (clientId, clientSecret, API keys) backed by mounted K8s Secrets (RHIDP-15265)
- [ ] 6.5 Implement configurable endpoint URLs (`baseUrl`) for all providers with startup validation (RHIDP-15265)
- [ ] 6.6 Create reference app-config YAML example for air-gapped deployment (RHIDP-15266)
- [ ] 6.7 Create reference Helm chart `values.yaml` example for air-gapped deployment (RHIDP-15266)
- [ ] 6.8 Create reference Operator CR example for air-gapped deployment (RHIDP-15266)

## 7. Performance and Resilience Testing (P1) — _Distributed_

### Load Testing — _RHIDP-15294 (OCI Skill Registry)_

- [ ] 7.1 Create load test harness generating 5,000+ AI asset entities (distributed across categories) (RHIDP-15268)
- [ ] 7.2 Measure baseline p95 latency for catalog queries without AI Catalog entities (RHIDP-15268)
- [ ] 7.3 Measure with-AI-Catalog p95 latency with 5,000+ entities ingested (RHIDP-15268)
- [ ] 7.4 Validate p95 latency degradation ≤10% SLA; fail test if violated (RHIDP-15268)
- [ ] 7.5 Measure processing-loop duration (entity emission → catalog API availability) (RHIDP-15268)
- [ ] 7.6 Document load test execution steps and reproducibility in `tests/load/README.md` (RHIDP-15268)

### Error Resilience — _RHIDP-15316 (Cross-Connector)_

- [ ] 7.7 Implement per-entity error isolation: single entity failures logged with full context (entity ID, source, field, error) (RHIDP-15330)
- [ ] 7.8 Verify remaining valid entities are ingested when single entity fails validation (RHIDP-15330)
- [ ] 7.9 Verify sync cycle completes even with multiple entity failures (RHIDP-15330)
- [ ] 7.10 Document error-handling guarantees in SDK README with example log entry format (RHIDP-15330)

## 8. Migration Readiness Design (P2) — _RHIDP-15258_

- [ ] 8.1 Create migration design document with mapping table: current kind/spec.type/annotation → target upstream kind (RHIDP-15302)
- [ ] 8.2 Document transformation rules for each AI asset category (RHIDP-15302)
- [ ] 8.3 Identify consumer-facing changes: catalog UI filters, entity refs, API queries (RHIDP-15302)
- [ ] 8.4 Document backward compatibility strategy (e.g., keep annotation for one major version) (RHIDP-15302)
- [ ] 8.5 Obtain upstream Backstage maintainer or RHDH architect sign-off on migration document (RHIDP-15302)
- [ ] 8.6 Document sign-off in spec: reviewer name, role, date, approval status (RHIDP-15302)

## 9. Documentation and Examples (P2) — _RHIDP-15258_

- [ ] 9.1 Write SDK package README documenting: interface contract, annotation constants, validation usage, Neo4j adapter, SkillBundle schema (RHIDP-15260)
- [ ] 9.2 Add code examples to README showing provider implementation (RHIDP-15260)
- [ ] 9.3 Document version normalization rules in SDK README with examples (RHIDP-15255)
- [ ] 9.4 Document air-gapped configuration pattern as generic "AI Catalog connector configuration" for reuse by all connectors (RHIDP-15266)
- [ ] 9.5 Create `CHANGELOG.md` with initial version entry (RHIDP-15260)

## 10. Verify

- [ ] 10.1 Verify all three annotations are enforced by CatalogProcessor validator (reject entities with missing/invalid values)
- [ ] 10.2 Verify Kagenti and LlamaStack providers emit entities with all required annotations
- [ ] 10.3 Verify delta sync framework falls back to full refresh when cursor invalid
- [ ] 10.4 Verify custom CA bundles are honored for TLS connections in air-gapped deployment
- [ ] 10.5 Verify startup validation rejects plaintext credentials with descriptive error
- [ ] 10.6 Verify load test passes with p95 latency degradation ≤10% at 5,000+ entities
- [ ] 10.7 Verify single entity failures are isolated and remaining entities are ingested
- [ ] 10.8 Verify migration design document has upstream maintainer or RHDH architect sign-off
