## ADDED Requirements

### Requirement: Catalog permission is the entity visibility gate

RHDH SHALL use `catalog.entity.read` as the single whole-entity authorization gate for AI Catalog entities.

#### Scenario: Authorized discovery

- **WHEN** a user is granted `catalog.entity.read` for an AI Catalog entity
- **THEN** the entity is eligible to appear in authorized search and browse results
- **AND** the user can navigate to its Catalog entity page

#### Scenario: Denied discovery and direct access

- **WHEN** a user is denied `catalog.entity.read` for an AI Catalog entity
- **THEN** the entity is absent from authorized search and browse results
- **AND** direct Catalog access does not expose the entity

### Requirement: Entity read includes all entity details

V1 SHALL use whole-entity visibility: a user granted `catalog.entity.read` for an AI Catalog entity is authorized to access every value stored on that entity. V1 SHALL NOT require a separate usage-detail permission or introduce graduated visibility or a field-redaction layer.

#### Scenario: Entity reader has no usage-detail grant

- **WHEN** a user is granted `catalog.entity.read` for an AI Catalog entity without any AI-specific usage-detail grant
- **THEN** the user can access its available metadata, usage instructions, configuration guidance, and connection details stored on the entity
- **AND** the API and UI do not omit or restrict those values because a separate usage-detail permission is absent

### Requirement: Entity access is deny-by-default

RHDH SHALL deny an AI Catalog entity request when no role, conditional policy, configured default role, or superuser rule grants `catalog.entity.read`.

#### Scenario: Newly ingested entity has no matching grant

- **WHEN** an entity provider adds an AI Catalog entity that matches no access grant
- **THEN** the entity is not visible to an ordinary authenticated user
- **AND** the provider does not create or persist an authorization decision

#### Scenario: Evaluation deployment grants default access

- **WHEN** an operator configures an authenticated default role with `catalog.entity.read`
- **THEN** matching authenticated users can discover eligible AI Catalog entities
- **AND** the grant remains owned by RHDH RBAC configuration

### Requirement: Authorization overhead is bounded

AI Catalog entity authorization SHALL use the existing Permission Framework evaluation path and SHALL NOT introduce a separate authorization cache or service.

#### Scenario: Permission-check latency comparison

- **WHEN** an AI Catalog search or browse request is compared with the same request against an equivalent volume of non-AI Catalog entities under the existing RBAC plugin
- **THEN** the added permission checks do not increase p95 latency by more than 10 percent
