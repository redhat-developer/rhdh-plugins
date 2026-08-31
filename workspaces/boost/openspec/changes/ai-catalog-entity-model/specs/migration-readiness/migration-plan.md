# Migration Plan: RHDH AI-Asset Entities to Upstream Backstage Kinds

> **Status: Draft** | **Last updated: 2026-08-31** | **Story: RHIDP-15302**
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
(`AiResource`, `rhdh.io/ai-asset-category`, etc.) that diverge from
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
- Downstream entity-type pivot:
  [#4164](https://github.com/redhat-developer/rhdh-plugins/pull/4164)
  (agent `AiResource`),
  [#4211](https://github.com/redhat-developer/rhdh-plugins/pull/4211)
  (`AiModelServerAPI`),
  [#4246](https://github.com/redhat-developer/rhdh-plugins/pull/4246)
  (`AiResourceAgentProcessor`),
  [#4260](https://github.com/redhat-developer/rhdh-plugins/pull/4260)
  (boost pivot to `AiResource` / `AiModelServerAPI`).
- Reconciliation in
  [#4189](https://github.com/redhat-developer/rhdh-plugins/pull/4189).

## Risks

- **Upstream model-server PR rejection:** The upstream model-server
  proposal
  ([#34476](https://github.com/backstage/backstage/pull/34476)) is still
  open. Downstream has committed to `AiModelServerAPI` from
  [#4211](https://github.com/redhat-developer/rhdh-plugins/pull/4211)
  for RHDH 2.1. If upstream #34476 merges, the schemas are identical and
  migration is byte-for-byte. If upstream devises a radically different
  mapping, a migration will be assessed at that time — the dev-preview
  status makes breaking changes acceptable.
- **Inbound relationship breakage:** When an entity's kind changes
  (e.g., `Resource` -> `API` for model-server), catalog identity is the
  tuple `(kind, namespace, name)`, so the change is an **identity cutover**
  (`resource:` -> `api:`), not an in-place rewrite of the same entity.
  Inbound relationships and hardcoded refs in other entities are **not**
  automatically rewritten by the catalog — a separate migration plan
  for ref consumers is required (see [Future Work](#future-work)).
  Note: for RHDH 2.1 development, intra-release migration of the
  component/resource/api tuples from ai-integrations dev preview is not
  a concern — dev-preview entities can be broken/re-worked.
- **Kind-filter breakage during transition:** Annotation retention
  supports **annotation-based** queries during the transition period, but
  pre-migration **kind** filters (e.g., `kind=Resource`) will **not**
  match after a kind change. Consumers using kind+annotation AND filters
  must switch to annotation-only or new-kind queries. See
  [Backward Compatibility Strategy](#backward-compatibility-strategy).

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
  `kind: API` stays. No `API` -> `McpServer` kind rename. RFC #32062 is
  MCP-only — it does **not** define an agent kind.
- **Skills/rules:** `AiResource` (lowercase `i`) shipped upstream via
  [backstage#34261](https://github.com/backstage/backstage/pull/34261)
  ([#33575](https://github.com/backstage/backstage/issues/33575) RFC
  lineage). There is no entity kind called `AIResource` — only
  `AiResource`. Some downstream supporting types (e.g.,
  `AIResourceScope`) capitalize the `I`, but the entity kind is always
  `AiResource`. Decision 1 / OpenSpec prose may still spell `AIResource`;
  shipped boost runtime already matches `AiResource` case-insensitively
  (`airesource` in `isAiAsset`; fixtures use `kind: AiResource`).
  Remaining work: align OpenSpec/Decision 1 spelling and any emitters
  to canonical `AiResource` (filters already OK).
- **Model servers:** `AiModelServerAPI` from
  [rhdh-plugins#4211](https://github.com/redhat-developer/rhdh-plugins/pull/4211)
  is the committed RHDH 2.1 target (`kind: API`,
  `spec.type: ai-model-server`). If upstream
  [backstage#34476](https://github.com/backstage/backstage/pull/34476)
  merges, schema-wise the types are identical — migration is
  byte-for-byte. If upstream never standardizes model servers,
  `AiModelServerAPI` persists. Only a radically different upstream
  mapping would require a new migration.
- **Agents:** `AiResource` with `spec.type: agent` is the committed
  RHDH 2.1 target from
  [rhdh-plugins#4164](https://github.com/redhat-developer/rhdh-plugins/pull/4164)
  (merged). Decision made — boost is pivoting to this schema via
  [#4260](https://github.com/redhat-developer/rhdh-plugins/pull/4260).
  If upstream backstage accepts the proposed agent kind, migration will
  be seamless. If upstream devises something radically different, dev
  preview allows breaking changes.
- **RHDHPLAN-1113 resolved:** Boost uses `AiResource`-kind skills/rules
  directly. The dual-path interim narrative is retired.
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

| Level       | Meaning                                                  |
| ----------- | -------------------------------------------------------- |
| High        | Upstream kind shipped and stable; kind already aligned   |
| Medium-High | Upstream kind shipped; field/name alignment work remains |
| Medium      | Downstream committed; upstream alignment pending         |
| Low         | No solid upstream kind yet, or mapping is speculative    |

## Current-to-Upstream Mapping Table

Source of truth for current state:
[ai-catalog-entity-model/design.md Decision 1](../../design.md).
Mapping tables reconciled via
[#4188](https://github.com/redhat-developer/rhdh-plugins/issues/4188) /
[#4189](https://github.com/redhat-developer/rhdh-plugins/pull/4189).

| Category       | Current Kind | Current `spec.type` | Current Annotation                        | RHDH 2.1 Target                                                                                                                                                                           | Confidence  |
| -------------- | ------------ | ------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `mcp-server`   | API          | `mcp-server`        | `rhdh.io/ai-asset-category: mcp-server`   | Same — `McpServerApiEntity` ([#34016](https://github.com/backstage/backstage/pull/34016), merged)                                                                                         | High        |
| `skill`        | AiResource   | `skill`             | `rhdh.io/ai-asset-category: skill`        | `AiResource` ([#34261](https://github.com/backstage/backstage/pull/34261) merged; [#33575](https://github.com/backstage/backstage/issues/33575) lineage)                                  | Medium-High |
| `rule`         | AiResource   | `rule`              | `rhdh.io/ai-asset-category: rule`         | `AiResource` ([#34261](https://github.com/backstage/backstage/pull/34261) merged; [#33575](https://github.com/backstage/backstage/issues/33575) lineage)                                  | Medium-High |
| `model-server` | API          | `ai-model-server`   | `rhdh.io/ai-asset-category: model-server` | `AiModelServerAPI` ([#4211](https://github.com/redhat-developer/rhdh-plugins/pull/4211)); byte-for-byte with upstream [#34476](https://github.com/backstage/backstage/pull/34476)         | Medium      |
| `ai-model`     | —            | —                   | —                                         | Part of `AiModelServerAPI` (models are a list of model names within the model-server entity); no separate entity kind                                                                     | Medium      |
| `skill-bundle` | AiResource   | `ai-skill-bundle`   | `rhdh.io/ai-asset-category: skill-bundle` | No upstream kind                                                                                                                                                                          | Low         |
| `agent`        | AiResource   | `agent`             | `rhdh.io/ai-asset-category: agent`        | `AiResource` / `agent` ([#4164](https://github.com/redhat-developer/rhdh-plugins/pull/4164), merged); boost pivot via [#4260](https://github.com/redhat-developer/rhdh-plugins/pull/4260) | Medium      |

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
  introduces `AiModelServerAPI` (`kind: API`,
  `spec.type: ai-model-server`) for RHDH 2.1 using the catalog model
  layer in the `ai-integrations` workspace. This is the committed 2.1
  target. Upstream
  [backstage#34476](https://github.com/backstage/backstage/pull/34476)
  proposes the same schema — if it merges, migration is byte-for-byte
  (just switch to upstream types). If upstream never standardizes or
  devises a radically different mapping, `AiModelServerAPI` persists and
  any migration will be assessed then. AI models (e.g., LLM names) are
  expressed as a list within the `AiModelServerAPI` entity — there is
  no separate `ai-model` entity kind per #34476 and #4211.
- **Agent committed target:**
  [rhdh-plugins#4164](https://github.com/redhat-developer/rhdh-plugins/pull/4164)
  (merged) ships `AgentAiResourceEntityV1alpha1` in
  ai-integrations: `kind: AiResource`, `spec.type: agent`, required
  `instructions`. Boost is pivoting to this schema via
  [#4260](https://github.com/redhat-developer/rhdh-plugins/pull/4260).
  [#4246](https://github.com/redhat-developer/rhdh-plugins/pull/4246)
  adds `AiResourceAgentProcessor`. Agent-kind ownership
  remains under RHDHPLAN-1113. An analogous proposal will be introduced
  upstream; if upstream accepts it, migration is seamless. If not
  accepted at all (there is discussion about not modeling agents as a
  special-case kind in the catalog), RHDH sticks with `AiResource` /
  `agent`. Dev-preview status allows breaking changes if upstream
  devises something radically different.

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

### Skill (Confidence: Medium-High)

**Kind change:** None for entity kind — `AiResource` is already the
canonical upstream name. Remaining work is docs/emitter alignment where
Decision 1 prose still spells `AIResource`.

**Field-level transforms:**

| Field            | Current                  | Target                        | Action                                                            |
| ---------------- | ------------------------ | ----------------------------- | ----------------------------------------------------------------- |
| `kind`           | `AiResource` (canonical) | `AiResource`                  | Already aligned; fix any docs/emitters still writing `AIResource` |
| `spec.type`      | `skill`                  | `skill` (unchanged)           | No change                                                         |
| `spec.lifecycle` | May be missing           | Required on `AiResource`      | Ensure lifecycle is populated                                     |
| `spec.owner`     | May be missing           | Required on `AiResource`      | Ensure owner is populated                                         |
| `spec.dependsOn` | Optional / SDK-specific  | Skill typed variant relations | Align with upstream skill `dependsOn` (defaultKind `AiResource`)  |
| `apiVersion`     | Current                  | Upstream `AiResource` version | Update to match upstream apiVersion                               |

**Notes:**

- Entity refs are unaffected: Backstage lowercases kind in entity ref
  strings, so `airesource:default/my-skill` remains the same.
- Shipped boost fixtures already use `kind: AiResource`;
  `isAiAsset` matches `airesource`.
- The `rhdh.io/ai-asset-category: skill` annotation is retained during
  transition.

### Rule (Confidence: Medium-High)

**Kind change:** None for entity kind — `AiResource` is already the
canonical upstream name (same as skill).

**Field-level transforms:**

| Field            | Current                  | Target                        | Action                                                            |
| ---------------- | ------------------------ | ----------------------------- | ----------------------------------------------------------------- |
| `kind`           | `AiResource` (canonical) | `AiResource`                  | Already aligned; fix any docs/emitters still writing `AIResource` |
| `spec.type`      | `rule`                   | `rule` (unchanged)            | No change                                                         |
| `spec.lifecycle` | May be missing           | Required on `AiResource`      | Ensure lifecycle is populated                                     |
| `spec.owner`     | May be missing           | Required on `AiResource`      | Ensure owner is populated                                         |
| `apiVersion`     | Current                  | Upstream `AiResource` version | Update to match upstream apiVersion                               |

**Notes:**

- Same transformation pattern as `skill`. Rules and skills share the
  `AiResource` kind.
- Entity refs are unaffected (same lowercasing behavior as skill).
- Boost runtime already treats `AiResource` as current for filtering.

### Model Server (Confidence: Medium)

**Kind change:** Committed to `AiModelServerAPI` from
[#4211](https://github.com/redhat-developer/rhdh-plugins/pull/4211)
for RHDH 2.1: `kind: API`, `spec.type: ai-model-server`.

**Field-level transforms:**

| Field             | Current (Decision 1)      | Target (AiModelServerAPI)     | Action                                                              |
| ----------------- | ------------------------- | ----------------------------- | ------------------------------------------------------------------- |
| `kind`            | `Resource`                | `API`                         | Kind change from Resource to API                                    |
| `spec.type`       | `ai-model-server`         | `ai-model-server` (unchanged) | No change                                                           |
| `spec.lifecycle`  | May not be present        | Required for API entities     | Populate lifecycle field                                            |
| `spec.owner`      | Existing                  | Existing (unchanged)          | No change                                                           |
| `spec.definition` | Resource-style definition | API-style definition          | Restructure definition format per API entity spec                   |
| `spec.system`     | Optional                  | Optional (unchanged)          | No change                                                           |
| Model list        | N/A                       | List of model names           | Models are expressed within the model-server entity, not separately |

**Notes:**

- `AiModelServerAPI` from #4211 is the committed RHDH 2.1 target.
- Upstream PR
  [backstage#34476](https://github.com/backstage/backstage/pull/34476)
  proposes the same schema (`kind: API`,
  `spec.type: ai-model-server`). If it merges, migration is
  byte-for-byte — just switch to upstream types. If upstream never
  standardizes or proposes something radically different, RHDH sticks
  with `AiModelServerAPI`.
- AI models are part of the `AiModelServerAPI` entity (a list of model
  names) — there is no separate entity kind for individual AI models.
- UI/console filters should be adjusted to deal with the new
  `AiModelServerAPI` entity kind.
- Dev-preview status: intra-release migration of the prior
  component/resource/api tuples is not a concern — they can be
  broken/re-worked.

### AI Model (Confidence: Medium)

**Kind change:** No separate entity kind. AI models are part of the
`AiModelServerAPI` entity type.

**Field-level transforms:** N/A — models are expressed as a list of
model names within the model-server entity per
[#34476](https://github.com/backstage/backstage/pull/34476) (upstream)
and [#4211](https://github.com/redhat-developer/rhdh-plugins/pull/4211)
(downstream).

**Recommendation:** Remove standalone `ai-model` entities
(`kind: Resource`, `spec.type: ai-model`) as they are superseded by the
model list within `AiModelServerAPI`. Track any edge cases where models
need independent entity identity.

### Skill Bundle (Confidence: Low)

**Kind change:** None planned. No upstream kind exists.

**Field-level transforms:** N/A — no target to transform toward.

**Recommendation:** Stay on current mapping
(`kind: AiResource`, `spec.type: ai-skill-bundle`). Track future
upstream RFCs. If `AiResource` gains support for bundle semantics,
the mapping is already aligned.

### Agent (Confidence: Medium)

**Kind change:** Committed to `AiResource` / `spec.type: agent` for
RHDH 2.1 from
[#4164](https://github.com/redhat-developer/rhdh-plugins/pull/4164)
(merged). Boost is pivoting via
[#4260](https://github.com/redhat-developer/rhdh-plugins/pull/4260).

**Field-level transforms:**

| Field               | Current (Decision 1 / boost) | Target (#4164 / ai-integrations)     | Action                                       |
| ------------------- | ---------------------------- | ------------------------------------ | -------------------------------------------- |
| `kind`              | `Component`                  | `AiResource`                         | Kind change (identity cutover)               |
| `spec.type`         | `ai-agent`                   | `agent`                              | Rename type to match agent AiResource schema |
| `spec.lifecycle`    | May be missing               | Required                             | Ensure lifecycle is populated                |
| `spec.owner`        | May be missing               | Required                             | Ensure owner is populated                    |
| `spec.instructions` | Not on Component mapping     | Required non-empty string            | Populate agent instructions (system prompt)  |
| `spec.handoffs`     | N/A                          | Optional string refs to other agents | Map if present in source configuration       |
| `spec.model` / etc. | Provider-specific            | Optional per #4164 schema            | Align optional fields when migrating         |

**Notes:**

- `AiResource` / `agent` is the committed RHDH 2.1 target — decision
  made.
- An analogous proposal will be introduced upstream. If upstream accepts
  it, migration is seamless. If upstream does not model agents as a
  special-case kind in the catalog, RHDH sticks with `AiResource` /
  `agent`.
- Dev-preview status: if upstream devises something radically different,
  breaking changes are within scope.
- Agent-kind ownership remains under RHDHPLAN-1113.
- [#4246](https://github.com/redhat-developer/rhdh-plugins/pull/4246)
  adds `AiResourceAgentProcessor` to process agent entities.

## Consumer-Facing Changes

> **Boost frontend note:** Catalog filter patterns below for
> `skill-bundle` and `model-server` are Decision 1 / catalog query
> patterns. Boost `isAiAsset` / `buildCatalogFilter` do not yet include
> those types — see [Notes](#notes).

### Catalog UI Filters

| Category       | Current Filter                                                 | Post-Migration Filter                                                                                                                                          | Impact                                                                    |
| -------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `mcp-server`   | `kind: API` + `rhdh.io/ai-asset-category: mcp-server`          | Same (no kind change)                                                                                                                                          | None                                                                      |
| `skill`        | `kind: AiResource` + `rhdh.io/ai-asset-category: skill`        | Same (kind already aligned upstream)                                                                                                                           | None — annotation still useful for category distinction                   |
| `rule`         | `kind: AiResource` + `rhdh.io/ai-asset-category: rule`         | Same (kind already aligned upstream)                                                                                                                           | None                                                                      |
| `skill-bundle` | `kind: AiResource` + `rhdh.io/ai-asset-category: skill-bundle` | No change planned                                                                                                                                              | None (until upstream kind exists)                                         |
| `model-server` | `kind: API` + `spec.type: ai-model-server`                     | Same — `AiModelServerAPI` ([#4211](https://github.com/redhat-developer/rhdh-plugins/pull/4211))                                                                | Filters already use `kind: API`; adjust from prior `kind: Resource` usage |
| `ai-model`     | —                                                              | Part of `AiModelServerAPI` entity (model list); no separate filter                                                                                             | N/A                                                                       |
| `agent`        | `kind: AiResource` + `spec.type: agent`                        | Same — committed via [#4164](https://github.com/redhat-developer/rhdh-plugins/pull/4164) / [#4260](https://github.com/redhat-developer/rhdh-plugins/pull/4260) | Filters already use `kind: AiResource, spec.type: agent`                  |

### Entity References

| Category       | Current Entity Ref             | Post-Migration Entity Ref                      | Impact                                           |
| -------------- | ------------------------------ | ---------------------------------------------- | ------------------------------------------------ |
| `mcp-server`   | `api:default/my-mcp-server`    | `api:default/my-mcp-server`                    | None                                             |
| `skill`        | `airesource:default/my-skill`  | `airesource:default/my-skill`                  | None (Backstage lowercases kind in entity refs)  |
| `rule`         | `airesource:default/my-rule`   | `airesource:default/my-rule`                   | None (same lowercasing behavior)                 |
| `skill-bundle` | `airesource:default/my-bundle` | `airesource:default/my-bundle`                 | None                                             |
| `model-server` | `api:default/my-server`        | `api:default/my-server`                        | None — `AiModelServerAPI` is already `kind: API` |
| `ai-model`     | —                              | Part of model-server entity; no standalone ref | N/A                                              |
| `agent`        | `airesource:default/my-agent`  | `airesource:default/my-agent`                  | None — already `kind: AiResource` per #4164      |

### API Queries

| Category       | Current Query                                                                | Post-Migration Query                                                                               | Impact          |
| -------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------- |
| `mcp-server`   | `GET /api/catalog/entities?filter=kind=API,spec.type=mcp-server`             | Same                                                                                               | None            |
| `skill`        | `GET /api/catalog/entities?filter=kind=AiResource,spec.type=skill`           | Same                                                                                               | None            |
| `rule`         | `GET /api/catalog/entities?filter=kind=AiResource,spec.type=rule`            | Same                                                                                               | None            |
| `model-server` | `GET /api/catalog/entities?filter=kind=API,spec.type=ai-model-server`        | Same — `AiModelServerAPI` from [#4211](https://github.com/redhat-developer/rhdh-plugins/pull/4211) | None post-pivot |
| `ai-model`     | N/A                                                                          | Part of model-server entity                                                                        | N/A             |
| `skill-bundle` | `GET /api/catalog/entities?filter=kind=AiResource,spec.type=ai-skill-bundle` | Same                                                                                               | None            |
| `agent`        | `GET /api/catalog/entities?filter=kind=AiResource,spec.type=agent`           | Same — committed via #4164                                                                         | None post-pivot |

## Backward Compatibility Strategy

### Annotation Retention

The `rhdh.io/ai-asset-category` annotation will be **retained on
migrated entities for one major version** after upstream kind alignment
is applied. This supports **annotation-based** queries during the
transition period — consumers can filter by
`metadata.annotations.rhdh.io/ai-asset-category=<category>` without
depending on the entity's kind.

**Limitation — kind-change migrations:** Annotation retention does
**not** preserve pre-migration **kind** filters for categories that
undergo a kind change. For example, if a consumer previously filtered
model-servers with `kind=Resource` AND
`metadata.annotations.rhdh.io/ai-asset-category=model-server`, that
filter returns no results after model-servers move to `kind: API`
because the catalog ANDs filter terms within a set. The entity's kind is
now `API`, so `kind=Resource` no longer matches. Consumers must switch
to annotation-only queries or adopt the new kind.

**Post-pivot state:** With the entity-type pivot landed (#4164, #4211,
#4246, #4260), model-servers are already `kind: API` and agents are
already `kind: AiResource`. Filters that used the old `kind: Resource`
or `kind: Component` patterns must be updated. Dev-preview status makes
this acceptable — the prior entities were only at dev preview and can be
broken/re-worked.

### Deprecation Timeline

1. **Migration release (N):** Entities carry both upstream kind and
   `rhdh.io/ai-asset-category` annotation. Annotation-based query
   patterns work (e.g.,
   `?filter=metadata.annotations.rhdh.io/ai-asset-category=model-server`).
   Pre-migration **kind** filters do **not** work for categories that
   changed kind. Release notes include deprecation notice for old query
   patterns.
2. **Next major release (N+1):** For **migrated** categories only, the
   annotation is removed and upstream kind / `spec.type` queries are the
   supported pattern. Unmigrated / Low-confidence categories (any
   still-pending targets) **retain** `rhdh.io/ai-asset-category`
   (and their current kind / `spec.type`) until a stable upstream target
   exists. Migration is complete only for categories that completed
   upstream alignment.

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

> **Note:** A compound filter that combines the **old kind** with the
> annotation — e.g.,
> `kind=Resource,metadata.annotations.rhdh.io/ai-asset-category=model-server`
> — does **not** work after a kind-change migration. The entity's kind
> is now `API`, so `kind=Resource` does not match, and the catalog ANDs
> all filter terms. Use annotation-only queries for patterns that must
> span the transition.

## Upstream Tracking

| Upstream Reference                                                              | Status  | Relevance                                                      |
| ------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------- |
| [backstage#34016](https://github.com/backstage/backstage/pull/34016)            | Merged  | `McpServerApiEntity` — MCP server kind                         |
| [backstage#34261](https://github.com/backstage/backstage/pull/34261)            | Merged  | `AiResource` kind implementation                               |
| [backstage#33575](https://github.com/backstage/backstage/issues/33575)          | Open    | RFC / lineage for AI catalog kinds (`AIContext` RFC)           |
| [backstage#34476](https://github.com/backstage/backstage/pull/34476)            | Open PR | `API` / `ai-model-server` candidate (byte-for-byte with #4211) |
| [rhdh-plugins#4164](https://github.com/redhat-developer/rhdh-plugins/pull/4164) | Merged  | Downstream `AiResource` agent type (RHIDP-15865)               |
| [rhdh-plugins#4211](https://github.com/redhat-developer/rhdh-plugins/pull/4211) | Merged  | `AiModelServerAPI` — committed 2.1 model-server target         |
| [rhdh-plugins#4246](https://github.com/redhat-developer/rhdh-plugins/pull/4246) | Merged  | `AiResourceAgentProcessor`                                     |
| [rhdh-plugins#4260](https://github.com/redhat-developer/rhdh-plugins/pull/4260) | Merged  | Boost pivot to `AiResource` / `AiModelServerAPI`               |

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
- **Inbound ref migration plan:** For categories that underwent kind
  changes, document and implement a plan to rewrite inbound relationship
  targets, `spec.dependsOn` entries, and other hardcoded entity refs in
  consuming entities. Treat the kind change as an identity cutover: plan
  orphan cleanup of the old `(kind, namespace, name)` after emitters
  stop producing it.
- **Catalog processor hook:** Automated migration via catalog
  processing pipeline (post-RFC-finalization).
- **Upstream RFC finalization tracking:** Continued monitoring of
  open PRs ([#34476](https://github.com/backstage/backstage/pull/34476))
  and proposals for agent/model kinds.
- **Upstream model-server byte-for-byte migration:** When/if
  upstream #34476 merges, switch from downstream `AiModelServerAPI`
  types to upstream equivalents. The schemas are identical, so this is
  a mechanical type-import change.

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
