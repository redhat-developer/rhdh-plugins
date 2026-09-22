# RHDHPLAN-1507 Frontend Coverage Analysis

> **Date:** 2026-07-17
> **Feature:** AI Asset Entity Model & Ingestion Framework
> **Cross-referenced against:** RHDHPLAN-1509 (AI Catalog Discovery UI)

## Feature Structure

| Level   | Key           | Summary                                         | Status      |
| ------- | ------------- | ----------------------------------------------- | ----------- |
| Feature | RHDHPLAN-1507 | AI Asset Entity Model & Ingestion Framework     | In Progress |
| Epic    | RHIDP-15258   | Entity-Provider SDK Package with Typed Contract | New         |
| Epic    | RHIDP-15294   | OCI Skill Registry Ingestion Framework          | New         |
| Epic    | RHIDP-15295   | Neo4j Knowledge Graph Sync Adapter              | New         |

### Stories by Epic

**RHIDP-15258 (SDK):** RHIDP-15255, 15259, 15260, 15262, 15302, 15303 (6 stories, all New)
**RHIDP-15294 (OCI Skill Registry):** RHIDP-15268, 15296, 15297, 15298 (4 stories, all New)
**RHIDP-15295 (Neo4j Sync):** RHIDP-15299, 15300, 15301 (3 stories, all New)

## RHDHPLAN-1509 Structure (Cross-Reference)

| Level   | Key           | Summary                                                 | Status      |
| ------- | ------------- | ------------------------------------------------------- | ----------- |
| Feature | RHDHPLAN-1509 | AI Catalog Discovery UI — Browse, Search & Detail Pages | New         |
| Epic    | RHIDP-15164   | [Agentic] AI Catalog Frontend Plugin                    | In Progress |
| Story   | RHIDP-15165   | Plugin scaffold and dev app                             | **Closed**  |
| Story   | RHIDP-15166   | Browse page with search and filters                     | **Closed**  |
| Story   | RHIDP-15167   | Entity page extensions and adoption actions             | New         |
| Story   | RHIDP-15449   | Extensible browse filters via NFS                       | Review      |
| Story   | RHIDP-15479   | Add translations for supported languages                | New         |
| Story   | RHIDP-15480   | E2E tests with Playwright                               | New         |
| Story   | RHIDP-15481   | Dynamic plugin export and overlay registration          | New         |

## 1) Frontend Needs Covered by RHDHPLAN-1509

RHDHPLAN-1507's feature description explicitly states: _"no new top-level navigation is required for this Feature (the dedicated AI Catalog UI is delivered in RHDHPLAN-1509)"_ and out-of-scope says _"Any user-facing AI Catalog browse/search/detail UI beyond what the existing generic Software Catalog UI already renders for Resource/Component entities — delivered in RHDHPLAN-1509."_

All RHDHPLAN-1507 acceptance criteria with frontend aspects map to existing RHDHPLAN-1509 stories:

| RHDHPLAN-1507 Acceptance Criteria (frontend aspect)        | RHDHPLAN-1509 Coverage                  | Status          |
| ---------------------------------------------------------- | --------------------------------------- | --------------- |
| AI assets browsable with card grid, grouped by category    | RHIDP-15166 (Browse page)               | Closed          |
| Filter by category, source connector, tags                 | RHIDP-15166 + RHIDP-15449 (NFS filters) | Closed / Review |
| Detail page: name, description, category, source, versions | RHIDP-15167 (Entity page extensions)    | New             |
| "How to use this" panel with TechDocs rendering            | RHIDP-15167                             | New             |
| Skill spec body fetchable on demand via OCI annotation     | RHIDP-15167 (entity page extensions)    | New             |
| Global/federated search includes AI assets                 | RHIDP-15166                             | Closed          |
| RBAC visibility enforcement in UI                          | RHIDP-15164 (consumes RHDHPLAN-1508)    | In Progress     |
| Dynamic plugin export                                      | RHIDP-15481                             | New             |
| Theming, accessibility, air-gapped UI, empty/error states  | RHIDP-15164 (baseline)                  | In Progress     |

## 2) Frontend Needs NOT Covered by RHDHPLAN-1509

**None identified.**

RHDHPLAN-1507 is purely entity model + backend SDK + ingestion framework. All three epics are backend-only:

- **RHIDP-15258 (SDK):** TypeScript interfaces, annotation validation, delta sync abstractions, Neo4j adapter interface, skillcard.yaml validation — no frontend
- **RHIDP-15294 (OCI Skill Registry):** OCI artifact fetching, skillcard parsing, multi-registry config, digest-based sync — no frontend
- **RHIDP-15295 (Neo4j Sync):** Relationship mapping, SkillBundle nodes, graph sync — no frontend

The standard Backstage catalog UI renders AI entities out of the box since they use existing entity kinds (Resource, Component, AIResource). Everything beyond basic catalog visibility is RHDHPLAN-1509's scope.

## 3) Uncovered RHIDP Jiras / OpenSpec Changes

N/A — category 2 is empty, so no gaps to fill.

## OpenSpec Changes on This Branch Related to RHDHPLAN-1507

The following openspec changes relate to RHDHPLAN-1507 and are all backend-only (no frontend specs):

| OpenSpec Change             | Related Epic                                        |
| --------------------------- | --------------------------------------------------- |
| `ai-catalog-entity-model`   | RHIDP-15258 (SDK)                                   |
| `oci-skill-registry`        | RHIDP-15294 (OCI Skill Registry)                    |
| `oci-skill-connector`       | RHIDP-15294 (absorbed RHIDP-15315)                  |
| `neo4j-knowledge-graph`     | RHIDP-15295 (Neo4j Sync)                            |
| `upstream-schema-alignment` | RHIDP-15334 (RHDHPLAN-1513, cross-refs RHIDP-15258) |

## Summary

RHDHPLAN-1507 is the cleanest feature from a frontend perspective — it has zero frontend work of its own, and all UI needs are fully covered by RHDHPLAN-1509's existing epic (RHIDP-15164) and its stories. No additional RHIDP stories or openspec changes are needed for frontend coverage.
