# Hot-Reload Propagation

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

Runtime overrides propagate to active connector instances within 30s TTL. Connector responds to config changes on next reconciliation cycle. Endpoint URL changes, schedule changes, and enable/disable toggles take effect without pod restart.

## EXISTING Requirements

### Requirement: Enable/Disable Propagation

Enable/disable changes propagate to active entity provider within 30s + reconciliation interval.

#### Scenario: Disable connector via DB override

- **WHEN** admin writes DB override `connectors.jira.enabled: false`
- **THEN** `RuntimeConfigResolver` cache is invalidated immediately
- **AND** next entity provider reconciliation cycle (within 5 minutes) reads config
- **AND** provider sees `enabled: false`, logs "Jira connector disabled via runtime config, skipping sync"
- **AND** provider skips sync, no entities ingested
- **AND** total propagation time ≤ 30s TTL + 5m reconciliation interval = 5m30s

#### Scenario: Re-enable connector via DB override

- **WHEN** admin writes DB override `connectors.jira.enabled: true` after previously disabling
- **THEN** next reconciliation cycle reads config via `RuntimeConfigResolver`
- **AND** provider sees `enabled: true`, resumes normal sync
- **AND** entities ingested as usual

#### Scenario: Enable/disable with no DB override (YAML baseline only)

- **WHEN** no DB override exists for `connectors.jira.enabled`
- **THEN** `RuntimeConfigResolver` returns YAML baseline value (e.g., `enabled: true`)
- **AND** provider uses YAML baseline

### Requirement: Schedule Change Propagation

Schedule changes take effect on next reconciliation cycle.

#### Scenario: Increase schedule interval via DB override

- **WHEN** admin writes DB override `connectors.jira.schedule.intervalMs: 600000` (10 minutes)
- **THEN** current reconciliation cycle completes using old schedule (5 minutes)
- **AND** next reconciliation cycle reads new config via `RuntimeConfigResolver`
- **AND** provider reschedules task with new interval (10 minutes)
- **AND** subsequent cycles run every 10 minutes

#### Scenario: Decrease schedule interval via DB override

- **WHEN** admin writes DB override `connectors.jira.schedule.intervalMs: 60000` (1 minute)
- **THEN** next reconciliation cycle reads new config
- **AND** provider reschedules task with new interval (1 minute)
- **AND** subsequent cycles run every 1 minute

#### Scenario: Switch from interval to cron schedule

- **WHEN** admin writes DB override `connectors.jira.schedule.cron: "0 */2 * * *"` (every 2 hours) and removes `schedule.intervalMs`
- **THEN** next reconciliation cycle reads new config
- **AND** provider switches from interval-based to cron-based scheduling
- **AND** subsequent cycles run at cron-specified times

### Requirement: Endpoint URL Change Propagation

Endpoint URL changes take effect on next sync cycle.

#### Scenario: Change Jira endpoint URL via DB override

- **WHEN** admin writes DB override `connectors.jira.endpoint: "https://jira-staging.example.com"`
- **THEN** current sync cycle completes using old endpoint
- **AND** next sync cycle reads new config via `RuntimeConfigResolver`
- **AND** provider connects to new endpoint `https://jira-staging.example.com`
- **AND** entities synced from new endpoint

#### Scenario: Invalid endpoint URL rejected before propagation

- **WHEN** admin attempts to write DB override `connectors.jira.endpoint: "not-a-url"`
- **THEN** Zod schema validation rejects the write before cache invalidation
- **AND** no cache invalidation occurs, provider continues using old endpoint

### Requirement: Credential Rotation Timing

K8s Secret mount propagation delays (up to 60s) are handled transparently. Provider re-reads mounted file each cycle.

#### Scenario: Credential rotation with Secret mount delay

- **WHEN** admin updates K8s Secret `jira-credentials` content (new API token)
- **THEN** kubelet syncs projected volume within 60s
- **AND** next reconciliation cycle (within schedule interval, e.g., 5m)
- **AND** provider reads mounted Secret file at `/etc/boost/secrets/jira-api-token`
- **AND** provider uses new credentials for sync
- **AND** total credential rotation latency ≤ 60s kubelet delay + 5m reconciliation interval = ~6 minutes

#### Scenario: Immediate credential use on file change

- **WHEN** mounted Secret file changes (detected by file mtime)
- **THEN** provider reads new file content at next reconciliation cycle start
- **AND** provider uses new credentials immediately (no additional cache invalidation needed)

### Requirement: DB Override Cache Invalidation

Database override writes trigger immediate cache invalidation.

#### Scenario: Cache invalidated on DB write

- **WHEN** admin writes DB override via `AdminConfigService`
- **THEN** `AdminConfigService` calls `RuntimeConfigResolver.invalidate()` (whole-cache invalidation, no key parameter)
- **AND** all cached config entries are cleared
- **AND** next `RuntimeConfigResolver.resolve('boost.connectors.jira')` call fetches fresh YAML + DB overrides

#### Scenario: TTL-based cache refresh

- **WHEN** no DB override write occurs within 30s
- **THEN** `RuntimeConfigResolver` cache entry expires after 30s TTL
- **AND** next `resolve` call fetches fresh YAML + DB overrides
- **AND** ensures eventual consistency even if invalidation signal is missed

### Requirement: Provider Behavior During Config Transition

Entity provider handles config changes gracefully without data loss or duplicate ingestion.

#### Scenario: Provider respects disable during in-flight sync

- **WHEN** sync cycle is in progress and admin disables connector
- **THEN** current sync cycle completes normally (uses config snapshot from cycle start)
- **AND** next sync cycle reads new config, sees `enabled: false`, skips sync

#### Scenario: Provider handles endpoint change without duplicate entities

- **WHEN** endpoint URL changes mid-sync
- **THEN** current sync completes using old endpoint
- **AND** next sync uses new endpoint
- **AND** entity provider deduplication (via entity ref) prevents duplicate catalog entries

#### Scenario: Provider logs config changes

- **WHEN** provider detects config change (e.g., endpoint URL changed)
- **THEN** provider logs: "Connector config changed: endpoint updated from https://jira-prod.example.com to https://jira-staging.example.com"
- **AND** log includes old and new values for auditability

## ADDED Requirements

### Requirement: Specification Coverage

This capability area MUST have its existing behavior documented as baseline acceptance criteria.

#### Scenario: Baseline validation

- **WHEN** the existing implementation is validated against this specification
- **THEN** all scenarios described in the EXISTING Requirements section MUST pass
