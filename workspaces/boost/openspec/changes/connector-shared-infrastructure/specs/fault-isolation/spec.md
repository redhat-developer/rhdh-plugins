# Fault Isolation and Error Logging

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

Connector fault isolation ensures one connector failure does not block other connectors or degrade non-AI catalog entities. Each entity provider runs in its own isolated bucket (Backstage built-in). Additional hardening: wrap each provider's `connect()` and scheduled refresh callback in try/catch to prevent unhandled rejections from crashing the Node.js process. Actionable error details logged per connector on failure.

## EXISTING Requirements

### Requirement: Provider Crash Contained to Own Bucket

One connector crash does not affect other connectors' entities or non-AI catalog entities.

#### Scenario: Backstage entity bucket isolation

- **WHEN** MCP Registry connector crashes during a scheduled refresh
- **THEN** RHOAI connector's entities remain visible in the catalog
- **AND** OCI Skill connector's entities remain visible in the catalog
- **AND** non-AI catalog entities (components, APIs, users, groups) remain unaffected
- **AND** Backstage's entity bucket isolation prevents cross-provider entity corruption

#### Scenario: Unhandled rejection in refresh caught by wrapper

- **WHEN** a connector's scheduled refresh callback throws an unhandled promise rejection (e.g., network timeout)
- **THEN** `createSafeRefresh()` catches the rejection in its try/catch block
- **AND** logs a structured error with connector context
- **AND** the catalog backend Node.js process continues running (does not crash)
- **AND** other connectors' scheduled tasks continue executing

#### Scenario: connect() failure caught by wrapper

- **WHEN** a connector's `connect()` method throws during provider startup (e.g., invalid endpoint, DNS resolution failure)
- **THEN** `createProviderWrapper()` catches the error in the wrapped `connect()` try/catch
- **AND** logs a structured error with connector ID and failure details
- **AND** the catalog backend continues starting other providers
- **AND** the failed connector's entity bucket remains empty (no stale entities)

### Requirement: Structured Error Logging with Connector Context

Each connector failure produces actionable error details for debugging.

#### Scenario: Structured error log includes connector context

- **WHEN** MCP Registry connector fails to fetch tools from the external registry
- **THEN** the error log includes fields: `connectorId`, `endpoint`, `errorType`, `errorMessage`, `retryable`, `nextRetryAt`
- **AND** `connectorId` is the provider name (e.g., `'mcpRegistry'`)
- **AND** `endpoint` is the external API URL that failed
- **AND** `errorType` is the error constructor name (e.g., `'FetchError'`, `'TimeoutError'`)
- **AND** `errorMessage` is the human-readable error message
- **AND** `retryable` is a boolean indicating whether the error is transient
- **AND** `nextRetryAt` is the ISO timestamp of the next scheduled retry

#### Scenario: Logger uses Backstage LoggerService

- **WHEN** a connector logs an error via the shared fault isolation wrapper
- **THEN** the log message uses Backstage's `LoggerService` for structured JSON output
- **AND** the log level is ERROR for failures, INFO for warnings (e.g., missing CA file)

### Requirement: Enable/Disable Config Check at Registration

Disabled connectors are never registered, producing zero resource usage.

#### Scenario: Disabled connector produces zero resource usage

- **WHEN** a connector is configured with `catalog.providers.<connectorId>.enabled: false`
- **THEN** `isConnectorEnabled(config, connectorId)` returns `false`
- **AND** the backend module's `init()` exits early without calling `catalog.addEntityProvider()`
- **AND** no scheduled tasks are created for the disabled connector
- **AND** no HTTP clients are initialized
- **AND** no cache allocation occurs

#### Scenario: Enabled connector registered normally

- **WHEN** a connector is configured with `catalog.providers.<connectorId>.enabled: true`
- **OR** the `enabled` field is omitted (defaults to `true`)
- **THEN** `isConnectorEnabled(config, connectorId)` returns `true`
- **AND** the backend module proceeds with provider registration via `catalog.addEntityProvider()`

#### Scenario: Info-level log for disabled connector

- **WHEN** a connector is disabled via config
- **THEN** the backend module logs an INFO-level message: `"<Connector Name> connector is disabled"`
- **AND** the log includes the connector ID for context

### Requirement: Multiple Connector Failures Independent

One connector's failure does not trigger retries or error states in other connectors.

#### Scenario: MCP Registry failure does not affect RHOAI connector

- **WHEN** MCP Registry connector fails repeatedly (e.g., network unreachable)
- **THEN** RHOAI connector continues its scheduled refresh tasks independently
- **AND** RHOAI connector's retry logic operates on its own schedule
- **AND** RHOAI connector's error logs are distinct from MCP Registry logs

#### Scenario: All connectors can fail simultaneously without cascading

- **WHEN** all three connectors (MCP Registry, RHOAI, OCI Skill) fail simultaneously
- **THEN** each connector logs its own structured error with independent context
- **AND** the catalog backend remains operational for non-AI entities
- **AND** no cross-connector retry storms or deadlocks occur

## ADDED Requirements

### Requirement: Specification Coverage

This capability area MUST have its existing behavior documented as baseline acceptance criteria.

#### Scenario: Baseline validation

- **WHEN** the existing implementation is validated against this specification
- **THEN** all scenarios described in the EXISTING Requirements section MUST pass
