# Design: Ingestion Audit Logging and Metrics

## Context

> **RHDHPLAN-1513 Consolidation (2026-07-08):** This entire change has been consolidated into RHIDP-15277 (AI Catalog RBAC Audit Logging, RHDHPLAN-1508). The audit event infrastructure, analytics REST API, and Eval Hub integration described here are now delivered under RHIDP-15277's expanded scope. Specifically: sync audit events → RHIDP-15280, analytics metrics API → RHIDP-15277 epic scope, Eval Hub integration → RHIDP-15277 epic scope.

Boost audit logging extends the pattern established by RHIDP-15277 (RBAC audit events). That epic defined the RHDH audit log integration, structured JSON event schema, and event emission infrastructure. This change applies the same pattern to ingestion operations.

Analytics REST API provides the data layer for the Admin Panel's Analytics tab (RHDHPLAN-1509). The tab consumes sync history, quality scores, and match coverage metrics via RBAC-gated endpoints.

Eval Hub is the quality feedback pipeline — external eval frameworks (LightEval, IBM Clear, GuideLLM) produce per-skill quality scores, which flow into Boost's analytics API. The API contract and availability of these eval backends are the main integration risk — not the Backstage framework.

## Goals

- Extend RBAC audit logging pattern (RHIDP-15277) to ingestion events from day one
- All ingestion sync attempts and config changes audited with structured events
- Analytics REST API RBAC-gated with `ai-catalog.admin` permission
- Quality score storage decoupled from eval framework specifics
- Graceful degradation when Eval Hub unavailable
- On-demand computation for expensive metrics (match coverage, aggregate distributions)

## Non-Goals

- Building the Analytics tab UI (covered in RHDHPLAN-1509)
- Implementing the Eval Hub pipeline or eval frameworks (Feature 8)
- Real-time metrics streaming or WebSocket push
- Prometheus/Grafana integration (may come later)
- Audit log retention policies (handled by RHDH platform)

## Decisions

### Decision 1: Shared audit event infrastructure with RHIDP-15277

Ingestion audit events follow the same structured JSON format, event schema, and log channel as RBAC audit events (RHIDP-15277).

**Why:** Consistent audit trail across all Boost operations. Admins read one audit log channel, not multiple. Event correlation is simple when all events share the same metadata structure.

**How to apply:**

Event types:

- `ingestion.sync.start` — sync attempt initiated
- `ingestion.sync.success` — sync completed successfully
- `ingestion.sync.failure` — sync failed with error details
- `ingestion.config.change` — connector configuration changed

Event payload schema (extends RBAC audit event base schema):

```typescript
interface IngestionAuditEvent {
  type:
    | 'ingestion.sync.start'
    | 'ingestion.sync.success'
    | 'ingestion.sync.failure'
    | 'ingestion.config.change';
  timestamp: string; // ISO 8601
  actor?: string; // user or service account identifier (for config changes)
  connector_name: string; // connector entity ref or name
  outcome?: 'success' | 'failure'; // for sync events
  assets?: {
    added: number;
    updated: number;
    removed: number;
  }; // for sync success events
  error?: {
    message: string;
    code?: string;
  }; // for sync failure events
  config_change?: {
    field: string;
    before: string;
    after: string;
  }; // for config change events
  metadata: Record<string, unknown>; // extensible for connector-specific data
}
```

Audit log channel: RHDH audit log (same as RBAC events). Events persist to local audit log in disconnected clusters.

**Implementation:** `plugins/boost-backend/src/audit/ingestion-events.ts` defines event types and emission helpers. Connector lifecycle hooks (`onSyncStart`, `onSyncSuccess`, `onSyncFailure`) emit audit events. Config change service emits `ingestion.config.change` events.

### Decision 2: Analytics REST API design

Analytics endpoints serve the Admin Panel Analytics tab (RHDHPLAN-1509). All endpoints RBAC-gated with `ai-catalog.admin` permission.

**Why:** Centralized analytics data layer. Frontend consumes clean JSON payloads without direct DB access. RBAC gating ensures only admins see sensitive sync/quality data.

**How to apply:**

Endpoints:

1. **Sync History:**
   - `GET /api/boost/admin/analytics/sync-history`
   - Query params: `connector_name` (optional filter), `start_date`, `end_date`, `page`, `limit`
   - Response: array of sync attempts with `timestamp`, `outcome`, `assets` counts, `duration`
   - Pagination via `page`/`limit`, total count in response metadata

2. **Quality Scores:**
   - `GET /api/boost/admin/analytics/quality-scores`
   - Query params: `skill_entity_ref` (optional filter), `eval_source` (optional filter), `start_date`, `end_date`
   - Response: per-skill quality scores array + aggregate distribution (histogram of score ranges)
   - Aggregate distribution computed on-demand from DB

3. **Match Coverage:**
   - `GET /api/boost/admin/analytics/match-coverage`
   - Response: `{ total_capabilities: number, matched_capabilities: number, coverage_ratio: number, unmatched_capabilities: string[] }`
   - Computed on-demand by comparing agent capability declarations against skill catalog entities

4. **Neo4j Sync Status:**
   - Embedded in analytics responses (not a separate endpoint)
   - Status: `{ neo4j_connected: boolean, last_sync: string, entity_count: number }`

**Implementation:** `plugins/boost-backend/src/api/admin/analytics/routes.ts` defines Express routes. Each route checks `ai-catalog.admin` permission via `authorize` helper. Routes call service layer (`AnalyticsService`) which queries DB and computes metrics.

### Decision 3: Quality score storage

Per-skill quality scores stored in DB table. Aggregate distribution computed on-demand when analytics API is called.

**Why:** Asynchronous score ingestion from Eval Hub. Scores arrive in batches, not real-time. DB storage decouples score ingestion from API serving. On-demand computation avoids continuous re-aggregation overhead.

**How to apply:**

DB table schema:

```sql
CREATE TABLE boost_quality_scores (
  id SERIAL PRIMARY KEY,
  skill_entity_ref VARCHAR(255) NOT NULL,
  eval_source VARCHAR(100) NOT NULL, -- 'lighteval', 'ibm-clear', 'guidellm', etc.
  score DECIMAL(5, 3) NOT NULL, -- 0.000 to 1.000 (normalized)
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  metadata JSONB, -- extensible for eval-framework-specific data
  INDEX idx_skill_ref (skill_entity_ref),
  INDEX idx_timestamp (timestamp DESC)
);
```

Aggregate distribution: Computed on-demand when `GET /api/boost/admin/analytics/quality-scores` is called. Query groups scores into buckets (e.g., 0.0-0.2, 0.2-0.4, ..., 0.8-1.0) and returns histogram.

**Implementation:** `plugins/boost-backend/src/db/migrations/` adds table schema. `plugins/boost-backend/src/db/quality-scores-store.ts` provides CRUD operations. `AnalyticsService.getQualityScores()` queries DB and computes distribution.

### Decision 4: Eval Hub as pluggable integration

Eval Hub is a configurable external service. Generic quality score ingestion interface, not hardcoded to specific eval frameworks.

**Why:** Eval Hub API availability and contract stability are the main risk. If Eval Hub isn't ready, Boost must still function. Pluggable design allows manual score import or mock scores during development.

**How to apply:**

app-config configuration:

```yaml
boost:
  evalHub:
    endpoint: 'https://eval-hub.example.com/api'
    enabled: true # set to false to disable Eval Hub integration
    refreshInterval: '1h' # how often to poll for new scores
```

Eval Hub client interface:

```typescript
interface EvalHubClient {
  fetchQualityScores(): Promise<QualityScoreResult[]>;
}

interface QualityScoreResult {
  skill_entity_ref: string;
  eval_source: string; // 'lighteval', 'ibm-clear', 'guidellm'
  score: number; // 0.0 to 1.0
  timestamp: string; // ISO 8601
  metadata?: Record<string, unknown>;
}
```

Graceful degradation:

- If `boost.evalHub.enabled` is `false`, skip score ingestion
- If Eval Hub endpoint unreachable, log warning and continue (no crash)
- If Eval Hub returns empty scores, store empty result (don't fail)

**Implementation:** `plugins/boost-backend/src/eval-hub/client.ts` implements `EvalHubClient`. `plugins/boost-backend/src/eval-hub/ingestion-service.ts` polls Eval Hub on interval (via background task), fetches scores, stores in DB. Config loaded from `boost.evalHub` in app-config.

### Decision 5: Match coverage calculation

Match coverage compares declared agent capabilities (from Kagenti agent specs) against available skills in catalog. Coverage = matched capabilities / total capabilities. Computed on-demand when analytics API is called.

**Why:** Coverage is expensive to compute (requires fetching all agents and all skills, then matching). On-demand computation avoids continuous re-calculation. Coverage changes infrequently (only when agents or skills are added/removed).

**How to apply:**

Agent capabilities: Declared in Kagenti agent specs (e.g., `metadata.capabilities: ['code-review', 'bug-detection']`). Boost reads agent entities from catalog.

Skill catalog: Entities with `spec.type: skill` (from RHDHPLAN-1506 skill ingestion). Boost reads skill entities from catalog.

Match logic:

1. Fetch all agent entities (filter by `spec.type: ai-agent` or similar)
2. Fetch all skill entities (filter by `spec.type: skill`)
3. Extract capabilities from agents: `agent.metadata.capabilities`
4. Extract skill IDs from skills: `skill.metadata.id`
5. Compute matched capabilities: capabilities that have a corresponding skill
6. Coverage ratio = matched capabilities / total capabilities
7. Unmatched capabilities = capabilities without corresponding skills

**Implementation:** `plugins/boost-backend/src/analytics/match-coverage-calculator.ts` implements match logic. `AnalyticsService.getMatchCoverage()` calls calculator, returns coverage data. Catalog queries use Backstage catalog client.

## Risks

- **Eval Hub API instability:** If Eval Hub API changes frequently, integration breaks. Mitigated by pluggable design and graceful degradation (fall back to manual score import).
- **Audit log volume:** High-frequency sync operations generate many audit events. Mitigated by RHDH audit log retention policies (managed by platform, not Boost).
- **Match coverage computation cost:** Fetching all agents and skills is expensive. Mitigated by on-demand computation (only when API is called), not continuous re-calculation. Future optimization: cache coverage result for 5 minutes.
- **Quality score normalization:** Different eval frameworks produce scores on different scales (0-100, 0-1, letter grades). Mitigated by normalizing all scores to 0.0-1.0 range in `EvalHubClient.fetchQualityScores()` before storing.
