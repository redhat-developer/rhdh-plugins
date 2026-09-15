# Catalog Entity Access

> **Status: Draft** — Follow-on RHDH permission/RBAC guidance. No
> Boost-specific configuration key or provider authorization state is proposed.

RHDH roles and conditional rules for `catalog.entity.read` determine which AI
catalog entities a user receives.

**Jira:** RHIDP-15270, RHIDP-15306

## ADDED Requirements

### Requirement: RHDH-managed entity access

AI Catalog visibility MUST follow RHDH's configured policy for
`catalog.entity.read`.

#### Scenario: Access denied

- **WHEN** RHDH does not grant `catalog.entity.read` for an AI catalog entity
- **THEN** that entity is excluded from the user's authorized Catalog results

#### Scenario: Explicit access granted

- **WHEN** RHDH grants `catalog.entity.read` through a role or condition
- **THEN** the user can receive the matching entity from Catalog queries

### Requirement: Scoped entity access

RHDH policies MUST be able to scope `catalog.entity.read` by provider-emitted
category, source, and namespace data.

#### Scenario: Source scope

- **WHEN** RHDH denies `catalog.entity.read` for source `ogx`
- **THEN** entities whose source annotation is `ogx` are denied
- **AND** the provider does not add an authorization annotation

### Requirement: No provider authorization state

Providers MUST NOT persist an authorization decision or policy-change timestamp
by default.

#### Scenario: Provider refresh

- **WHEN** a provider refreshes an entity
- **THEN** Catalog evaluates visibility using the current RHDH decision and the
  entity's refreshed annotations and metadata
- **AND** the provider does not update an authorization record
