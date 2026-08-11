# Migration Plan: RHDH AI-Asset Entities to Upstream Backstage Kinds

> **Status: Draft** | **Last updated: 2026-08-11** | **Story: RHIDP-15302**
>
> **Epic:** RHIDP-15258 (Entity-Provider SDK) | **Feature:** RHDHPLAN-1507
>
> **Sign-off:** Pending RHDH architect review (see [Sign-Off](#sign-off))

This document maps current RHDH AI-asset entities (per
[Decision 1](../../design.md)) to upstream Backstage entity kind targets,
documents field-level transformation rules, identifies consumer-facing
impact, and specifies the backward compatibility strategy.

This is **readiness design** — it documents the migration path
without executing migration. The actual migration is future work
dependent on upstream RFC finalization.

## Context

This plan exists because RHDH ships custom entity kinds and annotations
(`AIResource`, `rhdh.io/ai-asset-category`, etc.) that diverge from
upstream Backstage kinds as they stabilize (`AiResource`,
`McpServerApiEntity`). Customers need a documented path from current to
upstream schemas so their catalog integrations, filters, and entity refs
continue to work through the transition.

Key inputs:

- [ai-catalog-entity-model/design.md Decision 1](../../design.md) —
  current seven-category model.
- Upstream RFCs/PRs: `McpServerApiEntity`
  ([#34016](https://github.com/backstage/backstage/pull/34016)),
  `AiResource` ([#34261](https://github.com/backstage/backstage/pull/34261);
  [#33575](https://github.com/backstage/backstage/issues/33575) lineage),
  model-server candidate
  ([#34476](https://github.com/backstage/backstage/pull/34476)).
- Reconciliation in
  [#4189](https://github.com/redhat-developer/rhdh-plugins/pull/4189).

## Risks

- **Upstream PR rejection:** The model-server mapping
  (`Resource` -> `API`) depends on an open PR
  ([#34476](https://github.com/backstage/backstage/pull/34476)). If
  declined, that row must be redesigned.
- **Inbound relationship breakage:** When an entity's kind changes
  (e.g., `Resource` -> `API` for model-server), catalog identity is the
  tuple `(kind, namespace, name)`, so the change is an **identity cutover**
  (`resource:` -> `api:`), not an in-place rewrite of the same entity.
  Inbound relationships and hardcoded refs in other entities are **not**
  automatically rewritten by the catalog — a separate migration plan
  for ref consumers is required (see [Future Work](#future-work)).
- **Kind-filter breakage during transition:** Annotation retention
  supports **annotation-based** queries during the transition period, but
  pre-migration **kind** filters (e.g., `kind=Resource`) will **not**
  match after a kind change. Consumers using kind+annotation AND filters
  must switch to annotation-only or new-kind queries. See
  [Backward Compatibility Strategy](#backward-compatibility-strategy).
- **Agent kind uncertainty:** No upstream agent kind exists via RFC
  #32062. Downstream
  [rhdh-plugins#4164](https://github.com/redhat-developer/rhdh-plugins/pull/4164)
  (merged) ships `AiResource` / `spec.type: agent` in ai-integrations,
  while Decision 1 / boost still classify agents as
  `Component` / `ai-agent` until boost migrates.

## Binding Decisions

The following decisions are resolved and are not re-litigated here:

- **Current-state SoT:**
  [ai-catalog-entity-model/design.md Decision 1](../../design.md) —
  seven categories (`agent`, `skill`, `rule`, `skill-bundle`,
  `mcp-server`, `ai-model`, `model-server`).
- **MCP alignment:** RFC
  [#32062](https://github.com/backstage/backstage/issues/32062) Option 3
  shipped as `McpServerApiEntity`
  ([backstage#34016](https://github.com/backstage/backstage/pull/34016)).
  `kind: API` stays. No `API` -> `McpServer` kind rename.
- **Skills/rules:** `AiResource` shipped upstream via
  [backstage#34261](https://github.com/backstage/backstage/pull/34261)
  ([#33575](https://github.com/backstage/backstage/issues/33575) RFC
  lineage). Decision 1 / OpenSpec prose often still writes `AIResource`;
  shipped boost runtime already matches `AiResource` case-insensitively
  (`airesource` in `isAiAsset`; fixtures use `kind: AiResource`).
  Remaining work: align OpenSpec/Decision 1 spelling and any emitters
  still writing `AIResource` to canonical `AiResource` (filters already
  OK).
- **RHDHPLAN-1113 resolved:** Boost uses AiResource-kind skills/rules
  directly (Decision 1 may still spell `AIResource`). The dual-path
  interim narrative is retired.
- **`vector-store` / `ai-tool`:** Out of scope for this seven-category
  upstream-migration SoT (Augment POC vestiges per
  [gate comment](https://github.com/redhat-developer/rhdh-plugins/issues/4042#issuecomment-5204217995)).
  Boost frontend still recognizes them via `isAiAsset`
  (`Resource` + `ai-tool` / `vector-store`) and fixtures until
  explicitly retired.
- **Sign-off scope:** RHDH architect / tech lead (not upstream
  maintainer required).

## Confidence Levels

Each mapping carries a confidence level reflecting the maturity of the
upstream target:

| Level       | Meaning                                                   |
| ----------- | --------------------------------------------------------- |
| High        | Upstream kind shipped and stable; kind already aligned    |
| Medium–High | Upstream kind shipped; field/name alignment work remains  |
| Medium/Low  | Upstream target proposed in an open PR; hedge accordingly |
| Low         | No solid upstream kind yet, or mapping is speculative     |

## Current-to-Upstream Mapping Table

Source of truth for current state:
[ai-catalog-entity-model/design.md Decision 1](../../design.md).
Mapping tables reconciled via
[#4188](https://github.com/redhat-developer/rhdh-plugins/issues/4188) /
[#4189](https://github.com/redhat-developer/rhdh-plugins/pull/4189).

| Category       | Current Kind | Current `spec.type` | Current Annotation                        | Upstream Target                                                                                                                                                               | Confidence  |
| -------------- | ------------ | ------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `mcp-server`   | API          | `mcp-server`        | `rhdh.io/ai-asset-category: mcp-server`   | Same — `McpServerApiEntity` ([#34016](https://github.com/backstage/backstage/pull/34016), merged)                                                                             | High        |
| `skill`        | AIResource   | `skill`             | `rhdh.io/ai-asset-category: skill`        | `AiResource` ([#34261](https://github.com/backstage/backstage/pull/34261) merged; [#33575](https://github.com/backstage/backstage/issues/33575) lineage)                      | Medium–High |
| `rule`         | AIResource   | `rule`              | `rhdh.io/ai-asset-category: rule`         | `AiResource` ([#34261](https://github.com/backstage/backstage/pull/34261) merged; [#33575](https://github.com/backstage/backstage/issues/33575) lineage)                      | Medium–High |
| `model-server` | Resource     | `ai-model-server`   | `rhdh.io/ai-asset-category: model-server` | Candidate `API` / `ai-model-server` ([#34476](https://github.com/backstage/backstage/pull/34476), open)                                                                       | Medium/Low  |
| `ai-model`     | Resource     | `ai-model`          | `rhdh.io/ai-asset-category: ai-model`     | No solid upstream kind yet                                                                                                                                                    | Low         |
| `skill-bundle` | AIResource   | `ai-skill-bundle`   | `rhdh.io/ai-asset-category: skill-bundle` | No upstream kind                                                                                                                                                              | Low         |
| `agent`        | Component    | `ai-agent`          | `rhdh.io/ai-asset-category: agent`        | No upstream kind via RFC #32062. Downstream target: `AiResource` / `agent` ([#4164](https://github.com/redhat-developer/rhdh-plugins/pull/4164), merged). Track RHDHPLAN-1113 | Low         |

### Notes

- **`vector-store` / `ai-tool`** are out of scope for this readiness
  table (not part of the Decision 1 seven-category model). Boost
  frontend still classifies them via `isAiAsset`
  (`Resource` + `ai-tool` / `vector-store`) and sample fixtures until
  explicitly retired.
- **Boost `isAiAsset` gap (`skill-bundle` / `model-server`):** Decision 1
  includes `skill-bundle` (`spec.type: ai-skill-bundle`) and
  `model-server` (`spec.type: ai-model-server`), but boost
  `isAiAsset` / `buildCatalogFilter` do **not** track them today.
  `AI_ASSET_SPEC_TYPES` covers `skill` / `rule`, `mcp-server`,
  `ai-agent`, and `ai-model` / `ai-tool` / `vector-store` only. Catalog
  UI Filters "current" rows for `skill-bundle` and `model-server` are
  catalog/annotation query patterns, not boost frontend coverage yet.
- **Model-server downstream work:**
  [rhdh-plugins#4211](https://github.com/redhat-developer/rhdh-plugins/pull/4211)
  adds the new type for AI model servers downstream (RHIDP-14258), using
  the catalog model layer system in the `ai-integrations` workspace.
  Upstream [backstage#34476](https://github.com/backstage/backstage/pull/34476)
  proposes `kind: API` / `spec.type: ai-model-server` — **not** a new
  kind named `ai-model-server`. Migration will be handled if/when the
  upstream PR merges.
- **Agent dual baseline:**
  [rhdh-plugins#4164](https://github.com/redhat-developer/rhdh-plugins/pull/4164)
  (merged) ships downstream `AgentAiResourceEntityV1alpha1` in
  ai-integrations: `kind: AiResource`, `spec.type: agent`, required
  `instructions`. **Current for Decision 1 / boost today** remains
  `kind: Component`, `spec.type: ai-agent` (what boost `isAiAsset`
  classifies). Migration path when boost adopts #4164:
  `Component`+`ai-agent` -> `AiResource`+`agent`. Agent-kind ownership
  remains under RHDHPLAN-1113. RFC #32062 does **not** define an
  `AIAgent` kind — do not attribute agent entity kind to that RFC.

## Field-Level Transformation Rules

### MCP Server (Confidence: High)

**Kind change:** None. Already `kind: API`, `spec.type: mcp-server`.

**Field-level transforms:**

| Field                          | Current                        | Target                                                               | Action                                                          |
| ------------------------------ | ------------------------------ | -------------------------------------------------------------------- | --------------------------------------------------------------- |
| `spec.definition`              | May hold legacy MCP definition | **Not present** on `McpServerApiEntity`                              | Remove; do not keep `definition` on mcp-server entities         |
| `spec.remotes`                 | Not present / incomplete       | **Required** (`minItems: 1`) structured `{type, url}[]` per upstream | Hard replacement: populate from legacy definition/endpoint data |
| Catalog-model AI module opt-in | Not opted in                   | `@backstage/plugin-catalog-backend-module-ai-model`                  | Add module to backend configuration                             |

**Additional considerations:**

- Flag any fallback `Resource`-kind MCP entities that should be migrated
  to `API` kind.
- The `McpServerApiEntity` type
  ([backstage#34016](https://github.com/backstage/backstage/pull/34016))
  replaces `ApiEntity` `spec` for `mcp-server` — `spec.remotes` is
  required and there is no `definition` field on that subtype.

### Skill (Confidence: Medium–High)

**Kind change:** Docs/emitter casing alignment to canonical upstream
`AiResource` (boost runtime filters already case-insensitive).
`kind: AIResource` -> `kind: AiResource`.

**Field-level transforms:**

| Field            | Current                                            | Target                        | Action                                                              |
| ---------------- | -------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------- |
| `kind`           | `AIResource` (Decision 1 spelling / some emitters) | `AiResource`                  | Align emitted kind casing to upstream; filters already match either |
| `spec.type`      | `skill`                                            | `skill` (unchanged)           | No change                                                           |
| `spec.lifecycle` | May be missing                                     | Required on `AiResource`      | Ensure lifecycle is populated                                       |
| `spec.owner`     | May be missing                                     | Required on `AiResource`      | Ensure owner is populated                                           |
| `spec.dependsOn` | Optional / SDK-specific                            | Skill typed variant relations | Align with upstream skill `dependsOn` (defaultKind `AiResource`)    |
| `apiVersion`     | Current                                            | Upstream `AiResource` version | Update to match upstream apiVersion                                 |

**Notes:**

- Entity refs are unaffected: Backstage lowercases kind in entity ref
  strings, so `airesource:default/my-skill` remains the same whether
  the kind is `AIResource` or `AiResource`.
- Shipped boost fixtures already use `kind: AiResource`;
  `isAiAsset` matches `airesource`.
- The `rhdh.io/ai-asset-category: skill` annotation is retained during
  transition.

### Rule (Confidence: Medium–High)

**Kind change:** Docs/emitter casing alignment to canonical upstream
`AiResource` (same as skill).
`kind: AIResource` -> `kind: AiResource`.

**Field-level transforms:**

| Field            | Current                                            | Target                        | Action                                                  |
| ---------------- | -------------------------------------------------- | ----------------------------- | ------------------------------------------------------- |
| `kind`           | `AIResource` (Decision 1 spelling / some emitters) | `AiResource`                  | Align emitted kind casing; filters already match either |
| `spec.type`      | `rule`                                             | `rule` (unchanged)            | No change                                               |
| `spec.lifecycle` | May be missing                                     | Required on `AiResource`      | Ensure lifecycle is populated                           |
| `spec.owner`     | May be missing                                     | Required on `AiResource`      | Ensure owner is populated                               |
| `apiVersion`     | Current                                            | Upstream `AiResource` version | Update to match upstream apiVersion                     |

**Notes:**

- Same transformation pattern as `skill`. Rules and skills share the
  `AiResource` kind.
- Entity refs are unaffected (same lowercasing behavior as skill).
- Boost runtime already treats `AiResource` as current for filtering.

### Model Server (Confidence: Medium/Low)

**Kind change:** `Resource` -> `API` (if
[#34476](https://github.com/backstage/backstage/pull/34476) merges).

**Field-level transforms (contingent on upstream PR):**

| Field             | Current                   | Target                        | Action                                            |
| ----------------- | ------------------------- | ----------------------------- | ------------------------------------------------- |
| `kind`            | `Resource`                | `API`                         | Kind change from Resource to API                  |
| `spec.type`       | `ai-model-server`         | `ai-model-server` (unchanged) | No change                                         |
| `spec.lifecycle`  | May not be present        | Required for API entities     | Populate lifecycle field                          |
| `spec.owner`      | Existing                  | Existing (unchanged)          | No change                                         |
| `spec.definition` | Resource-style definition | API-style definition          | Restructure definition format per API entity spec |
| `spec.system`     | Optional                  | Optional (unchanged)          | No change                                         |

**Notes:**

- This transformation is contingent on upstream PR
  [backstage#34476](https://github.com/backstage/backstage/pull/34476).
  If the PR is declined or the schema changes significantly, this
  mapping must be revisited.
- Downstream PR
  [rhdh-plugins#4211](https://github.com/redhat-developer/rhdh-plugins/pull/4211)
  is adding the new type using the catalog model layer in
  `ai-integrations`; migration will happen if/when upstream merges.
- The upstream direction is `kind: API` + `spec.type: ai-model-server`
  — **not** a new kind named `ai-model-server`.

### AI Model (Confidence: Low)

**Kind change:** None planned. No solid upstream kind exists.

**Field-level transforms:** N/A — no target to transform toward.

**Recommendation:** Continue using current mapping
(`kind: Resource`, `spec.type: ai-model`). Track future upstream
proposals. When an upstream kind is proposed, revisit this mapping and
assign field-level transforms.

### Skill Bundle (Confidence: Low)

**Kind change:** None planned. No upstream kind exists.

**Field-level transforms:** N/A — no target to transform toward.

**Recommendation:** Stay on current mapping
(`kind: AIResource`, `spec.type: ai-skill-bundle`). Track future
upstream RFCs. If `AiResource` gains support for bundle semantics,
casing alignment (same as skill/rule) would apply.

### Agent (Confidence: Low)

**Kind change (downstream, when boost adopts #4164):**
`Component` -> `AiResource`. No upstream agent kind via RFC #32062.

**Field-level transforms (downstream target from #4164):**

| Field               | Current (Decision 1 / boost) | Target (#4164 / ai-integrations)     | Action                                       |
| ------------------- | ---------------------------- | ------------------------------------ | -------------------------------------------- |
| `kind`              | `Component`                  | `AiResource`                         | Kind change (identity cutover)               |
| `spec.type`         | `ai-agent`                   | `agent`                              | Rename type to match agent AiResource schema |
| `spec.lifecycle`    | May be missing               | Required                             | Ensure lifecycle is populated                |
| `spec.owner`        | May be missing               | Required                             | Ensure owner is populated                    |
| `spec.instructions` | Not on Component mapping     | Required non-empty string            | Populate agent instructions (system prompt)  |
| `spec.handoffs`     | N/A                          | Optional string refs to other agents | Map if present in source configuration       |
| `spec.model` / etc. | Provider-specific            | Optional per #4164 schema            | Align optional fields when migrating         |

**Recommendation:** Keep Decision 1 / boost **current** mapping
(`kind: Component`, `spec.type: ai-agent`) until boost migrates
emitters and `isAiAsset` to the downstream #4164 schema. Do **not**
attribute agent kind to RFC #32062 (that RFC is MCP-only). Track:

- RHDHPLAN-1113 agent-kind ownership
- RHIDP-15865 /
  [rhdh-plugins#4164](https://github.com/redhat-developer/rhdh-plugins/pull/4164)
  (merged; downstream `AiResource` agent type)

## Consumer-Facing Changes

> **Boost frontend note:** Catalog filter patterns below for
> `skill-bundle` and `model-server` are Decision 1 / catalog query
> patterns. Boost `isAiAsset` / `buildCatalogFilter` do not yet include
> those types — see [Notes](#notes).

### Catalog UI Filters

| Category       | Current Filter                                                 | Post-Migration Filter                                                                                                         | Impact                                                                                                                          |
| -------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `mcp-server`   | `kind: API` + `rhdh.io/ai-asset-category: mcp-server`          | Same (no kind change)                                                                                                         | None                                                                                                                            |
| `skill`        | `kind: AIResource` + `rhdh.io/ai-asset-category: skill`        | `kind: AiResource` (canonical casing; filters unchanged)                                                                      | None for filters (kind matching is case-insensitive). Annotation still useful for category. Optional UI/docs label polish only. |
| `rule`         | `kind: AIResource` + `rhdh.io/ai-asset-category: rule`         | `kind: AiResource` (canonical casing; filters unchanged)                                                                      | Same as skill.                                                                                                                  |
| `skill-bundle` | `kind: AIResource` + `rhdh.io/ai-asset-category: skill-bundle` | No change planned                                                                                                             | None (until upstream kind exists)                                                                                               |
| `model-server` | `kind: Resource` + `rhdh.io/ai-asset-category: model-server`   | If [#34476](https://github.com/backstage/backstage/pull/34476) merges: `kind: API`, `spec.type: ai-model-server`              | Must update kind filter from Resource to API.                                                                                   |
| `ai-model`     | `kind: Resource` + `rhdh.io/ai-asset-category: ai-model`       | No change planned                                                                                                             | None (until upstream kind exists)                                                                                               |
| `agent`        | `kind: Component` + `rhdh.io/ai-asset-category: agent`         | When boost adopts [#4164](https://github.com/redhat-developer/rhdh-plugins/pull/4164): `kind: AiResource`, `spec.type: agent` | Must update kind + type filters on boost adoption of #4164                                                                      |

### Entity References

| Category       | Current Entity Ref             | Post-Migration Entity Ref                               | Impact                                                                                                                                                                                                                                                  |
| -------------- | ------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mcp-server`   | `api:default/my-mcp-server`    | `api:default/my-mcp-server`                             | None                                                                                                                                                                                                                                                    |
| `skill`        | `airesource:default/my-skill`  | `airesource:default/my-skill`                           | None (Backstage lowercases kind in entity refs)                                                                                                                                                                                                         |
| `rule`         | `airesource:default/my-rule`   | `airesource:default/my-rule`                            | None (same lowercasing behavior)                                                                                                                                                                                                                        |
| `skill-bundle` | `airesource:default/my-bundle` | `airesource:default/my-bundle`                          | None                                                                                                                                                                                                                                                    |
| `model-server` | `resource:default/my-server`   | `api:default/my-server` (if #34476 merges)              | **Breaking:** kind change is an identity cutover (`resource:` -> `api:`), not an in-place ref update. Inbound relationships and hardcoded refs in other entities are **not** auto-rewritten. A ref-consumer migration plan is needed (see Future Work). |
| `ai-model`     | `resource:default/my-model`    | `resource:default/my-model`                             | None                                                                                                                                                                                                                                                    |
| `agent`        | `component:default/my-agent`   | `airesource:default/my-agent` (when boost adopts #4164) | **Breaking** on boost adoption: identity cutover `component:` -> `airesource:`. Inbound refs not auto-rewritten.                                                                                                                                        |

### API Queries

| Category       | Current Query                                                                                                | Post-Migration Query                                                                                                 | Impact                              |
| -------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `mcp-server`   | `GET /api/catalog/entities?filter=kind=API,spec.type=mcp-server`                                             | Same                                                                                                                 | None                                |
| `skill`        | `GET /api/catalog/entities?filter=kind=AIResource,spec.type=skill`                                           | `?filter=kind=AiResource,spec.type=skill` (canonical; existing `AIResource` filters still match)                     | None for filters (case-insensitive) |
| `rule`         | `GET /api/catalog/entities?filter=kind=AIResource,spec.type=rule`                                            | `?filter=kind=AiResource,spec.type=rule` (canonical; existing `AIResource` filters still match)                      | None for filters (case-insensitive) |
| `model-server` | `GET /api/catalog/entities?filter=kind=Resource,metadata.annotations.rhdh.io/ai-asset-category=model-server` | `?filter=kind=API,spec.type=ai-model-server` (if [#34476](https://github.com/backstage/backstage/pull/34476) merges) | Update kind + filter                |
| `ai-model`     | `GET /api/catalog/entities?filter=kind=Resource,spec.type=ai-model`                                          | Same                                                                                                                 | None                                |
| `skill-bundle` | `GET /api/catalog/entities?filter=kind=AIResource,spec.type=ai-skill-bundle`                                 | Same                                                                                                                 | None                                |
| `agent`        | `GET /api/catalog/entities?filter=kind=Component,spec.type=ai-agent`                                         | `?filter=kind=AiResource,spec.type=agent` (when boost adopts #4164)                                                  | Update kind + type on adoption      |

## Backward Compatibility Strategy

### Annotation Retention

The `rhdh.io/ai-asset-category` annotation will be **retained on
migrated entities for one major version** after upstream kind alignment
is applied. This supports **annotation-based** queries during the
transition period — consumers can filter by
`metadata.annotations.rhdh.io/ai-asset-category=<category>` without
depending on the entity's kind.

**Limitation:** Annotation retention does **not** preserve pre-migration
**kind** filters for categories that undergo a kind change. For example,
after `model-server` migrates from `kind: Resource` to `kind: API`, a
filter combining `kind=Resource` AND
`metadata.annotations.rhdh.io/ai-asset-category=model-server`
will return no results because the catalog ANDs filter terms within a
set. Consumers using kind+annotation compound filters must switch to
annotation-only queries or adopt the new kind.

**Casing-only changes are not affected:** For `skill` and `rule`,
Decision 1 / some emitters may still spell `AIResource` while canonical
upstream and boost fixtures use `AiResource`. Backstage catalog kind
matching is case-insensitive, so existing `kind=AIResource` filters
continue to work. The dual-filter concern applies only to actual kind
changes (e.g., `Resource` -> `API`).

### Deprecation Timeline

1. **Migration release (N):** Entities carry both upstream kind and
   `rhdh.io/ai-asset-category` annotation. Annotation-based query
   patterns work (e.g.,
   `?filter=metadata.annotations.rhdh.io/ai-asset-category=model-server`).
   Pre-migration **kind** filters do **not** work for categories that
   changed kind (`Resource` -> `API`). Release notes include deprecation
   notice for old query patterns.
2. **Next major release (N+1):** For **migrated** categories only, the
   annotation is removed and upstream kind / `spec.type` queries are the
   supported pattern. Unmigrated / Low-confidence categories (`agent`,
   `ai-model`, `skill-bundle`, and any still-pending targets) **retain**
   `rhdh.io/ai-asset-category` (and their current kind / `spec.type`)
   until a stable upstream target exists. Migration is complete only for
   categories that completed upstream alignment.

### Migration Execution Strategy (Future Work)

When upstream kinds stabilize and migration is executed:

1. **Catalog processor / provider** emits the post-migration kind during
   entity refresh (not a one-shot batch rewrite of the catalog DB).
2. **Kind change is an identity cutover**, not an in-place entity-ref
   update. Backstage identifies entities by `(kind, namespace, name)`,
   so changing kind (e.g., `Resource` -> `API`) produces a **new**
   entity (`api:default/my-server`) while the old identity
   (`resource:default/my-server`) is removed when that location no
   longer emits it. **Inbound relationships and hardcoded entity refs
   in other entities are not automatically rewritten**. A separate
   migration plan for ref consumers (relationship targets,
   `spec.dependsOn` entries, etc.) is required — see
   [Future Work](#future-work).
3. **API query patterns** are documented in release notes with
   before/after examples.
4. **UI filters** are updated in the same release as the catalog
   processor change.

### Dual-Filter Period

During the transition (release N), consumers should use
**annotation-only** queries as the backward-compatible pattern, since
these work regardless of whether the entity's kind has changed:

```
# Annotation-only pattern (backward-compatible, works before and after migration)
GET /api/catalog/entities?filter=metadata.annotations.rhdh.io/ai-asset-category=model-server

# New pattern (preferred post-migration)
GET /api/catalog/entities?filter=kind=API,spec.type=ai-model-server
```

> **Note:** The pre-migration compound filter
> `kind=Resource,metadata.annotations.rhdh.io/ai-asset-category=model-server`
> does **not**
> work after migration because the entity's kind changes to `API` and
> the catalog ANDs filter terms. Use the annotation-only path
> (`metadata.annotations.rhdh.io/ai-asset-category`) for queries that
> must span the transition.

For **casing-only** changes (`AIResource` -> `AiResource` for skills
and rules), catalog kind matching is case-insensitive, so existing
kind-based filters continue to work without modification during the
transition.

## Upstream Tracking

| Upstream Reference                                                              | Status  | Relevance                                             |
| ------------------------------------------------------------------------------- | ------- | ----------------------------------------------------- |
| [backstage#34016](https://github.com/backstage/backstage/pull/34016)            | Merged  | `McpServerApiEntity` — MCP server kind                |
| [backstage#34261](https://github.com/backstage/backstage/pull/34261)            | Merged  | `AiResource` kind implementation                      |
| [backstage#33575](https://github.com/backstage/backstage/issues/33575)          | Open    | RFC / lineage for AI catalog kinds (`AIContext` RFC)  |
| [backstage#34476](https://github.com/backstage/backstage/pull/34476)            | Open PR | `API` / `ai-model-server` candidate for model servers |
| [backstage#32062](https://github.com/backstage/backstage/issues/32062)          | Closed  | MCP RFC (Option 3 confirmed) — **not** agent-related  |
| [rhdh-plugins#4211](https://github.com/redhat-developer/rhdh-plugins/pull/4211) | Open PR | Downstream model-server type (RHIDP-14258)            |
| [rhdh-plugins#4164](https://github.com/redhat-developer/rhdh-plugins/pull/4164) | Merged  | Downstream `AiResource` agent type (RHIDP-15865)      |

## Out of Scope

- **`vector-store` / `ai-tool`:** Excluded from the seven-category
  upstream-migration SoT (Augment POC vestiges). Still recognized by
  boost `isAiAsset` / fixtures until explicitly retired.
- **Annotation specification publish (RHIDP-15346):** Split to
  [#4220](https://github.com/redhat-developer/rhdh-plugins/issues/4220).
- **Migration-readiness CLI (RHIDP-15347):** Split to
  [#4220](https://github.com/redhat-developer/rhdh-plugins/issues/4220).
- **Actual entity migration / catalog processor:** Future work
  dependent on upstream RFC finalization.
- **Re-opening Decision 1 or MCP Option 3.**

## Future Work

- **Actual entity migration:** Execute field-level transforms via
  catalog processor when upstream kinds stabilize. This is a separate
  effort requiring its own design, implementation, and testing.
- **Migration-readiness CLI:** Dry-run tool for assessing migration
  readiness ([#4220](https://github.com/redhat-developer/rhdh-plugins/issues/4220)).
- **Entity kind transition plan:** Detailed rollout plan including
  customer communication, staged rollout, and rollback procedures.
- **Inbound ref migration plan:** For kind-changing categories
  (e.g., model-server `Resource` -> `API`), document and implement a
  plan to rewrite inbound relationship targets, `spec.dependsOn`
  entries, and other hardcoded entity refs in consuming entities.
  Treat the kind change as an identity cutover: plan orphan cleanup of
  the old `(kind, namespace, name)` after emitters stop producing it.
- **Catalog processor hook:** Automated migration via catalog
  processing pipeline (post-RFC-finalization).
- **Upstream RFC finalization tracking:** Continued monitoring of
  open PRs ([#34476](https://github.com/backstage/backstage/pull/34476))
  and proposals for agent/model kinds.
- **Boost agent adoption of #4164:** Migrate boost Decision 1
  `Component` / `ai-agent` emitters and `isAiAsset` classification to
  the downstream `AiResource` / `agent` schema when ready.

## Sign-Off

| Field      | Value                      |
| ---------- | -------------------------- |
| Reviewer   | _Pending_                  |
| Role       | RHDH Architect / Tech Lead |
| Date       | _Pending_                  |
| Status     | **Pending review**         |
| Conditions | _N/A_                      |

> **Process:** Per
> [gate decision](https://github.com/redhat-developer/rhdh-plugins/issues/4042#issuecomment-5204217995),
> sign-off is RHDH-side (architect or tech lead). Once reviewed, the
> reviewer updates this table with their name, date, and approval
> status (`approved`, `approved-with-conditions`, or `rejected`).

## References

- [ai-catalog-entity-model/design.md Decision 1](../../design.md) —
  current-state source of truth
- [migration-readiness/spec.md](spec.md) — OpenSpec requirements
- [upstream-schema-alignment/proposal.md](../../../upstream-schema-alignment/proposal.md) —
  upstream schema alignment proposal
- [upstream-schema-alignment/design.md](../../../upstream-schema-alignment/design.md) —
  upstream schema alignment design
- [#4042](https://github.com/redhat-developer/rhdh-plugins/issues/4042) —
  tracking issue (narrowed to RHIDP-15302)
- [#4188](https://github.com/redhat-developer/rhdh-plugins/issues/4188) /
  [#4189](https://github.com/redhat-developer/rhdh-plugins/pull/4189) —
  mapping table reconciliation (merged)
- [#4220](https://github.com/redhat-developer/rhdh-plugins/issues/4220) —
  sibling issue (RHIDP-15346 / RHIDP-15347)
