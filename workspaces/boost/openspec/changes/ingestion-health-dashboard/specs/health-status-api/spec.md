# Health Status API

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

REST API exposing per-connector health status and force-sync capabilities. Data model tracks sync attempts with timestamps and outcomes. API is RBAC-gated via `ai-catalog.admin` permission.

## ADDED Requirements

### Requirement: Health Status API Returns Per-Connector Health

The API exposes connector health state for admin dashboard consumption.

#### Scenario: API returns per-connector health objects

- **WHEN** `GET /api/boost/ingestion-health` is called with valid `ai-catalog.admin` credentials
- **THEN** the response is a JSON array of connector health objects
- **AND** each object contains: `connectorId`, `connectorType`, `enabled`, `status` (healthy/degraded/failing/unknown), `lastSyncAttempt` (ISO timestamp), `lastSuccessfulSync` (ISO timestamp or null), `errorSummary` (object or null), `metrics` (object with assetsAdded/Updated/Removed counts)
- **AND** `status` reflects health derivation only — `disabled` is not a status value; disabled connectors are identified by `enabled: false`
- **AND** disabled connectors (`enabled: false`) are excluded from the response unless `?includeDisabled=true` query parameter is set; when included, their `status` is derived normally from sync history (or `unknown` if never synced)

#### Scenario: Health status derivation logic

- **WHEN** a connector has 1+ sync attempts in the database
- **THEN** the API derives status from the last 3 attempts (or fewer if less than 3 exist):
  - **Healthy** if all attempts succeeded
  - **Degraded** if results are mixed (not all-success and not all-failure)
  - **Failing** if all attempts failed
  - **Unknown** if zero sync attempts exist (new connector, never synced)
- **AND** the same derivation rules apply regardless of whether 1, 2, or 3 attempts are available

#### Scenario: Empty state for zero connectors

- **WHEN** `GET /api/boost/ingestion-health` is called and no connectors are configured
- **THEN** the response is an empty JSON array `[]`
- **AND** the HTTP status is 200 OK

### Requirement: Data Model Tracks Sync Attempts

Each connector sync attempt is recorded in the database.

#### Scenario: Sync attempt recorded in database

- **WHEN** a connector completes a sync attempt (success or failure)
- **THEN** a record is inserted into the `boost_sync_attempts` table with: `connector_id`, `timestamp`, `outcome` (success/failure), `error_type`, `error_message`, `assets_added`, `assets_updated`, `assets_removed`, `duration_ms`
- **AND** the record is queryable via health API within 1 second

#### Scenario: Retention policy enforced

- **WHEN** a connector has more than 100 sync attempts in the database
- **THEN** the oldest attempts beyond the retention limit are deleted via scheduled cleanup job
- **AND** the retention limit is configurable via `boost.ingestion.healthRetention.maxAttemptsPerConnector` (default 100)

#### Scenario: Sync metrics calculation

- **WHEN** a connector sync succeeds
- **THEN** `assets_added`, `assets_updated`, `assets_removed` counts are populated based on connector provider's diff logic
- **AND** if the provider doesn't report metrics, all three fields default to 0

### Requirement: RBAC Gating via `ai-catalog.admin` Permission

Access to the health API is restricted to users with `ai-catalog.admin` permission.

#### Scenario: Unauthorized user receives 403

- **WHEN** `GET /api/boost/ingestion-health` is called without `ai-catalog.admin` permission
- **THEN** the response is HTTP 403 Forbidden with error message `"Insufficient permissions to view ingestion health"`
- **AND** the request is logged in the audit log (per RHDHPLAN-1508 RHIDP-15277 audit logging pattern)

#### Scenario: Admin user receives health data

- **WHEN** `GET /api/boost/ingestion-health` is called with valid `ai-catalog.admin` credentials
- **THEN** the response is HTTP 200 OK with connector health array
- **AND** the request is logged in the audit log with user identity and timestamp

### Requirement: Force Sync API Endpoint

Admins can manually trigger connector sync outside scheduled cadence.

#### Scenario: Force Sync triggers connector run

- **WHEN** `POST /api/boost/ingestion-health/:connectorId/force-sync` is called with valid `ai-catalog.admin` credentials
- **THEN** the connector provider's `run()` method is invoked immediately
- **AND** the response includes a `runId` for polling status
- **AND** the sync attempt is recorded in the `boost_sync_attempts` table upon completion

#### Scenario: Force Sync timeout handling

- **WHEN** `POST /api/boost/ingestion-health/:connectorId/force-sync` is called and the sync exceeds the timeout limit
- **THEN** the response is HTTP 504 Gateway Timeout with error message `"Sync operation exceeded timeout of 10 minutes"`
- **AND** the timeout limit is configurable via `boost.ingestion.forceSyncTimeout` (default 10 minutes)
- **AND** the connector run continues in the background (not killed)

#### Scenario: Concurrent Force Sync prevention

- **WHEN** `POST /api/boost/ingestion-health/:connectorId/force-sync` is called while the connector is already running
- **THEN** the response is HTTP 409 Conflict with error message `"Connector is already running (runId: abc123)"`
- **AND** the response includes the existing `runId` for polling

#### Scenario: Force Sync status polling

- **WHEN** `GET /api/boost/ingestion-health/:connectorId/force-sync/:runId` is called
- **THEN** the response includes: `runId`, `status` (running/success/failure), `startTime`, `endTime` (null if running), `errorSummary` (null if success or running)
- **AND** if the run is complete, the response includes sync metrics (assetsAdded/Updated/Removed)

### Requirement: Neo4j Graph Sync Status API

Neo4j Knowledge Graph Sync Adapter health exposed via dedicated endpoint.

#### Scenario: Neo4j sync status retrieved

- **WHEN** `GET /api/boost/ingestion-health/neo4j` is called with valid `ai-catalog.admin` credentials
- **THEN** the response includes: `lastSyncTimestamp`, `outcome` (success/failure), `nodeCount`, `relationshipCount`, `errorSummary` (null if success)
- **AND** counts represent the current state of the Neo4j graph (not delta)

#### Scenario: Force Neo4j Re-sync

- **WHEN** `POST /api/boost/ingestion-health/neo4j/force-sync` is called with `mode` parameter (`full` or `incremental`)
- **THEN** the Neo4j sync adapter is triggered with the specified mode
- **AND** the response includes a `runId` for polling status
- **AND** full mode clears and rebuilds the entire graph, incremental mode syncs only catalog changes since last sync

### Requirement: Error Summary Structure

Error summaries provide actionable diagnostic context.

#### Scenario: Error summary includes classification

- **WHEN** a connector sync fails and the error is classified
- **THEN** the `errorSummary` object includes: `errorType` (auth/network/schema/rate-limit/unknown), `errorMessage` (raw error), `diagnosticGuidance` (actionable next steps)
- **AND** `diagnosticGuidance` is a human-readable string (e.g., "Check service account credentials in connector config")

#### Scenario: Unknown error fallback

- **WHEN** a connector sync fails and the error cannot be classified
- **THEN** the `errorSummary.errorType` is `"unknown"`
- **AND** `errorSummary.diagnosticGuidance` is `"Check connector logs for detailed error trace"`
- **AND** `errorSummary.errorMessage` contains the raw error string
