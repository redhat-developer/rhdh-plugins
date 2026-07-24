# Eval Hub Integration for Skill Quality Scores

> **Status:** 🔀 CONSOLIDATED into RHIDP-15277 (RHDHPLAN-1508)  
> **Story:** RHIDP-15345 (Closed — absorbed by RHIDP-15277 epic scope)  
> **Coverage:** Eval Hub endpoint configuration, quality score ingestion, per-skill score storage, aggregate distribution computation, graceful handling when Eval Hub unavailable, multiple eval backend support, score refresh cycle  
> **Consolidation (2026-07-08):** Eval Hub quality score integration is now part of the expanded RHIDP-15277 epic (AI Catalog RBAC Audit Logging, RHDHPLAN-1508). Eval Hub API stability remains the primary integration risk.

## Scenarios

### Scenario 1: Eval Hub endpoint configuration via app-config

**GIVEN** Boost is deployed with app-config containing `boost.evalHub.endpoint: 'https://eval-hub.example.com/api'`  
**WHEN** the Boost backend starts  
**THEN** the Eval Hub client is initialized with the configured endpoint  
**AND** the client uses the endpoint for all Eval Hub API calls  
**AND** if `boost.evalHub.enabled: false`, the Eval Hub client is not initialized and no score ingestion occurs  
**AND** if the endpoint is missing or invalid, the backend logs a warning and disables Eval Hub integration

### Scenario 2: Quality score ingestion from eval pipeline

**GIVEN** the Eval Hub endpoint is configured and reachable  
**WHEN** the Eval Hub ingestion service runs (on scheduled interval or manual trigger)  
**THEN** the service calls `EvalHubClient.fetchQualityScores()`  
**AND** the Eval Hub API returns an array of quality score results: `[{ skill_entity_ref, eval_source, score, timestamp, metadata }]`  
**AND** the ingestion service stores each score in the `boost_quality_scores` DB table  
**AND** scores are normalized to 0.0-1.0 range before storage (if eval source uses different scale)

### Scenario 3: Per-skill score storage

**GIVEN** the Eval Hub ingestion service fetches quality scores  
**WHEN** a score is received for skill `skill:default/code-review`  
**THEN** the score is stored in the DB with columns: `skill_entity_ref: 'skill:default/code-review'`, `eval_source: 'lighteval'`, `score: 0.85`, `timestamp: '2026-07-08T12:00:00Z'`  
**AND** if a score for the same skill and eval source already exists, the new score is inserted (historical scores retained)  
**AND** the DB table supports multiple scores per skill (e.g., daily quality scores over time)

### Scenario 4: Aggregate distribution computation

**GIVEN** multiple skills have quality scores stored in the DB  
**WHEN** the Analytics API `GET /api/boost/admin/analytics/quality-scores` is called  
**THEN** the aggregate distribution is computed on-demand by grouping scores into buckets: `0.0-0.2`, `0.2-0.4`, `0.4-0.6`, `0.6-0.8`, `0.8-1.0`  
**AND** each bucket contains the count of skills with scores in that range  
**AND** the distribution is returned as `{ score_ranges: [{ range: '0.0-0.2', count: 3 }, ...] }`  
**AND** the computation uses only the latest score per skill (by timestamp)

### Scenario 5: Graceful handling when Eval Hub unavailable

**GIVEN** the Eval Hub endpoint is configured but unreachable (network error, service down)  
**WHEN** the Eval Hub ingestion service runs  
**THEN** the service logs a warning: `'Eval Hub unreachable, skipping quality score ingestion'`  
**AND** the service does not crash or throw an unhandled error  
**AND** the next scheduled ingestion attempt will retry  
**AND** existing quality scores in the DB remain accessible via the Analytics API

**GIVEN** `boost.evalHub.enabled: false`  
**WHEN** the Eval Hub ingestion service is triggered  
**THEN** the service logs: `'Eval Hub integration disabled, skipping ingestion'`  
**AND** no API calls are made to the Eval Hub endpoint

### Scenario 6: Multiple eval backend support (LightEval, IBM Clear, GuideLLM)

**GIVEN** the Eval Hub API returns scores from different eval backends  
**WHEN** the ingestion service fetches scores  
**THEN** each score includes `eval_source: 'lighteval' | 'ibm-clear' | 'guidellm'`  
**AND** scores from different eval sources are stored independently in the DB  
**AND** the Analytics API can filter scores by `eval_source` query param  
**AND** aggregate distribution can be computed per eval source or across all sources

**GIVEN** a skill has scores from multiple eval backends  
**WHEN** the Analytics API is called without `eval_source` filter  
**THEN** the response includes scores from all eval sources  
**AND** the aggregate distribution includes scores from all sources (unless filtered)

### Scenario 7: Score refresh cycle

**GIVEN** the Eval Hub ingestion service is configured with `boost.evalHub.refreshInterval: '1h'`  
**WHEN** the Boost backend starts  
**THEN** the ingestion service schedules a background task to run every 1 hour  
**AND** each run fetches new quality scores from Eval Hub and stores them in the DB  
**AND** the background task runs independently of user requests (asynchronous ingestion)  
**AND** if the ingestion service crashes, the next scheduled run will retry

**GIVEN** an admin wants to manually trigger quality score ingestion  
**WHEN** the admin calls a manual ingestion endpoint (e.g., `POST /api/boost/admin/analytics/refresh-quality-scores`)  
**THEN** the ingestion service immediately fetches and stores new scores  
**AND** the manual trigger does not affect the scheduled refresh cycle
