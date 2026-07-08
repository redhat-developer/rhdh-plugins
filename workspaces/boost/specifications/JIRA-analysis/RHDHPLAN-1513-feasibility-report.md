# RHDHPLAN-1513 Feasibility Report: Operational Infrastructure Criteria vs. Backstage Framework

**Date:** 2026-07-07
**Purpose:** Assess whether each RHIDP epic under RHDHPLAN-1513 can be implemented within the existing Backstage framework and boost infrastructure without requiring upstream changes.

---

## Framework Capabilities Summary

RHDHPLAN-1513 covers operational infrastructure for the AI Catalog: admin dashboard, hot-reload config, audit logging/metrics, and upstream schema alignment. The cross-reference targets are the Backstage frontend extension model, configuration system, logging infrastructure, and catalog entity model, alongside boost's own `RuntimeConfigResolver` infrastructure.

| Capability                                                   | Status                                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Backstage frontend plugin pages (routes, sidebar items)      | **Available** — standard frontend plugin pattern                               |
| Backstage admin page patterns                                | **Available** — admin pages are standard routes gated by permissions           |
| `RequirePermission` frontend guards                          | **Available**                                                                  |
| Backstage app-config system (`ConfigApi`)                    | **Available** — read-only at runtime; changes require restart                  |
| Backstage config hot-reload                                  | **Not built-in** — app-config is loaded at startup; no native hot-reload       |
| Boost `RuntimeConfigResolver` (30s TTL, YAML + DB two-layer) | **Available** — boost-internal, already proven                                 |
| Backstage backend API routes (`createBackendPlugin`)         | **Available** — standard REST endpoint pattern                                 |
| Backstage structured logging (`LoggerService`)               | **Available** — JSON structured logs                                           |
| Backstage audit logging infrastructure                       | **Limited** — RHDH has audit logging; upstream Backstage has basic logger only |
| Backstage catalog search/list APIs                           | **Available** — for entity enumeration                                         |
| Custom annotations / `spec.type` values                      | **Available** — free-form extension                                            |
| Upstream Backstage RFCs (#32062, #33060)                     | **In progress** — not finalized, no migration tooling exists                   |

---

## Epic-by-Epic Analysis

### RHIDP-15331: Ingestion Health Admin Dashboard

**Summary:** Admin-facing per-connector health view: enabled/disabled, sync timestamps, health status, error classification, "Force Sync" action, Neo4j graph sync panel.

#### Acceptance Criteria Assessment

| Criterion                                                                                            | Feasible without upstream changes? | Assessment                                                                                                                                                                                                                                              |
| ---------------------------------------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Per-connector health dashboard showing enabled/disabled, last sync, health status, most recent error | **YES**                            | Frontend page in the boost admin panel. Backend API exposes connector status from stored state (last sync time, error, health). Connectors already run via scheduled tasks — the task runner captures this state. No framework changes needed           |
| Actionable error classification (auth, network, schema, rate limiting)                               | **YES**                            | Application-level error categorization. Connectors catch errors, classify by type (HTTP 401 → auth, connection refused → network, validation failure → schema, HTTP 429 → rate limiting), store classification alongside error message                  |
| "Force Sync" action per connector                                                                    | **YES**                            | Backend API endpoint that triggers an immediate connector sync cycle. Entity providers run via `SchedulerService` task runners — a force-sync endpoint invokes the provider's `run()` method outside the scheduled cadence. No framework changes needed |
| Neo4j graph sync status panel with "Force Re-sync"                                                   | **YES**                            | Same pattern — backend API exposes Neo4j sync adapter status, frontend displays it, force-sync endpoint triggers adapter run                                                                                                                            |
| Disconnected-cluster health differentiation (disabled vs. failing)                                   | **YES**                            | Application-level — config check (disabled = intentional, `enabled: false` in config) vs. runtime error (failing = connector enabled but erroring). Display different icons/labels                                                                      |

**Verdict: FULLY FEASIBLE** — This is a standard admin dashboard page. The backend stores connector health state (written by connectors during sync cycles), exposes it via REST API, and the frontend renders it. The "Force Sync" action triggers the provider's run method. All within standard Backstage frontend/backend plugin patterns. No upstream changes needed.

**Implementation note:** The augment workspace's admin panel (`workspaces/augment/plugins/augment/src/components/AdminPanels/`) already has model connection, system prompt, agent config, and skills marketplace sections. Adding an "Ingestion Health" section follows the existing pattern — new route, new backend API, new frontend components.

---

### RHIDP-15332: Connector Configuration Hot-Reload

**Summary:** Extend `RuntimeConfigResolver` to connector settings: enable/disable, endpoint URLs, sync schedules. Changes within 30s TTL without pod restart. Zod schemas for all fields.

#### Acceptance Criteria Assessment

| Criterion                                                                                               | Feasible without upstream changes? | Assessment                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Zod schemas defined for per-connector settings (enabled, endpoint URL, schedule, credential references) | **YES**                            | Application-level schema definitions. Boost already uses Zod for config validation. Adding connector-specific schemas follows the existing pattern                                                                                                           |
| Each field annotated with `configScope`                                                                 | **YES**                            | Boost's `RuntimeConfigResolver` uses `configScope` annotations to determine which fields are hot-reloadable. Extending to connector fields is the same pattern                                                                                               |
| `RuntimeConfigResolver` two-layer model handles connector config                                        | **YES**                            | The `RuntimeConfigResolver` already implements YAML baseline + DB overrides with 30s TTL. Extending it to connector settings means adding connector config keys to the resolver's scope. No framework changes — this is extending boost's own infrastructure |
| Changes take effect within 30s TTL without pod restart                                                  | **YES**                            | `RuntimeConfigResolver` already delivers this for existing config. Connector code reads config through the resolver instead of directly from `ConfigApi`, getting hot-reload for free                                                                        |
| Admin UI section for connector configuration                                                            | **YES**                            | Frontend page in the boost admin panel, writing to the DB override layer via the existing admin API. Same pattern as existing admin sections                                                                                                                 |

**Verdict: FULLY FEASIBLE** — This epic extends boost's proven `RuntimeConfigResolver` to connector settings. The resolver already handles hot-reload with 30s TTL; connector config is just more fields under its scope. No upstream Backstage changes needed.

**Key distinction from Backstage native config:** Backstage's built-in `ConfigApi` loads app-config at startup and does not support hot-reload. Boost's `RuntimeConfigResolver` is a custom layer on top that adds DB overrides and TTL-based refresh. This epic extends that custom layer, not the Backstage config system.

**Note on credential references:** Hot-reloading credential references (K8s Secret mounts) has a subtlety — the Secret value is read from the filesystem, not from app-config. If a Secret is rotated (the mounted file changes), the connector must re-read it. The 30s TTL should trigger a re-read of the mounted file, but this needs testing with K8s Secret mount propagation delays (which can take up to 60s for projected volumes).

---

### RHIDP-15333: Ingestion Audit Logging and Metrics

**Summary:** Audit log every sync attempt and config change. Expose analytics metrics (sync history, quality scores, match coverage, Neo4j sync status) via RBAC-gated REST API.

#### Acceptance Criteria Assessment

| Criterion                                                                       | Feasible without upstream changes? | Assessment                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Every sync attempt logged with connector name, timestamp, outcome, asset counts | **YES**                            | Application-level structured logging. Connectors emit a structured audit event at sync completion. RHIDP-15277 (RHDHPLAN-1508) established the pattern — same approach for ingestion events. Write to the RHDH audit log channel |
| Every config change logged with actor, timestamp, before/after values           | **YES**                            | Application-level — the admin API endpoint that writes config changes emits an audit event with the actor (from request identity), old value, and new value                                                                      |
| Analytics metrics exposed via RBAC-gated REST API                               | **YES**                            | Backend REST API route gated by permission check (e.g., `ai-catalog.admin`). Returns aggregated metrics from stored sync history and quality data. Standard Backstage backend plugin pattern                                     |
| Eval Hub integration for skill quality scores                                   | **YES with caveats**               | Application-level integration — REST calls to LightEval, IBM Clear, GuideLLM APIs. The eval hub APIs are external dependencies; availability and API stability are the risk, not Backstage framework limitations                 |

**Verdict: FULLY FEASIBLE** — Audit logging and metrics are application-level concerns. RHIDP-15277 (RHDHPLAN-1508) already establishes the audit logging pattern; this epic extends it to ingestion events. The analytics API is a standard RBAC-gated REST endpoint. No upstream changes needed.

**Eval Hub caveat:** The acceptance criterion mentions "Eval Hub integration for skill quality scores" using LightEval, IBM Clear, and GuideLLM. These are external evaluation frameworks with their own APIs. The feasibility of this criterion depends on those APIs being stable and accessible, not on Backstage capabilities. If these APIs are not yet available or their integration contracts are not defined, this criterion may need to be scoped down to "quality score ingestion from a configurable source" rather than specific eval framework integrations.

---

### RHIDP-15334: Upstream Schema Alignment Readiness

**Summary:** Document RHDH AI Asset annotation/versioning scheme with explicit mapping to draft RFCs #32062 and #33060. Build dry-run migration-readiness tooling scaffold.

#### Acceptance Criteria Assessment

| Criterion                                                             | Feasible without upstream changes? | Assessment                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Annotation specification document with explicit RFC mapping published | **YES**                            | Documentation exercise. Map each `rhdh.io/ai-asset-*` annotation and `spec.type` value to the corresponding proposed upstream RFC kind. This is analysis and documentation — no code changes to the framework                                                                                                                                                                                |
| Dry-run migration-readiness tooling scaffold implemented              | **YES**                            | A CLI tool or script that: (1) queries the catalog API for all entities with `rhdh.io/ai-asset-category` annotation, (2) for each entity, computes what upstream kind it would become under RFCs #32062 / #33060, (3) reports per-entity: current kind/type → proposed upstream kind, fields that need transformation, and any incompatibilities. Standard catalog API query + mapping logic |
| Actual migration explicitly framed as future work                     | **YES**                            | Documentation/scoping statement — no implementation needed                                                                                                                                                                                                                                                                                                                                   |

**Verdict: FULLY FEASIBLE** — This is the most straightforward epic. It's primarily documentation and a dry-run analysis tool. The catalog API provides entity enumeration; the mapping logic is a static table based on the current annotation scheme and the RFC proposals. No upstream changes needed — and by design, this epic explicitly defers the actual migration.

**Key consideration:** The utility of this epic depends on the upstream RFCs' stability. If RFCs #32062 and #33060 are still in early draft with significant open questions, the mapping document will need to capture uncertainty ("if the RFC adopts option A, the mapping is X; if option B, the mapping is Y"). The dry-run tool should report confidence levels per entity based on how settled the target RFC kind is.

---

## Summary Matrix

| Epic                                | Key         | Feasible without upstream changes? | Implementation complexity | Notes                                                                            |
| ----------------------------------- | ----------- | ---------------------------------- | ------------------------- | -------------------------------------------------------------------------------- |
| Ingestion Health Admin Dashboard    | RHIDP-15331 | **YES**                            | Medium                    | Standard admin page + backend API; boost admin panel already has this pattern    |
| Connector Configuration Hot-Reload  | RHIDP-15332 | **YES**                            | Medium                    | Extends proven `RuntimeConfigResolver`; K8s Secret rotation timing needs testing |
| Ingestion Audit Logging and Metrics | RHIDP-15333 | **YES**                            | Medium                    | Extends RHIDP-15277 audit pattern; Eval Hub API availability is the main risk    |
| Upstream Schema Alignment Readiness | RHIDP-15334 | **YES**                            | Low                       | Documentation + dry-run tool; depends on RFC stability                           |

## Key Findings

1. **All 4 epics are fully feasible without upstream Backstage changes.** RHDHPLAN-1513 is the most internally focused of the four features — three of the four epics build on boost's own infrastructure (`RuntimeConfigResolver`, admin panel, audit logging) rather than Backstage extension points.

2. **No PM discussion needed.** All acceptance criteria can be implemented as specified. No spec deviations required.

3. **Boost's `RuntimeConfigResolver` is the key enabler for RHIDP-15332.** Hot-reload config is not a native Backstage capability — boost built it. Extending it to connector settings is a natural progression of that investment.

4. **The audit logging pattern is now a cross-cutting concern.** RHIDP-15277 (RHDHPLAN-1508) establishes the pattern for RBAC audit events; RHIDP-15333 (this feature) extends it to ingestion events. These should share the same audit event infrastructure (structured JSON, dedicated log channel, consistent event schema) to avoid parallel implementations.

5. **Two external dependency risks (neither is a Backstage framework issue):**
   - **Eval Hub APIs** (LightEval, IBM Clear, GuideLLM) — API availability and contract stability are unknowns. If these APIs are not ready, the quality scores criterion should be scoped to a generic "quality score ingestion" interface.
   - **Upstream RFCs #32062 and #33060** — if these RFCs undergo significant revision, the mapping document and dry-run tool will need updates. The epic correctly frames actual migration as future work.

## Comparison Across All Four Features

| Aspect                          | RHDHPLAN-1507 (Entity Model) | RHDHPLAN-1508 (RBAC)          | RHDHPLAN-1510 (Connectors) | RHDHPLAN-1513 (Ops Infra)   |
| ------------------------------- | ---------------------------- | ----------------------------- | -------------------------- | --------------------------- |
| Epic count                      | 7                            | 7                             | 4                          | 4                           |
| Epics requiring spec deviations | 0                            | 3                             | 0                          | 0                           |
| Upstream changes needed         | None                         | None (3 alternate approaches) | None                       | None                        |
| Framework alignment             | High                         | Medium                        | High                       | High                        |
| PM discussion needed            | No                           | Yes (3 areas)                 | No                         | No                          |
| Highest-risk epic               | RHIDP-15295 (Neo4j)          | RHIDP-15274 (cascade)         | RHIDP-15315 (OCI scale)    | RHIDP-15333 (Eval Hub APIs) |
| Primary cross-reference         | Catalog framework            | Permission framework          | Entity provider interface  | Boost internal infra        |

**Overall:** 22 epics across 4 features. 19 of 22 are fully feasible as specified. 3 (all in RHDHPLAN-1508) require implementation approaches that deviate from the spec text and need PM discussion. Zero require upstream Backstage changes.
