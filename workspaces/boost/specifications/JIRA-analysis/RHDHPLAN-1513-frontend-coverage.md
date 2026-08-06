# RHDHPLAN-1513 Frontend Coverage Analysis

> **Date:** 2026-07-17
> **Feature:** AI Catalog Ingestion Operations & Upstream Schema Alignment Readiness
> **Cross-referenced against:** RHDHPLAN-1509 (AI Catalog Discovery UI)

## Feature Structure

| Level   | Key           | Summary                                                               | Status      |
| ------- | ------------- | --------------------------------------------------------------------- | ----------- |
| Feature | RHDHPLAN-1513 | AI Catalog Ingestion Operations & Upstream Schema Alignment Readiness | In Progress |
| Epic    | RHIDP-15331   | Ingestion Health Admin Dashboard                                      | New         |
| Epic    | RHIDP-15332   | Connector Configuration Hot-Reload                                    | New         |
| Epic    | RHIDP-15334   | Upstream Schema Alignment Readiness                                   | New         |

**Note:** Epic RHIDP-15333 (Ingestion Audit Logging & Metrics) was closed and its audit logging scope absorbed into RHIDP-15277/RHIDP-15280 under RHDHPLAN-1508. The remaining metrics/analytics API scope is tracked via the `ingestion-audit-metrics` openspec change on this branch.

### Stories by Epic

**RHIDP-15331 (Ingestion Health Admin Dashboard):**
| Key | Summary | Frontend? |
|---|---|---|
| RHIDP-15335 | Per-connector health status API and data model | No (backend REST API) |
| RHIDP-15336 | **Ingestion health admin UI** | **Yes** |
| RHIDP-15337 | Actionable error classification | No (backend classification logic) |
| RHIDP-15338 | **Neo4j graph sync status panel** | **Yes** |
| RHIDP-15339 | **Disconnected-cluster health view differentiation** | **Yes** |

**RHIDP-15332 (Connector Configuration Hot-Reload):**
| Key | Summary | Frontend? |
|---|---|---|
| RHIDP-15340 | Connector config Zod schemas and RuntimeConfigResolver integration | No (backend config) |
| RHIDP-15341 | Hot-reload propagation to active connector instances | No (backend propagation) |
| RHIDP-15342 | **Admin UI for connector configuration** | **Yes** |

**RHIDP-15334 (Upstream Schema Alignment Readiness):**
| Key | Summary | Frontend? |
|---|---|---|
| RHIDP-15346 | Annotation specification document | No (documentation) |
| RHIDP-15347 | Dry-run migration-readiness tooling scaffold | No (CLI/backend tooling) |

## 1) Frontend Needs Covered by RHDHPLAN-1509

RHDHPLAN-1513's feature description explicitly identifies one frontend touchpoint with RHDHPLAN-1509:

> _"The ingestion operations layer produces and exposes the following metrics consumed by the Analytics tab (RHDHPLAN-1509, Journey 6 Step 16): (a) sync history, (b) quality scores, (c) match coverage."_

> _"The ingestion health admin view and all four metric types are exposed via a REST API...so the Analytics tab component (RHDHPLAN-1509) can retrieve them without embedding metric logic in the frontend."_

The relationship is clean:

- **RHDHPLAN-1513** produces the backend metrics REST API (sync history, quality scores, match coverage, Neo4j sync status)
- **RHDHPLAN-1509** renders those metrics in the Analytics tab (Journey 6, Step 16)

| RHDHPLAN-1513 AC (frontend aspect delegated to 1509) | RHDHPLAN-1509 Coverage                          |
| ---------------------------------------------------- | ----------------------------------------------- |
| Metrics visualization in Analytics tab               | RHDHPLAN-1509 Journey 6 Step 16 (Analytics tab) |

## 2) Frontend Needs NOT Covered by RHDHPLAN-1509

RHDHPLAN-1513 has **4 frontend stories** across 2 epics that are its own deliverables, not part of RHDHPLAN-1509. These are all **admin-facing operational UIs**, distinct from RHDHPLAN-1509's **developer-facing discovery UI**.

### A. Ingestion Health Admin UI (RHIDP-15336)

**What:** Admin dashboard section showing per-connector health cards with status indicators (healthy/degraded/failing), last sync attempt and success timestamps, error summaries with link to detailed error view, and "Force Sync" button per connector. Built on PatternFly design system.

**Why not in RHDHPLAN-1509:** RHDHPLAN-1509 is the developer-facing discovery UI (browse, search, detail pages). The ingestion health dashboard is an admin-facing operational tool. RHDHPLAN-1509's out-of-scope explicitly defers to other features for admin tooling.

### B. Neo4j Graph Sync Status Panel (RHIDP-15338)

**What:** A distinct panel within the admin dashboard showing Neo4j Knowledge Graph sync status: last sync timestamp, success/failure, node and relationship counts, current sync health indicator, and "Force Neo4j Re-sync" action (full or incremental).

**Why not in RHDHPLAN-1509:** This is operational monitoring of a backend data layer (Neo4j secondary index). No developer-facing UI equivalent exists — it's purely admin infrastructure health.

### C. Disconnected-Cluster Health View Differentiation (RHIDP-15339)

**What:** Visual treatment in the health dashboard that distinguishes intentionally disabled connectors (e.g., MCP Registry in an air-gapped cluster with no mirror) from connectors that are enabled but unexpectedly failing. Prevents false alarms and alert fatigue.

**Why not in RHDHPLAN-1509:** This is an enhancement to the admin health dashboard (RHIDP-15336). Developers never see connector health state — only admins do.

### D. Admin UI for Connector Configuration (RHIDP-15342)

**What:** Admin UI section for managing connector config at runtime: toggle connectors on/off, set endpoint URLs and sync schedules, view K8s Secret references (read-only). Changes saved via `AdminConfigService` DB overrides and take effect within 30s via `RuntimeConfigResolver` hot-reload.

**Why not in RHDHPLAN-1509:** Connector configuration management is an admin operational concern. RHDHPLAN-1509 consumes entities produced by connectors but has no role in configuring them. The admin UI lives in Boost's existing admin panel alongside model connection, system prompt, and agent config — not in the AI Catalog frontend plugin.

## 3) Uncovered RHIDP Jiras / OpenSpec Changes

All 4 frontend stories have RHIDP Jiras defined **and** have corresponding openspec changes on this branch:

| Frontend Story                                     | RHIDP Jira                | OpenSpec Change               | Spec                     |
| -------------------------------------------------- | ------------------------- | ----------------------------- | ------------------------ |
| RHIDP-15336 (Ingestion health admin UI)            | Defined under RHIDP-15331 | `ingestion-health-dashboard`  | `specs/admin-health-ui/` |
| RHIDP-15338 (Neo4j sync status panel)              | Defined under RHIDP-15331 | `ingestion-health-dashboard`  | `specs/admin-health-ui/` |
| RHIDP-15339 (Disconnected-cluster differentiation) | Defined under RHIDP-15331 | `ingestion-health-dashboard`  | `specs/admin-health-ui/` |
| RHIDP-15342 (Admin UI for connector config)        | Defined under RHIDP-15332 | `connector-config-hot-reload` | `specs/config-admin-ui/` |

**No gaps found.** All RHDHPLAN-1513 frontend work has Jira coverage and openspec specifications.

## OpenSpec Changes on This Branch Related to RHDHPLAN-1513

| OpenSpec Change               | Related Epics                                               | Frontend Specs?                                                                                                        |
| ----------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `ingestion-health-dashboard`  | RHIDP-15331                                                 | `admin-health-ui/` (frontend), `health-status-api/` (backend), `error-classification/` (backend)                       |
| `connector-config-hot-reload` | RHIDP-15332                                                 | `config-admin-ui/` (frontend), `config-schemas/` (backend), `hot-reload-propagation/` (backend)                        |
| `ingestion-audit-metrics`     | RHIDP-15333 (closed, partially absorbed into RHDHPLAN-1508) | `analytics-api/` (backend API consumed by RHDHPLAN-1509), `audit-events/` (backend), `eval-hub-integration/` (backend) |
| `upstream-schema-alignment`   | RHIDP-15334                                                 | `annotation-specification/` (docs), `migration-readiness-tooling/` (backend/CLI)                                       |

## Summary

RHDHPLAN-1513 has **4 frontend stories** that are NOT in RHDHPLAN-1509's scope:

- **3 admin health dashboard stories** (RHIDP-15336, 15338, 15339) under RHIDP-15331 that build the ingestion health admin dashboard with per-connector health cards, Neo4j sync panel, Force Sync actions, and air-gapped cluster differentiation
- **1 connector config admin UI story** (RHIDP-15342) under RHIDP-15332 that builds the runtime connector configuration section in Boost's admin panel

All 4 stories have RHIDP Jira coverage and openspec specifications on this branch. No gaps.

The relationship between RHDHPLAN-1513 and RHDHPLAN-1509 is clean:

- **RHDHPLAN-1513** builds admin-facing operational UIs (health dashboard, connector config) and backend metrics APIs
- **RHDHPLAN-1509** builds developer-facing discovery UIs (browse, search, detail, Analytics tab)
- **RHDHPLAN-1513** exposes metrics via REST API → **RHDHPLAN-1509** renders them in the Analytics tab
- No overlap: admin operational tooling (1513) vs. developer discovery experience (1509)

## Cross-Feature Frontend Summary (All 4 Features)

| Feature       | Frontend Stories NOT in RHDHPLAN-1509                                         | Total |
| ------------- | ----------------------------------------------------------------------------- | ----- |
| RHDHPLAN-1507 | None                                                                          | 0     |
| RHDHPLAN-1508 | RHIDP-15273 (graduated visibility), RHIDP-15307/15308/15309 (RBAC admin UI)   | 4     |
| RHDHPLAN-1510 | None                                                                          | 0     |
| RHDHPLAN-1513 | RHIDP-15336/15338/15339 (health dashboard), RHIDP-15342 (connector config UI) | 4     |
| **Total**     |                                                                               | **8** |

All 8 frontend stories have RHIDP Jira coverage and openspec specifications. No gaps across any feature.
