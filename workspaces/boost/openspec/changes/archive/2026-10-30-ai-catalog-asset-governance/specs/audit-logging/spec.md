# Audit Logging

> **Status: Draft** — Follow-on coverage for Catalog authorization and provider
> operations. Full ingestion analytics remains separate work.

Policy, role, condition, and permission-evaluation events use RHDH's existing
`AuditorService`. Provider events are added only when an operational audit gap
is confirmed.

**Jira:** RHIDP-15277 (absorbs RHIDP-15333)

## ADDED Requirements

### Requirement: Reuse RBAC audit coverage

Catalog authorization MUST use the existing RHDH/RBAC audit facility.

#### Scenario: RBAC operation

- **WHEN** an administrator changes a Catalog permission policy or role
- **THEN** the existing RBAC audit facility records the operation
- **AND** the AI Catalog integration does not emit a duplicate event

### Requirement: Audit provider gaps through RHDH

Provider events MUST use the existing RHDH audit format and channel when an
operational requirement needs them.

#### Scenario: Provider failure

- **WHEN** an AI entity provider synchronization fails
- **THEN** the audit event records the provider and safe failure information
- **AND** the event does not expose credentials or other secret values

#### Scenario: No parallel audit store

- **WHEN** an AI Catalog operational event is emitted
- **THEN** it is consumable by the existing RHDH audit infrastructure
- **AND** no separate AI Catalog audit store is created
