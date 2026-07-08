# Design: Ingestion Health Admin Dashboard

## Context

Boost implements the ingestion health dashboard as a standard admin panel section following the existing patterns established in the augment workspace's admin panel (model connection, system prompt, agent config sections). The augment reference prototype has no equivalent feature — this is net-new functionality for Boost. The design follows RHDH Extensions Catalog patterns for admin tooling: backend exposes REST API, frontend renders via PatternFly components, RBAC enforced at API layer.

## Goals

- Per-connector health visibility without log diving
- Actionable error classification with diagnostic guidance
- Distinguish intentionally disabled connectors from unexpectedly failing ones in air-gapped clusters
- Force Sync capability for manual intervention
- Neo4j graph sync operational monitoring as distinct section
- Integrate seamlessly into existing augment admin panel navigation

## Non-Goals

- Real-time streaming ingestion (covered in RHDHPLAN-1514 Real-Time Ingestion future work)
- Implementing the connectors themselves (RHDHPLAN-1510/1511/1512)
- Defining RBAC policy model (RHDHPLAN-1508 RHIDP-15277)
- Auto-remediation of connector failures (admins manually force sync or fix root cause)
- Alerting/notification system for connector failures (future work)

## Decisions

### Decision 1: Health data model — sync attempts stored in database

The health data model tracks sync attempts in a dedicated database table with schema:

```sql
CREATE TABLE sync_attempts (
  id SERIAL PRIMARY KEY,
  connector_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  outcome TEXT NOT NULL CHECK (outcome IN ('success', 'failure')),
  error_type TEXT,  -- null for success
  error_message TEXT,  -- null for success
  assets_added INTEGER NOT NULL DEFAULT 0,
  assets_updated INTEGER NOT NULL DEFAULT 0,
  assets_removed INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL,
  INDEX (connector_id, timestamp DESC)
);
```

Health status is derived from the last N sync attempts (default N=3):

- **Healthy**: Last 3 sync attempts succeeded
- **Degraded**: Last sync attempt succeeded but 1+ failures in last 3 attempts
- **Failing**: Last 3 sync attempts failed

**Why:** Storing sync attempts provides historical context for health trends. Derivation logic (last N attempts) balances recency with resilience against transient failures. Separate table avoids coupling health storage to connector config schema.

**How to apply:** Each connector provider's `run()` method reports sync outcomes to `HealthTracker.recordSyncAttempt()`. API queries the table for per-connector latest attempts and derives status. Retention policy: keep last 100 sync attempts per connector (configurable via `boost.ingestion.healthRetention.maxAttemptsPerConnector`).

### Decision 2: Force Sync implementation — backend API endpoint triggers provider run()

The Force Sync feature is implemented as `POST /api/boost/ingestion-health/:connectorId/force-sync` that triggers the connector provider's `run()` method outside the scheduled cadence.

Implementation leverages `SchedulerService.triggerTask(taskId)` if available (for connectors registered as scheduled tasks). Falls back to direct `provider.run()` invocation if `SchedulerService` isn't integrated.

Timeout is configurable (default 10 minutes) via `boost.ingestion.forceSyncTimeout`. Concurrent Force Sync prevention: endpoint returns 409 Conflict if connector is already running.

**Why:** Force Sync is a manual override for cases where scheduled sync failed or admin needs immediate refresh (e.g., after fixing auth credentials). Timeout prevents hung requests. Concurrency prevention avoids duplicate work and state corruption.

**How to apply:** API handler checks connector run state (via in-memory run registry or `SchedulerService.getTaskStatus()`), returns 409 if running. Otherwise calls `SchedulerService.triggerTask()` or `provider.run()` with timeout wrapper. Response includes `runId` for polling status. UI polls `GET /api/boost/ingestion-health/:connectorId/force-sync/:runId` for completion.

### Decision 3: Admin UI in existing boost admin panel — new route/tab

The ingestion health UI is a new section in the augment workspace's existing admin panel at route `/admin/ingestion-health`. Follows the pattern established by `/admin/model-connection`, `/admin/system-prompt`, `/admin/agent-config`.

Navigation: Adds "Ingestion Health" item to admin panel sidebar (`AdminLayout.tsx`). Content: `IngestionHealthPanel.tsx` renders per-connector health cards using PatternFly `Card`, `CardHeader`, `CardBody` with status badges (`Label` component with green/yellow/red variants).

Each card shows:

- Connector name and type (GitHub, GitLab, Jira)
- Status badge (Healthy/Degraded/Failing/Disabled)
- Last sync attempt timestamp (relative time via `react-time-ago`)
- Last successful sync timestamp (or "Never" if no success)
- Error summary (if failing/degraded) with classification badge
- "Force Sync" button (disabled if already running)

**Why:** Reusing existing admin panel reduces navigation complexity and follows established RHDH admin tooling patterns. PatternFly ensures consistency with RHDH design system.

**How to apply:** Add route to `AdminLayout.tsx` routes array. `IngestionHealthPanel.tsx` fetches data from `GET /api/boost/ingestion-health` (returns array of connector health objects). Uses `useSWR` for polling (30s interval). Cards rendered in responsive grid layout (PatternFly `Gallery` component).

### Decision 4: Disconnected-cluster UX — three-state model

The health UI distinguishes between three connector states:

1. **Enabled + Healthy**: Green status badge, no error indicators, shows sync timestamps
2. **Enabled + Failing**: Red status badge, error summary, diagnostic guidance, "Force Sync" action
3. **Disabled**: Grey/muted status badge, no error indicators, shows "Disabled" label, no "Force Sync" action

Disabled state is set via connector config (`enabled: false`). Health status derivation skips disabled connectors entirely — they don't generate health records or consume health API response space.

**Why:** Air-gapped deployments intentionally disable upstream connectors (GitHub, GitLab) but enable internal ones (Jira). Showing disabled connectors as "failing" generates false alarms. Muted treatment signals "expected state, no action needed."

**How to apply:** Backend API filters disabled connectors before health status derivation. Frontend renders disabled connectors with `variant="outline"` PatternFly Label (grey), no error message, no "Force Sync" button. Admin can toggle `enabled` flag via connector config UI (separate feature, not in this change).

### Decision 5: Neo4j panel as separate section — distinct from per-connector catalog sync

The Neo4j graph sync status panel is a separate section within the Ingestion Health page, below per-connector cards. Renders as single card with distinct visual treatment (different header icon, "Knowledge Graph Sync" title).

Shows:

- Last sync timestamp (relative time)
- Sync outcome (success/failure)
- Node count (total nodes in graph)
- Relationship count (total relationships in graph)
- "Force Neo4j Re-sync" button with full/incremental toggle

**Why:** Neo4j is a derived index, not a catalog entity source. It syncs from the catalog database, not external APIs. Treating it as a separate section prevents confusion with upstream connectors. Node/relationship counts are unique data points specific to graph storage.

**How to apply:** `IngestionHealthPanel.tsx` renders Neo4j panel below connector cards, separated by PatternFly `Divider`. Fetches Neo4j sync status from `GET /api/boost/ingestion-health/neo4j`. "Force Neo4j Re-sync" calls `POST /api/boost/ingestion-health/neo4j/force-sync` with `mode` parameter (`full` or `incremental`).

## Risks

- **Health derivation lag**: Health status is derived from last N sync attempts, which may be stale if sync cadence is slow (e.g., hourly). Mitigated by showing last sync timestamp and supporting Force Sync for immediate refresh.
- **Sync attempt table growth**: Unbounded growth if retention policy isn't enforced. Mitigated by retention policy (last 100 attempts per connector) and scheduled cleanup job.
- **Force Sync timeout edge cases**: If connector run exceeds timeout, the sync may still complete in background but API returns timeout error. Mitigated by documenting timeout behavior and surfacing partial success state (e.g., "Sync in progress, check back later").
