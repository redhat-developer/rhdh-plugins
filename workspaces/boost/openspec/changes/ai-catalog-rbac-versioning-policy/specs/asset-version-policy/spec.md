## ADDED Requirements

### Requirement: Direct policy applies in v1

RHDH SHALL evaluate each AI Catalog entity using direct Catalog policy in v1. The PM scope decision supplied on 2026-09-15 defers automatic asset-to-version inheritance and inherited-policy override precedence until RHDHPLAN-1507 defines the prerequisite model and a follow-up design is reviewed.

#### Scenario: Entity has version metadata only

- **WHEN** an entity carries `rhdh.io/ai-asset-version` but no defined cross-version identity or relationship
- **THEN** RHDH evaluates `catalog.entity.read` directly for that entity
- **AND** it does not infer policy inheritance from names, versions, or source metadata

### Requirement: Inheritance is deferred to a follow-up after RHDHPLAN-1507

This change SHALL NOT implement automatic asset-to-version inheritance or precedence rules that make a version-specific policy override an inherited asset policy. RHDHPLAN-1507 SHALL supply stable cross-version identity, multi-version representation, and a resolvable relationship contract before an inheritance follow-up is designed. This dependency SHALL NOT block delivery of direct per-entity authorization.

#### Scenario: Entity-model prerequisite remains unavailable

- **WHEN** RHDHPLAN-1507 has not supplied the required model
- **THEN** automatic inheritance is excluded from implementation
- **AND** each entity continues to use direct Catalog policy

#### Scenario: Entity-model prerequisite becomes available

- **WHEN** RHDHPLAN-1507 supplies the required model and inheritance work resumes
- **THEN** inheritance and override semantics are specified in a reviewed follow-up change before implementation
- **AND** an integration spike against the target RBAC version proves same-role and cross-role precedence for an asset-wide allow plus an independent version-specific deny
- **AND** that follow-up defines safe behavior for precedence, removal, orphaned versions, migration, and resolver failure
- **AND** the arrival of model metadata alone does not activate inheritance
