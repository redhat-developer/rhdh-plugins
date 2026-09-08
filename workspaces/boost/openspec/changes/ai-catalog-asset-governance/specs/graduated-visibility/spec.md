# Graduated Visibility

> **Status: Draft** — Entity visibility is the baseline. Field-level behavior
> starts only if a future API returns protected fields.

Entity discovery uses Catalog's built-in `catalog.entity.read` permission.
Field-level redaction is a separate API responsibility.

**Jira:** RHIDP-15270, RHIDP-15271, RHIDP-15272, RHIDP-15273

## ADDED Requirements

### Requirement: Catalog entity discovery

The Catalog integration MUST use `catalog.entity.read` for AI entity access.

#### Scenario: Authorized entity

- **WHEN** RHDH grants `catalog.entity.read` for an AI catalog entity
- **THEN** the entity is available through authorized Catalog queries

#### Scenario: Denied entity

- **WHEN** RHDH denies `catalog.entity.read` for an AI catalog entity
- **THEN** the entity is excluded from authorized results
- **AND** direct Catalog access does not expose it

### Requirement: Future API redaction

An API that returns protected AI asset fields MUST authorize and redact those
fields at the response boundary.

#### Scenario: Protected field denied

- **WHEN** an authorized user requests an asset without access to its protected
  field group
- **THEN** the API omits those fields
- **AND** the frontend renders the data as unavailable

#### Scenario: No protected API

- **WHEN** no API returns protected AI asset fields
- **THEN** no field-level permission or redaction implementation is required

### Requirement: No duplicate entity permission by default

- **WHEN** an AI catalog entity is evaluated for discovery
- **THEN** `catalog.entity.read` is the entity-level gate
- **AND** no additional project-specific entity permission is required when
  the Catalog permission model expresses the requirement
