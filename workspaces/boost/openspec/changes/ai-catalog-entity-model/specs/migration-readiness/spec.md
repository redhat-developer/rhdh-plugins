# Migration Readiness for Upstream Entity Kinds

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

Design document mapping custom annotations and entity kinds to future upstream Backstage entity kinds (RFCs #32062 AIAgent, #33060 AIModel), identifying consumer-facing changes, and obtaining upstream sign-off.

## ADDED Requirements

### Requirement: Migration Design Document

A design document MUST map current custom annotations to upstream entity kinds when available.

#### Scenario: Mapping table exists (RHIDP-15302)

- **WHEN** the migration-readiness design document is reviewed
- **THEN** it contains a table mapping: current kind + spec.type + annotation → target upstream kind
- **AND** the table covers all five AI asset categories: `agent`, `skill`, `mcp-server`, `ai-model`, `model-server`

#### Scenario: Example mapping for agents (RHIDP-15302)

- **WHEN** upstream RFC #32062 defines `kind: AIAgent`
- **THEN** the migration document specifies:
  - **Current:** `kind: Component`, `spec.type: ai-agent`, `rhdh.io/ai-asset-category: agent`
  - **Target:** `kind: AIAgent` (when available)
  - **Transformation:** Remove `spec.type`, remove annotation (or keep for backward compat), change `kind` field

#### Scenario: Example mapping for models (RHIDP-15302)

- **WHEN** upstream RFC #33060 defines `kind: AIModel`
- **THEN** the migration document specifies:
  - **Current:** `kind: Resource`, `spec.type: ai-model`, `rhdh.io/ai-asset-category: ai-model`
  - **Target:** `kind: AIModel` (when available)
  - **Transformation:** Remove `spec.type`, remove annotation (or keep for backward compat), change `kind` field

#### Scenario: Mapping for categories without upstream kinds (RHIDP-15302)

- **WHEN** no upstream kind exists for `skill`, `mcp-server`, or `model-server`
- **THEN** the migration document specifies: "No upstream kind defined yet. Continue using current mapping until RFC available."
- **AND** the document tracks relevant upstream RFC proposals or discussions

### Requirement: Consumer-Facing Changes Identified

The migration document MUST identify consumer-facing changes when transitioning to upstream kinds.

#### Scenario: Catalog UI filters impacted (RHIDP-15302)

- **WHEN** the catalog UI filters by `kind: Component` + `rhdh.io/ai-asset-category: agent`
- **THEN** the migration document identifies: "After migration, filters must change to `kind: AIAgent` (no annotation filter needed)"

#### Scenario: Entity refs change format (RHIDP-15302)

- **WHEN** an entity ref is currently `component:default/my-agent`
- **THEN** the migration document identifies: "After migration, entity refs become `aiagent:default/my-agent` (kind prefix changes)"
- **AND** this impacts: entity links in catalog, relationship references, API queries filtering by entity ref

#### Scenario: Queries and API calls impacted (RHIDP-15302)

- **WHEN** API clients query `GET /api/catalog/entities?filter=kind=Component,rhdh.io/ai-asset-category=agent`
- **THEN** the migration document identifies: "After migration, queries must change to `?filter=kind=AIAgent`"

#### Scenario: Backward compatibility strategy documented (RHIDP-15302)

- **WHEN** the migration document specifies consumer-facing changes
- **THEN** it also documents backward compatibility approach: "Keep `rhdh.io/ai-asset-category` annotation on migrated entities for one major version, allowing queries to work with both old and new filters. Deprecation notice in release notes."

### Requirement: Upstream Maintainer or RHDH Architect Sign-Off

The migration design document MUST be reviewed and signed off by an upstream Backstage maintainer OR RHDH architect.

#### Scenario: Sign-off documented in spec (RHIDP-15302)

- **WHEN** the migration design document is finalized
- **THEN** it includes a sign-off section with: reviewer name, reviewer role (upstream maintainer OR RHDH architect), date of approval, approval status (approved/approved-with-conditions/rejected)

#### Scenario: Upstream maintainer approval (RHIDP-15302)

- **WHEN** an upstream Backstage maintainer reviews the migration document
- **THEN** they confirm: the mapping aligns with upstream RFC intent, the transformation strategy is sound, the backward compatibility approach is reasonable
- **AND** their approval is documented in the spec

#### Scenario: RHDH architect approval (RHIDP-15302)

- **WHEN** an upstream maintainer is not available for review
- **THEN** an RHDH architect (e.g., tech lead, principal engineer) reviews and approves
- **AND** their approval is documented with role and date
