# Audit Logging

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

AI-catalog management events and ingestion sync events complement the RBAC plugin's existing `AuditorService` coverage. Events use the same structured JSON format as existing RHDH audit logs.

**Jira references:** RHIDP-15277 (absorbs RHIDP-15333 from RHDHPLAN-1513)

## ADDED Requirements

### Requirement: AI-Catalog Management Audit Events

Management actions on AI catalog RBAC configuration MUST emit audit events.

#### Scenario: Default posture change event

- **WHEN** an admin changes `ai-catalog.rbac.defaultPolicy` from `allow` to `deny` (or vice versa) via the admin UI
- **THEN** an audit event is emitted with:
  - `eventName`: `ai-catalog.rbac.posture-changed`
  - `actor`: the admin's user entity ref
  - `previousValue`: the old posture value
  - `newValue`: the new posture value
  - `scope`: `global` | `category:<name>` | `connector:<name>`
  - `timestamp`: ISO 8601

#### Scenario: Category/connector policy CRUD events

- **WHEN** an admin creates, updates, or deletes a category-scoped or connector-scoped policy via the admin UI
- **THEN** an audit event is emitted with:
  - `eventName`: `ai-catalog.rbac.policy-created` | `policy-updated` | `policy-deleted`
  - `actor`: the admin's user entity ref
  - `policyTarget`: the category or connector name
  - `policyType`: `category` | `connector`
  - `permissionName`: the affected permission (e.g., `ai-catalog.asset.read`)

### Requirement: Ingestion Sync Audit Events

AI catalog ingestion sync operations MUST emit audit events for operational visibility.

#### Scenario: Sync completion event

- **WHEN** an entity provider completes a sync cycle
- **THEN** an audit event is emitted with:
  - `eventName`: `ai-catalog.ingestion.sync-completed`
  - `providerName`: the entity provider identifier
  - `entitiesCreated`: count of new entities
  - `entitiesUpdated`: count of updated entities
  - `entitiesDeleted`: count of removed entities
  - `duration`: sync duration in milliseconds
  - `timestamp`: ISO 8601

#### Scenario: Sync error event

- **WHEN** an entity provider encounters an error during sync
- **THEN** an audit event is emitted with:
  - `eventName`: `ai-catalog.ingestion.sync-error`
  - `providerName`: the entity provider identifier
  - `errorMessage`: the error description
  - `errorType`: the error classification
  - `partialResults`: whether partial entities were committed before the error

#### Scenario: Per-asset ingestion event

- **WHEN** an individual AI asset is created, updated, or deleted during ingestion
- **THEN** an audit event is emitted with:
  - `eventName`: `ai-catalog.ingestion.entity-created` | `entity-updated` | `entity-deleted`
  - `entityRef`: the Backstage entity reference
  - `operation`: `create` | `update` | `delete`
  - `sourceProvider`: the entity provider that originated the change

### Requirement: AuditorService Complementarity

AI Catalog audit events MUST NOT duplicate events already covered by the RBAC plugin's `AuditorService`.

#### Scenario: RBAC plugin covers permission evaluation

- **WHEN** a user's `ai-catalog.asset.read` permission is evaluated by the RBAC plugin
- **THEN** the RBAC plugin's `AuditorService` emits the evaluation event (approve/deny/conditional)
- **AND** the AI Catalog does NOT emit a duplicate event
- **AND** the AI Catalog only emits events for management actions and ingestion operations that the `AuditorService` does not cover

#### Scenario: RBAC plugin covers policy/role CRUD

- **WHEN** an admin modifies RBAC roles or policies that affect AI Catalog permissions
- **THEN** the RBAC plugin's `AuditorService` emits the CRUD event
- **AND** the AI Catalog does NOT emit a duplicate event

### Requirement: Audit Event Format

All AI-catalog audit events MUST follow the existing RHDH structured JSON format.

#### Scenario: Event format compliance

- **WHEN** an AI-catalog audit event is emitted
- **THEN** it includes the standard RHDH audit log fields: `timestamp`, `level`, `plugin`, `eventName`, `actor`
- **AND** `plugin` is set to `ai-catalog`
- **AND** the event is emitted via the standard `LoggerService` with structured metadata
