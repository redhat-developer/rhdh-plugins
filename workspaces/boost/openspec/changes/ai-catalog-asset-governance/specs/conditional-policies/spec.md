# Conditional Policies

> **Status: Draft** — Follow-on policy examples using existing RHDH conditions;
> no new AI Catalog rule implementation is proposed.

AI Catalog visibility uses conditions on provider-emitted annotations and
metadata. Current OGX examples use category `agent` or `model-server`, source
`ogx`, and the provider's default namespace.

**Jira:** RHIDP-15270, RHIDP-15312

## ADDED Requirements

### Requirement: Use provider metadata

RHDH policies MUST use existing annotation and metadata conditions for Catalog
entity visibility.

#### Scenario: Provider-scoped policy

- **WHEN** a policy matches category `agent` and source `ogx`
- **THEN** it matches an entity with those exact values
- **AND** it does not match an entity with a different category or source

#### Scenario: Namespace-scoped policy

- **WHEN** a policy matches the provider's default namespace
- **THEN** it matches entities in that namespace
- **AND** it does not match entities in another namespace

### Requirement: Compose existing conditions

Policies MUST use the existing `anyOf`, `allOf`, and `not` operators when a
scope requires composition.

#### Scenario: Combined condition

- **WHEN** a policy allows `agent` entities only in the provider's default
  namespace
- **THEN** the policy uses `allOf` for category and namespace
- **AND** an entity must satisfy both conditions

### Requirement: No duplicate rules

- **WHEN** an access scope can be represented by existing conditions
- **THEN** no AI Catalog-specific category, source, or tenant rule is added
