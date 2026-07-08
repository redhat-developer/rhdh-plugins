# Proposal: Ingestion Audit Logging and Metrics

## Why

Compliance requires an audit trail of ingestion operations. Every sync attempt, every config change, and every quality score must be recorded with timestamps, actors, and outcomes. The Analytics tab needs historical sync data, quality distributions, and match coverage metrics to give admins visibility into the AI system's health and evolution.

Eval Hub integration closes the quality feedback loop — scores from LightEval, IBM Clear, and GuideLLM flow into the analytics API and surface in the admin UI. Without this loop, quality is invisible; with it, teams can track quality degradation over time and debug skill performance regressions.

Boost builds this as RHDH-native audit logging and RBAC-gated REST endpoints from the start. Audit events follow the same structured JSON format and log channel established by RHIDP-15277 (RBAC audit logging) — ingestion events extend the existing pattern. Analytics metrics serve the Admin Panel's Analytics tab (RHDHPLAN-1509) and expose data for external observability platforms.

## What Boost Builds

### Sync Audit Events

- Structured audit events for every sync attempt: `ingestion.sync.start`, `ingestion.sync.success`, `ingestion.sync.failure`
- Event payload includes: connector name, timestamp, outcome, assets added/updated/removed counts, error details
- Config change events: `ingestion.config.change` with actor, timestamp, before/after values
- Events flow into the same RHDH audit log channel as RBAC audit events (RHIDP-15277)
- Disconnected cluster support: events persist to local audit log when central RHDH is unreachable

### Analytics REST API

- `/api/boost/admin/analytics/sync-history` — per-connector timeline of sync attempts with outcomes
- `/api/boost/admin/analytics/quality-scores` — per-skill quality scores and aggregate distribution
- `/api/boost/admin/analytics/match-coverage` — agent capabilities vs. available skills coverage ratio
- Neo4j sync status embedded in analytics responses
- All endpoints RBAC-gated with `ai-catalog.admin` permission
- Pagination for large result sets, date range filtering

### Eval Hub Integration

- Configurable Eval Hub endpoint: `boost.evalHub.endpoint` in app-config
- Quality score ingestion from eval pipeline (LightEval, IBM Clear, GuideLLM as orchestration backends)
- Per-skill quality score storage in DB table: `skill_entity_ref`, `eval_source`, `score`, `timestamp`
- Aggregate quality distribution computed on-demand when analytics API is called
- Graceful handling when Eval Hub unavailable: fall back to manual score import or skip
- Asynchronous score refresh cycle — no real-time scoring

### Key Design Principles

- **Shared audit infrastructure** — extend RHIDP-15277 pattern, same structured JSON format, same audit log channel
- **RBAC-gated analytics** — all endpoints require `ai-catalog.admin` permission
- **Pluggable eval backends** — generic quality score ingestion interface, not hardcoded to specific eval frameworks
- **On-demand computation** — match coverage calculated when API is called, not continuously
- **Asynchronous ingestion** — Eval Hub scores arrive in batches, stored in DB, surfaced via analytics API

## Impact

- `plugins/boost-backend/src/audit/` — audit event infrastructure, event types, RHDH audit log integration
- `plugins/boost-backend/src/ingestion/` — sync audit event emission in connector lifecycle hooks
- `plugins/boost-backend/src/api/admin/analytics/` — REST API routes for sync history, quality scores, match coverage
- `plugins/boost-backend/src/db/` — quality score storage table, schema migrations
- `plugins/boost-backend/src/eval-hub/` — Eval Hub client, quality score ingestion service
- `plugins/boost-backend/src/analytics/` — match coverage calculator, aggregate distribution calculator
- `plugins/boost-common/src/permissions.ts` — `ai-catalog.admin` permission definition (if not already defined)
- `app-config.yaml` — `boost.evalHub.endpoint` configuration
