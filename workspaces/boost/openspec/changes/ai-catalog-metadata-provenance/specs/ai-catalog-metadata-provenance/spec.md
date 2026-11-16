# AI Catalog Metadata and Provenance

> **Status: Draft** — Pre-implementation specification for annotation
> semantics, kind-to-category mapping, Location entity lifecycle, and source
> correlation rules. The working baseline is provisional; frontend stakeholder
> feedback is pending.

## EXISTING Requirements

### Requirement: rhdh.io/ai-asset-category annotation semantics

All AI asset entities MUST carry the `rhdh.io/ai-asset-category` annotation
with one of the six accepted values. The five minimum feature categories are
`agent`, `skill`, `mcp-server`, `ai-model`, and `model-server`. The existing
`rule` value remains accepted for compatibility.

This requirement restates the current contract from
[annotation-scheme/spec.md](../../ai-catalog-entity-model/specs/annotation-scheme/spec.md)
and the current SDK validation in
`ai-catalog-entity-provider-sdk/src/annotations.ts`.

#### Scenario: Category annotation is required on AI asset entities

- **GIVEN** an entity carries any `rhdh.io/ai-asset-*` annotation
- **WHEN** the CatalogProcessor validates the entity
- **THEN** the entity MUST have `rhdh.io/ai-asset-category` set to one of: `agent`, `skill`, `rule`, `mcp-server`, `ai-model`, `model-server`

#### Scenario: Category annotation is not required on non-AI entities

- **GIVEN** an entity carries no `rhdh.io/ai-asset-*` annotation
- **WHEN** the CatalogProcessor validates the entity
- **THEN** the category annotation validator does not reject the entity

### Requirement: rhdh.io/ai-asset-version annotation semantics

All AI asset entities MUST carry the `rhdh.io/ai-asset-version` annotation
with a non-empty string value. Normalization rules are specified separately by
[RHIDP-18845](https://redhat.atlassian.net/browse/RHIDP-18845); this
requirement covers only the presence and non-emptiness constraint.

#### Scenario: Version annotation is required on AI asset entities

- **GIVEN** an entity carries any `rhdh.io/ai-asset-*` annotation
- **WHEN** the CatalogProcessor validates the entity
- **THEN** the entity MUST have `rhdh.io/ai-asset-version` set to a non-empty string

### Requirement: rhdh.io/ai-asset-source annotation semantics

All AI asset entities MUST carry the `rhdh.io/ai-asset-source` annotation
with a non-empty string identifying the connector and, when applicable, the
registry instance. The CatalogProcessor/SDK MUST NOT enum-validate the
connector name; additional connectors may be added.

#### Scenario: Source annotation is required on AI asset entities

- **GIVEN** an entity carries any `rhdh.io/ai-asset-*` annotation
- **WHEN** the CatalogProcessor validates the entity
- **THEN** the entity MUST have `rhdh.io/ai-asset-source` set to a non-empty string

#### Scenario: Source annotation provides audit trail

- **GIVEN** an AI asset entity is in the catalog
- **WHEN** a consumer reads the entity's annotations
- **THEN** `rhdh.io/ai-asset-source` identifies which connector and which registry instance produced the entity

### Requirement: Kind/spec.type to category mapping

Each supported kind/`spec.type` pair maps to an `rhdh.io/ai-asset-category`
value. The current taxonomy is defined in
`ai-catalog-common/src/aiAssetTaxonomy.ts` (`AI_ASSET_SPEC_TYPES`).

#### Scenario: AiResource with spec.type agent maps to category agent

- **GIVEN** an entity has `kind: AiResource` and `spec.type: agent`
- **WHEN** a provider populates `rhdh.io/ai-asset-category`
- **THEN** the value MUST be `agent`

#### Scenario: AiResource with spec.type skill maps to category skill

- **GIVEN** an entity has `kind: AiResource` and `spec.type: skill`
- **WHEN** a provider populates `rhdh.io/ai-asset-category`
- **THEN** the value MUST be `skill`

#### Scenario: AiResource with spec.type rule maps to category rule

- **GIVEN** an entity has `kind: AiResource` and `spec.type: rule`
- **WHEN** a provider populates `rhdh.io/ai-asset-category`
- **THEN** the value MUST be `rule`

#### Scenario: AiModelServerAPI with spec.type ai-model-server maps to category model-server

- **GIVEN** an entity has `kind: AiModelServerAPI` and `spec.type: ai-model-server`
- **WHEN** a provider populates `rhdh.io/ai-asset-category`
- **THEN** the value MUST be `model-server`

#### Scenario: API with spec.type mcp-server maps to category mcp-server

- **GIVEN** an entity has `kind: API` and `spec.type: mcp-server`
- **WHEN** a provider populates `rhdh.io/ai-asset-category`
- **THEN** the value MUST be `mcp-server`

#### Scenario: Resource with spec.type ai-model maps to category ai-model

- **GIVEN** an entity has `kind: Resource` and `spec.type: ai-model`
- **WHEN** a provider populates `rhdh.io/ai-asset-category`
- **THEN** the value MUST be `ai-model`

## ADDED Requirements

### Requirement: Source annotation safe-exposure rules

Providers MUST NOT include credentials or internal network addresses in the
`rhdh.io/ai-asset-source` annotation value. The annotation appears on catalog
entities visible to all authorized users.

#### Scenario: Source annotation excludes credentials

- **WHEN** a provider populates `rhdh.io/ai-asset-source`
- **THEN** the value does not contain API keys, tokens, passwords, or client secrets

#### Scenario: Source annotation excludes raw internal URLs

- **WHEN** a provider populates `rhdh.io/ai-asset-source`
- **THEN** the value does not contain raw internal network addresses
- **AND** the value uses app-config instance identifiers instead of endpoint URLs

Provenance examples using safe values:

- OGX provider with one instance: `ogx`
- OGX provider with named instances: `ogx/prod-east`, `ogx/staging`
- MCP registry provider: `mcp-registry/mcpRegistryPrimary`
- RHOAI provider: `rhoai/default`
- Skills catalog provider: `oci/quay-prod`, `npx/internal`

These examples use connector names and app-config instance identifiers. None
contains credentials, hostnames, or internal IP addresses.

### Requirement: Management annotation consistency

All AI asset entities MUST carry both `backstage.io/managed-by-location` and
`backstage.io/managed-by-origin-location` annotations. These are required by
the Backstage catalog processing pipeline; entities without them do not appear
in the catalog.

For programmatic entity providers (all current AI Catalog providers), both
annotations SHOULD carry the same value because the entity's source and origin
are identical — the provider that emitted it.

#### Scenario: Both management annotations are present

- **WHEN** an entity provider emits an AI asset entity
- **THEN** the entity has `backstage.io/managed-by-location` set to a non-empty string
- **AND** the entity has `backstage.io/managed-by-origin-location` set to a non-empty string

#### Scenario: Programmatic providers set both annotations to the same value

- **GIVEN** a programmatic entity provider (not a file-based catalog location)
- **WHEN** the provider emits an AI asset entity
- **THEN** `backstage.io/managed-by-location` and `backstage.io/managed-by-origin-location` have the same value

### Requirement: Mutation locationKey is distinct from management annotations

Providers MUST NOT conflate the mutation `locationKey` passed to
`applyMutation` with the `backstage.io/managed-by-location` annotation value.
The `locationKey` determines entity ownership for update and deletion scoping.
It is NOT the same as the management annotation.

The `locationKey` is never visible to catalog consumers. The management
annotation is visible on every entity.

#### Scenario: locationKey scopes provider ownership

- **GIVEN** a provider with `locationKey` value `ogx-model-entity-provider`
- **WHEN** the provider submits a full mutation with `applyMutation({ type: 'full', entities: [...] })`
- **THEN** only entities previously submitted with the same `locationKey` are affected
- **AND** entities from other providers with different `locationKey` values are unaffected

#### Scenario: Management annotation differs from locationKey

- **GIVEN** the OGX model provider
- **WHEN** it emits an entity
- **THEN** the `locationKey` is `ogx-model-entity-provider`
- **AND** `backstage.io/managed-by-location` is `ogx-model-entity-provider:ogx-model-server`

### Requirement: Location entity generation

Providers that emit a catalog Location entity MUST follow the rules below.
Providers MAY choose not to emit Location entities; when they do, these
constraints apply.

No provider currently emits Location entities. This requirement defines the
future contract and is proposed, pending maintainer acceptance.

#### Scenario: One Location entity per provider instance

- **GIVEN** a provider instance configured with a source endpoint
- **WHEN** the provider emits entities during a refresh cycle
- **THEN** it emits at most one Location entity for that provider instance
- **AND** the Location entity name is deterministic from the provider identity

#### Scenario: Location entity has stable identity across restarts

- **GIVEN** a provider instance with the same configuration
- **WHEN** the provider restarts and performs a refresh
- **THEN** the emitted Location entity has the same `metadata.name` as before the restart

#### Scenario: Location entity type distinguishes AI Catalog sources

- **GIVEN** a provider emits a Location entity
- **WHEN** the Location entity is created
- **THEN** `spec.type` is `ai-catalog-provider`
- **AND** this distinguishes it from standard `url` or `file` catalog locations

#### Scenario: Location entity target identifies the source without credentials

- **GIVEN** a provider emits a Location entity
- **WHEN** the Location entity is created
- **THEN** `spec.target` identifies the source endpoint or configuration path
- **AND** `spec.target` does not contain credentials, tokens, or secrets

#### Scenario: Asset entities reference their Location

- **GIVEN** a provider emits both a Location entity and asset entities
- **WHEN** the asset entities are created
- **THEN** `backstage.io/managed-by-location` references the Location entity

#### Scenario: Location entity is removed with provider instance

- **GIVEN** a provider instance is removed from configuration
- **WHEN** the provider performs a full mutation with an empty entity list
- **THEN** the associated Location entity is also removed

### Requirement: Duplicate ingestion prevention

Providers MUST construct deterministic entity names from source data so that
the same source asset maps to the same entity identity
(`kind` + `namespace` + `metadata.name`).

#### Scenario: Same source asset maps to same entity identity

- **GIVEN** two refresh cycles for the same provider instance
- **WHEN** the source reports the same asset in both cycles
- **THEN** both cycles produce entities with the same `kind`, `namespace`, and `metadata.name`
- **AND** the second cycle's full mutation replaces the first, not duplicates it

#### Scenario: Multi-instance deployment with shared source

- **GIVEN** two provider instances with different `locationKey` values pointing at the same source
- **WHEN** both instances emit entities for the same source asset
- **THEN** the emitted entities have the same `kind`, `namespace`, and `metadata.name`
- **AND** the catalog merges them rather than creating duplicates

#### Scenario: Multi-instance deployment with distinct sources

- **GIVEN** two provider instances with different `locationKey` values pointing at different sources
- **WHEN** both instances emit entities
- **THEN** entities from each source coexist in the catalog
- **AND** each entity's `rhdh.io/ai-asset-source` identifies its originating instance

### Requirement: Metadata precedence for overlapping representations

Catalog consumers MUST treat the `rhdh.io/ai-asset-*` annotations as
authoritative for AI Catalog classification and provenance when metadata
appears in multiple places (annotation, `spec` field, kind name).

#### Scenario: Category annotation takes precedence over spec.type for browse filtering

- **GIVEN** an entity with `rhdh.io/ai-asset-category: agent`
- **AND** the entity has `spec.type: agent`
- **WHEN** the AI Catalog browse view filters entities
- **THEN** it uses the `rhdh.io/ai-asset-category` annotation value for classification

#### Scenario: Source annotation is distinct from management annotation

- **GIVEN** an entity with `rhdh.io/ai-asset-source: ogx`
- **AND** `backstage.io/managed-by-location: ogx-model-entity-provider:ogx-model-server`
- **WHEN** a consumer needs provenance information
- **THEN** `rhdh.io/ai-asset-source` identifies the upstream registry
- **AND** `backstage.io/managed-by-location` identifies the catalog provider

### Requirement: API-origin versus descriptor-URL sources

Programmatic entity providers MUST use provider-scoped synthetic values for
management annotations, not file URLs. Programmatic providers discover entities
through API calls, not catalog descriptor YAML files. This is the standard
Backstage pattern for programmatic `EntityProvider` implementations.

#### Scenario: API-origin provider sets synthetic location annotations

- **GIVEN** an entity provider that discovers entities via an API (e.g., OGX `/v1/models`)
- **WHEN** the provider emits entities
- **THEN** `backstage.io/managed-by-location` uses a provider-scoped synthetic value
- **AND** the value does not reference a `catalog-info.yaml` file

#### Scenario: Location entity target reflects API origin

- **GIVEN** a provider that emits a Location entity for an API-origin source
- **WHEN** the Location entity is created
- **THEN** `spec.target` is the API base URL or a synthetic identifier
- **AND** `spec.target` is not a path to a catalog descriptor file

### Requirement: Conflicting metadata handling

Providers MUST handle edge cases where metadata is missing, conflicting, or
ambiguous according to the rules below.

#### Scenario: Entity with valid category but missing version

- **GIVEN** an entity has `rhdh.io/ai-asset-category: agent`
- **AND** the entity has no `rhdh.io/ai-asset-version` annotation
- **WHEN** the CatalogProcessor validates the entity
- **THEN** the validator rejects the entity with an error identifying the missing annotation

#### Scenario: Entity from source with no version information

- **GIVEN** a source registry provides an asset with no version field
- **WHEN** the provider creates the entity
- **THEN** `rhdh.io/ai-asset-version` is set to `0.0.0-unknown`
- **AND** a warning is logged identifying the entity and source

#### Scenario: Multiple providers emit conflicting metadata for the same entity identity

- **GIVEN** two providers emit entities with the same `kind`, `namespace`, and `metadata.name`
- **AND** the entities have different `rhdh.io/ai-asset-version` values
- **WHEN** both mutations are processed
- **THEN** the last-written mutation's metadata wins
- **AND** the catalog does not merge annotation values from different mutations

#### Scenario: Source registry reports asset with unknown category

- **GIVEN** a source registry reports an asset type that does not map to any recognized category
- **WHEN** the provider creates the entity
- **THEN** the provider logs a warning with the unrecognized type and source
- **AND** the provider either skips the entity or maps it to the closest recognized category with a logged justification
