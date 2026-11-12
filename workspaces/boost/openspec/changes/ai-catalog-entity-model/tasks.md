# Tasks: AI Catalog Entity Model

> **RHDHPLAN-1507 Consolidation (2026-07-08):** Tasks are grouped by surviving epic ownership.
> Annotation stories RHIDP-15256/15257 consolidated into RHIDP-15255.
> Delta sync (group 5) merged into SDK (group 2). Air-gapped (group 7) moved to RHIDP-15316.
> Error resilience tasks (RHIDP-15269) consolidated into RHIDP-15330 under RHIDP-15316.

## 1. Annotation Scheme Definition and Validation (P0) — _RHIDP-15258_

The five minimum feature categories are `agent`, `skill`, `mcp-server`,
`ai-model`, and `model-server`. The existing `rule` value below is retained
for compatibility, not as a sixth minimum deliverable. SDK code and fixture
reconciliation belong to RHIDP-18762; future shared/per-kind design belongs
to RHIDP-18839.

- [ ] 1.1 Define `rhdh.io/ai-asset-category` annotation constant and allowed values enum (`agent`, `skill`, `rule`, `mcp-server`, `ai-model`, `model-server`) in SDK package (RHIDP-15255)
- [x] 1.2 Define `rhdh.io/ai-asset-version` annotation constant in SDK package (RHIDP-15255)
- [x] 1.3 Define `rhdh.io/ai-asset-source` annotation constant in SDK package (RHIDP-15255)
- [x] 1.4 Implement `normalizeAIAssetVersion(sourceVersion: string, options?: { entityRef?: string; warn?: (message: string) => void }): string` utility with all four normalization rules (semver pass-through, date-based, commit hash, fallback) (RHIDP-15255)
- [x] 1.5 Add unit tests for `normalizeAIAssetVersion()` covering all normalization rules (RHIDP-15255)
- [ ] 1.6 Implement CatalogProcessor validator rejecting entities with missing/invalid `rhdh.io/ai-asset-category`, `rhdh.io/ai-asset-version`, or `rhdh.io/ai-asset-source` annotations — gated to entities carrying any `rhdh.io/ai-asset-*` annotation (RHIDP-15255)
- [ ] 1.7 Add unit tests for CatalogProcessor validator covering valid and invalid annotation values (RHIDP-15255)

## 2. Entity Provider SDK Package Scaffolding (P0) — _RHIDP-15258_

> **Minimum SDK boundary:** RHIDP-15265/RHIDP-15329 are historical
> cross-connector references, not prerequisites requiring new SDK configuration
> or CA exports. Existing helpers stay in `ai-catalog-connector-utils`. Full
> air-gapped qualification does not gate minimum SDK reconciliation/publication.
> Per-entity fault isolation and contextual logging remain minimum behavior
> under RHIDP-15330; generic configuration examples remain in scope.

- [x] 2.1 Create the `ai-catalog-entity-provider-sdk` package (`@red-hat-developer-hub/backstage-plugin-ai-catalog-entity-provider-sdk`) with package metadata, README, and changelog; use workspace TypeScript defaults (RHIDP-15260)
- [x] 2.2 Define `AIAssetEntityProvider` TypeScript interface with required methods: `connect()`, `* entities()`, `getProviderName()`, `getProviderId()` (RHIDP-15259)
- [x] 2.3 Define optional `delta(cursor?: string)` method for incremental sync pattern (RHIDP-15259)
- [x] 2.4 Export annotation constants: `AI_ASSET_CATEGORY_ANNOTATION`, `AI_ASSET_VERSION_ANNOTATION`, `AI_ASSET_SOURCE_ANNOTATION` (RHIDP-15260)
- [ ] 2.5 Implement `validateAIAssetEntity(entity: Entity): void` utility throwing on missing/invalid annotations (RHIDP-15260)
- [ ] 2.6 Add unit tests for `validateAIAssetEntity()` covering all validation rules (RHIDP-15260)
- [ ] 2.7 Publish SDK package to npm registry with semver versioning (RHIDP-15260)
- [x] 2.8 Implement `DeltaSyncManager` class wrapping `applyMutation({ type: 'delta' })` API (RHIDP-15262)
- [x] 2.9 Add `applyDelta({ added, updated, removed, nextCursor })` method translating connector deltas to catalog mutations (RHIDP-15262)
- [x] 2.10 Implement sync cursor persistence via a pluggable `CursorStore` interface (SDK ships `InMemoryCursorStore`; a durable DB-backed store is the consuming backend plugin's responsibility) (RHIDP-15262)
- [x] 2.11 Implement `getCursor(): Promise<string | undefined>` method retrieving the last persisted cursor for the manager's construction-time `locationKey` (RHIDP-15262)
- [ ] 2.12 ~~Implement framework-managed fallback to full refresh when cursor invalid or missing~~ (RHIDP-15262) — **DEFERRED** to RHIDP-18840. Existing consumers own refresh orchestration; no shared fallback implementation is required by this baseline.
- [x] 2.13 Add unit tests for the existing delta helper covering mutation translation and cursor read/write/reset through `CursorStore` (RHIDP-15262)

## ~~3. Neo4j Sync Adapter Interface (P0)~~ REMOVED

> Removed from minimum scope (RHIDP-18761). Neo4j knowledge graph
> integration is archived — see
> `openspec/changes/archive/2026-11-06-neo4j-knowledge-graph/`.

## ~~4. SkillBundle Metadata Schema (P0)~~ REMOVED

> Removed from minimum scope (RHIDP-18761). SkillBundle/skillcard.yaml
> contracts are archived — see
> `openspec/changes/archive/2026-11-06-oci-skill-registry/` and
> `openspec/changes/archive/2026-11-06-oci-skill-connector/`.

## 5. Provider Implementations (P1) — _RHIDP-15258_

- [x] 5.2 OGX provider annotation emission is covered by the archived [`ogx-entity-provider` spec](../../specs/ogx-entity-provider/spec.md); its model and agent providers emit category, source, and normalized-version annotations (RHIDP-15255)
- [x] 5.4 Verify that the OGX providers use Backstage `EntityProvider` and the SDK annotation/version utilities; this is covered by the archived [`ogx-entity-provider` spec](../../specs/ogx-entity-provider/spec.md) and its targeted test suite (RHIDP-15259)

## 6. Configuration References and Deferred Air-Gapped Qualification — _RHIDP-15316 (RHDHPLAN-1510)_

### Full deployment qualification — DEFERRED / stretch

The historical tasks below do not gate the minimum SDK. This deferral does not
remove existing shared utilities or generic endpoint, CA, Secret, and schedule
examples.

- [ ] 6.1 ~~Add custom CA bundle support via `NODE_EXTRA_CA_CERTS` environment variable for all providers~~ (RHIDP-15329) — **DEFERRED — stretch qualification**
- [ ] 6.2 ~~Add custom CA bundle support via explicit `caCertPath` app-config field + `https.Agent` configuration~~ (RHIDP-15329) — **DEFERRED — stretch qualification**
- [ ] 6.3 ~~Implement startup validation rejecting plaintext credentials with descriptive error message~~ (RHIDP-15265) — **DEFERRED — stretch qualification**
- [ ] 6.4 ~~Add `$env` reference support for all credential fields (clientId, clientSecret, API keys) backed by mounted K8s Secrets~~ (RHIDP-15265) — **DEFERRED — stretch qualification**
- [ ] 6.5 ~~Implement configurable endpoint URLs (`baseUrl`) for all providers with startup validation~~ (RHIDP-15265) — **DEFERRED — stretch qualification**

### Generic reference examples — retained

- [ ] 6.6 Create reference app-config YAML for generic connector configuration (endpoints, CA bundles, Secret references, and schedules) without claiming deployment qualification (RHIDP-15266)
- [ ] 6.7 Create reference Helm chart `values.yaml` for the generic connector configuration pattern (RHIDP-15266)
- [ ] 6.8 Create reference Operator CR for the generic connector configuration pattern (RHIDP-15266)

## 7. Performance and Resilience Testing (P1) — _Distributed_

### Load Testing — _RHIDP-15294 (OCI Skill Registry)_ — **Stretch**

> Deferred from minimum baseline (RHIDP-18761). 5,000-entity load/SLA
> acceptance is a stretch goal.
> The identifiers below preserve historical traceability only. They do not
> authorize implementation or create coding-story mappings for this baseline.

- [ ] 7.1 ~~Create load test harness generating 5,000+ AI asset entities (distributed across categories)~~ (RHIDP-15268) — **DEFERRED — stretch, outside minimum scope**
- [ ] 7.2 ~~Measure baseline p95 latency for catalog queries without AI Catalog entities~~ (RHIDP-15268) — **DEFERRED — stretch, outside minimum scope**
- [ ] 7.3 ~~Measure with-AI-Catalog p95 latency with 5,000+ entities ingested~~ (RHIDP-15268) — **DEFERRED — stretch, outside minimum scope**
- [ ] 7.4 ~~Validate p95 latency degradation ≤10% SLA; fail test if violated~~ (RHIDP-15268) — **DEFERRED — stretch, outside minimum scope**
- [ ] 7.5 ~~Measure processing-loop duration (entity emission → catalog API availability)~~ (RHIDP-15268) — **DEFERRED — stretch, outside minimum scope**
- [ ] 7.6 ~~Document load test execution steps and reproducibility in `tests/load/README.md`~~ (RHIDP-15268) — **DEFERRED — stretch, outside minimum scope**

### Error Resilience — _RHIDP-15316 (Cross-Connector)_

- [ ] 7.7 Implement per-entity error isolation: single entity failures logged with full context (entity ID, source, field, error) (RHIDP-15330)
- [ ] 7.8 Verify remaining valid entities are ingested when single entity fails validation (RHIDP-15330)
- [ ] 7.9 Verify sync cycle completes even with multiple entity failures (RHIDP-15330)
- [ ] 7.10 Document error-handling guarantees in SDK README with example log entry format (RHIDP-15330)

## 8. Migration Readiness Design (P2) — _RHIDP-15258_

> **Implementation:** Tasks 8.1–8.4 live in [specs/migration-readiness/migration-plan.md](specs/migration-readiness/migration-plan.md) (canonical SoT). A discoverability stub is at [specifications/ai-asset-upstream-migration-design.md](../../../specifications/ai-asset-upstream-migration-design.md).

- [x] 8.1 Create migration design document with mapping table: current kind/spec.type/annotation → target upstream kind (RHIDP-15302)
- [x] 8.2 Document transformation rules for each AI asset category (RHIDP-15302)
- [x] 8.3 Identify consumer-facing changes: catalog UI filters, entity refs, API queries (RHIDP-15302)
- [x] 8.4 Document backward compatibility strategy (e.g., keep annotation for one major version) (RHIDP-15302)
- [ ] 8.5 Obtain upstream Backstage maintainer or RHDH architect sign-off on migration document (RHIDP-15302)
- [ ] 8.6 Document sign-off in spec: reviewer name, role, date, approval status (RHIDP-15302)

## 9. Documentation and Examples (P2) — _RHIDP-15258_

- [x] 9.1 Write SDK package README documenting: interface contract, annotation constants, validation usage (RHIDP-15260)
- [ ] 9.2 Add code examples to README showing provider implementation (RHIDP-15260)
- [x] 9.3 Document version normalization rules in SDK README with examples (RHIDP-15255)
- [ ] 9.4 Document generic "AI Catalog connector configuration" examples for endpoints, CA bundles, Secret references, and schedules without claiming full air-gapped qualification (RHIDP-15266)
- [x] 9.5 Create `CHANGELOG.md` with initial version entry (RHIDP-15260)

## 10. Verify

- [ ] 10.1 Verify all three annotations are enforced by CatalogProcessor validator (reject entities with missing/invalid values)
- [x] 10.2 Verify OGX provider annotation emission through the archived [`ogx-entity-provider` spec](../../specs/ogx-entity-provider/spec.md); targeted model and agent tests cover category, source, and normalized-version annotations
- [x] 10.3 Verify `getCursor()` returns `undefined` for absent/cleared state and `clearCursor()` resets only the configured `locationKey` without initiating a full mutation; automated fallback remains deferred to RHIDP-18840
- [ ] 10.4 ~~Verify custom CA bundles are honored for TLS connections in air-gapped deployment~~ — **DEFERRED — stretch qualification**
- [ ] 10.5 ~~Verify startup validation rejects plaintext credentials with descriptive error~~ — **DEFERRED — stretch qualification**
- [ ] 10.6 ~~Verify load test passes with p95 latency degradation ≤10% at 5,000+ entities~~ (RHIDP-15268) — **DEFERRED — stretch, tracked under RHIDP-15294, outside minimum scope**
- [ ] 10.7 Verify single entity failures are isolated and remaining entities are ingested
- [ ] 10.8 Verify migration design document has upstream maintainer or RHDH architect sign-off
