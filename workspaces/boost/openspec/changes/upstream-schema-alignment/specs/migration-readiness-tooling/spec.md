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

- Kind migration where applicable (e.g., `Resource` → `API` for model-server if [#34476](https://github.com/backstage/backstage/pull/34476) merges)
- Kind/name casing alignment (e.g., `AIResource` → `AiResource` for skills/rules)
- Field-level changes (e.g., adopt `spec.remotes` instead of `spec.definition` for MCP servers)
- Module opt-in requirements (e.g., `@backstage/plugin-catalog-backend-module-ai-model`)
- Annotation additions/removals

---

## Scenario: Confidence level reported per entity

**GIVEN** the annotation specification defines confidence levels per mapping  
**WHEN** the dry-run tool generates a per-entity report  
**THEN** each entity's report includes the confidence level from the mapping specification:

- **High:** Upstream kind shipped and stable, kind already aligned
- **Medium–High:** Upstream kind shipped, field/name alignment work remains
- **Medium/Low:** Upstream target proposed in an open PR, hedge accordingly
- **Low:** No solid upstream kind yet, mapping speculative

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
      "targetKind": "API",
      "targetModel": "McpServerApiEntity",
      "confidence": "high",
      "transformations": [
        "Kind already aligned (API). No kind change required.",
        "Adopt spec.remotes instead of spec.definition",
        "Opt in to @backstage/plugin-catalog-backend-module-ai-model"
      ]
    },
    {
      "name": "my-skill",
      "currentKind": "AIResource",
      "currentSpecType": "skill",
      "targetKind": "AiResource",
      "confidence": "medium-high",
      "transformations": [
        "Kind/name casing alignment: AIResource → AiResource",
        "Field alignment per upstream AiResource schema"
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
  Target:  kind=API (McpServerApiEntity, backstage#34016)
  Confidence: High
  Transformations:
    - Kind already aligned (API). No kind change required.
    - Adopt spec.remotes instead of spec.definition
    - Opt in to @backstage/plugin-catalog-backend-module-ai-model

Entity: my-skill
  Current: kind=AIResource, spec.type=skill
  Target:  kind=AiResource (upstream shipped, #33575)
  Confidence: Medium–High
  Transformations:
    - Kind/name casing alignment: AIResource → AiResource
    - Field alignment per upstream AiResource schema

---
This is a migration-readiness assessment.
Actual migration is future work pending upstream stabilization.
```

---

## Scenario: Handles entities with missing annotations gracefully

**GIVEN** a catalog entity without `rhdh.io/ai-asset-category` annotation  
**WHEN** the dry-run tool enumerates entities  
**THEN** the entity is excluded from the report (no error thrown)

**AND GIVEN** a catalog entity with partial annotations (e.g., missing `rhdh.io/ai-asset-version`)  
**WHEN** the dry-run tool analyzes the entity  
**THEN** the report includes the entity with a warning: "Partial annotations — migration may require manual review"
