# Migration Readiness for Upstream Entity Kinds

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.
>
> **Design document:** [migration-plan.md](migration-plan.md) — implements RHIDP-15302 tasks 8.1–8.4 (canonical SoT). Platform engineers can also find a pointer at [`specifications/ai-asset-upstream-migration-design.md`](../../../../../specifications/ai-asset-upstream-migration-design.md).

Design document mapping custom annotations and entity kinds to upstream Backstage entity kind targets, identifying consumer-facing changes, and obtaining RHDH architect / tech-lead sign-off (upstream maintainer optional). Current-state source of truth: [ai-catalog-entity-model/design.md Decision 1](../../design.md). MCP server kind is already aligned with upstream (`McpServerApiEntity`, [backstage#34016](https://github.com/backstage/backstage/pull/34016)); RFC [#32062](https://github.com/backstage/backstage/issues/32062) is MCP-only and does **not** define an agent kind. Entity-type pivot landed: `AiResource` (lowercase `i`) for skills/rules/agents, `AiModelServerAPI` for model servers.

## Stakeholder Alignment (2026-07-13, updated 2026-08-06)

> Per RHDHPLAN-1505 stakeholder meeting and [#4042 gate comment](https://github.com/redhat-developer/rhdh-plugins/issues/4042#issuecomment-5204217995):
>
> - **Decision 1 baseline:** The current-state source of truth is [ai-catalog-entity-model/design.md Decision 1](../../design.md). The mapping table uses Decision 1's seven categories as the starting point.
> - **RHDHPLAN-1113 resolved:** Boost uses `AiResource` (lowercase `i`) for skills/rules directly. The dual-path (Resource/Component interim vs AiResource) is retired as the primary narrative.
> - **MCP kind-aligned:** RFC [#32062](https://github.com/backstage/backstage/issues/32062) Option 3 shipped as `McpServerApiEntity` ([backstage#34016](https://github.com/backstage/backstage/pull/34016)). MCP stays `kind: API`. **No** `API` → `McpServer` kind rename.
> - **Skills/rules shipped:** `AiResource` kind shipped upstream via [backstage#34261](https://github.com/backstage/backstage/pull/34261) ([#33575](https://github.com/backstage/backstage/issues/33575) lineage). The entity kind is `AiResource` (lowercase `i`) — there is no kind called `AIResource`. Remaining work is docs/emitter alignment to canonical casing.
> - **Model servers committed:** `AiModelServerAPI` from [rhdh-plugins#4211](https://github.com/redhat-developer/rhdh-plugins/pull/4211) is the committed RHDH 2.1 target. Byte-for-byte with upstream [backstage#34476](https://github.com/backstage/backstage/pull/34476) if it merges.
> - **Agents committed:** `AiResource` / `spec.type: agent` from [rhdh-plugins#4164](https://github.com/redhat-developer/rhdh-plugins/pull/4164) (merged) is the committed RHDH 2.1 target. Boost pivoting via [#4260](https://github.com/redhat-developer/rhdh-plugins/pull/4260).
>
> The mapping scenarios below use Decision 1 as the baseline. The RHDHPLAN-1113 dual-path is no longer the primary narrative.

## ADDED Requirements

### Requirement: Migration Design Document

A design document MUST map current custom annotations to upstream entity kinds when available.

#### Scenario: Mapping table exists (RHIDP-15302)

- **WHEN** the migration-readiness design document is reviewed
- **THEN** it contains a table mapping: current kind + spec.type + annotation → upstream target kind
- **AND** the table covers all seven AI asset categories per Decision 1: `agent`, `skill`, `rule`, `skill-bundle`, `mcp-server`, `ai-model`, `model-server`
- **AND** the table uses [ai-catalog-entity-model/design.md Decision 1](../../design.md) as the current-state source of truth

#### Scenario: Example mapping for agents (RHIDP-15302)

- **WHEN** the migration document maps the `agent` category
- **THEN** the migration document specifies:
  - **Current:** `kind: Component`, `spec.type: ai-agent`, `rhdh.io/ai-asset-category: agent` (Decision 1 / boost today; RHDHPLAN-1113 owns agent-kind strategy)
  - **Target:** No upstream kind via RFC #32062 (MCP-only). Downstream RHDH target from [rhdh-plugins#4164](https://github.com/redhat-developer/rhdh-plugins/pull/4164) (merged): `kind: AiResource`, `spec.type: agent` (`AgentAiResourceEntityV1alpha1`).
  - **Confidence:** Low
  - **Note:** RFC #32062 does **not** define `AIAgent`. Do not attribute agent kind to RFC #32062.

#### Scenario: Example mapping for MCP servers — kind-aligned (RHIDP-15302)

- **WHEN** upstream shipped `McpServerApiEntity` via [backstage#34016](https://github.com/backstage/backstage/pull/34016) (RFC [#32062](https://github.com/backstage/backstage/issues/32062) Option 3)
- **THEN** the migration document specifies:
  - **Current:** `kind: API`, `spec.type: mcp-server`, `rhdh.io/ai-asset-category: mcp-server`
  - **Target:** Same — `kind: API`, `spec.type: mcp-server` (`McpServerApiEntity`). **No kind rename.**
  - **Confidence:** High (kind already aligned)
  - **Remaining work:** Field/module gaps — hard-replace legacy `spec.definition` with required `spec.remotes` (`McpServerApiEntity` has no `definition` field), opt in to `@backstage/plugin-catalog-backend-module-ai-model`. Flag fallback `Resource` entities.

#### Scenario: Example mapping for skills and rules (RHIDP-15302)

- **WHEN** upstream shipped `AiResource` kind via [backstage#34261](https://github.com/backstage/backstage/pull/34261) (see [#33575](https://github.com/backstage/backstage/issues/33575) lineage)
- **THEN** the migration document specifies:
  - **Skill — Current:** `kind: AiResource`, `spec.type: skill`, `rhdh.io/ai-asset-category: skill`
  - **Rule — Current:** `kind: AiResource`, `spec.type: rule`, `rhdh.io/ai-asset-category: rule`
  - **Target:** `AiResource` (shipped upstream via #34261)
  - **Confidence:** Medium–High
  - **Transformation:** Docs/emitter casing alignment (`AIResource` → `AiResource`; filters already case-insensitive) + field alignment per upstream schema

#### Scenario: Example mapping for AI models (RHIDP-15302)

- **WHEN** the migration document maps the `ai-model` category
- **THEN** the migration document specifies:
  - **Current:** `kind: Resource`, `spec.type: ai-model`, `rhdh.io/ai-asset-category: ai-model`
  - **Target:** No solid upstream kind yet
  - **Confidence:** Low
  - **Recommendation:** Continue using current mapping. Track future upstream proposals.

#### Scenario: Example mapping for model servers (RHIDP-15302)

- **WHEN** downstream committed to `AiModelServerAPI` from [rhdh-plugins#4211](https://github.com/redhat-developer/rhdh-plugins/pull/4211) (`kind: API`, `spec.type: ai-model-server`) for RHDH 2.1
- **THEN** the migration document specifies:
  - **Current:** `kind: API`, `spec.type: ai-model-server` (`AiModelServerAPI` from #4211)
  - **Target:** Same schema. If upstream [backstage#34476](https://github.com/backstage/backstage/pull/34476) merges, migration is byte-for-byte (switch to upstream types). **Not** a new kind named `ai-model-server`.
  - **Confidence:** Medium (downstream committed; upstream alignment pending)
  - **Note:** AI models are part of the model-server entity (list of model names) — no separate entity kind per #34476 and #4211

#### Scenario: Example mapping for skill bundles (RHIDP-15302)

- **WHEN** the migration document maps the `skill-bundle` category
- **THEN** the migration document specifies:
  - **Current:** `kind: AiResource`, `spec.type: ai-skill-bundle`, `rhdh.io/ai-asset-category: skill-bundle`
  - **Target:** No upstream kind
  - **Confidence:** Low
  - **Recommendation:** Stay on current mapping; track future RFCs.

#### Scenario: Mapping for categories without upstream kinds (RHIDP-15302)

- **WHEN** no upstream kind exists for `skill-bundle`
- **THEN** the migration document specifies: "No upstream kind defined yet. Continue using current mapping until upstream stabilizes."
- **AND** for `agent` and `model-server`, the downstream committed targets (`AiResource`/`agent` from #4164, `AiModelServerAPI` from #4211) are documented as the RHDH 2.1 targets
- **AND** for `ai-model`, documents that models are part of the `AiModelServerAPI` entity (no separate entity kind)
- **AND** the document tracks relevant upstream proposals or discussions

> **Out of scope / TBD:** `vector-store` and `ai-tool` are excluded from the seven-category upstream-migration SoT but remain recognized by boost `isAiAsset` / fixtures until explicitly retired. See [catalog-entities spec](../../../agent-creation-discovery/specs/catalog-entities/spec.md) for tracking.

### Requirement: Consumer-Facing Changes Identified

The migration document MUST identify consumer-facing changes when transitioning to upstream kinds.

#### Scenario: Catalog UI filters impacted — kind-aligned categories (RHIDP-15302)

- **WHEN** the catalog UI filters by `kind: AiResource` + `rhdh.io/ai-asset-category: skill`
- **THEN** the migration document identifies: "Kind is already `AiResource` (aligned with upstream). Annotation filter still useful for category distinction."

#### Scenario: Catalog UI filters impacted — kind-changing categories (RHIDP-15302)

- **WHEN** the catalog UI filters by `kind: Resource` + `rhdh.io/ai-asset-category: model-server`
- **THEN** the migration document identifies: "If [#34476](https://github.com/backstage/backstage/pull/34476) merges, filters must change to `kind: API, spec.type: ai-model-server`."

#### Scenario: Entity refs change format (RHIDP-15302)

- **WHEN** an entity ref uses a kind that will change (e.g., model-server: `resource:default/my-server`)
- **THEN** the migration document identifies: "For model-server if [#34476](https://github.com/backstage/backstage/pull/34476) merges: `resource:default/my-server` → `api:default/my-server` (kind change `Resource` → `API`). For skills/rules: entity refs stay the same (`airesource:default/my-skill`) because Backstage lowercases kind prefixes and `AIResource` → `AiResource` produces the same ref string."
- **AND** this impacts: entity links in catalog, relationship references, API queries filtering by entity ref

#### Scenario: Queries and API calls impacted (RHIDP-15302)

- **WHEN** API clients query `GET /api/catalog/entities?filter=kind=Resource,metadata.annotations.rhdh.io/ai-asset-category=model-server`
- **THEN** the migration document identifies: "If [#34476](https://github.com/backstage/backstage/pull/34476) merges, queries must change to `?filter=kind=API,spec.type=ai-model-server`. For MCP servers: no kind change needed (already `kind: API`)."

#### Scenario: Backward compatibility strategy documented (RHIDP-15302)

- **WHEN** the migration document specifies consumer-facing changes
- **THEN** it also documents backward compatibility approach: "Keep `rhdh.io/ai-asset-category` annotation on migrated entities for one major version. Annotation-only queries (full path `metadata.annotations.rhdh.io/ai-asset-category`) span kind-changing migrations; pre-migration kind+annotation AND filters do **not** work for kind-change migrations (e.g., `kind=Resource` will not match an entity whose kind is now `API`). Dev-preview entities can be broken/re-worked. Deprecation notice in release notes."

### Requirement: Upstream Maintainer or RHDH Architect Sign-Off

The migration design document MUST be reviewed and signed off by an upstream Backstage maintainer OR RHDH architect.

#### Scenario: Sign-off documented in spec (RHIDP-15302)

- **WHEN** the migration design document is finalized
- **THEN** it includes a sign-off section with: reviewer name, reviewer role (upstream maintainer OR RHDH architect), date of approval, approval status (approved/approved-with-conditions/rejected)

#### Scenario: Upstream maintainer approval (RHIDP-15302)

- **WHEN** an upstream Backstage maintainer reviews the migration document
- **THEN** they confirm: the mapping aligns with upstream RFC intent, the transformation strategy is sound, the backward compatibility approach is reasonable
- **AND** their approval is documented in the spec

#### Scenario: RHDH architect approval (RHIDP-15302)

- **WHEN** an upstream maintainer is not available for review
- **THEN** an RHDH architect (e.g., tech lead, principal engineer) reviews and approves
- **AND** their approval is documented with role and date
