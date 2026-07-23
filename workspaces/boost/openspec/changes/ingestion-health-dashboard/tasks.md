# Tasks: Ingestion Health Admin Dashboard

## 1. Health Data Model and Storage (P0) — RHIDP-15335

- [ ] 1.1 Define `boost_sync_attempts` table schema in database migration (connector_id, timestamp, outcome, error_type, error_message, assets_added/updated/removed, duration_ms)
- [ ] 1.2 Create database migration file for `boost_sync_attempts` table with indexes on (connector_id, timestamp DESC)
- [ ] 1.3 Implement `SyncAttemptsRepository` class with methods: `insertSyncAttempt()`, `getLatestAttempts(connectorId, limit)`, `cleanupOldAttempts(connectorId, retentionLimit)`
- [ ] 1.4 Add retention policy config schema to `boost.ingestion.healthRetention.maxAttemptsPerConnector` (default 100)
- [ ] 1.5 Implement scheduled cleanup job for sync attempts (runs daily, enforces retention policy per connector)
- [ ] 1.6 Add database indexes for efficient health status queries

## 2. Health Status API (P0) — RHIDP-15335

- [ ] 2.1 Define `ConnectorHealthStatus` type in `plugins/boost-common/src/types/ingestion-health.ts` (connectorId, connectorType, enabled, status, lastSyncAttempt, lastSuccessfulSync, errorSummary, metrics)
- [ ] 2.2 Implement `GET /api/boost/ingestion-health` route returning array of connector health objects
- [ ] 2.3 Implement health status derivation logic in `HealthStatusService.deriveStatus(attempts)` (healthy/degraded/failing/unknown based on last 3 attempts; unknown = zero sync attempts recorded)
- [ ] 2.4 Add `?includeDisabled=true` query parameter support for disabled connectors
- [ ] 2.5 Implement RBAC gating via `ai-catalog.admin` permission check in route handler (using `permissions.authorize()`)
- [ ] 2.6 Add audit logging for health API requests (per RHDHPLAN-1508 RHIDP-15277 audit logging pattern)
- [ ] 2.7 Implement empty state handling (returns `[]` for zero connectors)
- [ ] 2.8 Add health API integration tests (authorized/unauthorized, enabled/disabled filters, health status derivation)

## 3. Error Classification (P0) — RHIDP-15337

- [ ] 3.1 Create `ErrorClassifier` utility class in `plugins/boost-backend/src/ingestion/error-classifier.ts`
- [ ] 3.2 Implement `classify(error, options?)` method returning `{ errorType, errorMessage, diagnosticGuidance }`
- [ ] 3.3 Add auth failure detection patterns (401/403 status, "Invalid token", "OAuth expired", "Insufficient scopes")
- [ ] 3.4 Add network failure detection patterns (ECONNREFUSED, ETIMEDOUT, DNS errors, TLS errors)
- [ ] 3.5 Add schema mismatch detection patterns (JSON parsing errors, "Unexpected field", GraphQL query errors)
- [ ] 3.6 Add rate limit detection patterns (429 status, "Rate limit exceeded", X-RateLimit-Remaining headers)
- [ ] 3.7 Implement connector-specific error matchers (GitHub secondary rate limit, Jira Cloud auth errors)
- [ ] 3.8 Implement unknown error fallback classification
- [ ] 3.9 Add diagnostic guidance text for each error type
- [ ] 3.10 Add error classification unit tests (each error type pattern, fallback, connector-specific)

## 4. Admin Health UI (P1) — RHIDP-15336, RHIDP-15339

- [ ] 4.1 Create `IngestionHealthPanel.tsx` component in `plugins/boost/src/components/AdminPanels/`
- [ ] 4.2 Implement health card rendering with PatternFly `Card`, `CardHeader`, `CardBody` components
- [ ] 4.3 Add status badge rendering (PatternFly `Label` with success/warning/danger/outline variants for healthy/degraded/failing/disabled/unknown)
- [ ] 4.4 Add timestamp rendering with `react-time-ago` (last sync attempt, last successful sync)
- [ ] 4.5 Add sync metrics display (assets added/updated/removed counts)
- [ ] 4.6 Add error summary section with error type badge and diagnostic guidance text
- [ ] 4.7 Add "Force Sync" button with disabled state during connector run (PatternFly `Button` with spinner)
- [ ] 4.8 Implement disabled connector visual treatment (grey badge, no error indicators, hidden Force Sync button)
- [ ] 4.9 Add loading state (PatternFly `Spinner` with "Loading connector health..." message)
- [ ] 4.10 Add error state (PatternFly `EmptyState` with "Failed to load" message and Refresh button)
- [ ] 4.11 Add empty state (PatternFly `EmptyState` with "No connectors configured" message)
- [ ] 4.12 Implement health data polling via `useSWR` with 30s refresh interval
- [ ] 4.13 Add responsive grid layout for health cards (PatternFly `Gallery` component)

## 5. Neo4j Sync Panel (P1) — RHIDP-15338

- [ ] 5.1 Implement `GET /api/boost/ingestion-health/neo4j` route returning Neo4j sync status
- [ ] 5.2 Add Neo4j panel rendering in `IngestionHealthPanel.tsx` below connector cards (PatternFly `Divider` separator)
- [ ] 5.3 Add Neo4j panel header with "Knowledge Graph Sync" title and graph icon
- [ ] 5.4 Add sync status display (last sync timestamp, outcome badge, node count, relationship count)
- [ ] 5.5 Add "Force Re-sync" button with mode toggle (PatternFly `ToggleGroup` for Full/Incremental)
- [ ] 5.6 Implement `POST /api/boost/ingestion-health/neo4j/force-sync` route with mode parameter
- [ ] 5.7 Add Neo4j panel error state (error summary, show last successful counts)
- [ ] 5.8 Add Neo4j panel loading state (spinner during force sync)
- [ ] 5.9 Integrate Neo4j sync adapter health tracking hooks

## 6. Force Sync (P1) — RHIDP-15335, RHIDP-15336

- [ ] 6.1 Implement `POST /api/boost/ingestion-health/:connectorId/force-sync` route
- [ ] 6.2 Add connector run state registry (via SchedulerService.getTaskStatus())
- [ ] 6.3 Implement concurrent Force Sync prevention (return 409 if already running)
- [ ] 6.4 Implement Force Sync trigger via SchedulerService.triggerTask() or direct provider.run() invocation
- [ ] 6.5 Add Force Sync timeout wrapper (configurable via `boost.ingestion.forceSyncTimeout`, default 10 min)
- [ ] 6.6 Implement `GET /api/boost/ingestion-health/:connectorId/force-sync/:runId` status polling route
- [ ] 6.7 Add Force Sync UI polling in health card (poll every 2s until status is success/failure)
- [ ] 6.8 Add Force Sync error handling in UI (409/504 error alerts)
- [ ] 6.9 Add Force Sync integration tests (trigger, timeout, concurrency prevention, polling)

## 7. Connector Provider Integration (P1)

- [ ] 7.1 Add `HealthTracker.recordSyncAttempt()` calls to GitHub connector provider's `run()` method
- [ ] 7.2 Add `HealthTracker.recordSyncAttempt()` calls to GitLab connector provider's `run()` method
- [ ] 7.3 Add `HealthTracker.recordSyncAttempt()` calls to Jira connector provider's `run()` method
- [ ] 7.4 Implement sync metrics calculation (assets added/updated/removed) in each provider
- [ ] 7.5 Add error capture and classification in each provider's error handlers
- [ ] 7.6 Verify health tracking doesn't introduce performance overhead (measure sync duration before/after)

## 8. Navigation Integration (P1)

- [ ] 8.1 Add "Ingestion Health" navigation item to `AdminLayout.tsx` sidebar
- [ ] 8.2 Add `/admin/ingestion-health` route to admin panel routes
- [ ] 8.3 Implement active state highlighting for Ingestion Health nav item
- [ ] 8.4 Verify navigation integration follows existing admin panel patterns (Model Connection, System Prompt, Agent Config)

## 9. RBAC and Permissions (P1)

- [ ] 9.1 Implement RBAC permission check via `permissions.authorize()` with `ai-catalog.admin` permission (not custom middleware — per AGENTS.md, authorization goes through the permission framework)
- [ ] 9.2 Add permission check to all ingestion health API routes (GET health, POST force-sync, GET Neo4j, POST Neo4j force-sync)
- [ ] 9.3 Add 403 error handling in UI (show "Insufficient permissions" message)
- [ ] 9.4 Add permission check integration tests (verify 403 for non-admin users)

## 10. Testing (P1)

- [ ] 10.1 Add health status API unit tests (status derivation, retention policy, empty state, RBAC)
- [ ] 10.2 Add error classification unit tests (all error types, connector-specific patterns, fallback)
- [ ] 10.3 Add Force Sync integration tests (trigger, timeout, concurrency, polling)
- [ ] 10.4 Add Neo4j sync API tests (status retrieval, force re-sync, mode selection)
- [ ] 10.5 Add health UI component tests (card rendering, status badges, error summary, Force Sync button states)
- [ ] 10.6 Add end-to-end tests (full health dashboard flow: view health, force sync, poll status, see updated metrics)
- [ ] 10.7 Add cross-connector health tracking tests (verify health tracking works for GitHub, GitLab, Jira providers)

## 11. Documentation (P2)

- [ ] 11.1 Add admin user guide for Ingestion Health dashboard (how to interpret status, when to force sync, error diagnostic steps)
- [ ] 11.2 Add developer guide for connector health integration (how to add health tracking to new connectors)
- [ ] 11.3 Add configuration reference for health retention settings (`boost.ingestion.healthRetention`, `boost.ingestion.forceSyncTimeout`)
- [ ] 11.4 Add error classification reference table (error types, detection patterns, diagnostic guidance)

## 12. Performance and Monitoring (P2)

- [ ] 12.1 Add performance metrics for health API (response time, database query duration)
- [ ] 12.2 Add monitoring for sync attempt table growth (alert if retention cleanup fails)
- [ ] 12.3 Add monitoring for Force Sync timeouts (track timeout frequency per connector)
- [ ] 12.4 Optimize health status queries (ensure indexes are used, consider caching if needed)
