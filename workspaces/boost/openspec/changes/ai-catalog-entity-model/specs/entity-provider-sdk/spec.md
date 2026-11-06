# Entity Provider SDK

> **Status: Draft (Expanded Scope)** — Pre-implementation specification. Subject to change during implementation.
>
> Post-consolidation, RHIDP-15258 absorbs: annotation scheme (RHIDP-15255), delta sync framework (RHIDP-15262), and migration readiness (RHIDP-15302). See companion specs for detailed requirements.
>
> **Cross-connector dependencies:** RHIDP-15260 (SDK package) is blocked by three RHIDP-15316 stories:
>
> - RHIDP-15265 — SDK must export the configuration schema for endpoint URLs and Secret-based credential validation
> - RHIDP-15329 — SDK must expose the shared CA bundle resolution utility for all connectors
> - RHIDP-15330 — SDK must define the per-entity and per-connector error isolation contract

A TypeScript SDK package defining the contract for AI asset entity providers, exporting shared types and validation utilities.

## ADDED Requirements

### Requirement: TypeScript Interface Contract

The SDK MUST define TypeScript interfaces for AI asset entity providers covering entity emission, annotation population, and kind/spec.type mapping. The entity kind definitions depend on RHDHPLAN-1113: if RHDHPLAN-1113 lands before RHIDP-15258 work begins, the SDK uses AIResource/AIContext kinds directly; otherwise Resource/Component is used as interim (see design.md Stakeholder Alignment).

#### Scenario: AIAssetEntityProvider interface definition (RHIDP-15259)

- **WHEN** a developer implements an AI asset entity provider
- **THEN** they implement the `AIAssetEntityProvider` interface from `@red-hat-developer-hub/backstage-plugin-boost-entity-provider-sdk`
- **AND** the interface requires methods: `connect()`, `* entities()` (async generator), `getProviderName()`, `getProviderId()`
- **AND** the interface supports both full-refresh and incremental-sync patterns (incremental via optional `delta()` method)

#### Scenario: Entity emission contract (RHIDP-15259)

- **WHEN** a provider's `entities()` generator yields an entity
- **THEN** the entity MUST be a valid Backstage `Entity` object with `apiVersion`, `kind`, `metadata`, `spec`
- **AND** the entity MUST have all three required annotations: `rhdh.io/ai-asset-category`, `rhdh.io/ai-asset-version`, `rhdh.io/ai-asset-source`
- **AND** the SDK exports a `validateAIAssetEntity(entity: Entity): void` function that throws if annotations are missing/invalid

#### Scenario: Full-refresh and delta sync pattern support (RHIDP-15259)

- **WHEN** a provider implements only the `entities()` generator
- **THEN** it operates in full-refresh mode: yields all entities on each poll
- **AND** **WHEN** a provider implements the optional `delta(cursor?: string)` method
- **THEN** it operates in incremental mode: yields only additions/updates/deletions since the cursor

### Requirement: Published SDK Package with Validation

The SDK MUST be published as an installable npm package with shared validation utilities.

#### Scenario: SDK package is installable (RHIDP-15260)

- **WHEN** a developer runs `npm install @red-hat-developer-hub/backstage-plugin-boost-entity-provider-sdk`
- **THEN** the package installs successfully
- **AND** the package exports: `AIAssetEntityProvider`, `AIAssetCategory`, annotation constants, `validateAIAssetEntity()`, `normalizeAIAssetVersion()`
- **AND** the package exports the delta sync framework: `DeltaSyncManager`, `InMemoryCursorStore`, `CursorStore`, `CursorState`, `ApplyDeltaOptions`, `DeltaSyncManagerOptions`

#### Scenario: Annotation constants exported (RHIDP-15260)

- **WHEN** a developer imports from `@red-hat-developer-hub/backstage-plugin-boost-entity-provider-sdk`
- **THEN** they can use constants: `AI_ASSET_CATEGORY_ANNOTATION = 'rhdh.io/ai-asset-category'`, `AI_ASSET_VERSION_ANNOTATION = 'rhdh.io/ai-asset-version'`, `AI_ASSET_SOURCE_ANNOTATION = 'rhdh.io/ai-asset-source'`

#### Scenario: Shared validation rejects invalid entities (RHIDP-15260)

- **WHEN** `validateAIAssetEntity(entity)` is called with an entity missing `rhdh.io/ai-asset-category`
- **THEN** it throws: `Error: Invalid or missing rhdh.io/ai-asset-category annotation. Allowed values: agent, skill, rule, mcp-server, ai-model, model-server`
- **AND** **WHEN** called with an entity having `rhdh.io/ai-asset-category: invalid-value`
- **THEN** it throws: `Error: Invalid rhdh.io/ai-asset-category value 'invalid-value'. Allowed: agent, skill, rule, mcp-server, ai-model, model-server`

#### Scenario: Rejected category diagnostics escape control characters

- **WHEN** `validateAIAssetEntity(entity)` receives category `ag` followed by a line feed and `ent`
- **THEN** it rejects the original category value
- **AND** its error displays the category as `ag\u000aent`, with a literal backslash escape instead of a line feed

#### Scenario: SDK has README, CHANGELOG, semver (RHIDP-15260)

- **WHEN** the SDK package is published
- **THEN** it has `README.md` documenting: interface contract, annotation constants, validation usage
- **AND** it has `CHANGELOG.md` tracking version changes
- **AND** it follows semver (e.g., `1.0.0`, `1.1.0`)

### ~~Requirement: Neo4j Sync Adapter Interface~~ REMOVED

> Removed from minimum scope (RHIDP-18761). Neo4j knowledge graph
> integration is archived — see
> `openspec/changes/archive/2026-11-06-neo4j-knowledge-graph/`.

### ~~Requirement: SkillBundle Metadata Contract~~ REMOVED

> Removed from minimum scope (RHIDP-18761). SkillBundle/skillcard.yaml
> contracts and the OCI skill registry are archived — see
> `openspec/changes/archive/2026-11-06-oci-skill-registry/` and
> `openspec/changes/archive/2026-11-06-oci-skill-connector/`.
