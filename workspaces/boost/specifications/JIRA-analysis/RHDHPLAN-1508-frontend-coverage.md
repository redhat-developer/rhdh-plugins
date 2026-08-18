# RHDHPLAN-1508 Frontend Coverage Analysis

> **Date:** 2026-07-17
> **Feature:** AI Catalog RBAC & Versioning Policy Model
> **Cross-referenced against:** RHDHPLAN-1509 (AI Catalog Discovery UI)

## Feature Structure

| Level   | Key           | Summary                                                | Status      |
| ------- | ------------- | ------------------------------------------------------ | ----------- |
| Feature | RHDHPLAN-1508 | AI Catalog RBAC & Versioning Policy Model              | In Progress |
| Epic    | RHIDP-15270   | AI Catalog Graduated Visibility Permissions            | New         |
| Epic    | RHIDP-15274   | Version-Level Policy Cascade for AI Catalog Assets     | New         |
| Epic    | RHIDP-15277   | AI Catalog RBAC Audit Logging                          | New         |
| Epic    | RHIDP-15304   | RBAC Admin UI Section for AI Catalog Policy Management | New         |

### Stories by Epic

**RHIDP-15270 (Graduated Visibility):**
| Key | Summary | Frontend? |
|---|---|---|
| RHIDP-15271 | Define and register `ai-catalog.asset.access` permission | No (backend) |
| RHIDP-15272 | Define `ai-catalog.asset.access.usage-docs` with field-level filtering | No (backend) |
| RHIDP-15273 | **Frontend graduated visibility with RequirePermission gating** | **Yes** |
| RHIDP-15306 | Define and register `ai-catalog.admin` permission | No (backend) |
| RHIDP-15310 | Backend read-time RBAC filtering for SkillBundle skill lists | No (backend, UX messaging absorbed into RHIDP-15273) |
| RHIDP-15312 | Per-category and per-connector conditional policy backend support | No (backend) |

**RHIDP-15274 (Version-Level Policy Cascade):**
| Key | Summary | Frontend? |
|---|---|---|
| RHIDP-15275 | Implement asset-level to version-level policy evaluation and cascade logic | No (backend) |

**RHIDP-15277 (Audit Logging):**
| Key | Summary | Frontend? |
|---|---|---|
| RHIDP-15279 | Emit audit events for RBAC policy changes on AI catalog assets | No (backend) |
| RHIDP-15280 | Emit audit events for entity provider ingestion sync cycles | No (backend) |

**RHIDP-15304 (RBAC Admin UI):**
| Key | Summary | Frontend? |
|---|---|---|
| RHIDP-15307 | **AI Catalog Policy Dashboard in RBAC Admin UI** | **Yes** |
| RHIDP-15308 | **Category and Connector Policy Editor in RBAC Admin UI** | **Yes** |
| RHIDP-15309 | **Default Posture Configuration UI for AI Catalog** | **Yes** |

## 1) Frontend Needs Covered by RHDHPLAN-1509

RHDHPLAN-1509's feature acceptance criteria state: _"All visibility enforcement (browse list, search results including global search, and detail page direct navigation by URL/entity reference) consistently applies the RBAC policies defined by RHDHPLAN-1508."_

This covers the **binary entity visibility** layer — i.e., when a user is denied `ai-catalog.asset.access`, the entity is hidden from browse, search, and direct URL access:

| RHDHPLAN-1508 AC (frontend aspect)                                                         | RHDHPLAN-1509 Coverage    | Status      |
| ------------------------------------------------------------------------------------------ | ------------------------- | ----------- |
| Entity hidden from browse/search when `ai-catalog.asset.access` denied                     | RHIDP-15166 (Browse page) | Closed      |
| Entity hidden from direct URL when `ai-catalog.asset.access` denied                        | RHIDP-15167 (Entity page) | New         |
| No-leakage guarantee (no distinguishable errors between "doesn't exist" and "not visible") | RHIDP-15164 (baseline)    | In Progress |

## 2) Frontend Needs NOT Covered by RHDHPLAN-1509

RHDHPLAN-1508 has **4 frontend stories** across 2 epics that are its own deliverables, not part of RHDHPLAN-1509:

### A. Graduated Visibility UI (RHIDP-15273)

**What:** `RequirePermission` gating on entity detail pages. Users with `ai-catalog.asset.access` but NOT `ai-catalog.asset.access.usage-docs` see the asset's name, category, description, owner, and version list, but usage/install instructions, configuration snippets, and connection endpoints are replaced with a "request access" / "contact owner" placeholder.

**Why not in RHDHPLAN-1509:** RHDHPLAN-1509 only handles binary visibility (asset exists vs. hidden). The graduated tier-2 model (asset visible but sensitive fields redacted) is RHDHPLAN-1508's own concern. RHDHPLAN-1509 _renders_ the entity detail page (RHIDP-15167), but RHDHPLAN-1508 _gates_ specific sections of it (RHIDP-15273).

**Also includes:** SkillBundle UX messaging (absorbed from closed RHIDP-15311) — when a bundle contains a mix of permitted and restricted skills, the UI communicates that some skills are filtered.

### B. RBAC Admin UI for AI Catalog (RHIDP-15304, 3 stories)

**What:** A standalone admin page at `/ai-catalog/admin/rbac` (a new frontend plugin page calling the RBAC REST API directly), accessible only to users with `ai-catalog.admin`. Three stories:

| Story       | What it builds                                                                                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| RHIDP-15307 | Policy Dashboard — summary view of all active AI Catalog policies grouped by category and connector                                                                                                    |
| RHIDP-15308 | Category and Connector Policy Editor — create/edit/delete conditional policies for `ai-catalog.asset.access` and `ai-catalog.asset.access.usage-docs` with category and connector filters, no raw YAML |
| RHIDP-15309 | Default Posture Configuration — UI to set default-allow/deny per category and per connector                                                                                                            |

**Why not in RHDHPLAN-1509:** RHDHPLAN-1509 is the discovery UI (browse, search, detail pages for developers). Admin RBAC management is a distinct concern. RHDHPLAN-1509's out-of-scope explicitly says: _"Defining or implementing the RBAC policy model itself (delivered by RHDHPLAN-1508); this feature only consumes and enforces the policies that RHDHPLAN-1508 provides."_

**Feasibility note:** The upstream RBAC admin UI (`@backstage-community/plugin-rbac`) has no frontend extension points — no way to inject an "AI Catalog" tab. The standalone page pattern (calling RBAC REST API directly) follows the same approach as existing RHDH admin pages.

## 3) Uncovered RHIDP Jiras / OpenSpec Changes

All 4 frontend stories have RHIDP Jiras defined **and** have corresponding openspec changes on this branch:

| Frontend Story                        | RHIDP Jira                | OpenSpec Change               | Spec                              |
| ------------------------------------- | ------------------------- | ----------------------------- | --------------------------------- |
| RHIDP-15273 (Graduated visibility UI) | Defined under RHIDP-15270 | `ai-catalog-asset-governance` | `specs/graduated-visibility/`     |
| RHIDP-15273 (also)                    | "                         | `security-safety-governance`  | `specs/fine-grained-permissions/` |
| RHIDP-15307 (Policy Dashboard)        | Defined under RHIDP-15304 | `ai-catalog-asset-governance` | `specs/rbac-admin-ui/`            |
| RHIDP-15308 (Policy Editor)           | Defined under RHIDP-15304 | `ai-catalog-asset-governance` | `specs/rbac-admin-ui/`            |
| RHIDP-15309 (Default Posture UI)      | Defined under RHIDP-15304 | `ai-catalog-asset-governance` | `specs/default-deny-config/`      |

**No gaps found.** All RHDHPLAN-1508 frontend work has Jira coverage and openspec specifications.

## OpenSpec Changes on This Branch Related to RHDHPLAN-1508

| OpenSpec Change               | Related Epics                             | Frontend Specs?                                                |
| ----------------------------- | ----------------------------------------- | -------------------------------------------------------------- |
| `security-safety-governance`  | RHIDP-15270 (cross-refs)                  | `fine-grained-permissions` touches RHIDP-15273                 |
| `ai-catalog-asset-governance` | RHIDP-15270, 15274, 15277, 15304          | `graduated-visibility`, `rbac-admin-ui`, `default-deny-config` |
| `ingestion-audit-metrics`     | RHIDP-15277 (absorbed from RHDHPLAN-1513) | `audit-events` (backend only), `analytics-api` (backend only)  |

## Summary

RHDHPLAN-1508 has **4 frontend stories** that are NOT in RHDHPLAN-1509's scope:

- **1 graduated visibility story** (RHIDP-15273) that adds `RequirePermission` gating to the entity detail page built by RHDHPLAN-1509
- **3 admin UI stories** (RHIDP-15307, 15308, 15309) under a dedicated RBAC Admin UI epic (RHIDP-15304) that build a standalone policy management page

All 4 stories have RHIDP Jira coverage and openspec specifications on this branch. No gaps.

The relationship between RHDHPLAN-1508 and RHDHPLAN-1509 is clean:

- **RHDHPLAN-1509** builds the entity detail page → RHIDP-15167
- **RHDHPLAN-1508** gates sections of that page with permissions → RHIDP-15273
- **RHDHPLAN-1509** enforces binary visibility (show/hide entity) in browse/search
- **RHDHPLAN-1508** adds graduated visibility (show entity, hide sensitive fields) and admin management UI
