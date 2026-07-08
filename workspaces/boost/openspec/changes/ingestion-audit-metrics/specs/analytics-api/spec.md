# Spec: Analytics Metrics REST API

> **Status:** ✅ READY  
> **Story:** RHIDP-15344  
> **Coverage:** Sync history endpoint, quality scores endpoint, match coverage endpoint, Neo4j sync status, RBAC gating, pagination, date range filtering

## Scenarios

### Scenario 1: Sync history endpoint returns per-connector timeline

**GIVEN** a connector has completed multiple sync operations over the past week  
**WHEN** an admin calls `GET /api/boost/admin/analytics/sync-history?connector_name=github-connector`  
**THEN** the response contains an array of sync attempts with `timestamp`, `outcome`, `assets` counts, `duration`  
**AND** the sync attempts are ordered by `timestamp` descending (most recent first)  
**AND** each sync attempt includes `connector_name`, `timestamp`, `outcome` (success/failure), `assets: { added, updated, removed }`  
**AND** the response includes pagination metadata: `{ page, limit, total_count }`

### Scenario 2: Quality scores endpoint returns per-skill and aggregate

**GIVEN** multiple skills have quality scores stored in the DB from Eval Hub ingestion  
**WHEN** an admin calls `GET /api/boost/admin/analytics/quality-scores`  
**THEN** the response contains an array of per-skill quality scores with `skill_entity_ref`, `eval_source`, `score`, `timestamp`  
**AND** the response includes an aggregate distribution: `{ score_ranges: [{ range: '0.0-0.2', count: N }, ...] }`  
**AND** the aggregate distribution is computed on-demand from the DB  
**AND** scores are normalized to 0.0-1.0 range regardless of eval source

### Scenario 3: Match coverage endpoint returns capability coverage ratio

**GIVEN** agents have declared capabilities and skills are available in the catalog  
**WHEN** an admin calls `GET /api/boost/admin/analytics/match-coverage`  
**THEN** the response contains `{ total_capabilities: N, matched_capabilities: M, coverage_ratio: M/N, unmatched_capabilities: [...] }`  
**AND** the coverage ratio is computed by comparing agent capabilities against skill catalog entities  
**AND** unmatched capabilities are listed as an array of capability IDs  
**AND** the computation is performed on-demand when the API is called

### Scenario 4: Neo4j sync status in analytics

**GIVEN** Neo4j is configured and syncing (or not syncing)  
**WHEN** an admin calls any analytics endpoint (e.g., sync history, quality scores)  
**THEN** the response includes a `neo4j_status` object: `{ connected: boolean, last_sync: string, entity_count: number }`  
**AND** `connected` reflects the current Neo4j connection status  
**AND** `last_sync` is the timestamp of the last successful Neo4j sync  
**AND** `entity_count` is the count of entities in Neo4j (if connected)

### Scenario 5: RBAC gating on all endpoints

**GIVEN** a user without `ai-catalog.admin` permission  
**WHEN** the user calls `GET /api/boost/admin/analytics/sync-history`  
**THEN** the response is `403 Forbidden`  
**AND** the error message indicates missing permission  
**AND** no analytics data is leaked in the error response

**GIVEN** a user with `ai-catalog.admin` permission  
**WHEN** the user calls `GET /api/boost/admin/analytics/sync-history`  
**THEN** the response is `200 OK` with analytics data

### Scenario 6: Pagination for large result sets

**GIVEN** a connector has 1000+ sync attempts in the DB  
**WHEN** an admin calls `GET /api/boost/admin/analytics/sync-history?page=1&limit=50`  
**THEN** the response contains 50 sync attempts (page 1)  
**AND** the response includes pagination metadata: `{ page: 1, limit: 50, total_count: 1000+ }`

**WHEN** the admin calls `GET /api/boost/admin/analytics/sync-history?page=2&limit=50`  
**THEN** the response contains the next 50 sync attempts (page 2)  
**AND** the pagination metadata reflects page 2

### Scenario 7: Date range filtering

**GIVEN** a connector has sync attempts spanning 6 months  
**WHEN** an admin calls `GET /api/boost/admin/analytics/sync-history?start_date=2026-01-01&end_date=2026-01-31`  
**THEN** the response contains only sync attempts within the specified date range (January 2026)  
**AND** sync attempts outside the date range are excluded  
**AND** the response includes the applied date range in metadata: `{ filters: { start_date, end_date } }`
