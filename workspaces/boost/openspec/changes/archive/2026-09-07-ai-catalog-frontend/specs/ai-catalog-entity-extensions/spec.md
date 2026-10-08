# Entity Page Extensions

> **Status: Implemented**

NFS Blueprint extensions on existing catalog entity pages for AI assets. All
extensions use `isAiAsset` and do not render on non-AI entities. Catalog About,
Relations, and TechDocs remain Catalog surfaces.

## ADDED Requirements

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

#### Scenario: Permission denied

- **WHEN** the user is denied `ai-catalog.asset.access.usage-docs`
- **THEN** the Usage tab shows a permission-denied message
- **AND** it links to the owner when the entity has a valid owner reference

#### Scenario: Permission allowed

- **WHEN** the user is allowed `ai-catalog.asset.access.usage-docs` for the entity
- **THEN** the Usage tab links to TechDocs and `metadata.links` when present
- **AND** the Catalog TechDocs tab is unchanged

#### Scenario: Tab visibility

- **WHEN** a developer views a non-AI entity page
- **THEN** the Usage tab is not present
