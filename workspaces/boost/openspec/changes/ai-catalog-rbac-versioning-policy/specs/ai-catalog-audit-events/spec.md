## ADDED Requirements

### Requirement: RBAC audit events use the existing audit facility

AI Catalog RBAC policy create, update, and delete events SHALL use RHDH's existing RBAC audit facility and channel. RHDHPLAN-1508 does not add a separate permission-evaluation audit requirement.

#### Scenario: AI Catalog policy changes

- **WHEN** an administrator creates, changes, or removes a policy granting or revoking `catalog.entity.read`, `ai-catalog.manage`, or the deprecated `ai-catalog.admin`
- **THEN** the existing audit facility records the actor, timestamp, affected role or policy, operation, and safe before-and-after change summary
- **AND** the integration does not emit a duplicate event to a parallel store

#### Scenario: Permission is evaluated during a request

- **WHEN** RHDH evaluates an AI Catalog permission without changing an RBAC policy
- **THEN** this feature does not introduce an additional permission-evaluation audit event

### Requirement: Provider mutations are auditable

As a separate non-RBAC outcome required by RHDHPLAN-1508, AI entity providers SHALL emit operational audit events for completed synchronization mutations not covered by the RBAC auditor.

#### Scenario: Asset version mutation

- **WHEN** a provider adds, updates, removes, or tombstones an AI asset version
- **THEN** an RHDH audit event records the source connector, stable asset identifier when available, version, mutation type, timestamp, and outcome

#### Scenario: Synchronization failure

- **WHEN** a provider synchronization fails
- **THEN** the audit event identifies the provider and safe failure category
- **AND** credentials, tokens, and secret configuration values are not recorded

### Requirement: Audit events remain queryable through RHDH

AI Catalog audit events SHALL be consumable through the existing RHDH audit query and export mechanisms.

#### Scenario: Combined audit review

- **WHEN** an administrator filters audit history for an affected AI asset or connector
- **THEN** relevant RBAC changes and provider mutation events are available without a separate AI Catalog audit viewer
