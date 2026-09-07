# ai-catalog-entity-extensions Specification

## Purpose

TBD - created by archiving change ai-catalog-frontend. Update Purpose after archive.

## Requirements

### Requirement: Summary Card

The Summary card MUST render on AI asset entity pages.

#### Scenario: Summary card renders on AI entity

- **WHEN** a developer views a catalog entity page for an AI asset
- **THEN** `entity-card:boost/summary` may render extra AI fields from the entity

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
- **THEN** the Usage tab shows a contact-owner affordance

#### Scenario: Permission allowed

- **WHEN** the user is allowed
- **THEN** the Usage tab may link to TechDocs if `backstage.io/techdocs-ref` is present
- **AND** it may show `metadata.links`
- **AND** the Catalog TechDocs tab is unchanged

#### Scenario: Tab visibility

- **WHEN** a developer views a non-AI entity page
- **THEN** the Usage tab is not present
