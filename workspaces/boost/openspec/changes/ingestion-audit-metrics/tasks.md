# Tasks: Ingestion Audit Logging and Metrics

> **RHDHPLAN-1513 Consolidation (2026-07-08):** All tasks below have been consolidated into RHIDP-15277 (AI Catalog RBAC Audit Logging, RHDHPLAN-1508). Task groups 1-4 (audit events) → RHIDP-15280, task groups 5-10 (analytics API, Neo4j status) → RHIDP-15277 epic scope, task groups 11-13 (Eval Hub) → RHIDP-15277 epic scope. Cross-reference tasks (group 17) remain relevant — surviving RHDHPLAN-1513 epics should reference RHIDP-15277 for audit event patterns.

## 1. Audit Event Infrastructure (P0) — RHIDP-15343

- [ ] 1.1 Define ingestion audit event types in `plugins/boost-backend/src/audit/event-types.ts`
- [ ] 1.2 Define audit event payload schema extending RBAC audit event base schema
- [ ] 1.3 Create `IngestionAuditEvent` TypeScript interface with all event types
- [ ] 1.4 Create audit event emission helpers in `plugins/boost-backend/src/audit/ingestion-events.ts`
- [ ] 1.5 Integrate with RHDH audit log channel (same as RBAC events from RHIDP-15277)
- [ ] 1.6 Add audit event serialization to structured JSON
- [ ] 1.7 Add audit event validation (required fields, type constraints)
- [ ] 1.8 Add unit tests for audit event schema and emission helpers

## 2. Sync Audit Integration (P0) — RHIDP-15343

- [ ] 2.1 Add `onSyncStart` lifecycle hook to connector base class
- [ ] 2.2 Emit `ingestion.sync.start` event in `onSyncStart` hook
- [ ] 2.3 Add `onSyncSuccess` lifecycle hook with asset counts parameter
- [ ] 2.4 Emit `ingestion.sync.success` event in `onSyncSuccess` hook with asset counts
- [ ] 2.5 Add `onSyncFailure` lifecycle hook with error parameter
- [ ] 2.6 Emit `ingestion.sync.failure` event in `onSyncFailure` hook with error details
- [ ] 2.7 Integrate audit event emission into existing connectors (GitHub, Jira, Confluence)
- [ ] 2.8 Add asset count tracking logic (added/updated/removed entities)
- [ ] 2.9 Add error serialization for sync failure events
- [ ] 2.10 Add integration tests for sync audit events end-to-end

## 3. Config Change Audit (P0) — RHIDP-15343

- [ ] 3.1 Add config change tracking to connector config service
- [ ] 3.2 Emit `ingestion.config.change` event on config update
- [ ] 3.3 Capture actor identifier (user or service account) from request context
- [ ] 3.4 Capture before/after values for config changes
- [ ] 3.5 Add config field serialization (convert objects to strings for audit log)
- [ ] 3.6 Add integration tests for config change audit events

## 4. Disconnected Cluster Support (P1) — RHIDP-15343

- [ ] 4.1 Add local audit log fallback when RHDH central unreachable
- [ ] 4.2 Add event queuing for sync-to-central when connectivity restored
- [ ] 4.3 Add event persistence to local file system
- [ ] 4.4 Add event replay mechanism for queued events
- [ ] 4.5 Add unit tests for disconnected cluster audit logging

## 5. Analytics REST API (P1) — RHIDP-15344

- [ ] 5.1 Define analytics API routes in `plugins/boost-backend/src/api/admin/analytics/routes.ts`
- [ ] 5.2 Add `GET /api/boost/admin/analytics/sync-history` endpoint
- [ ] 5.3 Add `GET /api/boost/admin/analytics/quality-scores` endpoint
- [ ] 5.4 Add `GET /api/boost/admin/analytics/match-coverage` endpoint
- [ ] 5.5 Add RBAC gating to all endpoints (require `ai-catalog.admin` permission)
- [ ] 5.6 Add pagination support (page, limit, total_count metadata)
- [ ] 5.7 Add date range filtering (start_date, end_date query params)
- [ ] 5.8 Add connector name filtering for sync history endpoint
- [ ] 5.9 Add eval source filtering for quality scores endpoint
- [ ] 5.10 Add Express route registration in `plugins/boost-backend/src/plugin.ts`
- [ ] 5.11 Add integration tests for analytics API endpoints

## 6. Sync History Service (P1) — RHIDP-15344

- [ ] 6.1 Create `AnalyticsService` in `plugins/boost-backend/src/analytics/service.ts`
- [ ] 6.2 Implement `getSyncHistory()` method querying audit log DB
- [ ] 6.3 Add sync history query with pagination
- [ ] 6.4 Add sync history query with date range filtering
- [ ] 6.5 Add sync history query with connector name filtering
- [ ] 6.6 Add sync duration calculation from start/end timestamps
- [ ] 6.7 Add unit tests for sync history service

## 7. Quality Score Storage (P1) — RHIDP-15344, RHIDP-15345

- [ ] 7.1 Define `boost_quality_scores` DB table schema
- [ ] 7.2 Create DB migration for quality scores table in `plugins/boost-backend/src/db/migrations/`
- [ ] 7.3 Create `QualityScoresStore` in `plugins/boost-backend/src/db/quality-scores-store.ts`
- [ ] 7.4 Implement `insertScore()` method for storing quality scores
- [ ] 7.5 Implement `getScoresBySkill()` method for fetching per-skill scores
- [ ] 7.6 Implement `getLatestScores()` method for fetching latest scores per skill
- [ ] 7.7 Add DB indexes for performance (skill_entity_ref, timestamp)
- [ ] 7.8 Add unit tests for quality scores store

## 8. Quality Score Analytics (P1) — RHIDP-15344, RHIDP-15345

- [ ] 8.1 Implement `getQualityScores()` method in `AnalyticsService`
- [ ] 8.2 Add per-skill quality scores query
- [ ] 8.3 Add aggregate distribution computation (group scores into buckets)
- [ ] 8.4 Add score normalization to 0.0-1.0 range
- [ ] 8.5 Add eval source filtering
- [ ] 8.6 Add unit tests for quality score analytics

## 9. Match Coverage Calculator (P1) — RHIDP-15344

- [ ] 9.1 Create `MatchCoverageCalculator` in `plugins/boost-backend/src/analytics/match-coverage-calculator.ts`
- [ ] 9.2 Implement agent capability extraction from catalog entities
- [ ] 9.3 Implement skill ID extraction from catalog entities
- [ ] 9.4 Implement capability matching logic (agent capabilities vs. skill IDs)
- [ ] 9.5 Implement coverage ratio calculation (matched / total)
- [ ] 9.6 Implement unmatched capabilities list generation
- [ ] 9.7 Add caching for match coverage results (5 minute TTL)
- [ ] 9.8 Add unit tests for match coverage calculator

## 10. Neo4j Sync Status (P1) — RHIDP-15344

- [ ] 10.1 Add Neo4j connection status check to `AnalyticsService`
- [ ] 10.2 Add Neo4j last sync timestamp query
- [ ] 10.3 Add Neo4j entity count query
- [ ] 10.4 Embed Neo4j status in all analytics API responses
- [ ] 10.5 Add graceful handling when Neo4j unavailable
- [ ] 10.6 Add unit tests for Neo4j status integration

## 11. Eval Hub Client (P2) — RHIDP-15345

- [ ] 11.1 Define `EvalHubClient` interface in `plugins/boost-backend/src/eval-hub/client.ts`
- [ ] 11.2 Implement `fetchQualityScores()` method calling Eval Hub API
- [ ] 11.3 Add app-config schema for `boost.evalHub.endpoint`, `boost.evalHub.enabled`
- [ ] 11.4 Add Eval Hub client initialization from app-config
- [ ] 11.5 Add HTTP client with timeout and retry logic
- [ ] 11.6 Add error handling for Eval Hub API failures
- [ ] 11.7 Add score normalization to 0.0-1.0 range (handle different eval source scales)
- [ ] 11.8 Add unit tests for Eval Hub client

## 12. Eval Hub Ingestion Service (P2) — RHIDP-15345

- [ ] 12.1 Create `EvalHubIngestionService` in `plugins/boost-backend/src/eval-hub/ingestion-service.ts`
- [ ] 12.2 Add scheduled background task for quality score ingestion
- [ ] 12.3 Add `boost.evalHub.refreshInterval` app-config option
- [ ] 12.4 Implement score fetching and storage logic
- [ ] 12.5 Add graceful handling when Eval Hub disabled or unavailable
- [ ] 12.6 Add manual ingestion trigger endpoint `POST /api/boost/admin/analytics/refresh-quality-scores`
- [ ] 12.7 Add ingestion status logging (success/failure, score count)
- [ ] 12.8 Add integration tests for Eval Hub ingestion

## 13. Multi-Eval Backend Support (P2) — RHIDP-15345

- [ ] 13.1 Add `eval_source` field to quality scores DB table
- [ ] 13.2 Add eval source normalization in `EvalHubClient` (map backend-specific IDs to standard names)
- [ ] 13.3 Add eval source filtering in analytics API
- [ ] 13.4 Add per-eval-source aggregate distribution computation
- [ ] 13.5 Add support for LightEval, IBM Clear, GuideLLM eval backends
- [ ] 13.6 Add unit tests for multi-eval backend support

## 14. Permission Definitions (P1)

- [ ] 14.1 Define `ai-catalog.admin` permission in `plugins/boost-common/src/permissions.ts` (if not already defined)
- [ ] 14.2 Add permission rules for analytics endpoints
- [ ] 14.3 Add RBAC policy configuration examples in documentation
- [ ] 14.4 Add unit tests for permission checks

## 15. Integration Testing (P1)

- [ ] 15.1 Add end-to-end test for sync audit event flow (start → success → audit log)
- [ ] 15.2 Add end-to-end test for sync failure audit event flow
- [ ] 15.3 Add end-to-end test for config change audit event flow
- [ ] 15.4 Add end-to-end test for sync history API endpoint
- [ ] 15.5 Add end-to-end test for quality scores API endpoint
- [ ] 15.6 Add end-to-end test for match coverage API endpoint
- [ ] 15.7 Add end-to-end test for Eval Hub ingestion flow
- [ ] 15.8 Add end-to-end test for RBAC gating on analytics endpoints
- [ ] 15.9 Add end-to-end test for pagination and filtering

## 16. Documentation (P2)

- [ ] 16.1 Document audit event schema in `docs/audit-events.md`
- [ ] 16.2 Document analytics API endpoints in `docs/analytics-api.md`
- [ ] 16.3 Document Eval Hub integration setup in `docs/eval-hub-integration.md`
- [ ] 16.4 Add app-config examples for Eval Hub configuration
- [ ] 16.5 Add examples of analytics API usage (curl, fetch)
- [ ] 16.6 Add troubleshooting guide for Eval Hub connection issues
- [ ] 16.7 Add admin guide for interpreting analytics metrics

## 17. Cross-Reference Updates (P2)

- [ ] 17.1 Update RHDHPLAN-1508 (RBAC audit logging) cross-reference in shared audit infrastructure
- [ ] 17.2 Update RHDHPLAN-1509 (Analytics tab) cross-reference for API consumer
- [ ] 17.3 Update connector changes (RHDHPLAN-1510/1511/1512) for sync audit event emission
- [ ] 17.4 Update `ingestion-health-dashboard` change for audit event correlation
- [ ] 17.5 Update `connector-config-hot-reload` change for config change audit events
