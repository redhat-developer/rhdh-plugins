# AI Asset Upstream Migration Design

> **Status: Draft** — Readiness design only. Actual migration is future work
> pending upstream RFC finalization.
>
> **Last updated:** 2026-08-10
>
> **Story:** RHIDP-15302 (tasks 8.1-8.4)
> **Feature:** RHDHPLAN-1507 — Epic RHIDP-15258
> **Parent issue:**
> [#4042](https://github.com/redhat-developer/rhdh-plugins/issues/4042)

## Purpose

This document maps every current RHDH AI-asset entity representation to
its upstream Backstage target, documents field-level transformation
rules, identifies consumer-facing impact, and defines a backward
compatibility strategy. It is a **readiness design** — the actual
catalog migration is explicit future work.

Platform engineers can use this document to understand what will change
when upstream entity kinds stabilize, and how RHDH will transition
without breaking existing catalog consumers.

### Scope

- All **seven** AI-asset categories per
  [ai-catalog-entity-model/design.md Decision 1][decision-1].
- Field-level transformation rules per category.
- Consumer-facing changes (catalog UI filters, entity refs, API
  queries).
- Backward compatibility strategy.

### Out of scope

- **`vector-store` / `ai-tool`** categories — not yet confirmed as
  AI-asset mapping rows. See
  [catalog-entities spec][catalog-entities-spec] for tracking.
- Dry-run migration-readiness CLI — covered by
  [#4220](https://github.com/redhat-developer/rhdh-plugins/issues/4220)
  (RHIDP-15347).
- Annotation specification document (RHIDP-15346) — covered by
  [#4220](https://github.com/redhat-developer/rhdh-plugins/issues/4220).
- Live catalog migration (re-mapping entities to finalized upstream
  kinds) and any catalog processor for automated migration — future
  work after RFC finalization and sign-off.
- Detailed production entity-kind transition / rollout plan — future
  work.
- Re-writing mapping tables already reconciled in
  [#4189](https://github.com/redhat-developer/rhdh-plugins/pull/4189).

## Current-State Source of Truth

The authoritative current-state entity mapping is
[ai-catalog-entity-model/design.md Decision 1][decision-1]. It defines
seven `rhdh.io/ai-asset-category` values and their entity kind +
`spec.type` pairings:

| Category       | Backstage Kind | `spec.type`       | Notes                                |
| -------------- | -------------- | ----------------- | ------------------------------------ |
| `agent`        | Component      | `ai-agent`        | Pending RHDHPLAN-1113 agent kind def |
| `skill`        | AIResource     | `skill`           | AIResource per RHDHPLAN-1113         |
| `rule`         | AIResource     | `rule`            | AIResource per RHDHPLAN-1113         |
| `skill-bundle` | AIResource     | `ai-skill-bundle` | Curated skill collections            |
| `mcp-server`   | API            | `mcp-server`      | Ships in RHDH 2.1 via RHDHPLAN-1510  |
| `ai-model`     | Resource       | `ai-model`        | Pending RHDHPLAN-404 upstream work   |
| `model-server` | Resource       | `ai-model-server` | Pending RHDHPLAN-404 upstream work   |

All entities carry `rhdh.io/ai-asset-category` as the domain
classifier, independent of the Backstage structural kind.

> **Note:** Decision 1 still lists `AIResource` as the current kind for
> skills/rules/skill-bundles. In-tree Boost fixtures and plugin tests
> already emit `kind: AiResource`, so casing alignment may already be
> done locally. Decision 1 remains the source of truth for this
> document; any Decision 1 wording update is separate follow-up work.

## Mapping Table: Current to Upstream Target

The mapping below was reconciled in
[#4188](https://github.com/redhat-developer/rhdh-plugins/issues/4188) /
[#4189](https://github.com/redhat-developer/rhdh-plugins/pull/4189) and
reflects the post-reconciliation OpenSpec state. Confidence levels
follow
[upstream-schema-alignment/design.md Decision 2][usa-design-d2].

| AI Asset     | Current Kind | Current `spec.type` | `rhdh.io/ai-asset-category` | Upstream Target                                                                                                                                 | Confidence  | Notes                                                                                            |
| ------------ | ------------ | ------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------ |
| MCP Server   | `API`        | `mcp-server`        | `mcp-server`                | Same — `McpServerApiEntity` ([backstage#34016][bs-34016], merged). **No kind rename.**                                                          | High        | Kind already aligned. Remaining work is field/module gaps (see Transformation Rules).            |
| Model Server | `Resource`   | `ai-model-server`   | `model-server`              | Candidate `kind: API`, `spec.type: ai-model-server` ([backstage#34476][bs-34476], open PR; downstream [#4211][rhdh-4211]). **Not** a new kind.  | Medium/Low  | `Resource` to `API` kind change + field mapping. Hedge on open PR status.                        |
| AI Model     | `Resource`   | `ai-model`          | `ai-model`                  | No solid upstream kind yet.                                                                                                                     | Low         | Continue current mapping. Track future upstream proposals.                                       |
| Skill        | `AIResource` | `skill`             | `skill`                     | `AiResource` (shipped upstream; see [Backstage 1.51][bs-1-51] / [#34876][bs-34876]; [#33575][bs-33575] lineage).                                | Medium-High | Kind/name casing alignment (`AIResource` to `AiResource`). Field alignment needed.               |
| Rule         | `AIResource` | `rule`              | `rule`                      | `AiResource` (shipped upstream; see [Backstage 1.51][bs-1-51] / [#34876][bs-34876]; [#33575][bs-33575] lineage).                                | Medium-High | Kind/name casing alignment (`AIResource` to `AiResource`). Field alignment needed.               |
| Skill Bundle | `AIResource` | `ai-skill-bundle`   | `skill-bundle`              | No upstream kind yet.                                                                                                                           | Low         | Stay on current mapping; track future RFCs.                                                      |
| Agent        | `Component`  | `ai-agent`          | `agent`                     | No upstream kind via RFC [#32062][bs-32062] (that RFC is MCP-only). Track RHIDP-15865 / [#4164][rhdh-4164] (`AiResource` + `spec.type: agent`). | Low         | Do **not** attribute agent kind to RFC #32062. Agent-kind ownership tracked under RHDHPLAN-1113. |

### Confidence level definitions

| Level           | Meaning                                                      |
| --------------- | ------------------------------------------------------------ |
| **High**        | Upstream kind shipped and stable; RHDH kind already aligned. |
| **Medium-High** | Upstream kind shipped; field/name alignment work remains.    |
| **Medium/Low**  | Upstream target proposed in an open PR; hedge accordingly.   |
| **Low**         | No solid upstream kind yet, or mapping is speculative.       |

## Transformation Rules

Per-category field-level transformation rules. Each subsection covers
what changes beyond the kind and `spec.type`.

### MCP Server (High confidence)

**Kind change:** None. `kind: API` stays `kind: API`.

**Field transformations:**

| Field                | Current                         | Target                                              | Action                                                                                          |
| -------------------- | ------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `spec.type`          | `mcp-server`                    | `mcp-server`                                        | No change.                                                                                      |
| `spec.definition`    | Free-form API definition string | `spec.remotes` (`{ type, url }[]`)                  | Migrate `spec.definition` content to structured `spec.remotes` per `McpServerApiEntity` schema. |
| catalog-model module | Not opted in                    | `@backstage/plugin-catalog-backend-module-ai-model` | Opt in to the upstream AI catalog-model module for entity validation.                           |

**Additional considerations:**

- Flag any fallback `Resource`-kind entities that represent MCP servers.
  These must be migrated to `kind: API` with `spec.type: mcp-server`
  before upstream field alignment.
- The `rhdh.io/ai-asset-category: mcp-server` annotation remains for
  backward compatibility during transition.

### Model Server (Medium/Low confidence)

**Kind change:** `Resource` to `API` (if
[backstage#34476][bs-34476] merges).

**Field transformations (conditional on PR merge):**

| Field                 | Current           | Target                                                                        | Action                                                     |
| --------------------- | ----------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `kind`                | `Resource`        | `API`                                                                         | Kind change from Resource to API.                          |
| `spec.type`           | `ai-model-server` | `ai-model-server`                                                             | No change to type value.                                   |
| `spec.owner`          | Standard          | Standard                                                                      | No change (both kinds use `spec.owner`).                   |
| `spec.serverType`     | Not present       | Required (`spec.serverType`)                                                  | Add `spec.serverType` per upstream schema.                 |
| `spec.serverUrl`      | Not present       | Required (`spec.serverUrl`)                                                   | Add `spec.serverUrl` per upstream schema.                  |
| `spec.models`         | Not present       | Optional `{ discoverable?: boolean, available?: string[], default?: string }` | Add model discovery metadata when applicable.              |
| `spec.requiresApiKey` | Not present       | Optional (`spec.requiresApiKey`)                                              | Add when the server requires an API key.                   |
| `spec.apiEntityRef`   | Not present       | Optional (`spec.apiEntityRef`)                                                | Add entity ref to a related API credential/entity if used. |

**Hedge:** This mapping is conditional on
[backstage#34476][bs-34476] merging. If the PR is declined or the
schema changes, the transformation rules will need to be updated.
Downstream implementation:
[#4211](https://github.com/redhat-developer/rhdh-plugins/pull/4211).

### AI Model (Low confidence)

**Kind change:** Unknown — no solid upstream kind proposed.

**Field transformations:** None defined. Continue using `kind: Resource`,
`spec.type: ai-model` until upstream stabilizes.

**Recommendation:** Track future upstream proposals. When an upstream
kind is proposed, revisit this section with concrete field-level
transformation rules.

### Skill (Medium-High confidence)

**Kind change:** `AIResource` to `AiResource` (casing alignment).

**Field transformations** (upstream `AiResource` skill subtype; see
[Backstage 1.51][bs-1-51] / [#33575][bs-33575] lineage):

| Field                           | Current                                       | Target                            | Action                                                                                                    |
| ------------------------------- | --------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `kind`                          | `AIResource`                                  | `AiResource`                      | Casing change. Backstage lowercases kind in entity refs, so `airesource:default/my-skill` stays the same. |
| `spec.type`                     | `skill`                                       | `skill`                           | No change.                                                                                                |
| `spec.lifecycle` / `spec.owner` | Required base fields                          | Required base fields              | No change.                                                                                                |
| `spec.system`                   | Optional                                      | Optional                          | No change when present.                                                                                   |
| `spec.disciplines`              | Optional string array (RHDH / local fixtures) | Optional `string[]`               | Keep; aligns with upstream skill schema.                                                                  |
| `spec.categories`               | Optional string array                         | Optional `string[]`               | Keep; aligns with upstream skill schema.                                                                  |
| `spec.agents`                   | Optional refs / identifiers                   | Optional `string[]`               | Keep as catalog-friendly agent identifiers per upstream schema.                                           |
| `spec.dependsOn`                | Often absent                                  | Optional entity-ref `string[]`    | Add when the skill depends on other `AiResource` entities (`defaultKind: AiResource`).                    |
| `spec.location` (RHDH-local)    | Sometimes present (`type` + `target`)         | Not part of upstream skill schema | Remove from `spec`; point content via `metadata.annotations['backstage.io/source-location']` instead.     |
| Skill **content**               | Embedded or custom location fields            | Not stored in entity `spec`       | Providers must set `backstage.io/source-location` to the `SKILL.md` (or equivalent) source file.          |

**Note:** The `AIResource` to `AiResource` casing change does not
affect entity ref strings because Backstage lowercases the kind prefix
(`airesource:default/...` in both cases). In-tree Boost fixtures and
tests already use `kind: AiResource`; see the footnote under
Current-State Source of Truth.

### Rule (Medium-High confidence)

**Kind change:** `AIResource` to `AiResource` (casing alignment).

**Field transformations** (upstream `AiResource` rule subtype):

| Field                           | Current                               | Target                           | Action                                                                                                   |
| ------------------------------- | ------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `kind`                          | `AIResource`                          | `AiResource`                     | Casing change (same entity-ref behavior as Skill).                                                       |
| `spec.type`                     | `rule`                                | `rule`                           | No change — distinguishes rules from skills on the same kind.                                            |
| `spec.lifecycle` / `spec.owner` | Required base fields                  | Required base fields             | No change.                                                                                               |
| `spec.system`                   | Optional                              | Optional                         | No change when present.                                                                                  |
| `spec.disciplines`              | Optional string array                 | Optional `string[]`              | Keep when used; supported on upstream rule subtype.                                                      |
| `spec.category`                 | Present in RHDH fixtures              | **Required** string              | Ensure every rule entity sets `spec.category` (upstream required).                                       |
| `spec.rationale`                | Present in RHDH fixtures              | **Required** string              | Ensure every rule entity sets `spec.rationale` (upstream required).                                      |
| `spec.location` (RHDH-local)    | Sometimes present (`type` + `target`) | Not part of upstream rule schema | Remove from `spec`; use `metadata.annotations['backstage.io/source-location']` for the rule source file. |
| Rule **content**                | Embedded or custom location fields    | Not stored in entity `spec`      | Same as Skill — content lives at `backstage.io/source-location`, not in `spec`.                          |

### Skill Bundle (Low confidence)

**Kind change:** Unknown — no upstream kind proposed.

**Field transformations:** None defined. Continue using
`kind: AIResource`, `spec.type: ai-skill-bundle`.

**Recommendation:** Stay on current mapping. Track future upstream RFCs
that may define a bundle or collection kind.

### Agent (Low confidence)

**Kind change:** Unknown — no upstream kind via RFC
[#32062][bs-32062] (that RFC is MCP-only, not agent).

**Field transformations:** None defined. Continue using
`kind: Component`, `spec.type: ai-agent`.

**Current work in progress:**

- RHIDP-15865 /
  [#4164](https://github.com/redhat-developer/rhdh-plugins/pull/4164)
  is adding `AiResource` + `spec.type: agent` schema support
  downstream. This represents a potential migration path from
  `Component` to `AiResource` for agents, but the upstream agent-kind
  ownership is still tracked under RHDHPLAN-1113.

**Recommendation:** Do not attribute agent kind to RFC #32062. Track
agent-kind ownership under RHDHPLAN-1113 and RHIDP-15865.

## Consumer-Facing Changes

Migration to upstream entity kinds will affect three consumer-facing
areas: catalog UI filters, entity references, and API queries.

### Catalog UI Filters

| Category     | Current filter                                                 | Post-migration filter                                                                        | Impact                                            |
| ------------ | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| MCP Server   | `kind: API` + `rhdh.io/ai-asset-category: mcp-server`          | No change (kind already aligned).                                                            | **None.**                                         |
| Model Server | `kind: Resource` + `rhdh.io/ai-asset-category: model-server`   | `kind: API`, `spec.type: ai-model-server` (if [#34476][bs-34476] merges).                    | **Kind filter changes** from `Resource` to `API`. |
| AI Model     | `kind: Resource` + `rhdh.io/ai-asset-category: ai-model`       | No change (no upstream kind yet).                                                            | **None** until upstream kind proposed.            |
| Skill        | `kind: AIResource` + `rhdh.io/ai-asset-category: skill`        | `kind: AiResource` (casing change). Annotation filter still useful for category distinction. | **Minimal** — casing change only.                 |
| Rule         | `kind: AIResource` + `rhdh.io/ai-asset-category: rule`         | `kind: AiResource` (casing change).                                                          | **Minimal** — same as Skill.                      |
| Skill Bundle | `kind: AIResource` + `rhdh.io/ai-asset-category: skill-bundle` | No change (no upstream kind yet).                                                            | **None** until upstream kind proposed.            |
| Agent        | `kind: Component` + `rhdh.io/ai-asset-category: agent`         | No change (no upstream kind yet).                                                            | **None** until upstream kind proposed.            |

### Entity References

| Category     | Current entity ref             | Post-migration entity ref                               | Impact                                                                                                                                                       |
| ------------ | ------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| MCP Server   | `api:default/my-mcp-server`    | `api:default/my-mcp-server`                             | **No change.**                                                                                                                                               |
| Model Server | `resource:default/my-server`   | `api:default/my-server` (if [#34476][bs-34476] merges). | **Breaking** — entity ref kind prefix changes from `resource:` to `api:`. All entity links, relationship references, and stored entity refs must be updated. |
| AI Model     | `resource:default/my-model`    | No change.                                              | **No change.**                                                                                                                                               |
| Skill        | `airesource:default/my-skill`  | `airesource:default/my-skill`                           | **No change.** Backstage lowercases kind prefixes; `AIResource` and `AiResource` both produce `airesource:`.                                                 |
| Rule         | `airesource:default/my-rule`   | `airesource:default/my-rule`                            | **No change** (same as Skill).                                                                                                                               |
| Skill Bundle | `airesource:default/my-bundle` | No change.                                              | **No change.**                                                                                                                                               |
| Agent        | `component:default/my-agent`   | No change.                                              | **No change.**                                                                                                                                               |

### API Queries

Catalog annotation filters use the
`metadata.annotations.<key>=<value>` path form (see
[Backstage catalog API filtering](https://backstage.io/docs/features/software-catalog/software-catalog-api#filtering)).

| Category     | Current query                                                                         | Post-migration query                                                           | Impact                                            |
| ------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------- |
| MCP Server   | `?filter=kind=API,spec.type=mcp-server`                                               | No change.                                                                     | **None.**                                         |
| Model Server | `?filter=kind=Resource,metadata.annotations.rhdh.io/ai-asset-category=model-server`   | `?filter=kind=API,spec.type=ai-model-server` (if [#34476][bs-34476] merges).   | **Breaking** — both kind and filter field change. |
| AI Model     | `?filter=kind=Resource,metadata.annotations.rhdh.io/ai-asset-category=ai-model`       | No change.                                                                     | **None.**                                         |
| Skill        | `?filter=kind=AIResource,metadata.annotations.rhdh.io/ai-asset-category=skill`        | `?filter=kind=AiResource,metadata.annotations.rhdh.io/ai-asset-category=skill` | **Minimal** — casing change in kind filter value. |
| Rule         | `?filter=kind=AIResource,metadata.annotations.rhdh.io/ai-asset-category=rule`         | `?filter=kind=AiResource,metadata.annotations.rhdh.io/ai-asset-category=rule`  | **Minimal** — same as Skill.                      |
| Skill Bundle | `?filter=kind=AIResource,metadata.annotations.rhdh.io/ai-asset-category=skill-bundle` | No change.                                                                     | **None.**                                         |
| Agent        | `?filter=kind=Component,metadata.annotations.rhdh.io/ai-asset-category=agent`         | No change.                                                                     | **None.**                                         |

## Backward Compatibility

### Strategy

Keep the `rhdh.io/ai-asset-category` annotation on migrated entities
for **one major RHDH version** after migration. This allows consumers
to query using both old and new filter patterns during the transition
period.

### Deprecation approach

1. **Announcement:** Include migration guidance in the RHDH release
   notes for the version that introduces upstream kind alignment.
2. **Dual-filter period:** For one major version, both old and new
   query patterns return results. The `rhdh.io/ai-asset-category`
   annotation remains on all entities regardless of the new kind.
3. **Deprecation notice:** Mark the old query patterns as deprecated
   in the API documentation and catalog UI.
4. **Removal:** In the following major version, remove support for
   the deprecated query patterns. The annotation itself may persist
   as a useful domain classifier even after kind alignment.

### Per-category compatibility notes

| Category     | Compatibility impact       | Notes                                                                                                                                         |
| ------------ | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| MCP Server   | **No breaking change**     | Kind already aligned. Only field/module changes.                                                                                              |
| Model Server | **Breaking** (conditional) | Kind changes from `Resource` to `API`. Entity refs change. Requires dual-filter support during transition. Conditional on [#34476][bs-34476]. |
| AI Model     | **No change**              | No upstream kind yet.                                                                                                                         |
| Skill / Rule | **Minimal**                | Casing change only (`AIResource` to `AiResource`). Entity refs unchanged.                                                                     |
| Skill Bundle | **No change**              | No upstream kind yet.                                                                                                                         |
| Agent        | **No change**              | No upstream kind yet.                                                                                                                         |

## Sign-Off

> This section is a placeholder for reviewer sign-off per
> [#4042](https://github.com/redhat-developer/rhdh-plugins/issues/4042)
> tasks 8.5-8.6. It will be filled in by a human reviewer after this
> document is merged.

| Field    | Value              |
| -------- | ------------------ |
| Reviewer | _(to be filled)_   |
| Role     | RHDH Architect     |
| Date     | _(to be filled)_   |
| Status   | _(pending review)_ |

---

## References

- [ai-catalog-entity-model/design.md Decision 1][decision-1] —
  Current-state source of truth for entity kinds and categories
- [upstream-schema-alignment/proposal.md][usa-proposal] —
  Upstream schema alignment proposal
- [upstream-schema-alignment/design.md][usa-design] —
  Upstream schema alignment design
- [annotation-specification/spec.md][annotation-spec] —
  Annotation specification (RHIDP-15346)
- [migration-readiness/spec.md][migration-spec] —
  Migration readiness specification (RHIDP-15302)
- [#4189](https://github.com/redhat-developer/rhdh-plugins/pull/4189)
  — Mapping table reconciliation PR
- [#4042 gate comment][gate-comment] — Pre-implementation gate
  decisions
- [Backstage 1.51 release notes][bs-1-51] — shipped `AiResource` kind
  in catalog-model
- [#34876][bs-34876] — follow-on `AiResource` spec extension proposal
- [#33575][bs-33575] — AIContext RFC (related AI catalog kind lineage)

[decision-1]: ../openspec/changes/ai-catalog-entity-model/design.md
[usa-proposal]: ../openspec/changes/upstream-schema-alignment/proposal.md
[usa-design]: ../openspec/changes/upstream-schema-alignment/design.md
[usa-design-d2]: ../openspec/changes/upstream-schema-alignment/design.md#decision-2-mapping-table-structure-with-confidence-levels
[annotation-spec]: ../openspec/changes/upstream-schema-alignment/specs/annotation-specification/spec.md
[migration-spec]: ../openspec/changes/ai-catalog-entity-model/specs/migration-readiness/spec.md
[catalog-entities-spec]: ../openspec/changes/agent-creation-discovery/specs/catalog-entities/spec.md
[gate-comment]: https://github.com/redhat-developer/rhdh-plugins/issues/4042#issuecomment-5204217995
[bs-34016]: https://github.com/backstage/backstage/pull/34016
[bs-34476]: https://github.com/backstage/backstage/pull/34476
[bs-33575]: https://github.com/backstage/backstage/issues/33575
[bs-32062]: https://github.com/backstage/backstage/issues/32062
[bs-34876]: https://github.com/backstage/backstage/issues/34876
[bs-1-51]: https://github.com/backstage/backstage/blob/master/docs/releases/v1.51.0-changelog.md
[rhdh-4211]: https://github.com/redhat-developer/rhdh-plugins/pull/4211
[rhdh-4164]: https://github.com/redhat-developer/rhdh-plugins/pull/4164
