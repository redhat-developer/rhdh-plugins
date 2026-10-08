# Version-Level Policy Behavior

> **Status: Draft** — Decision-gated follow-on behavior. OGX currently emits
> ordinary entities with version annotations, not a policy hierarchy.

An annotation alone does not create inherited authorization. Direct Catalog
policies are evaluated first.

**Jira:** RHIDP-15274, RHIDP-15275

## ADDED Requirements

### Requirement: Direct policy first

Version entities MUST use normal Catalog policy evaluation before inheritance is
considered.

#### Scenario: Direct version policy

- **WHEN** a version entity has a direct `catalog.entity.read` policy
- **THEN** that policy is evaluated against the version entity
- **AND** no parent-asset lookup is required

#### Scenario: Annotation without relationship

- **WHEN** an entity has a version annotation but no explicit resolvable parent
  relationship
- **THEN** it is evaluated using its own Catalog policy
- **AND** no inherited policy is applied

### Requirement: Cascade requires a demonstrated gap

The implementation MUST satisfy the scenarios below.

#### Scenario: Cascade design is gated

- **WHEN** direct Catalog policies cannot express required inherited access
- **AND** an explicit asset-to-version relationship is resolvable
- **THEN** precedence, refresh, removal, and orphan behavior are defined before
  a custom cascade is implemented
