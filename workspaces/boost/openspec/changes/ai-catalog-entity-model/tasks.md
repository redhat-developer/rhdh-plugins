# Tasks: AI Catalog Entity Model

## 1. Annotation Scheme Definition and Validation (P0)

- [ ] 1.1 Define `rhdh.io/ai-asset-category` annotation constant and allowed values enum (`agent`, `skill`, `mcp-server`, `ai-model`, `model-server`) in SDK package (RHIDP-15255)
- [ ] 1.2 Define `rhdh.io/ai-asset-version` annotation constant in SDK package (RHIDP-15256)
- [ ] 1.3 Define `rhdh.io/ai-asset-source` annotation constant in SDK package (RHIDP-15257)
- [ ] 1.4 Implement `normalizeAIAssetVersion(sourceVersion: string): string` utility with all four normalization rules (semver pass-through, date-based, commit hash, fallback) (RHIDP-15256)
- [ ] 1.5 Add unit tests for `normalizeAIAssetVersion()` covering all normalization rules (RHIDP-15256)
- [ ] 1.6 Implement CatalogProcessor validator rejecting entities with missing/invalid `rhdh.io/ai-asset-category` annotation (RHIDP-15255)
- [ ] 1.7 Add unit tests for CatalogProcessor validator covering valid and invalid annotation values (RHIDP-15255)

## 2. Entity Provider SDK Package Scaffolding (P0)

- [ ] 2.1 Create `@boost/entity-provider-sdk` package with `package.json`, `tsconfig.json`, `README.md`, `CHANGELOG.md` (RHIDP-15260)
- [ ] 2.2 Define `AIAssetEntityProvider` TypeScript interface with required methods: `connect()`, `* entities()`, `getProviderName()`, `getProviderId()` (RHIDP-15259)
- [ ] 2.3 Define optional `delta(cursor?: string)` method for incremental sync pattern (RHIDP-15259)
- [ ] 2.4 Export annotation constants: `AI_ASSET_CATEGORY_ANNOTATION`, `AI_ASSET_VERSION_ANNOTATION`, `AI_ASSET_SOURCE_ANNOTATION` (RHIDP-15260)
- [ ] 2.5 Implement `validateAIAssetEntity(entity: Entity): void` utility throwing on missing/invalid annotations (RHIDP-15260)
- [ ] 2.6 Add unit tests for `validateAIAssetEntity()` covering all validation rules (RHIDP-15260)
- [ ] 2.7 Publish SDK package to npm registry with semver versioning (RHIDP-15260)

## 3. Neo4j Sync Adapter Interface (P0)

- [ ] 3.1 Define `Neo4jSyncAdapter` TypeScript interface with methods: `createNode()`, `updateNode()`, `deleteNode()`, `createRelationship()` (RHIDP-15303)
- [ ] 3.2 Define `RelationshipType` union type with constants: `DEPENDS_ON`, `USES_TOOL`, `BELONGS_TO`, `SIMILAR_TO`, `IMPLEMENTED_BY`, `INCLUDES` (RHIDP-15303)
- [ ] 3.3 Export `Neo4jSyncAdapter` interface from SDK package (RHIDP-15303)
- [ ] 3.4 Add JSDoc documentation to interface explaining when to use each method and relationship type (RHIDP-15303)

## 4. SkillBundle Metadata Schema (P0)

- [ ] 4.1 Define `SkillBundleMetadata` TypeScript type with fields: `name`, `version`, `description?`, `author?`, `tags?`, `runtime?`, `mcp?` (RHIDP-15303)
- [ ] 4.2 Export `SkillBundleMetadata` type from SDK package (RHIDP-15303)
- [ ] 4.3 Add JSDoc documentation with example skillcard.yaml structure (RHIDP-15303)

## 5. Delta Sync Framework Implementation (P1)

- [ ] 5.1 Implement `DeltaSyncManager` class wrapping `applyMutation({ type: 'delta' })` API (RHIDP-15262)
- [ ] 5.2 Add `applyDelta({ added, updated, removed, nextCursor })` method translating connector deltas to catalog mutations (RHIDP-15262)
- [ ] 5.3 Implement sync cursor persistence using catalog database (provider-scoped key-value pairs) (RHIDP-15262)
- [ ] 5.4 Implement `getCursor(providerId): string | undefined` method retrieving last persisted cursor (RHIDP-15262)
- [ ] 5.5 Implement fallback to full refresh when cursor invalid or missing (RHIDP-15262)
- [ ] 5.6 Add unit tests for delta sync framework covering cursor persistence, fallback, mutation translation (RHIDP-15262)

## 6. Provider Implementations (P1)

- [ ] 6.1 Update Kagenti provider to emit entities with all three required annotations (RHIDP-15255, RHIDP-15256, RHIDP-15257)
- [ ] 6.2 Update LlamaStack provider to emit entities with all three required annotations (RHIDP-15255, RHIDP-15256, RHIDP-15257)
- [ ] 6.3 Verify Kagenti provider compiles against SDK interface without errors (RHIDP-15259)
- [ ] 6.4 Verify LlamaStack provider compiles against SDK interface without errors (RHIDP-15259)

## 7. Air-Gapped Deployment Support (P1)

- [ ] 7.1 Add custom CA bundle support via `NODE_EXTRA_CA_CERTS` environment variable for all providers (RHIDP-15264)
- [ ] 7.2 Add custom CA bundle support via explicit `caCertPath` app-config field + `https.Agent` configuration (RHIDP-15264)
- [ ] 7.3 Implement startup validation rejecting plaintext credentials with descriptive error message (RHIDP-15264)
- [ ] 7.4 Add `$secret` reference support for all credential fields (clientId, clientSecret, API keys) (RHIDP-15264)
- [ ] 7.5 Implement configurable endpoint URLs (`baseUrl`) for all providers with startup validation (RHIDP-15265)
- [ ] 7.6 Create reference app-config YAML example for air-gapped deployment (RHIDP-15266)
- [ ] 7.7 Create reference Helm chart `values.yaml` example for air-gapped deployment (RHIDP-15266)
- [ ] 7.8 Create reference Operator CR example for air-gapped deployment (RHIDP-15266)

## 8. Performance and Resilience Testing (P1)

- [ ] 8.1 Create load test harness generating 5,000+ AI asset entities (distributed across categories) (RHIDP-15268)
- [ ] 8.2 Measure baseline p95 latency for catalog queries without AI Catalog entities (RHIDP-15268)
- [ ] 8.3 Measure with-AI-Catalog p95 latency with 5,000+ entities ingested (RHIDP-15268)
- [ ] 8.4 Validate p95 latency degradation ≤10% SLA; fail test if violated (RHIDP-15268)
- [ ] 8.5 Measure processing-loop duration (entity emission → catalog API availability) (RHIDP-15268)
- [ ] 8.6 Document load test execution steps and reproducibility in `tests/load/README.md` (RHIDP-15268)
- [ ] 8.7 Implement per-entity error isolation: single entity failures logged with full context (entity ID, source, field, error) (RHIDP-15269)
- [ ] 8.8 Verify remaining valid entities are ingested when single entity fails validation (RHIDP-15269)
- [ ] 8.9 Verify sync cycle completes even with multiple entity failures (RHIDP-15269)
- [ ] 8.10 Document error-handling guarantees in SDK README with example log entry format (RHIDP-15269)

## 9. Migration Readiness Design (P2)

- [ ] 9.1 Create migration design document with mapping table: current kind/spec.type/annotation → target upstream kind (RHIDP-15302)
- [ ] 9.2 Document transformation rules for each AI asset category (RHIDP-15302)
- [ ] 9.3 Identify consumer-facing changes: catalog UI filters, entity refs, API queries (RHIDP-15302)
- [ ] 9.4 Document backward compatibility strategy (e.g., keep annotation for one major version) (RHIDP-15302)
- [ ] 9.5 Obtain upstream Backstage maintainer or RHDH architect sign-off on migration document (RHIDP-15302)
- [ ] 9.6 Document sign-off in spec: reviewer name, role, date, approval status (RHIDP-15302)

## 10. Documentation and Examples (P2)

- [ ] 10.1 Write SDK package README documenting: interface contract, annotation constants, validation usage, Neo4j adapter, SkillBundle schema (RHIDP-15260)
- [ ] 10.2 Add code examples to README showing provider implementation (RHIDP-15260)
- [ ] 10.3 Document version normalization rules in SDK README with examples (RHIDP-15256)
- [ ] 10.4 Document air-gapped configuration pattern as generic "AI Catalog connector configuration" for reuse by all connectors (RHIDP-15266)
- [ ] 10.5 Create `CHANGELOG.md` with initial version entry (RHIDP-15260)

## 11. Verify

- [ ] 11.1 Verify all three annotations are enforced by CatalogProcessor validator (reject entities with missing/invalid values)
- [ ] 11.2 Verify Kagenti and LlamaStack providers emit entities with all required annotations
- [ ] 11.3 Verify delta sync framework falls back to full refresh when cursor invalid
- [ ] 11.4 Verify custom CA bundles are honored for TLS connections in air-gapped deployment
- [ ] 11.5 Verify startup validation rejects plaintext credentials with descriptive error
- [ ] 11.6 Verify load test passes with p95 latency degradation ≤10% at 5,000+ entities
- [ ] 11.7 Verify single entity failures are isolated and remaining entities are ingested
- [ ] 11.8 Verify migration design document has upstream maintainer or RHDH architect sign-off
