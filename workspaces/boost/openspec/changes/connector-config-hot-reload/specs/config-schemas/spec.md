# Config Schemas

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

Zod schemas define per-connector configuration fields with `configScope` annotations. `RuntimeConfigResolver` integrates schemas for two-layer resolution (YAML baseline + DB overrides). Schema validation rejects invalid values before write.

## EXISTING Requirements

### Requirement: Zod Schema Definition Per Connector

Each connector has a Zod schema defining all configuration fields with `configScope` annotations.

#### Scenario: Jira connector config schema

- **WHEN** Jira connector config schema is defined
- **THEN** schema includes fields: `enabled` (boolean), `endpoint` (URL string), `schedule.intervalMs` (number), `schedule.cron` (string), `tls.caFile` (string), `credentials.secretRef` (string), `credentials.secretKey` (string), `namespace` (string), `batchSize` (number), `timeout.connectionMs` (number)
- **AND** each field is annotated with `configScope`: `enabled` is `db-overridable`, `endpoint` is `db-overridable`, `schedule.intervalMs` is `db-overridable`, `schedule.cron` is `db-overridable`, `tls.caFile` is `yaml-only`, `credentials.secretRef` is `yaml-only`, `credentials.secretKey` is `yaml-only`, `namespace` is `yaml-only`, `batchSize` is `db-overridable`, `timeout.connectionMs` is `db-overridable`

#### Scenario: GitHub connector config schema

- **WHEN** GitHub connector config schema is defined
- **THEN** schema includes fields: `enabled` (boolean), `endpoint` (URL string), `schedule.intervalMs` (number), `credentials.secretRef` (string), `credentials.secretKey` (string), `namespace` (string), `batchSize` (number)
- **AND** `configScope` annotations match Jira pattern: `enabled`, `endpoint`, `schedule.intervalMs`, `batchSize` are `db-overridable`; `credentials.*`, `namespace` are `yaml-only`

#### Scenario: GitLab connector config schema

- **WHEN** GitLab connector config schema is defined
- **THEN** schema includes fields: `enabled` (boolean), `endpoint` (URL string), `schedule.intervalMs` (number), `credentials.secretRef` (string), `credentials.secretKey` (string), `namespace` (string), `batchSize` (number)
- **AND** `configScope` annotations match Jira pattern

### Requirement: RuntimeConfigResolver Integration

`RuntimeConfigResolver` uses connector Zod schemas for two-layer config resolution.

#### Scenario: Two-layer resolution with schema validation

- **WHEN** `RuntimeConfigResolver.resolve('boost.connectors.jira.enabled')` is called
- **THEN** resolver reads YAML baseline value from `ConfigApi` at key path `boost.connectors.jira.enabled`
- **AND** resolver reads any DB override from `AdminConfigService` for leaf key `boost.connectors.jira.enabled`
- **AND** resolver returns the DB override value if present, otherwise the YAML baseline value, validated against the Jira connector Zod schema
- **AND** resolved value is cached with 30s TTL

#### Scenario: DB override takes precedence over YAML

- **WHEN** YAML config has `enabled: true` and DB override has `enabled: false`
- **THEN** `RuntimeConfigResolver.resolve('boost.connectors.jira.enabled')` returns `false`

#### Scenario: YAML-only field rejects DB override

- **WHEN** admin attempts to write DB override for `credentials.secretRef`
- **THEN** schema validation rejects the write because `credentials.secretRef` has `configScope: yaml-only`
- **AND** admin receives error: "Field credentials.secretRef is yaml-only and cannot be overridden at runtime"

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

#### Scenario: Schema version stored with DB override

- **WHEN** admin writes DB override for `boost.connectors.jira`
- **THEN** DB entry includes schema version (e.g., `schemaVersion: 1`)
- **AND** future reads validate against matching schema version

#### Scenario: Schema migration on version mismatch

- **WHEN** DB override has `schemaVersion: 1` and current schema is `schemaVersion: 2`
- **THEN** `RuntimeConfigResolver` applies migration logic to upgrade old config
- **AND** migrated config validates against current schema

### Requirement: Default Values

Connector config schemas define default values for optional fields.

#### Scenario: Default schedule interval

- **WHEN** connector config omits `schedule.intervalMs`
- **THEN** schema provides default value (e.g., `300000` ms = 5 minutes)

#### Scenario: Default batch size

- **WHEN** connector config omits `batchSize`
- **THEN** schema provides default value (e.g., `100`)

## ADDED Requirements

### Requirement: Specification Coverage

This capability area MUST have its existing behavior documented as baseline acceptance criteria.

#### Scenario: Baseline validation

- **WHEN** the existing implementation is validated against this specification
- **THEN** all scenarios described in the EXISTING Requirements section MUST pass
