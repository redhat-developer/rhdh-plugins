# RHDHPLAN-1513 — Deferral Impact on 2.1 Staging and Jira

## Context

RHDHPLAN-1513 (Ingestion Operations & Schema Alignment) may be deferred from the 2.1 release. This document analyzes the impact on the staged GitHub issues in `rhdhplan1505-1-staged-issues.md` (29 issues across 3 dependency tiers covering RHDHPLAN-1507, 1508, 1510, and 1513).

## RHDHPLAN-1513 Epics

| Epic        | Name             |
| ----------- | ---------------- |
| RHIDP-15331 | Health Dashboard |
| RHIDP-15332 | Hot-Reload       |
| RHIDP-15334 | Schema Alignment |

Note: RHIDP-15333 (Ingestion Audit Metrics) was originally a 1513 epic but was consolidated into RHDHPLAN-1508 Epic RHIDP-15277. Its stories (Issue 29) are now 1508-owned.

## Story-Level Analysis by Epic

### Epic RHIDP-15331 (Health Dashboard) — 5 stories

| RHIDP Story | Description               | Start Issue | Start Tier | Complete Issue | Complete Tier |
| ----------- | ------------------------- | ----------- | ---------- | -------------- | ------------- |
| RHIDP-15335 | Health API + Data Model   | Issue 5     | Tier 0     | Issue 26       | Tier 2        |
| RHIDP-15337 | Error Classification      | Issue 5     | Tier 0     | Issue 5        | Tier 0        |
| RHIDP-15336 | Admin Health UI           | Issue 26    | Tier 2     | Issue 26       | Tier 2        |
| RHIDP-15338 | Neo4j Sync Status Panel   | Issue 27    | Tier 2     | Issue 27       | Tier 2        |
| RHIDP-15339 | Disconnected Cluster View | Issue 26    | Tier 2     | Issue 26       | Tier 2        |

RHIDP-15335 is the only multi-issue split in this epic: the health API and data model are defined in Issue 5 (Tier 0), but the force-sync backend routes consuming that data are in Issue 26 (Tier 2, task group 6 tagged `RHIDP-15335, RHIDP-15336`).

### Epic RHIDP-15332 (Hot-Reload) — 3 stories

| RHIDP Story | Description                                | Start Issue | Start Tier | Complete Issue | Complete Tier |
| ----------- | ------------------------------------------ | ----------- | ---------- | -------------- | ------------- |
| RHIDP-15340 | Zod Config Schemas + RuntimeConfigResolver | Issue 6     | Tier 0     | Issue 6        | Tier 0        |
| RHIDP-15341 | Hot-Reload Propagation to Connectors       | Issue 22    | Tier 1     | Issue 22       | Tier 1        |
| RHIDP-15342 | Connector Config Admin UI                  | Issue 28    | Tier 2     | Issue 28       | Tier 2        |

No multi-issue splits. Each story completes in a single issue. The entire Hot-Reload epic is a clean, isolated vertical — nothing outside of 1513 depends on Issue 6 or its downstream chain (Issues 22, 28).

### Epic RHIDP-15334 (Schema Alignment) — 2 stories (1513-owned)

| RHIDP Story | Description                      | Start Issue | Start Tier | Complete Issue | Complete Tier |
| ----------- | -------------------------------- | ----------- | ---------- | -------------- | ------------- |
| RHIDP-15346 | Annotation Specification Mapping | Issue 4     | Tier 0     | Issue 4        | Tier 0        |
| RHIDP-15347 | Migration Readiness CLI          | Issue 4     | Tier 0     | Issue 4        | Tier 0        |

Note: RHIDP-15302 (Migration Design Document) is also in Issue 4 but belongs to **RHDHPLAN-1507** Epic RHIDP-15258, not 1513. If 1513 is deferred, Issue 4 must be split — RHIDP-15302 stays, RHIDP-15346/15347 defer.

## 1513 Footprint Across Tiers

| Tier      | 1513 Issues       | Issue Count | Share of Tier |
| --------- | ----------------- | ----------- | ------------- |
| Tier 0    | Issues 4, 5, 6    | 3 of 7      | 43%           |
| Tier 1    | Issue 22          | 1 of 15     | 7%            |
| Tier 2    | Issues 26, 27, 28 | 3 of 7      | 43%           |
| **Total** |                   | **7 of 29** | **24%**       |

## Cross-Feature Entanglements

Three entanglements exist between 1513 issues and other features:

### 1. Issue 4 is shared with RHDHPLAN-1507

Issue 4 bundles RHIDP-15302 (Migration Design, 1507) with RHIDP-15346/15347 (Schema Alignment, 1513). Deferring 1513 requires splitting Issue 4 so that RHIDP-15302 can proceed independently.

### 2. Issue 29 (RHDHPLAN-1508) depends on Issue 5 (1513)

Issue 29 (Ingestion Analytics API, RHIDP-15280) is owned by RHDHPLAN-1508 but depends on Issue 5's health data model (RHIDP-15335, 1513). Deferring 1513 blocks Issue 29 unless it is also deferred or re-scoped to remove the health data dependency.

### 3. RHDHPLAN-1509 depends on Issue 5 (1513)

Per the cross-feature dependencies in the staging document, RHIDP-15167 (Entity page extensions, RHDHPLAN-1509) depends on RHIDP-15335 (Issue 5, 1513). Deferring 1513 breaks this chain unless RHDHPLAN-1509 is re-sequenced to not depend on the health API.

## Issues Safe to Run While Decision Is Pending

The 1513 decision does not block most of the staged work. Only issues whose dependency chain touches Issues 4, 5, or 6 are blocked. Everything else can proceed.

**Tier 0 (4 of 7):**

| Issue   | Feature       | Description                                                    |
| ------- | ------------- | -------------------------------------------------------------- |
| Issue 1 | RHDHPLAN-1510 | Cross-Connector Shared Infrastructure Package                  |
| Issue 2 | RHDHPLAN-1507 | Entity-Provider SDK — Types, Interfaces, Annotation Validation |
| Issue 3 | RHDHPLAN-1508 | AI Catalog Permissions, Backend Enforcement, Conditional Rules |
| Issue 7 | RHDHPLAN-1510 | MCP Mirror Endpoint + RHOAI Version Normalization              |

**Tier 1 (14 of 15) — all except Issue 22 (depends on Issue 6):**

| Issue    | Feature       | Description                           | Depends On |
| -------- | ------------- | ------------------------------------- | ---------- |
| Issue 8  | RHDHPLAN-1507 | SDK Delta Sync + Publish              | 1, 2       |
| Issue 9  | RHDHPLAN-1507 | OCI Core Connector                    | 1, 8       |
| Issue 10 | RHDHPLAN-1507 | OCI Multi-Registry + Air-Gapped       | 1, 9       |
| Issue 11 | RHDHPLAN-1507 | OCI Digest-Based Sync                 | 1, 9       |
| Issue 12 | RHDHPLAN-1507 | OCI Load Testing                      | 1, 9       |
| Issue 13 | RHDHPLAN-1510 | MCP TLS + Credential Hardening        | 1, 7       |
| Issue 14 | RHDHPLAN-1510 | MCP Annotation Enrichment             | 8, 13      |
| Issue 15 | RHDHPLAN-1510 | RHOAI MCP Catalog Source              | 8          |
| Issue 16 | RHDHPLAN-1510 | RHOAI Deployment Config               | 1, 15      |
| Issue 17 | RHDHPLAN-1507 | Neo4j Core Sync Adapter               | 2          |
| Issue 18 | RHDHPLAN-1507 | Neo4j SkillBundle Support             | 17         |
| Issue 19 | RHDHPLAN-1507 | Neo4j Docs + Observability            | 17, 18     |
| Issue 20 | RHDHPLAN-1508 | Version Policy Cascade + Default-Deny | 3          |
| Issue 21 | RHDHPLAN-1508 | RBAC Audit Logging                    | 3          |

**Tier 2 (3 of 7):**

| Issue    | Feature       | Description                   | Depends On |
| -------- | ------------- | ----------------------------- | ---------- |
| Issue 23 | RHDHPLAN-1508 | SkillBundle RBAC Filtering    | 3          |
| Issue 24 | RHDHPLAN-1508 | Graduated Visibility Frontend | 3, 1509    |
| Issue 25 | RHDHPLAN-1508 | RBAC Admin UI                 | 3, 20      |

**Total: 21 of 29 issues (72%) can proceed without the 1513 decision.**

Issues blocked pending the decision (8 of 29):

- **Issue 4** (Tier 0) — shared with 1507, needs splitting if deferred
- **Issue 5** (Tier 0) — cross-feature dependency from 1508 (Issue 29) and 1509 (RHIDP-15167)
- **Issue 6** (Tier 0) — pure 1513, isolated chain, but no reason to start if deferring
- **Issue 22** (Tier 1) — depends on Issue 6
- **Issue 26** (Tier 2) — depends on Issue 5
- **Issue 27** (Tier 2) — depends on Issues 5, 17
- **Issue 28** (Tier 2) — depends on Issues 6, 22
- **Issue 29** (Tier 2) — depends on Issues 5, 21 (1508-owned but health data dependency)

## Decision Deadline

The decision only becomes blocking **when the 1513-free work is exhausted** — i.e., when the 21 safe issues above are complete or in progress and the remaining 8 are next in line. Since this spans all three tiers, the natural buffer is substantial: the full duration of Tier 0 Issues 1, 2, 3, 7, then their Tier 1 and Tier 2 downstream chains. The decision does not need to be made before Tier 0 launches or even before Tier 1 begins.
