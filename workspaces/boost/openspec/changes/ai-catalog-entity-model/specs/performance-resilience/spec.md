# Performance and Resilience

> **Status: Distributed across RHIDP-15294, RHIDP-15316** — Load testing (RHIDP-15268) moved to RHIDP-15294 (OCI Skill Registry). Error resilience consolidated into RHIDP-15330 under RHIDP-15316 (Cross-Connector). Story RHIDP-15269 has been closed.

Per-entity error resilience ensuring single entity failures don't block the entire sync cycle.

> **Stretch (RHIDP-18761):** The 5,000-entity load/SLA acceptance
> requirements are deferred from the minimum baseline. Per-entity fault
> isolation and contextual logging below are the minimum requirements.

## ADDED Requirements

### ~~Requirement: Load Testing with 5,000+ Entities~~ — **STRETCH**

> Deferred from minimum baseline (RHIDP-18761). Load testing at 5,000+
> entities (RHIDP-15268) with p95 latency SLA ≤10% degradation is a
> stretch goal tracked under RHIDP-15294.

### Requirement: Per-Entity Error Resilience

Single entity failures MUST NOT block the entire sync cycle. Failures are logged with full context; remaining valid entities are still ingested.

#### Scenario: Single entity failure logged with context (RHIDP-15330)

- **WHEN** an entity fails validation (e.g., missing `rhdh.io/ai-asset-category` annotation)
- **THEN** the error is logged with: entity identifier (`metadata.name` or source registry ID), source registry (`rhdh.io/ai-asset-source` annotation value), field that failed, human-readable error message

#### Scenario: Remaining entities still ingested (RHIDP-15330)

- **WHEN** a batch of 100 entities is processed and entity #42 fails validation
- **THEN** entities #1-41 and #43-100 are successfully ingested into the catalog
- **AND** entity #42 is skipped with error logged

#### Scenario: Sync cycle completes with multiple failures (RHIDP-15330)

- **WHEN** a sync cycle processes 5,000 entities and 50 entities fail validation
- **THEN** 4,950 valid entities are ingested
- **AND** 50 errors are logged with full context
- **AND** the sync cycle completes successfully (does NOT throw an exception or halt)

#### Scenario: Error-handling guarantees documented (RHIDP-15330)

- **WHEN** the SDK README is reviewed
- **THEN** it documents the error-handling contract: single entity failures are isolated, remaining entities are processed, sync completes even with multiple failures
- **AND** it provides an example log entry showing the error format
