## ADDED Requirements

### Requirement: Existing Catalog conditions scope AI asset access

RHDH SHALL express AI Catalog entity scopes with existing Catalog conditional rules whenever those rules can match the required provider-emitted metadata.

#### Scenario: Category and source scope

- **WHEN** an administrator grants `catalog.entity.read` for a specific AI asset category and source connector
- **THEN** the condition matches the exact normalized category and source annotation values
- **AND** entities with different values are not granted by that policy

#### Scenario: Team scope

- **WHEN** an administrator scopes access by owner, namespace, or label
- **THEN** the policy uses the corresponding existing Catalog condition
- **AND** the entity provider does not ingest a tenant-specific duplicate

### Requirement: Multiple tenants share one entity set

RHDH SHALL evaluate conditional policies at request time so different teams can receive different authorized views over the same ingested entity set.

#### Scenario: Different team grants

- **WHEN** team A and team B have conditions matching different subsets of the same catalog
- **THEN** each team's authorized query returns only its matching entities
- **AND** connector synchronization is not repeated per team

### Requirement: Scoped default posture is policy-based

Per-category and per-source default access SHALL be represented by explicit conditional policies rather than authorization state stored on entities.

#### Scenario: Skills denied and model servers allowed

- **WHEN** an operator configures a grant for model-server entities but no grant for skill entities
- **THEN** eligible users can discover matching model servers
- **AND** unmatched skills remain denied

### Requirement: Existing RBAC administration is the v1 control plane

RHDH SHALL manage AI Catalog roles, grants, and conditional policies through the existing RBAC administration permissions and UI in v1.

#### Scenario: SMP Admin manages AI Catalog policy

- **WHEN** a deployment assigns the SMP Admin persona the required existing RBAC policy-management permissions
- **THEN** that administrator manages AI Catalog access through the existing RBAC UI
- **AND** no AI-specific runtime posture setting or dedicated administration section is required
- **AND** `ai-catalog.manage` does not replace the existing RBAC policy-management permissions

### Requirement: Custom conditions require a proven gap

The implementation SHALL document a concrete expression that existing Catalog conditions cannot represent before adding an AI Catalog-specific rule.

#### Scenario: Existing composition is sufficient

- **WHEN** a scope can be expressed with existing conditions and `anyOf`, `allOf`, or `not`
- **THEN** no custom AI Catalog condition is introduced
