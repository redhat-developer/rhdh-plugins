# Cross-Feature Frontend Coverage Summary

> **Date:** 2026-07-17
> **Scope:** RHDHPLAN-1507, 1508, 1510, 1513
> **Cross-referenced against:** RHDHPLAN-1509 (AI Catalog Discovery UI)

## Overview

RHDHPLAN-1509 covers all **developer-facing** discovery UI (browse, search, detail pages). However, **8 admin-facing frontend stories** across RHDHPLAN-1508 and RHDHPLAN-1513 fall outside RHDHPLAN-1509's scope and must be delivered independently. All 8 have RHIDP Jira coverage and openspec specifications on this branch.

## Per-Feature Breakdown

| Feature       | Summary                                          | Frontend Stories Outside 1509           | Count |
| ------------- | ------------------------------------------------ | --------------------------------------- | ----- |
| RHDHPLAN-1507 | AI Asset Entity Model & Ingestion Framework      | None — purely backend SDK/ingestion     | **0** |
| RHDHPLAN-1508 | AI Catalog RBAC & Versioning Policy Model        | Graduated visibility UI + RBAC Admin UI | **4** |
| RHDHPLAN-1510 | MCP Registry & RHOAI Connector                   | None — purely backend connectors        | **0** |
| RHDHPLAN-1513 | Ingestion Operations & Upstream Schema Alignment | Health dashboard + Connector config UI  | **4** |
|               |                                                  | **Total**                               | **8** |

## The 8 Frontend Stories

### RHDHPLAN-1508 — RBAC & Versioning Policy (4 stories)

| Story       | Epic                               | What It Builds                                                                                                                                                                                                                                      | OpenSpec                                                    |
| ----------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| RHIDP-15273 | RHIDP-15270 (Graduated Visibility) | `RequirePermission` gating on entity detail pages — users with `ai-catalog.asset.access` but not `ai-catalog.asset.access.usage-docs` see redacted fields with "request access" placeholder. Also includes SkillBundle filtered-skill UX messaging. | `ai-catalog-asset-governance` `specs/graduated-visibility/` |
| RHIDP-15307 | RHIDP-15304 (RBAC Admin UI)        | AI Catalog Policy Dashboard — summary view of active policies grouped by category and connector                                                                                                                                                     | `ai-catalog-asset-governance` `specs/rbac-admin-ui/`        |
| RHIDP-15308 | RHIDP-15304 (RBAC Admin UI)        | Category and Connector Policy Editor — create/edit/delete conditional RBAC policies, no raw YAML                                                                                                                                                    | `ai-catalog-asset-governance` `specs/rbac-admin-ui/`        |
| RHIDP-15309 | RHIDP-15304 (RBAC Admin UI)        | Default Posture Configuration — UI for default-allow/deny per category and per connector                                                                                                                                                            | `ai-catalog-asset-governance` `specs/default-deny-config/`  |

**Theme:** Permission-gated content rendering (1 story) + standalone RBAC admin page at `/ai-catalog/admin/rbac` (3 stories)

### RHDHPLAN-1513 — Ingestion Operations (4 stories)

| Story       | Epic                           | What It Builds                                                                                                                                                      | OpenSpec                                               |
| ----------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| RHIDP-15336 | RHIDP-15331 (Health Dashboard) | Per-connector health cards with status indicators (healthy/degraded/failing), timestamps, error summaries, "Force Sync" buttons. PatternFly design.                 | `ingestion-health-dashboard` `specs/admin-health-ui/`  |
| RHIDP-15338 | RHIDP-15331 (Health Dashboard) | Neo4j graph sync status panel — sync timestamps, node/relationship counts, "Force Neo4j Re-sync" action                                                             | `ingestion-health-dashboard` `specs/admin-health-ui/`  |
| RHIDP-15339 | RHIDP-15331 (Health Dashboard) | Disconnected-cluster health differentiation — visually distinguishes intentionally disabled connectors from enabled-but-failing                                     | `ingestion-health-dashboard` `specs/admin-health-ui/`  |
| RHIDP-15342 | RHIDP-15332 (Hot-Reload)       | Admin UI for connector config — toggle enable/disable, endpoint URLs, sync schedules, K8s Secret references (read-only). Saves via AdminConfigService DB overrides. | `connector-config-hot-reload` `specs/config-admin-ui/` |

**Theme:** Admin health dashboard in Boost admin panel (3 stories) + runtime connector config section (1 story)

## Relationship to RHDHPLAN-1509

RHDHPLAN-1509 delivers the **developer-facing** AI Catalog frontend:

- Browse page with search and filters (RHIDP-15166 — **Closed**)
- Entity page extensions and adoption actions (RHIDP-15167 — **New**)
- Extensible browse filters via NFS (RHIDP-15449 — Review)
- Translations, E2E tests, dynamic plugin export (RHIDP-15479, 15480, 15481)
- Analytics tab rendering (Journey 6 Step 16 — consumes RHDHPLAN-1513 metrics API)

The 8 stories above are **admin-facing** and live in two distinct UI surfaces:

1. **RBAC Admin UI** (RHDHPLAN-1508) — standalone page calling RBAC REST API directly, gated by `ai-catalog.admin` permission
2. **Boost Admin Panel** (RHDHPLAN-1513) — new sections in existing admin panel for health monitoring and connector config

No overlap. RHDHPLAN-1509 renders entities; RHDHPLAN-1508 gates sections of those renderings; RHDHPLAN-1513 manages the connectors that produce them.

### RHIDP-15167 — The Key Open Dependency Hub

With RHIDP-15166 (Browse page) already **Closed**, **RHIDP-15167** (Entity page extensions and adoption actions) is the remaining critical story under RHDHPLAN-1509 with active cross-feature dependencies:

| Direction                         | Our Story                   | Relationship                                                                                             | Rationale                                   |
| --------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| **RHIDP-15167 is depended on by** | RHIDP-15273 (RHDHPLAN-1508) | Graduated visibility frontend wraps RHIDP-15167's entity page components with `RequirePermission` gating | Cannot gate what hasn't been built yet      |
| **RHIDP-15167 depends on**        | RHIDP-15335 (RHDHPLAN-1513) | RHIDP-15167's Analytics tab (Journey 6 Step 16) consumes the per-connector health status API             | Cannot render metrics without a metrics API |

Both dependency links are registered in Jira as story-to-story "Depend" relationships.

## Interface Boundaries

```
Developer-facing (RHDHPLAN-1509)          Admin-facing (1508 + 1513)
┌──────────────────────────────┐         ┌──────────────────────────────┐
│  Browse Page (RHIDP-15166)   │         │  RBAC Admin UI (RHIDP-15304) │
│  Entity Page (RHIDP-15167)   │◄────────│    Policy Dashboard (15307)  │
│    └─ RequirePermission gate │ gates   │    Policy Editor (15308)     │
│       (RHIDP-15273)          │ sections│    Default Posture (15309)   │
│  NFS Filters (RHIDP-15449)   │         ├──────────────────────────────┤
│  Analytics Tab (Journey 6)   │◄────────│  Boost Admin Panel           │
│                              │consumes │    Health Dashboard (15336)  │
│                              │ metrics │    Neo4j Panel (15338)       │
│                              │  API    │    Air-gap Diff (15339)      │
│                              │         │    Connector Config (15342)  │
└──────────────────────────────┘         └──────────────────────────────┘
         ▲                                          ▲
         │ displays                                 │ manages
         │                                          │
    ┌────┴──────────────────────────────────────────┴────┐
    │           Backend Connectors & SDK                  │
    │  RHDHPLAN-1507 (SDK) + RHDHPLAN-1510 (Connectors)  │
    │           0 frontend stories                        │
    └────────────────────────────────────────────────────┘
```

## Conclusion

- **RHDHPLAN-1509** covers all **developer-facing** discovery UI (browse, search, detail pages, Analytics tab)
- **RHDHPLAN-1508** owns **4 admin-facing frontend stories** not covered by RHDHPLAN-1509: graduated visibility gating (RHIDP-15273) and RBAC Admin UI (RHIDP-15307, 15308, 15309)
- **RHDHPLAN-1513** owns **4 admin-facing frontend stories** not covered by RHDHPLAN-1509: ingestion health dashboard (RHIDP-15336, 15338, 15339) and connector config UI (RHIDP-15342)
- **RHDHPLAN-1507 and 1510** are purely backend with zero frontend deliverables
- **No gaps** — every identified frontend need has a Jira story and an openspec specification
