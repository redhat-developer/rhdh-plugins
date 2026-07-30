# RHDHPLAN-1510 Frontend Coverage Analysis

> **Date:** 2026-07-17
> **Feature:** MCP Registry & OpenShift AI (RHOAI) Connector
> **Cross-referenced against:** RHDHPLAN-1509 (AI Catalog Discovery UI)

## Feature Structure

| Level   | Key           | Summary                                                      | Status      |
| ------- | ------------- | ------------------------------------------------------------ | ----------- |
| Feature | RHDHPLAN-1510 | MCP Registry & OpenShift AI (RHOAI) Connector                | In Progress |
| Epic    | RHIDP-15313   | MCP Registry Connector — Productization & Air-Gapped Support | New         |
| Epic    | RHIDP-15314   | RHOAI Entity-Provider Connector (MCP Catalog)                | New         |
| Epic    | RHIDP-15316   | Cross-Connector Shared Infrastructure                        | New         |

### Stories by Epic

**RHIDP-15313 (MCP Registry Connector):**
| Key | Summary | Frontend? |
|---|---|---|
| RHIDP-15317 | MCP Registry mirror endpoint and zero-internet validation | No (backend connector config) |
| RHIDP-15318 | MCP Registry custom CA bundle and K8s Secret auth | No (backend TLS/credentials) |
| RHIDP-15319 | MCP Registry AI Asset annotation enrichment | No (backend annotation mapping) |

**RHIDP-15314 (RHOAI Connector):**
| Key | Summary | Frontend? |
|---|---|---|
| RHIDP-15320 | RHOAI Model Registry source — Kubeflow API ingestion and entity mapping | No (backend ingestion) — **Closed** |
| RHIDP-15321 | RHOAI version normalization | No (backend data mapping) |
| RHIDP-15322 | RHOAI MCP catalog source — developer-preview API ingestion | No (backend ingestion) |
| RHIDP-15323 | RHOAI per-source toggle and cross-cluster endpoint config | No (backend config) |

**RHIDP-15316 (Cross-Connector Shared Infrastructure):**
| Key | Summary | Frontend? |
|---|---|---|
| RHIDP-15265 | Configurable endpoint URLs and K8s Secret-only credentials with startup validation | No (backend config/validation) |
| RHIDP-15266 | Reference air-gapped connector configuration (Helm/Operator CR examples) | No (documentation) |
| RHIDP-15329 | Custom CA bundle resolution and TLS configuration for entity-provider connectors | No (backend shared utility) |
| RHIDP-15330 | Error resilience and fault isolation (per-entity and per-connector) | No (backend error handling) |

## 1) Frontend Needs Covered by RHDHPLAN-1509

RHDHPLAN-1510's feature description explicitly states frontend dependencies on RHDHPLAN-1509:

- _"Skills Marketplace — Journey 1 Step 2 (Browse the Skill Catalog) and Step 3 (View Skill Details): both steps depend directly on this connector providing rich, up-to-date skill metadata to the catalog UI delivered by RHDHPLAN-1509."_
- _"Each ingested asset appears as a versioned catalog entity using the AI Asset abstraction...carrying RHDH annotations...and is subject to the RBAC-gated visibility delivered by RHDHPLAN-1507 and RHDHPLAN-1508."_

All user-facing display of entities produced by RHDHPLAN-1510 connectors is delivered by RHDHPLAN-1509:

| RHDHPLAN-1510 Goal (frontend aspect)                                | RHDHPLAN-1509 Coverage                   | Status                 |
| ------------------------------------------------------------------- | ---------------------------------------- | ---------------------- |
| Developers browse and see MCP servers from MCP Registry             | RHIDP-15166 (Browse page)                | Closed                 |
| ~~Developers browse and see models/model servers from RHOAI~~       | ~~RHIDP-15166 (Browse page)~~            | _(RHDHPLAN-404 scope)_ |
| Filter by category (`mcp-server`, `ai-model`), source connector     | RHIDP-15166 + RHIDP-15449 (NFS filters)  | Closed / Review        |
| ~~View detail page for RHOAI-sourced `ai-model` with version info~~ | ~~RHIDP-15167 (Entity page extensions)~~ | _(RHDHPLAN-404 scope)_ |
| View detail page for MCP Registry-sourced `mcp-server`              | RHIDP-15167 (Entity page extensions)     | New                    |
| RBAC visibility enforcement hides denied entities                   | RHIDP-15164 (consumes RHDHPLAN-1508)     | In Progress            |

**Connector admin configuration UI** (enable/disable connectors, change endpoints, sync schedules) is covered by **RHDHPLAN-1513** (connector-config-hot-reload), not RHDHPLAN-1509 or RHDHPLAN-1510.

## 2) Frontend Needs NOT Covered by RHDHPLAN-1509

**None identified.**

RHDHPLAN-1510 is purely backend connector/ingestion work. All three epics are backend-only:

- **RHIDP-15313 (MCP Registry):** Mirror endpoint config, custom CA bundles, K8s Secret auth, AI Asset annotation enrichment — all backend entity-provider work
- **RHIDP-15314 (RHOAI):** RHOAI MCP catalog API ingestion, version normalization, enable/disable toggle — all backend entity-provider work _(Model Registry / Kubeflow is RHDHPLAN-404 scope)_
- **RHIDP-15316 (Cross-Connector):** Shared CA bundle utility, K8s Secret credential validation, fault isolation, reference config docs — all backend infrastructure and documentation

The feature's out-of-scope section reinforces this: _"Installing, deploying, invoking, or proxying MCP servers, AI models, model servers, or AI skills from RHDH — this Feature is discovery/metadata ingestion only."_

All openspec changes on this branch related to RHDHPLAN-1510 (`mcp-registry-connector`, `rhoai-connector`, `connector-shared-infrastructure`) contain zero frontend specs — confirmed by grep across all spec directories.

## 3) Uncovered RHIDP Jiras / OpenSpec Changes

N/A — category 2 is empty, so no gaps to fill.

## OpenSpec Changes on This Branch Related to RHDHPLAN-1510

All openspec changes are backend-only (no frontend specs):

| OpenSpec Change                   | Related Epic                                        | Spec Dirs                                                            |
| --------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------- |
| `mcp-registry-connector`          | RHIDP-15313                                         | `mirror-endpoint/`, `auth-tls-hardening/`, `annotation-enrichment/`  |
| `rhoai-connector`                 | RHIDP-15314                                         | `mcp-catalog-source/`, `deployment-config/`                          |
| `connector-shared-infrastructure` | RHIDP-15316                                         | `ca-bundle-resolution/`, `fault-isolation/`, `reference-app-config/` |
| `connector-config-hot-reload`     | RHIDP-15332 (RHDHPLAN-1513, cross-refs RHIDP-15316) | Config Admin UI is RHDHPLAN-1513 scope                               |

## Summary

RHDHPLAN-1510 is, like RHDHPLAN-1507, entirely backend work with zero frontend deliverables of its own. All 11 stories across 3 epics are backend entity-provider connectors, shared infrastructure utilities, or documentation.

The frontend relationship is clean:

- **RHDHPLAN-1510** produces entities (MCP servers from MCP Registry, models/model servers from RHOAI)
- **RHDHPLAN-1509** displays those entities in browse/search/detail pages (RHIDP-15166, 15167)
- **RHDHPLAN-1513** provides the admin config UI for managing connectors (connector-config-hot-reload)
- **RHDHPLAN-1508** applies RBAC visibility to those entities

No additional RHIDP stories or openspec changes are needed for frontend coverage.
