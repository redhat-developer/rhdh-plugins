# Migration Design: RHDH AI-Asset Entities to Upstream Backstage Kinds

> **Status: Draft** | **Last updated: 2026-08-10** | **Story: RHIDP-15302**
>
> **Epic:** RHIDP-15258 (Entity-Provider SDK) | **Feature:** RHDHPLAN-1507
>
> **Sign-off:** Pending RHDH architect review (see [Sign-Off](#sign-off))

This document maps current RHDH AI-asset entities (per
[Decision 1](../../design.md)) to upstream Backstage entity kind targets,
documents field-level transformation rules, identifies consumer-facing
impact, and specifies the backward compatibility strategy.

This is **readiness design** --- it documents the migration path
without executing migration. The actual migration is future work
dependent on upstream RFC finalization.

## Binding Decisions

The following decisions are resolved and are not re-litigated here:

- **Current-state SoT:**
  [ai-catalog-entity-model/design.md Decision 1](../../design.md) ---
  seven categories (`agent`, `skill`, `rule`, `skill-bundle`,
  `mcp-server`, `ai-model`, `model-server`).
- **MCP alignment:** RFC
  [#32062](https://github.com/backstage/backstage/issues/32062) Option 3
  shipped as `McpServerApiEntity`
  ([backstage#34016](https://github.com/backstage/backstage/pull/34016)).
  `kind: API` stays. No `API` -> `McpServer` kind rename.
- **Skills/rules:** `AiResource` shipped upstream
  ([#33575](https://github.com/backstage/backstage/issues/33575) lineage).
  Boost uses `AIResource`; casing alignment is the remaining work.
- **RHDHPLAN-1113 resolved:** Boost uses AIResource for skills/rules
  directly. The dual-path interim narrative is retired.
- **`vector-store` / `ai-tool`:** Out of scope --- vestiges of the
  former Augment POC
  ([gate comment](https://github.com/redhat-developer/rhdh-plugins/issues/4042#issuecomment-5204217995)).
- **Sign-off scope:** RHDH architect / tech lead (not upstream
  maintainer required).

## Confidence Levels

Each mapping carries a confidence level reflecting the maturity of the
upstream target:

| Level       | Meaning                                                  |
| ----------- | -------------------------------------------------------- |
| High        | Upstream kind shipped and stable; kind already aligned   |
| Medium--High | Upstream kind shipped; field/name alignment work remains |
| Medium/Low  | Upstream target proposed in an open PR; hedge accordingly |
| Low         | No solid upstream kind yet, or mapping is speculative    |

## Current-to-Upstream Mapping Table

Source of truth for current state:
[ai-catalog-entity-model/design.md Decision 1](../../design.md).
Mapping tables reconciled via
[#4188](https://github.com/redhat-developer/rhdh-plugins/issues/4188) /
[#4189](https://github.com/redhat-developer/rhdh-plugins/pull/4189).

| Category       | Current Kind | Current `spec.type` | Current Annotation                           | Upstream Target                                                                                               | Confidence   |
| -------------- | ------------ | ------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------ |
| `mcp-server`   | API          | `mcp-server`        | `rhdh.io/ai-asset-category: mcp-server`      | Same --- `McpServerApiEntity` ([#34016](https://github.com/backstage/backstage/pull/34016), merged)           | High         |
| `skill`        | AIResource   | `skill`             | `rhdh.io/ai-asset-category: skill`           | `AiResource` ([#33575](https://github.com/backstage/backstage/issues/33575), shipped)                        | Medium--High |
| `rule`         | AIResource   | `rule`              | `rhdh.io/ai-asset-category: rule`            | `AiResource` ([#33575](https://github.com/backstage/backstage/issues/33575), shipped)                        | Medium--High |
| `model-server` | Resource     | `ai-model-server`   | `rhdh.io/ai-asset-category: model-server`    | Candidate `API` / `ai-model-server` ([#34476](https://github.com/backstage/backstage/pull/34476), open)      | Medium/Low   |
| `ai-model`     | Resource     | `ai-model`          | `rhdh.io/ai-asset-category: ai-model`        | No solid upstream kind yet                                                                                    | Low          |
| `skill-bundle` | AIResource   | `ai-skill-bundle`   | `rhdh.io/ai-asset-category: skill-bundle`    | No upstream kind                                                                                              | Low          |
| `agent`        | Component    | `ai-agent`          | `rhdh.io/ai-asset-category: agent`           | No upstream kind via RFC #32062 (that RFC is MCP-only). Track RHDHPLAN-1113 / RHIDP-15865                     | Low          |

### Notes

- **`vector-store` / `ai-tool`** are explicitly out of scope for this
  readiness work (Augment POC vestiges, not part of the seven-category
  model).
- **Model-server downstream work:**
  [rhdh-plugins#4211](https://github.com/redhat-developer/rhdh-plugins/pull/4211)
  adds the new type for AI model servers downstream (RHIDP-14258), using
  the catalog model layer system in the `ai-integrations` workspace.
  Upstream [backstage#34476](https://github.com/backstage/backstage/pull/34476)
  proposes `kind: API` / `spec.type: ai-model-server` --- **not** a new
  kind named `ai-model-server`. Migration will be handled if/when the
  upstream PR merges.
- **Agent downstream work:**
  [rhdh-plugins#4164](https://github.com/redhat-developer/rhdh-plugins/pull/4164)
  introduces a downstream extension of `AiResource` for agents
  (RHIDP-15865 under RHDHPLAN-1507). Agent-kind ownership is tracked
  under RHDHPLAN-1113. RFC #32062 does **not** define an `AIAgent`
  kind --- do not attribute agent entity kind to that RFC.

## Field-Level Transformation Rules

### MCP Server (Confidence: High)

**Kind change:** None. Already `kind: API`, `spec.type: mcp-server`.

**Field-level transforms:**

| Field                          | Current                                    | Target                                     | Action                                   |
| ------------------------------ | ------------------------------------------ | ------------------------------------------ | ---------------------------------------- |
| `spec.definition`              | Contains MCP server definition             | Deprecated in favor of `spec.remotes`      | Migrate to `spec.remotes` structure      |
| `spec.remotes`                 | Not present                                | Structured remote endpoints per upstream   | Populate from `spec.definition` content  |
| Catalog-model AI module opt-in | Not opted in                               | `@backstage/plugin-catalog-backend-module-ai-model` | Add module to backend configuration |

**Additional considerations:**

- Flag any fallback `Resource`-kind MCP entities that should be migrated
  to `API` kind.
- The `McpServerApiEntity` type
  ([backstage#34016](https://github.com/backstage/backstage/pull/34016))
  extends `ApiEntity` --- no structural kind change is required.

### Skill (Confidence: Medium--High)

**Kind change:** Casing alignment only.
`kind: AIResource` -> `kind: AiResource`.

**Field-level transforms:**

| Field              | Current                         | Target                        | Action                                          |
| ------------------ | ------------------------------- | ----------------------------- | ----------------------------------------------- |
| `kind`             | `AIResource`                    | `AiResource`                  | Update kind casing per upstream                  |
| `spec.type`        | `skill`                         | `skill` (unchanged)           | No change                                        |
| `spec.*` fields    | Current SDK-defined fields      | Upstream `AiResource` schema  | Align field names/structure per upstream schema  |
| `apiVersion`       | Current                         | Upstream `AiResource` version | Update to match upstream apiVersion              |

**Notes:**

- Entity refs are unaffected: Backstage lowercases kind in entity ref
  strings, so `airesource:default/my-skill` remains the same whether
  the kind is `AIResource` or `AiResource`.
- The `rhdh.io/ai-asset-category: skill` annotation is retained during
  transition.

### Rule (Confidence: Medium--High)

**Kind change:** Casing alignment only.
`kind: AIResource` -> `kind: AiResource`.

**Field-level transforms:**

| Field              | Current                         | Target                        | Action                                          |
| ------------------ | ------------------------------- | ----------------------------- | ----------------------------------------------- |
| `kind`             | `AIResource`                    | `AiResource`                  | Update kind casing per upstream                  |
| `spec.type`        | `rule`                          | `rule` (unchanged)            | No change                                        |
| `spec.*` fields    | Current SDK-defined fields      | Upstream `AiResource` schema  | Align field names/structure per upstream schema  |
| `apiVersion`       | Current                         | Upstream `AiResource` version | Update to match upstream apiVersion              |

**Notes:**

- Same transformation pattern as `skill`. Rules and skills share the
  `AiResource` kind.
- Entity refs are unaffected (same lowercasing behavior as skill).

### Model Server (Confidence: Medium/Low)

**Kind change:** `Resource` -> `API` (if
[#34476](https://github.com/backstage/backstage/pull/34476) merges).

**Field-level transforms (contingent on upstream PR):**

| Field           | Current                          | Target                                          | Action                                            |
| --------------- | -------------------------------- | ----------------------------------------------- | ------------------------------------------------- |
| `kind`          | `Resource`                       | `API`                                           | Kind change from Resource to API                  |
| `spec.type`     | `ai-model-server`                | `ai-model-server` (unchanged)                   | No change                                          |
| `spec.lifecycle`| May not be present               | Required for API entities                       | Populate lifecycle field                          |
| `spec.owner`    | Existing                         | Existing (unchanged)                            | No change                                          |
| `spec.definition`| Resource-style definition       | API-style definition                            | Restructure definition format per API entity spec |
| `spec.system`   | Optional                         | Optional (unchanged)                            | No change                                          |

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
  --- **not** a new kind named `ai-model-server`.

### AI Model (Confidence: Low)

**Kind change:** None planned. No solid upstream kind exists.

**Field-level transforms:** N/A --- no target to transform toward.

**Recommendation:** Continue using current mapping
(`kind: Resource`, `spec.type: ai-model`). Track future upstream
proposals. When an upstream kind is proposed, revisit this mapping and
assign field-level transforms.

### Skill Bundle (Confidence: Low)

**Kind change:** None planned. No upstream kind exists.

**Field-level transforms:** N/A --- no target to transform toward.

**Recommendation:** Stay on current mapping
(`kind: AIResource`, `spec.type: ai-skill-bundle`). Track future
upstream RFCs. If `AiResource` gains support for bundle semantics,
casing alignment (same as skill/rule) would apply.

### Agent (Confidence: Low)

**Kind change:** None planned. No upstream kind defined.

**Field-level transforms:** N/A --- no target to transform toward.

**Recommendation:** Continue using current mapping
(`kind: Component`, `spec.type: ai-agent`). Do **not** attribute agent
kind to RFC #32062 (that RFC is MCP-only). Track:

- RHDHPLAN-1113 agent-kind ownership
- RHIDP-15865 /
  [rhdh-plugins#4164](https://github.com/redhat-developer/rhdh-plugins/pull/4164)
  (downstream `AiResource` extension for agents)

## Consumer-Facing Changes

### Catalog UI Filters

| Category       | Current Filter                                                    | Post-Migration Filter                                                     | Impact                                             |
| -------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------- |
| `mcp-server`   | `kind: API` + `rhdh.io/ai-asset-category: mcp-server`            | Same (no kind change)                                                     | None                                               |
| `skill`        | `kind: AIResource` + `rhdh.io/ai-asset-category: skill`          | `kind: AiResource` (casing change)                                        | Annotation filter still useful for category distinction. Update kind filter casing. |
| `rule`         | `kind: AIResource` + `rhdh.io/ai-asset-category: rule`           | `kind: AiResource` (casing change)                                        | Same as skill.                                     |
| `skill-bundle` | `kind: AIResource` + `rhdh.io/ai-asset-category: skill-bundle`   | No change planned                                                         | None (until upstream kind exists)                  |
| `model-server` | `kind: Resource` + `rhdh.io/ai-asset-category: model-server`     | If [#34476](https://github.com/backstage/backstage/pull/34476) merges: `kind: API`, `spec.type: ai-model-server` | Must update kind filter from Resource to API.      |
| `ai-model`     | `kind: Resource` + `rhdh.io/ai-asset-category: ai-model`         | No change planned                                                         | None (until upstream kind exists)                  |
| `agent`        | `kind: Component` + `rhdh.io/ai-asset-category: agent`           | No change planned                                                         | None (until upstream kind exists)                  |

### Entity References

| Category       | Current Entity Ref                      | Post-Migration Entity Ref                  | Impact                                          |
| -------------- | --------------------------------------- | ------------------------------------------ | ----------------------------------------------- |
| `mcp-server`   | `api:default/my-mcp-server`             | `api:default/my-mcp-server`                | None                                            |
| `skill`        | `airesource:default/my-skill`           | `airesource:default/my-skill`              | None (Backstage lowercases kind in entity refs)  |
| `rule`         | `airesource:default/my-rule`            | `airesource:default/my-rule`               | None (same lowercasing behavior)                 |
| `skill-bundle` | `airesource:default/my-bundle`          | `airesource:default/my-bundle`             | None                                            |
| `model-server` | `resource:default/my-server`            | `api:default/my-server` (if #34476 merges) | **Breaking:** entity ref kind prefix changes from `resource:` to `api:`. Impacts entity links, relationships, and API queries. |
| `ai-model`     | `resource:default/my-model`             | `resource:default/my-model`                | None                                            |
| `agent`        | `component:default/my-agent`            | `component:default/my-agent`               | None                                            |

### API Queries

| Category       | Current Query                                                                                | Post-Migration Query                                                                          | Impact                  |
| -------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------- |
| `mcp-server`   | `GET /api/catalog/entities?filter=kind=API,spec.type=mcp-server`                              | Same                                                                                          | None                    |
| `skill`        | `GET /api/catalog/entities?filter=kind=AIResource,spec.type=skill`                            | `?filter=kind=AiResource,spec.type=skill`                                                     | Update kind casing      |
| `rule`         | `GET /api/catalog/entities?filter=kind=AIResource,spec.type=rule`                             | `?filter=kind=AiResource,spec.type=rule`                                                      | Update kind casing      |
| `model-server` | `GET /api/catalog/entities?filter=kind=Resource,rhdh.io/ai-asset-category=model-server`       | `?filter=kind=API,spec.type=ai-model-server` (if [#34476](https://github.com/backstage/backstage/pull/34476) merges) | Update kind + filter    |
| `ai-model`     | `GET /api/catalog/entities?filter=kind=Resource,spec.type=ai-model`                           | Same                                                                                          | None                    |
| `skill-bundle` | `GET /api/catalog/entities?filter=kind=AIResource,spec.type=ai-skill-bundle`                  | Same                                                                                          | None                    |
| `agent`        | `GET /api/catalog/entities?filter=kind=Component,spec.type=ai-agent`                          | Same                                                                                          | None                    |

## Backward Compatibility Strategy

### Annotation Retention

The `rhdh.io/ai-asset-category` annotation will be **retained on
migrated entities for one major version** after upstream kind alignment
is applied. This allows consumers to query by either the old
kind-based filter or the annotation-based filter during the transition
period.

### Deprecation Timeline

1. **Migration release (N):** Entities carry both upstream kind and
   `rhdh.io/ai-asset-category` annotation. Both old and new query
   patterns work. Release notes include deprecation notice for old
   query patterns.
2. **Next major release (N+1):** Annotation is removed. Only upstream
   kind-based queries are supported. Migration is complete.

### Migration Execution Strategy (Future Work)

When upstream kinds stabilize and migration is executed:

1. **Catalog processor** applies kind transformations during entity
   refresh (not batch migration).
2. **Entity refs** are updated by the catalog processor
   automatically --- the catalog handles ref format changes when the
   entity kind changes.
3. **API query patterns** are documented in release notes with
   before/after examples.
4. **UI filters** are updated in the same release as the catalog
   processor change.

### Dual-Filter Period

During the transition (release N), the following query patterns will
both work:

```
# Old pattern (deprecated)
GET /api/catalog/entities?filter=kind=Resource,rhdh.io/ai-asset-category=model-server

# New pattern (preferred)
GET /api/catalog/entities?filter=kind=API,spec.type=ai-model-server
```

The annotation-based filter remains functional because the
`rhdh.io/ai-asset-category` annotation is retained on all migrated
entities throughout the transition release.

## Upstream Tracking

| Upstream Reference                                                                           | Status      | Relevance                                         |
| -------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------- |
| [backstage#34016](https://github.com/backstage/backstage/pull/34016)                         | Merged      | `McpServerApiEntity` --- MCP server kind           |
| [backstage#33575](https://github.com/backstage/backstage/issues/33575)                       | Shipped     | `AiResource` kind for skills/rules                 |
| [backstage#34476](https://github.com/backstage/backstage/pull/34476)                         | Open PR     | `API` / `ai-model-server` candidate for model servers |
| [backstage#32062](https://github.com/backstage/backstage/issues/32062)                       | Closed      | MCP RFC (Option 3 confirmed) --- **not** agent-related |
| [rhdh-plugins#4211](https://github.com/redhat-developer/rhdh-plugins/pull/4211)              | Open PR     | Downstream model-server type (RHIDP-14258)        |
| [rhdh-plugins#4164](https://github.com/redhat-developer/rhdh-plugins/pull/4164)              | Open PR     | Downstream `AiResource` agent type (RHIDP-15865)  |

## Out of Scope

- **`vector-store` / `ai-tool`:** Augment POC vestiges; excluded from
  the seven-category model.
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
- **Catalog processor hook:** Automated migration via catalog
  processing pipeline (post-RFC-finalization).
- **Upstream RFC finalization tracking:** Continued monitoring of
  open PRs ([#34476](https://github.com/backstage/backstage/pull/34476))
  and proposals for agent/model kinds.

## Sign-Off

| Field       | Value                                       |
| ----------- | ------------------------------------------- |
| Reviewer    | *Pending*                                   |
| Role        | RHDH Architect / Tech Lead                  |
| Date        | *Pending*                                   |
| Status      | **Pending review**                          |
| Conditions  | *N/A*                                       |

> **Process:** Per
> [gate decision](https://github.com/redhat-developer/rhdh-plugins/issues/4042#issuecomment-5204217995),
> sign-off is RHDH-side (architect or tech lead). Once reviewed, the
> reviewer updates this table with their name, date, and approval
> status (`approved`, `approved-with-conditions`, or `rejected`).

## References

- [ai-catalog-entity-model/design.md Decision 1](../../design.md) ---
  current-state source of truth
- [migration-readiness/spec.md](spec.md) --- OpenSpec requirements
- [upstream-schema-alignment/proposal.md](../../../upstream-schema-alignment/proposal.md) ---
  upstream schema alignment proposal
- [upstream-schema-alignment/design.md](../../../upstream-schema-alignment/design.md) ---
  upstream schema alignment design
- [#4042](https://github.com/redhat-developer/rhdh-plugins/issues/4042) ---
  tracking issue (narrowed to RHIDP-15302)
- [#4188](https://github.com/redhat-developer/rhdh-plugins/issues/4188) /
  [#4189](https://github.com/redhat-developer/rhdh-plugins/pull/4189) ---
  mapping table reconciliation (merged)
- [#4220](https://github.com/redhat-developer/rhdh-plugins/issues/4220) ---
  sibling issue (RHIDP-15346 / RHIDP-15347)
