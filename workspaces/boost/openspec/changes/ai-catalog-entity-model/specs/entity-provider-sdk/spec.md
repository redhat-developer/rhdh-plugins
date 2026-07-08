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

A TypeScript SDK package defining the contract for AI asset entity providers, exporting shared types, validation utilities, and adapter interfaces for Neo4j and skillcard.yaml schemas.

## ADDED Requirements

### Requirement: TypeScript Interface Contract

The SDK MUST define TypeScript interfaces for AI asset entity providers covering entity emission, annotation population, and kind/spec.type mapping.

#### Scenario: AIAssetEntityProvider interface definition (RHIDP-15259)

- **WHEN** a developer implements an AI asset entity provider
- **THEN** they implement the `AIAssetEntityProvider` interface from `@boost/entity-provider-sdk`
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

#### Scenario: Existing Kagenti and LlamaStack providers compile (RHIDP-15259)

- **WHEN** the SDK package is published
- **THEN** the Kagenti provider (`plugins/boost-backend-module-kagenti`) compiles against the SDK interface without errors
- **AND** the LlamaStack provider (`plugins/boost-backend-module-llamastack`) compiles against the SDK interface without errors

### Requirement: Published SDK Package with Validation

The SDK MUST be published as an installable npm package with shared validation utilities.

#### Scenario: SDK package is installable (RHIDP-15260)

- **WHEN** a developer runs `npm install @boost/entity-provider-sdk`
- **THEN** the package installs successfully
- **AND** the package exports: `AIAssetEntityProvider`, `AIAssetCategory`, annotation constants, `validateAIAssetEntity()`, `normalizeAIAssetVersion()`

#### Scenario: Annotation constants exported (RHIDP-15260)

- **WHEN** a developer imports from `@boost/entity-provider-sdk`
- **THEN** they can use constants: `AI_ASSET_CATEGORY_ANNOTATION = 'rhdh.io/ai-asset-category'`, `AI_ASSET_VERSION_ANNOTATION = 'rhdh.io/ai-asset-version'`, `AI_ASSET_SOURCE_ANNOTATION = 'rhdh.io/ai-asset-source'`

#### Scenario: Shared validation rejects invalid entities (RHIDP-15260)

- **WHEN** `validateAIAssetEntity(entity)` is called with an entity missing `rhdh.io/ai-asset-category`
- **THEN** it throws: `Error: Invalid or missing rhdh.io/ai-asset-category annotation`
- **AND** **WHEN** called with an entity having `rhdh.io/ai-asset-category: invalid-value`
- **THEN** it throws: `Error: Invalid rhdh.io/ai-asset-category value 'invalid-value'. Allowed: agent, skill, mcp-server, ai-model, model-server`

#### Scenario: SDK has README, CHANGELOG, semver (RHIDP-15260)

- **WHEN** the SDK package is published
- **THEN** it has `README.md` documenting: interface contract, annotation constants, validation usage, Neo4j adapter, SkillBundle schema
- **AND** it has `CHANGELOG.md` tracking version changes
- **AND** it follows semver (e.g., `1.0.0`, `1.1.0`)

### Requirement: Neo4j Sync Adapter Interface

The SDK MUST define a TypeScript interface for Neo4j sync adapters with node/relationship creation contracts.

#### Scenario: Neo4jSyncAdapter interface definition (RHIDP-15303)

- **WHEN** a developer implements a Neo4j sync adapter
- **THEN** they implement the `Neo4jSyncAdapter` interface from `@boost/entity-provider-sdk`
- **AND** the interface requires methods: `createNode()`, `updateNode()`, `deleteNode()`, `createRelationship()`

#### Scenario: Relationship type constants (RHIDP-15303)

- **WHEN** a developer creates a relationship via `createRelationship(fromRef, toRef, type, metadata?)`
- **THEN** `type` is one of: `DEPENDS_ON`, `USES_TOOL`, `BELONGS_TO`, `SIMILAR_TO`, `IMPLEMENTED_BY`, `INCLUDES`
- **AND** the SDK exports a `RelationshipType` union type with these constants

#### Scenario: Interface documentation (RHIDP-15303)

- **WHEN** the SDK is published
- **THEN** the `Neo4jSyncAdapter` interface has JSDoc comments explaining: when to use each method, what metadata should contain, how relationships are used for knowledge graph queries

### Requirement: SkillBundle Metadata Contract

The SDK MUST define the TypeScript type for SkillBundle metadata (skillcard.yaml schema).

#### Scenario: SkillBundleMetadata type definition (RHIDP-15303)

- **WHEN** a developer parses a `skillcard.yaml` file
- **THEN** they use the `SkillBundleMetadata` type from `@boost/entity-provider-sdk`
- **AND** the type defines fields: `name: string`, `version: string`, `description?: string`, `author?: string`, `tags?: string[]`, `runtime?: { language: string, dependencies?: Record<string, string> }`, `mcp?: { servers: string[] }`

#### Scenario: OCI skill registry uses SkillBundleMetadata (RHIDP-15303)

- **WHEN** the OCI skill registry provider parses an OCI artifact's `skillcard.yaml`
- **THEN** it validates the YAML against the `SkillBundleMetadata` type
- **AND** it emits a catalog entity with metadata derived from the skillcard (name, version, tags, runtime)
