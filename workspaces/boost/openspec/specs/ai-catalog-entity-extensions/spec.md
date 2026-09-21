# ai-catalog-entity-extensions Specification

> **Status: Implemented** — Current RHDH 2.1 release source of truth.
>
> **Scope:** `plugins/ai-catalog` entity-page cards for AI catalog assets. Catalog
> entity visibility remains a Catalog/RHDH concern; this spec covers frontend
> presentation only.

## Purpose

This specification describes the entity-page extensions delivered by the AI
Catalog plugin. AI assets use a small set of composable cards rather than a
separate card for every individual field. Type-specific fields are grouped in
the AI asset details card, while agent instructions and usage actions have
their own cards when applicable.

Catalog entity discovery is governed by Backstage's built-in
`catalog.entity.read` permission. The transitional
`ai-catalog.asset.access.usage-docs` permission may gate the Usage card, but it
is not an entity-visibility control or a backend security boundary.

## Requirements

### Requirement: AI asset details card

The AI asset details card MUST render on AI asset entity pages when the entity
contains a description, rationale, version, or supported type-specific field.
It MUST omit itself when there is no supported content.

#### Scenario: Details card renders for supported content

- **WHEN** an AI asset has a description, rationale, version, or supported
  type-specific metadata
- **THEN** `entity-card:ai-catalog/ai-asset-details` renders the available fields

#### Scenario: Description-only asset

- **WHEN** an AI asset has only `metadata.description`
- **THEN** the details card renders the description

#### Scenario: Details card has no supported data

- **WHEN** an AI asset has none of the supported fields
- **THEN** the details card is not rendered

#### Scenario: Details card absent on non-AI entity

- **WHEN** a user views a catalog entity page for a non-AI entity
- **THEN** the details card is not rendered

### Requirement: Type-specific asset details

The details card MUST present fields according to the AI asset type without
requiring separate cards for each field.

#### Scenario: Agent details

- **WHEN** an agent has model, tools, RAG, handoff description, handoff
  targets, or related model data
- **THEN** the card renders the available values
- **AND** handoff targets link to resolvable catalog entities

#### Scenario: Model-server details

- **WHEN** a model server has server type, API-key requirement, default model,
  or available models
- **THEN** the card renders the available values
- **AND** a large model inventory is available through a focused models view

#### Scenario: Other AI asset details

- **WHEN** a skill, rule, or MCP server has supported type-specific metadata
- **THEN** the card renders the metadata using the appropriate field
  presentation

### Requirement: Agent instructions card

The agent instructions card MUST render only for agents with instructions and
MUST render the instruction content as Markdown.

#### Scenario: Agent instructions exist

- **WHEN** an agent has non-empty instructions
- **THEN** `entity-card:ai-catalog/agent-instructions` renders the instructions
  using Markdown content

#### Scenario: Agent instructions are absent

- **WHEN** an agent has no instructions
- **THEN** the instructions card is not rendered

### Requirement: Usage card

The Usage card MUST expose a safe, type-specific usage action when one can be
derived from the entity. It MUST NOT call a Boost backend.

#### Scenario: Usage action exists

- **WHEN** the entity has a supported skill command, OCI pull command, model
  server endpoint, MCP endpoint, Git archive, or Git source location
- **THEN** `entity-card:ai-catalog/usage` exposes the corresponding copy or link
  action

#### Scenario: Git subpath source

- **WHEN** a Git source points to a repository subpath rather than a
  repository root
- **THEN** the Usage card opens the source location instead of guessing an
  archive download

#### Scenario: No usage action

- **WHEN** there is no safe supported usage action
- **THEN** the Usage card is not rendered

#### Scenario: Usage permission denies access

- **WHEN** `ai-catalog.asset.access.usage-docs` denies access to the entity
- **THEN** the Usage card is not rendered
- **AND** the entity remains discoverable through the Catalog permission model

#### Scenario: Usage permission allows access

- **WHEN** `ai-catalog.asset.access.usage-docs` allows access to the entity
- **THEN** the Usage card may render its supported usage action

### Requirement: Standard TechDocs behavior

The AI Catalog plugin MUST NOT replace or duplicate the standard Backstage
TechDocs experience with a dedicated Usage tab. TechDocs remain available
through the host application's normal entity-page extensions.

#### Scenario: Standard TechDocs remain available

- **WHEN** a user views an AI asset with TechDocs configured
- **THEN** the host application's standard TechDocs experience remains
  available
- **AND** the AI Catalog plugin does not add a separate Usage tab for it
