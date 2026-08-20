# Config Schemas

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

Zod schemas define per-connector configuration fields with `configScope` annotations. `RuntimeConfigResolver` integrates schemas for two-layer resolution (YAML baseline + DB overrides). Schema validation rejects invalid values before write.

## EXISTING Requirements

### Requirement: Zod Schema Definition Per Connector

Each connector has a Zod schema defining all configuration fields with `configScope` annotations.

#### Scenario: Jira connector config schema

- **WHEN** Jira connector config schema is defined
- **THEN** schema includes `boost.connectors` fields only: `enabled` (boolean), `endpoint` (URL string), `schedule.intervalMs` (number), `schedule.cron` (string), `batchSize` (number), `timeout.connectionMs` (number), `__schemaVersion` (number, internal metadata)
- **AND** all user-facing fields are `configScope: db-overridable`; `__schemaVersion` is `configScope: db-only` (deployment-time fields like `tls.caFile`, `credentials.*`, and `namespace` live under `ai-catalog.providers.<id>.*` and are not part of this schema)

#### Scenario: GitHub connector config schema

- **WHEN** GitHub connector config schema is defined
- **THEN** schema includes `boost.connectors` fields only: `enabled` (boolean), `endpoint` (URL string), `schedule.intervalMs` (number), `batchSize` (number), `__schemaVersion` (number, internal metadata)
- **AND** all user-facing fields are `configScope: db-overridable`; `__schemaVersion` is `configScope: db-only` (matching Jira pattern)

#### Scenario: GitLab connector config schema

- **WHEN** GitLab connector config schema is defined
- **THEN** schema includes `boost.connectors` fields only: `enabled` (boolean), `endpoint` (URL string), `schedule.intervalMs` (number), `batchSize` (number), `__schemaVersion` (number, internal metadata)
- **AND** all user-facing fields are `configScope: db-overridable`; `__schemaVersion` is `configScope: db-only` (matching Jira pattern)

### Requirement: RuntimeConfigResolver Integration

`RuntimeConfigResolver` uses connector Zod schemas for two-layer config resolution.

#### Scenario: Two-layer resolution with schema validation

- **WHEN** `RuntimeConfigResolver.resolve('boost.connectors.jira.enabled')` is called
- **THEN** resolver reads YAML baseline value from `ConfigApi` at key path `boost.connectors.jira.enabled`
- **AND** resolver reads any DB override from `AdminConfigService` for leaf key `boost.connectors.jira.enabled`
- **AND** resolver returns the DB override value if present, otherwise the YAML baseline value, validated against the leaf field's Zod type (per-leaf validation on resolve/write — not the full connector schema)
- **AND** connector-level aggregate validation (cross-field consistency checks) is applied only on `GET`-prefix queries that return all leaf overrides for a connector, not on individual leaf resolve
- **AND** resolved value is cached with 30s TTL

#### Scenario: DB override takes precedence over YAML

- **WHEN** YAML config has `enabled: true` and DB override has `enabled: false`
- **THEN** `RuntimeConfigResolver.resolve('boost.connectors.jira.enabled')` returns `false`

#### Scenario: Deployment-time field rejects DB override

- **WHEN** admin attempts to write DB override for a deployment-time field (e.g., `boost.connectors.jira.credentials.secretRef`)
- **THEN** the write is rejected because `credentials.*`, `tls.*`, and `namespace` are `ai-catalog.providers` fields not present in the `boost.connectors` Zod schema
- **AND** admin receives error: "Unknown config key: credentials.secretRef is not a valid boost.connectors field"

### Requirement: Validation Rejection

Schema validation rejects invalid connector config values before write.

#### Scenario: Invalid endpoint URL rejected

- **WHEN** admin attempts to write DB override with `endpoint: "not-a-url"`
- **THEN** Zod schema validation rejects the write
- **AND** admin receives error: "Invalid URL format for endpoint"

#### Scenario: Negative schedule interval rejected

- **WHEN** admin attempts to write DB override with `schedule.intervalMs: -1000`
- **THEN** Zod schema validation rejects the write
- **AND** admin receives error: "schedule.intervalMs must be a positive number"

#### Scenario: Invalid cron expression rejected

- **WHEN** admin attempts to write DB override with `schedule.cron: "not-a-cron"`
- **THEN** Zod schema validation rejects the write (via cron parser)
- **AND** admin receives error: "Invalid cron expression"

### Requirement: Schema Versioning

Connector config schemas support versioning for backward compatibility.

#### Scenario: Schema version stored with connector-level DB overrides

- **WHEN** admin writes DB override for a leaf key under `boost.connectors.jira` (e.g., `boost.connectors.jira.enabled`)
- **THEN** the DB entry stores the leaf key and value (each write targets a single `BoostConfigKey`); concurrent writes to different leaves under the same connector do not conflict
- **AND** the connector-level schema version is stored as an explicit leaf key `boost.connectors.jira.__schemaVersion` (e.g., value `1`), bumped only during schema migrations — not on individual config writes. `__schemaVersion` is a metadata key excluded from per-leaf Zod validation; it must be registered in `boostConfigFields` with `configScope: 'db-only'` to survive the `validateStoredValues()` startup sweep
- **AND** `GET /api/boost/admin/config?key=boost.connectors.jira` returns all leaf overrides matching that prefix, merged into a single object for the response
- **AND** Zod schema validation is applied at the connector level (aggregating all leaf values) on GET-prefix queries to ensure cross-field consistency

#### Scenario: Schema migration on version mismatch

- **WHEN** stored `boost.connectors.<id>.__schemaVersion` is `1` and `BOOST_CONNECTOR_SCHEMA_VERSION` is `2`
- **THEN** `RuntimeConfigResolver.migrateConnectorSchemas()` applies the migration registered under source version `1`
- **AND** migrated config validates against the current schema
- **AND** the stored `__schemaVersion` is stamped to `2` after the successful step

#### Scenario: Future field rename or removal

- **WHEN** a connector field is renamed, removed, or its value type changes
- **THEN** `BOOST_CONNECTOR_SCHEMA_VERSION` is incremented
- **AND** a migration function is registered on `ConnectorMigrationRegistry` keyed by the **source** version (key `1` upgrades v1 → v2)
- **AND** `RuntimeConfigResolver.migrateConnectorSchemas()` runs on plugin startup after `validateStoredValues()`
- **AND** a missing `__schemaVersion` is treated as v1 and written explicitly before intermediate migrations run
- **AND** each successful migration step stamps the next version so a later failure can resume
- **AND** migration functions must be idempotent (a function that throws after partial leaf writes will re-run)

### Requirement: Default Values

Optional connector fields may declare a read-time default on
`ConfigFieldMeta.defaultValue`. Defaults are **not** Zod `.default()` —
`validateConfigValue(key, undefined)` must preserve "unset", and
`RuntimeConfigResolver` applies the fallback after the YAML+DB merge
(DB override → YAML baseline → field default → undefined).

#### Scenario: Default schedule interval

- **WHEN** connector config omits `schedule.intervalMs`
- **THEN** `RuntimeConfigResolver.resolve()` returns `ConfigFieldMeta.defaultValue` (e.g., `300000` ms = 5 minutes)

#### Scenario: Default batch size

- **WHEN** connector config omits `batchSize`
- **THEN** `RuntimeConfigResolver.resolve()` returns `ConfigFieldMeta.defaultValue` (e.g., `100`)

### Requirement: Override Removal

DB overrides can be removed to revert to the YAML baseline value.

#### Scenario: Remove override via DELETE endpoint

- **WHEN** admin calls `DELETE /api/boost/admin/config?key=boost.connectors.jira.schedule.intervalMs`
- **THEN** `AdminConfigService.removeOverride('boost.connectors.jira.schedule.intervalMs')` deletes the DB row
- **AND** `RuntimeConfigResolver.invalidate()` is called
- **AND** next `resolve('boost.connectors.jira.schedule.intervalMs')` returns the YAML baseline value (or `ConfigFieldMeta.defaultValue` if no YAML value)

#### Scenario: Schedule type precedence when both overrides exist

- **WHEN** DB overrides exist for both `boost.connectors.jira.schedule.intervalMs` and `boost.connectors.jira.schedule.cron`
- **THEN** `schedule.cron` takes precedence — provider uses cron-based scheduling
- **AND** provider logs warning: "Both schedule.intervalMs and schedule.cron are set; using cron"

## ADDED Requirements

### Requirement: Specification Coverage

This capability area MUST have its existing behavior documented as baseline acceptance criteria.

#### Scenario: Baseline validation

- **WHEN** the existing implementation is validated against this specification
- **THEN** all scenarios described in the EXISTING Requirements section MUST pass
