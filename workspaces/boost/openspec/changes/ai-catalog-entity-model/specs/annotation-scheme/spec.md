# AI Asset Annotation Scheme

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

Standardized annotation scheme for classifying AI assets (agents, skills, MCP servers, models, model servers) in the Backstage catalog, with documented normalization rules for versioning and provenance tracking.

## ADDED Requirements

### Requirement: rhdh.io/ai-asset-category Annotation Definition

All AI asset entities MUST carry the `rhdh.io/ai-asset-category` annotation with one of five allowed values.

#### Scenario: Valid category annotation values

- **WHEN** an entity provider emits an AI asset entity
- **THEN** the entity MUST have `metadata.annotations['rhdh.io/ai-asset-category']` set to one of: `agent`, `skill`, `mcp-server`, `ai-model`, `model-server`
- **AND** the CatalogProcessor validator accepts the entity

#### Scenario: Missing or invalid category annotation rejected

- **WHEN** an entity is ingested with missing or invalid `rhdh.io/ai-asset-category` annotation
- **THEN** the CatalogProcessor validator rejects the entity with error: `Invalid or missing rhdh.io/ai-asset-category annotation. Allowed values: agent, skill, mcp-server, ai-model, model-server`
- **AND** the entity does NOT appear in the catalog
- **AND** the error is logged with entity identifier and source registry

#### Scenario: All entity providers populate category annotation (RHIDP-15255)

- **WHEN** the Kagenti entity provider emits an agent entity
- **THEN** the entity has `rhdh.io/ai-asset-category: agent`
- **AND** **WHEN** the LlamaStack entity provider emits a model entity
- **THEN** the entity has `rhdh.io/ai-asset-category: ai-model`
- **AND** **WHEN** the OCI skill registry provider emits a skill entity
- **THEN** the entity has `rhdh.io/ai-asset-category: skill`

### Requirement: rhdh.io/ai-asset-version Annotation with Normalization

All AI asset entities MUST carry the `rhdh.io/ai-asset-version` annotation with documented normalization rules.

#### Scenario: Semver version pass-through (RHIDP-15256)

- **WHEN** the source registry reports version `1.2.3` (valid semver)
- **THEN** the entity has `rhdh.io/ai-asset-version: 1.2.3` (unchanged)
- **AND** **WHEN** the source registry reports version `2.0.0-beta.1`
- **THEN** the entity has `rhdh.io/ai-asset-version: 2.0.0-beta.1`

#### Scenario: Date-based version normalization (RHIDP-15256)

- **WHEN** the source registry reports version `20260708` (date format)
- **THEN** the entity has `rhdh.io/ai-asset-version: 0.0.0-20260708`
- **AND** **WHEN** the source registry reports version `2026-07-08`
- **THEN** the entity has `rhdh.io/ai-asset-version: 0.0.0-20260708` (normalized to compact format)

#### Scenario: Commit hash version normalization (RHIDP-15256)

- **WHEN** the source registry reports version `a1b2c3d` (Git commit SHA)
- **THEN** the entity has `rhdh.io/ai-asset-version: 0.0.0-a1b2c3d`

#### Scenario: Unrecognized version format fallback (RHIDP-15256)

- **WHEN** the source registry reports version `unknown-format-xyz`
- **THEN** the entity has `rhdh.io/ai-asset-version: 0.0.0-unknown`
- **AND** a warning is logged: `Unrecognized version format 'unknown-format-xyz' for entity <entityRef>. Normalized to 0.0.0-unknown`

#### Scenario: SDK exports normalizeAIAssetVersion utility (RHIDP-15256)

- **WHEN** a developer imports `normalizeAIAssetVersion` from `@boost/entity-provider-sdk`
- **THEN** it is a function accepting `sourceVersion: string` and returning normalized semver string
- **AND** it implements all four normalization rules (semver pass-through, date-based, commit hash, fallback)
- **AND** unit tests cover all normalization rules

### Requirement: rhdh.io/ai-asset-source Annotation for Provenance

All AI asset entities MUST carry the `rhdh.io/ai-asset-source` annotation identifying the connector and registry instance.

#### Scenario: Source annotation format (RHIDP-15257)

- **WHEN** an entity provider emits an entity
- **THEN** the entity has `metadata.annotations['rhdh.io/ai-asset-source']` in format: `connector-name/registry-instance-id`
- **AND** `connector-name` is one of: `kagenti`, `llamastack`, `oci-skill-registry`
- **AND** `registry-instance-id` is the app-config provider instance ID (e.g., `default`, `prod-kagenti`, `dev-skills`)

#### Scenario: Kagenti provider source annotation (RHIDP-15257)

- **WHEN** the Kagenti provider with instance ID `prod-kagenti` emits an entity
- **THEN** the entity has `rhdh.io/ai-asset-source: kagenti/prod-kagenti`

#### Scenario: OCI skill registry provider source annotation (RHIDP-15257)

- **WHEN** the OCI skill registry provider with instance ID `default` emits an entity
- **THEN** the entity has `rhdh.io/ai-asset-source: oci-skill-registry/default`

#### Scenario: Audit traceability via source annotation (RHIDP-15257)

- **WHEN** an AI asset entity is queried from the catalog
- **THEN** the `rhdh.io/ai-asset-source` annotation provides audit trail: which connector and which registry instance produced this entity
- **AND** this enables troubleshooting (e.g., "all entities from kagenti/prod-kagenti failing validation")

### Requirement: Migration-Readiness Mapping to Upstream Kinds

A documented mapping from custom annotations to upstream Backstage entity kinds MUST be defined and reviewed.

#### Scenario: Migration design document exists (RHIDP-15302)

- **WHEN** the migration-readiness spec is reviewed
- **THEN** it contains a mapping table: current kind + spec.type + annotation → target upstream kind (e.g., `Component` + `ai-agent` + `agent` → `AIAgent`)
- **AND** it identifies consumer-facing changes during migration (e.g., catalog UI filters, queries, entity refs)

#### Scenario: Upstream maintainer or RHDH architect sign-off (RHIDP-15302)

- **WHEN** the migration-readiness design document is finalized
- **THEN** it is reviewed and signed off by an upstream Backstage maintainer OR RHDH architect
- **AND** the sign-off is documented in the spec (reviewer name, date, approval status)
