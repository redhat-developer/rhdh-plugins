# Migration-Readiness Tooling Scaffold

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.
>
> **Epic:** RHIDP-15334 (Upstream Schema Alignment Readiness). **Story:** RHIDP-15347 (Dry-run migration-readiness tooling scaffold).

## Overview

Read-only CLI command that enumerates AI Asset catalog entities and reports migration readiness. Per-entity report shows current kind/type → target RFC kind, transformation requirements, and confidence level. No destructive changes — read-only analysis only.

---

## Scenario: CLI enumerates AI Asset entities from catalog API

**GIVEN** a Backstage catalog with AI Asset entities  
**WHEN** the dry-run CLI is executed: `npx @red-hat-developer-hub/backstage-plugin-boost-migration-readiness --catalog-url <url>`  
**THEN** the tool:

- Queries the catalog API for all entities
- Filters entities that have `rhdh.io/ai-asset-category` annotation
- Returns a list of AI Asset entities with their current kind and `spec.type`

---

## Scenario: Per-entity mapping report generated

**GIVEN** AI Asset entities enumerated from the catalog  
**WHEN** the dry-run tool processes each entity  
**THEN** a per-entity report is generated including:

- Current entity kind and `spec.type`
- Target RFC entity kind (from annotation specification mapping)
- Confidence level (high/medium/low)
- List of fields requiring transformation
- Incompatibilities or warnings if applicable

---

## Scenario: Field transformation requirements identified

**GIVEN** an AI Asset entity with current kind/type  
**WHEN** the dry-run tool analyzes the entity  
**THEN** the report lists all fields that would need transformation during actual migration:

- Kind migration (e.g., `API` → `McpServer`)
- `spec.type` remapping or removal
- Custom field migrations if required by target RFC schema
- Annotation additions/removals

---

## Scenario: Confidence level reported per entity

**GIVEN** the annotation specification defines confidence levels per mapping  
**WHEN** the dry-run tool generates a per-entity report  
**THEN** each entity's report includes the confidence level from the mapping specification:

- **High:** RFC schema stable, migration path clear
- **Medium:** RFC active, schema may evolve
- **Low:** No corresponding RFC yet, mapping speculative

---

## Scenario: Read-only mode (no destructive changes)

**GIVEN** the dry-run tool is executed  
**WHEN** it queries the catalog and analyzes entities  
**THEN** no destructive changes occur:

- No entity writes via catalog API
- No entity deletions
- No catalog configuration modifications
- Tool reports analysis results only

---

## Scenario: JSON output format

**GIVEN** the dry-run tool completes analysis  
**WHEN** the user requests JSON output: `--output-format json`  
**THEN** the tool outputs machine-readable JSON:

```json
{
  "entities": [
    {
      "name": "my-mcp-server",
      "currentKind": "API",
      "currentSpecType": "mcp-server",
      "targetKind": "McpServer",
      "confidence": "medium",
      "transformations": [
        "Migrate kind: API → McpServer",
        "Preserve spec.type as type field"
      ]
    }
  ]
}
```

---

## Scenario: Human-readable output format

**GIVEN** the dry-run tool completes analysis  
**WHEN** the user requests human-readable output: `--output-format text` (default)  
**THEN** the tool outputs a formatted report:

```
Migration Readiness Report
=========================

Entity: my-mcp-server
  Current: kind=API, spec.type=mcp-server
  Target:  kind=McpServer (RFC #32062)
  Confidence: Medium
  Transformations:
    - Migrate kind: API → McpServer
    - Preserve spec.type as type field

---
This is a migration-readiness assessment.
Actual migration is future work pending RFC finalization.
```

---

## Scenario: Handles entities with missing annotations gracefully

**GIVEN** a catalog entity without `rhdh.io/ai-asset-category` annotation  
**WHEN** the dry-run tool enumerates entities  
**THEN** the entity is excluded from the report (no error thrown)

**AND GIVEN** a catalog entity with partial annotations (e.g., missing `rhdh.io/ai-asset-version`)  
**WHEN** the dry-run tool analyzes the entity  
**THEN** the report includes the entity with a warning: "Partial annotations — migration may require manual review"
