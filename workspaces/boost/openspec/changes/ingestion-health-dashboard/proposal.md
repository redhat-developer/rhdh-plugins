# Proposal: Ingestion Health Admin Dashboard

## Why

Admins need visibility into connector health without reading raw logs. When catalog connectors fail, administrators face:

- **Silent failures**: Connectors fail but no alerts fire — catalog goes stale, users see outdated data
- **Diagnostic friction**: Error messages in backend logs require SSH access, grep expertise, and correlation across connector instances
- **Air-gapped blind spots**: In disconnected clusters, connectivity failures are common and expected — but distinguishing "intentionally disabled" from "unexpectedly failing" requires manual inspection

Air-gapped deployments make connectivity failures common and hard to diagnose. Administrators need a health dashboard that distinguishes intentionally disabled connectors from unexpectedly failing ones, surfaces actionable error classifications, and provides manual force-sync capability when automated scheduling isn't sufficient.

## What Boost Builds

### Health Status API

- REST API exposing per-connector health: enabled state, last sync attempt/success timestamps, health status (healthy/degraded/failing), most recent error
- Data model tracks sync attempts with timestamps and outcomes (success/failure, assets added/updated/removed counts, error type, error message)
- Health status derivation: healthy = last 3 sync attempts succeeded, degraded = last sync succeeded but recent failures, failing = last 3 sync attempts failed
- RBAC-gated via boost admin permissions
- Force Sync API endpoint triggers provider's `run()` method outside scheduled cadence with configurable timeout

### Admin Health UI

- Admin dashboard section showing per-connector health cards with status indicators (PatternFly green/yellow/red), timestamps, error summaries, "Force Sync" buttons
- Built on PatternFly design system following existing admin panel patterns (model connection, system prompt, agent config sections)
- Loading states, error states, empty states for zero connectors
- Integrates into augment workspace's existing admin panel navigation

### Error Classification

- Connector failures classified into: auth/authorization failure, network/DNS/connectivity, schema/parsing mismatch, rate limiting
- Each classification includes diagnostic guidance (e.g., "Check service account credentials" for auth failures, "Verify DNS resolution" for network failures)
- Classification logic shared across all connectors via common error detection utilities
- Unknown errors fall back to generic classification with raw error message

### Neo4j Graph Sync Status Panel

- Operational monitoring for RHIDP-15295's Neo4j Knowledge Graph Sync Adapter: last sync timestamp, success/failure, node/relationship counts, "Force Neo4j Re-sync" action (full or incremental)
- Distinct from per-connector catalog sync panels because Neo4j is a derived index, not a catalog entity source
- Shows node/relationship counts as unique data points specific to graph storage

### Disconnected-Cluster Health View Differentiation

- Three-state model: enabled+healthy, enabled+failing, disabled
- Disabled connectors shown with grey/muted treatment (not error state)
- Enabled+failing connectors shown with red/alert indicators
- No "disabled" state generates alerts or error indicators — prevents false alarms in air-gapped environments

## Impact

- `plugins/boost-backend/src/api/ingestion-health.ts` — health status API routes
- `plugins/boost-backend/src/database/sync-attempts.ts` — sync attempts table schema and queries
- `plugins/boost-common/src/types/ingestion-health.ts` — health status types
- `plugins/boost-backend/src/ingestion/health-tracker.ts` — health status derivation logic
- `plugins/boost-backend/src/ingestion/error-classifier.ts` — error classification utilities
- `workspaces/augment/plugins/augment/src/components/AdminPanels/IngestionHealthPanel.tsx` — admin UI component
- `workspaces/augment/plugins/augment/src/components/AdminPanels/AdminLayout.tsx` — navigation integration
- Connector providers (`github-connector`, `gitlab-connector`, `jira-connector`) — integrate health tracking hooks
