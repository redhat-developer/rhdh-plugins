# Performance and Resilience

> **Status: Distributed across RHIDP-15294, RHIDP-15316** — Load testing (RHIDP-15268) moved to RHIDP-15294 (OCI Skill Registry). Error resilience consolidated into RHIDP-15330 under RHIDP-15316 (Cross-Connector). Story RHIDP-15269 has been closed.

Load testing validation at 5,000+ entities with p95 latency SLA ≤10% degradation, and per-entity error resilience ensuring single entity failures don't block the entire sync cycle.

## ADDED Requirements

### Requirement: Load Testing with 5,000+ Entities

A test harness MUST validate catalog performance with 5,000+ AI asset entities.

#### Scenario: Test harness creates 5,000+ entities (RHIDP-15268)

- **WHEN** the load test runs
- **THEN** it creates 5,000+ catalog entities with all required AI asset annotations
- **AND** the entities are distributed across categories: 2,000 agents, 1,500 skills, 800 MCP servers, 500 models, 200 model servers
- **AND** the test harness is documented and reproducible (script in `tests/load/` directory)

#### Scenario: Baseline p95 latency measured (RHIDP-15268)

- **WHEN** the load test runs
- **THEN** it measures baseline p95 latency for catalog queries (e.g., `GET /api/catalog/entities`) WITHOUT AI Catalog entities
- **AND** the baseline latency is recorded (e.g., `baseline_p95: 120ms`)

#### Scenario: With-AI-Catalog p95 latency measured (RHIDP-15268)

- **WHEN** the load test runs with 5,000+ AI asset entities ingested
- **THEN** it measures p95 latency for the same catalog queries
- **AND** the with-AI-Catalog latency is recorded (e.g., `with_ai_catalog_p95: 130ms`)

#### Scenario: p95 latency SLA validated (RHIDP-15268)

- **WHEN** the load test compares baseline vs with-AI-Catalog p95 latency
- **THEN** the degradation MUST be ≤10% (e.g., if baseline is 120ms, with-AI-Catalog must be ≤132ms)
- **AND** if the SLA is violated, the test fails with: `Error: p95 latency degradation exceeds 10% SLA. Baseline: 120ms, With AI Catalog: 145ms (20.8% increase)`

#### Scenario: Processing-loop duration measured (RHIDP-15268)

- **WHEN** entity providers ingest 5,000+ entities
- **THEN** the load test measures time from entity emission → catalog API availability (processing-loop duration)
- **AND** the duration MUST be within documented SLA (e.g., ≤60 seconds for 5,000 entities)

#### Scenario: Load test is documented and reproducible (RHIDP-15268)

- **WHEN** a developer wants to run the load test
- **THEN** they can execute `yarn test:load` from the repository root
- **AND** the test outputs: baseline p95, with-AI-Catalog p95, degradation percentage, processing-loop duration, pass/fail status

### Requirement: Per-Entity Error Resilience

Single entity failures MUST NOT block the entire sync cycle. Failures are logged with full context; remaining valid entities are still ingested.

#### Scenario: Single entity failure logged with context (RHIDP-15330)

- **WHEN** an entity fails validation (e.g., missing `rhdh.io/ai-asset-category` annotation)
- **THEN** the error is logged with: entity identifier (`metadata.name` or source registry ID), source registry (`rhdh.io/ai-asset-source` annotation value), field that failed, human-readable error message
- **AND** the log entry format is: `[AI Catalog] Entity validation failed: entity=component:default/broken-agent, source=kagenti/prod-kagenti, field=rhdh.io/ai-asset-category, error=Missing required annotation`

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
