# AI Asset Annotation Scheme

> **Status: Consolidated into RHIDP-15258 (Entity-Provider SDK)** — Annotation scheme is now part of the SDK epic. Single story RHIDP-15255 covers all 3 annotations (category, version, source). Stories RHIDP-15256 and RHIDP-15257 have been closed.

Standardized annotation scheme for the five minimum feature categories (agents, skills, MCP servers, models, model servers), with existing rule compatibility retained separately.

Requirements cover: `rhdh.io/ai-asset-category` (five minimum categories plus the existing `rule` compatibility value), `rhdh.io/ai-asset-version` (4 normalization rules), `rhdh.io/ai-asset-source` (provenance), and migration-readiness mapping. RHIDP-18762 reconciled the SDK category schema, public type/list, and validation diagnostics to the six retained values, excluding `skill-bundle`. This reconciliation does not activate provider adoption or settle deferred metadata and incremental-sync design.

## ADDED Requirements

### Requirement: rhdh.io/ai-asset-category Annotation Definition

All AI asset entities MUST carry the `rhdh.io/ai-asset-category` annotation with one of the allowed values.

The five minimum categories are `agent`, `skill`, `mcp-server`, `ai-model`, and `model-server`. Existing `rule` values remain accepted for compatibility. This does not require new rule discovery, providers, or frontend functionality. The kind/spec.type mappings are separate from this category vocabulary.

#### Scenario: Valid minimum category annotation values

- **WHEN** an entity provider emits an asset in one of the five minimum feature categories
- **THEN** the entity MUST have `metadata.annotations['rhdh.io/ai-asset-category']` set to one of: `agent`, `skill`, `mcp-server`, `ai-model`, `model-server`
- **AND** the CatalogProcessor validator accepts the entity

#### Scenario: Existing rule category remains compatible

- **WHEN** an otherwise valid AI asset entity has `rhdh.io/ai-asset-category: rule`
- **THEN** the CatalogProcessor validator accepts that category

#### Scenario: Missing category annotation rejected (AI entities only)

- **WHEN** an entity is ingested that carries any `rhdh.io/ai-asset-*` annotation but has no `rhdh.io/ai-asset-category` value
- **THEN** the CatalogProcessor validator rejects the entity with error: `Invalid or missing rhdh.io/ai-asset-category annotation. Allowed values: agent, skill, rule, mcp-server, ai-model, model-server`
- **AND** the entity does NOT appear in the catalog
- **AND** the error is logged with entity identifier and source registry
- **AND** entities without any `rhdh.io/ai-asset-*` annotation are NOT affected by this validator

#### Scenario: Invalid category annotation rejected with value shown (AI entities only)

- **WHEN** an entity is ingested that carries any `rhdh.io/ai-asset-*` annotation and has an invalid `rhdh.io/ai-asset-category` value (e.g. `invalid-type`)
- **THEN** the CatalogProcessor validator rejects the entity with error: `Invalid rhdh.io/ai-asset-category value 'invalid-type'. Allowed: agent, skill, rule, mcp-server, ai-model, model-server`
- **AND** the entity does NOT appear in the catalog
- **AND** the error is logged with entity identifier and source registry

#### Scenario: Invalid category diagnostics do not carry control characters

- **WHEN** an AI-annotated entity has category `ag` followed by a line feed and `ent`
- **THEN** the CatalogProcessor validator rejects the original value
- **AND** its error displays the category as `ag\u000aent`, with a literal backslash escape instead of a line feed

#### Scenario: All entity providers populate category annotation (RHIDP-15255)

- **WHEN** the OGX entity provider emits a model entity
- **THEN** the entity has `rhdh.io/ai-asset-category: ai-model`
- **AND** **WHEN** the MCP registry provider emits an MCP server entity
- **THEN** the entity has `rhdh.io/ai-asset-category: mcp-server`

### Requirement: rhdh.io/ai-asset-version Annotation with Normalization

All AI asset entities MUST carry the `rhdh.io/ai-asset-version` annotation with documented normalization rules.

#### Scenario: Semver version pass-through (RHIDP-15255)

- **WHEN** the source registry reports version `1.2.3` (valid semver)
- **THEN** the entity has `rhdh.io/ai-asset-version: 1.2.3` (unchanged)
- **AND** **WHEN** the source registry reports version `2.0.0-beta.1`
- **THEN** the entity has `rhdh.io/ai-asset-version: 2.0.0-beta.1`

#### Scenario: Date-based version normalization (RHIDP-15255)

- **WHEN** the source registry reports version `20260708` (date format)
- **THEN** the entity has `rhdh.io/ai-asset-version: 0.0.0-20260708`
- **AND** **WHEN** the source registry reports version `2026-07-08`
- **THEN** the entity has `rhdh.io/ai-asset-version: 0.0.0-20260708` (normalized to compact format)

#### Scenario: Commit hash version normalization (RHIDP-15255)

- **WHEN** the source registry reports version `a1b2c3d` (Git commit SHA)
- **THEN** the entity has `rhdh.io/ai-asset-version: 0.0.0-a1b2c3d`

#### Scenario: Unrecognized version format fallback (RHIDP-15255)

- **WHEN** the source registry reports version `unknown-format-xyz`
- **THEN** the entity has `rhdh.io/ai-asset-version: 0.0.0-unknown`
- **AND** a warning is logged: `Unrecognized version format 'unknown-format-xyz' for entity <entityRef>. Normalized to 0.0.0-unknown`

#### Scenario: SDK exports normalizeAIAssetVersion utility (RHIDP-15255)

- **WHEN** a developer imports `normalizeAIAssetVersion` from `@red-hat-developer-hub/backstage-plugin-ai-catalog-entity-provider-sdk`
- **THEN** it is a function accepting `sourceVersion: string` and returning normalized semver string
- **AND** it implements all four normalization rules (semver pass-through, date-based, commit hash, fallback)
- **AND** unit tests cover all normalization rules

### Requirement: rhdh.io/ai-asset-source Annotation for Provenance

All AI asset entities MUST carry the `rhdh.io/ai-asset-source` annotation identifying the connector and registry instance.

Additional connector names may be added when new connectors ship. The CatalogProcessor/SDK today only requires a non-empty string and MUST NOT enum-validate `connector-name`.

#### Scenario: Source annotation format (RHIDP-15255)

- **WHEN** an entity provider emits an entity
- **THEN** the entity has `metadata.annotations['rhdh.io/ai-asset-source']` in format: `connector-name/registry-instance-id`
- **AND** `connector-name` is one of: `ogx`, `mcp-registry`, `rhoai`
- **AND** `registry-instance-id` is the app-config provider instance ID (e.g., `default`, `dev-skills`)

#### Scenario: MCP Registry provider source annotation (RHIDP-15255)

- **WHEN** the MCP Registry provider with instance ID `mcpRegistryPrimary` emits an entity
- **THEN** the entity has `rhdh.io/ai-asset-source: mcp-registry/mcpRegistryPrimary`

#### Scenario: RHOAI provider source annotation (RHIDP-15255)

- **WHEN** the RHOAI provider with instance ID `default` emits an entity
- **THEN** the entity has `rhdh.io/ai-asset-source: rhoai/default`

#### Scenario: Audit traceability via source annotation (RHIDP-15255)

- **WHEN** an AI asset entity is queried from the catalog
- **THEN** the `rhdh.io/ai-asset-source` annotation provides audit trail: which connector and which registry instance produced this entity

### Requirement: Migration-Readiness Mapping to Upstream Kinds

A documented mapping from custom annotations to upstream Backstage entity kinds MUST be defined and reviewed.

#### Scenario: Migration design document exists (RHIDP-15302)

- **WHEN** the migration-readiness spec is reviewed
- **THEN** it contains a mapping table: current kind + spec.type + annotation → target upstream kind (e.g., `AIResource` + `skill` + `skill` → `AiResource` casing alignment)
- **AND** it identifies consumer-facing changes during migration (e.g., catalog UI filters, queries, entity refs)
- **AND** it documents the AIResource starting point per RHDHPLAN-1113 (resolved 2026-07-20)

#### Scenario: Upstream maintainer or RHDH architect sign-off (RHIDP-15302)

- **WHEN** the migration-readiness design document is finalized
- **THEN** it is reviewed and signed off by an upstream Backstage maintainer OR RHDH architect
- **AND** the sign-off is documented in the spec (reviewer name, date, approval status)
