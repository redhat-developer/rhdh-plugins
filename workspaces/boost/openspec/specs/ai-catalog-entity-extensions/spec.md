# ai-catalog-entity-extensions Specification

> **Status: Implemented** — Current RHDH 2.1 release source of truth.
>
> **Scope:** `plugins/boost` entity-page cards and Usage tab. Catalog entity
> visibility remains a Catalog/RHDH concern; this spec covers frontend
> presentation only.

## Purpose

This specification describes the frontend entity-page extensions delivered by
the AI Catalog plugin. Catalog entity discovery is governed by Backstage's
built-in `catalog.entity.read` permission; the Usage tab behavior below is
field-level presentation and must not be treated as a second entity-visibility
permission.

The current frontend may still use the existing
`ai-catalog.asset.access.usage-docs` check as a presentation gate for the
Usage tab. That check is transitional UI behavior: it is not the Catalog
entity-visibility control and it is not a backend security boundary. If a
future API returns protected fields, the API must enforce authorization at its
response boundary.

## Requirements

### Requirement: Summary Card

The Summary card MUST render on AI asset entity pages when the entity contains
at least one supported summary field.

#### Scenario: Summary card renders on AI entity

- **WHEN** an AI asset has a description, rationale, available model, agent
  instruction, handoff description, or RAG setting
- **THEN** `entity-card:boost/summary` renders the available summary fields

#### Scenario: Summary card has no supported data

- **WHEN** an AI asset has none of the supported summary fields
- **THEN** the Summary card is not rendered

#### Scenario: Summary card absent on non-AI entity

- **WHEN** a developer views a catalog entity page for a non-AI entity
- **THEN** the Summary card is not rendered

### Requirement: Adoption Card

The Adoption card MUST copy or open a URL in the browser. It MUST NOT call a
Boost backend.

#### Scenario: Copy or open action exists

- **WHEN** the entity has a skill command, OCI pull, git archive link, or MCP remote
- **THEN** the card exposes that action in the browser

#### Scenario: No action

- **WHEN** there is no adoption action
- **THEN** the Adoption card is not rendered

### Requirement: Version Card

The Version card MUST show only the current annotated version.

#### Scenario: Current version annotation exists

- **WHEN** `rhdh.io/ai-asset-version` is present
- **THEN** `entity-card:boost/version-list` shows that version
- **AND** it does not list a version history

### Requirement: Usage Tab

The Usage tab MUST be a Boost `EntityContentBlueprint` on AI assets. It MUST NOT
replace the Catalog TechDocs tab.

Usage authorization is an API/data-boundary concern. If a future backend API
returns protected usage data, that API MUST enforce field-level authorization;
the frontend MUST NOT rely on hiding a tab as the security boundary.

#### Scenario: Current usage permission denies access

- **WHEN** `ai-catalog.asset.access.usage-docs` denies access to the entity
- **THEN** the Usage tab shows a permission-denied message
- **AND** it links to the owner when the entity has a valid owner reference

#### Scenario: Entity visibility is independent from usage presentation

- **WHEN** a user is authorized to read an entity through `catalog.entity.read`
- **AND** `ai-catalog.asset.access.usage-docs` denies access to the entity
- **THEN** the entity remains discoverable
- **AND** the Usage tab shows its permission-denied state

#### Scenario: Current usage permission allows access

- **WHEN** `ai-catalog.asset.access.usage-docs` allows access to the entity
- **THEN** the Usage tab links to TechDocs and `metadata.links` when present
- **AND** the Catalog TechDocs tab is unchanged

#### Scenario: Tab visibility

- **WHEN** a developer views a non-AI entity page
- **THEN** the Usage tab is not present
