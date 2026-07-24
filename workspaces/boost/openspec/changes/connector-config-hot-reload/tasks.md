# Tasks: Connector Configuration Hot-Reload

## 1. Zod Schema Definitions (P0) — RHIDP-15340

- [ ] 1.1 Define Jira connector config Zod schema with `boost.connectors` fields only: `enabled` (boolean), `endpoint` (URL), `schedule.intervalMs` (number), `schedule.cron` (string), `batchSize` (number), `timeout.connectionMs` (number). Note: `tls.caFile`, `credentials.*`, and `namespace` are `catalog.providers` fields — not part of the `boost.connectors` schema.
- [ ] 1.2 All `boost.connectors` fields are `configScope: db-overridable` (deployment-time fields like `credentials.*`, `tls.*`, and `namespace` live under `catalog.providers.<id>.*`)
- [ ] 1.3 Define GitHub connector config Zod schema with connector-appropriate field subset (`enabled`, `endpoint`, `schedule.intervalMs`, `batchSize`)
- [ ] 1.4 Define GitLab connector config Zod schema with connector-appropriate field subset (`enabled`, `endpoint`, `schedule.intervalMs`, `batchSize`)
- [ ] 1.5 Add URL validation for `endpoint` field (must be valid https:// URL)
- [ ] 1.6 Add positive number validation for `schedule.intervalMs`, `batchSize`, `timeout.connectionMs`
- [ ] 1.7 Add cron expression validation for `schedule.cron` (via cron parser library)
- [ ] 1.8 Define default values in schemas: `schedule.intervalMs: 300000` (5 min), `batchSize: 100`, `timeout.connectionMs: 30000`
- [ ] 1.9 Add schema versioning field: `schemaVersion: 1` in each schema
- [ ] 1.10 Add unit tests for schema validation (valid configs pass, invalid configs rejected with correct error messages)

## 2. RuntimeConfigResolver Extension (P0) — RHIDP-15340

- [ ] 2.1 Extend `RuntimeConfigResolver` to support connector config scope (e.g., `boost.connectors.jira`, `boost.connectors.github`)
- [ ] 2.2 Extend `resolve(key: BoostConfigKey)` method to support connector leaf config keys (e.g., `boost.connectors.jira.enabled`)
- [ ] 2.3 Implement two-layer merge: YAML baseline from `ConfigApi` + DB overrides from `AdminConfigService`
- [ ] 2.4 Implement cache with 30s TTL for merged connector config
- [ ] 2.5 Implement immediate cache invalidation on DB override write
- [ ] 2.6 Add Zod schema validation during merge (reject invalid values before caching)
- [ ] 2.7 Implement `configScope` enforcement: reject DB override writes for `yaml-only` fields
- [ ] 2.8 Add schema version migration logic for backward compatibility
- [ ] 2.9 Add unit tests for two-layer merge (YAML + DB override precedence, cache TTL, invalidation)
- [ ] 2.10 Add integration tests for `RuntimeConfigResolver` with connector schemas

## 3. Hot-Reload Propagation (P0) — RHIDP-15341

- [ ] 3.1 Update Jira entity provider to read config via `RuntimeConfigResolver.resolve('boost.connectors.jira.enabled')` (and other leaf keys) at reconciliation cycle start
- [ ] 3.2 Implement enable/disable check: skip sync if `enabled: false`
- [ ] 3.3 Implement endpoint URL propagation: use DB override endpoint if present, else YAML baseline
- [ ] 3.4 Implement schedule change propagation: reschedule task with new `schedule.intervalMs` or `schedule.cron` from merged config
- [ ] 3.5 Update GitHub entity provider with same hot-reload pattern
- [ ] 3.6 Update GitLab entity provider with same hot-reload pattern
- [ ] 3.7 Add config change logging: log old → new values when config changes detected
- [ ] 3.8 Implement credential re-read: provider reads mounted Secret file at each reconciliation cycle start
- [ ] 3.9 Add integration tests: disable connector via DB override, verify next cycle skips sync
- [ ] 3.10 Add integration tests: change endpoint via DB override, verify next cycle uses new endpoint
- [ ] 3.11 Add integration tests: change schedule via DB override, verify task rescheduled
- [ ] 3.12 Document propagation latency: 30s TTL + reconciliation interval (e.g., 5m30s for 5m interval)

## 4. Config Admin UI (P1) — RHIDP-15342

- [ ] 4.1 Create connector config section in admin panel (`/admin/connectors`)
- [ ] 4.2 Implement connector list view with toggle switches for `enabled` state
- [ ] 4.3 Implement connector detail view with form fields: `endpoint` (URL input), `schedule.intervalMs` (duration picker), `schedule.cron` (cron builder)
- [ ] 4.4 Display K8s Secret references as read-only fields with tooltip: "Deployment-time config. Edit YAML to change."
- [ ] 4.5 Implement client-side validation: URL format for `endpoint`, positive numbers for `schedule.intervalMs`, cron syntax for `schedule.cron`
- [ ] 4.6 Implement save handler: call `POST /api/boost/admin/config` with connector key and updated fields
- [ ] 4.7 Implement success notification: "Saved — will take effect within 30 seconds + next reconciliation cycle"
- [ ] 4.8 Implement validation error feedback: display server-side Zod validation errors inline
- [ ] 4.9 Implement RBAC gating: require `ai-catalog.admin` permission to access connector config section (via `permissions.authorize()`)
- [ ] 4.10 Implement read-only view for non-admin users (if configured)
- [ ] 4.11 Implement config change history view: display last 10 changes from audit log (timestamp, fields, old/new values, user)
- [ ] 4.12 Add UI tests: toggle connector, verify POST request with correct payload
- [ ] 4.13 Add UI tests: change endpoint, verify validation and save flow

## 5. Credential Rotation Testing (P1) — RHIDP-15341

- [ ] 5.1 Add integration test: update K8s Secret content, wait for kubelet sync (≤60s), verify provider uses new credentials on next cycle
- [ ] 5.2 Document credential rotation latency: kubelet delay (≤60s) + reconciliation interval = ~6 minutes worst case
- [ ] 5.3 Add manual test procedure: emergency credential rotation with pod restart (for sub-60s latency)

## 6. AdminConfigService Integration (P1)

- [ ] 6.1 Extend existing `POST /api/boost/admin/config` endpoint to accept connector config keys (e.g., `{ key: "boost.connectors.jira.enabled", value: false }`). Add `GET /api/boost/admin/config?key=boost.connectors.<connectorId>` for reading merged connector config.
- [ ] 6.2 Implement Zod schema validation in `setOverride()` method before DB write
- [ ] 6.3 Implement `configScope` enforcement: reject writes for `yaml-only` fields
- [ ] 6.4 Implement cache invalidation call to `RuntimeConfigResolver.invalidate()` after DB write
- [ ] 6.5 Add audit logging for connector config changes (timestamp, user, changed fields, old/new values)
- [ ] 6.6 Add unit tests for `AdminConfigService` connector config methods

## 7. Testing (P1)

- [ ] 7.1 Add unit tests for all Zod schemas (valid configs pass, invalid configs rejected)
- [ ] 7.2 Add unit tests for `RuntimeConfigResolver` connector config methods (merge, cache, invalidation)
- [ ] 7.3 Add integration tests for hot-reload propagation (enable/disable, endpoint change, schedule change)
- [ ] 7.4 Add integration tests for credential rotation (K8s Secret update, provider re-read)
- [ ] 7.5 Add UI tests for admin panel (toggle, form validation, save flow)
- [ ] 7.6 Add E2E test: admin disables connector via UI, verify next sync cycle skips ingestion
- [ ] 7.7 Add E2E test: admin changes endpoint via UI, verify next sync uses new endpoint

## 8. Documentation (P2)

- [ ] 8.1 Document `RuntimeConfigResolver` extension for connector config in architecture docs
- [ ] 8.2 Document `configScope` annotations and their meaning (`yaml-only`, `db-overridable`). Note: runtime operational state lives in the health store (`boost_sync_attempts` table), not the config resolver.
- [ ] 8.3 Document connector config admin UI usage (how to toggle, change endpoint/schedule)
- [ ] 8.4 Document propagation latency: 30s TTL + reconciliation interval
- [ ] 8.5 Document credential rotation workflow and latency (≤60s kubelet + reconciliation interval)
- [ ] 8.6 Add troubleshooting guide: "Config change not taking effect?" → check cache TTL, reconciliation schedule
- [ ] 8.7 Document RBAC permissions required for connector config access (`ai-catalog.admin`)

## 9. Schema Migration (P2)

- [ ] 9.1 Implement schema version migration logic in `RuntimeConfigResolver` (upgrade old config to current schema)
- [ ] 9.2 Add unit tests for schema migration (v1 → v2 config upgrade)
- [ ] 9.3 Document schema versioning and migration process for future connector config changes
