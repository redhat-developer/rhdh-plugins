# Migration Readiness for Upstream Entity Kinds

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

Design document mapping custom annotations and entity kinds to upstream Backstage entity kind targets, identifying consumer-facing changes, and obtaining upstream sign-off. Current-state source of truth: [ai-catalog-entity-model/design.md Decision 1](../../design.md). MCP server kind is already aligned with upstream (`McpServerApiEntity`, [backstage#34016](https://github.com/backstage/backstage/pull/34016)); RFC [#32062](https://github.com/backstage/backstage/issues/32062) is MCP-only and does **not** define an `AIAgent` kind.

## Stakeholder Alignment (2026-07-13, updated 2026-08-06)

> Per RHDHPLAN-1505 stakeholder meeting and [#4042 gate comment](https://github.com/redhat-developer/rhdh-plugins/issues/4042#issuecomment-5204217995):
>
> - **Decision 1 baseline:** The current-state source of truth is [ai-catalog-entity-model/design.md Decision 1](../../design.md). The mapping table uses Decision 1's seven categories as the starting point.
> - **RHDHPLAN-1113 resolved:** Boost uses AIResource for skills/rules directly. The dual-path (Resource/Component interim vs AIResource) is retired as the primary narrative.
> - **MCP kind-aligned:** RFC [#32062](https://github.com/backstage/backstage/issues/32062) Option 3 shipped as `McpServerApiEntity` ([backstage#34016](https://github.com/backstage/backstage/pull/34016)). MCP stays `kind: API`. **No** `API` → `McpServer` kind rename.
> - **Skills/rules shipped:** `AiResource` kind shipped upstream ([#33575](https://github.com/backstage/backstage/issues/33575) lineage). Kind/name casing alignment (`AIResource` → `AiResource`) is the remaining work.
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
  - **Current:** `kind: Component`, `spec.type: ai-agent`, `rhdh.io/ai-asset-category: agent` (pending RHDHPLAN-1113)
  - **Target:** No upstream kind via RFC #32062 (that RFC is MCP-only, not agent). Track agent-kind ownership under RHDHPLAN-1113.
  - **Confidence:** Low
  - **Note:** RFC #32062 does **not** define `AIAgent`. Do not attribute agent kind to RFC #32062.

#### Scenario: Example mapping for MCP servers — kind-aligned (RHIDP-15302)

- **WHEN** upstream shipped `McpServerApiEntity` via [backstage#34016](https://github.com/backstage/backstage/pull/34016) (RFC [#32062](https://github.com/backstage/backstage/issues/32062) Option 3)
- **THEN** the migration document specifies:
  - **Current:** `kind: API`, `spec.type: mcp-server`, `rhdh.io/ai-asset-category: mcp-server`
  - **Target:** Same — `kind: API`, `spec.type: mcp-server` (`McpServerApiEntity`). **No kind rename.**
  - **Confidence:** High (kind already aligned)
  - **Remaining work:** Field/module gaps — adopt `spec.remotes` instead of `spec.definition`, opt in to `@backstage/plugin-catalog-backend-module-ai-model`. Flag fallback `Resource` entities.

#### Scenario: Example mapping for skills and rules (RHIDP-15302)

- **WHEN** upstream shipped `AiResource` kind (see [#33575](https://github.com/backstage/backstage/issues/33575) lineage)
- **THEN** the migration document specifies:
  - **Skill — Current:** `kind: AIResource`, `spec.type: skill`, `rhdh.io/ai-asset-category: skill`
  - **Rule — Current:** `kind: AIResource`, `spec.type: rule`, `rhdh.io/ai-asset-category: rule`
  - **Target:** `AiResource` (shipped upstream)
  - **Confidence:** Medium–High
  - **Transformation:** Kind/name casing alignment (`AIResource` → `AiResource`) + field alignment per upstream schema

#### Scenario: Example mapping for AI models (RHIDP-15302)

- **WHEN** the migration document maps the `ai-model` category
- **THEN** the migration document specifies:
  - **Current:** `kind: Resource`, `spec.type: ai-model`, `rhdh.io/ai-asset-category: ai-model`
  - **Target:** No solid upstream kind yet
  - **Confidence:** Low
  - **Recommendation:** Continue using current mapping. Track future upstream proposals.

#### Scenario: Example mapping for model servers (RHIDP-15302)

- **WHEN** an open upstream PR [backstage#34476](https://github.com/backstage/backstage/pull/34476) proposes `kind: API`, `spec.type: ai-model-server`
- **THEN** the migration document specifies:
  - **Current:** `kind: Resource`, `spec.type: ai-model-server`, `rhdh.io/ai-asset-category: model-server`
  - **Target:** Candidate `kind: API`, `spec.type: ai-model-server` ([#34476](https://github.com/backstage/backstage/pull/34476)). **Not** a new kind named `ai-model-server`.
  - **Confidence:** Medium/Low (open PR, hedge accordingly)
  - **Transformation:** `Resource` → `API` kind change + field mapping

#### Scenario: Example mapping for skill bundles (RHIDP-15302)

- **WHEN** the migration document maps the `skill-bundle` category
- **THEN** the migration document specifies:
  - **Current:** `kind: AIResource`, `spec.type: ai-skill-bundle`, `rhdh.io/ai-asset-category: skill-bundle`
  - **Target:** No upstream kind
  - **Confidence:** Low
  - **Recommendation:** Stay on current mapping; track future RFCs.

#### Scenario: Mapping for categories without upstream kinds (RHIDP-15302)

- **WHEN** no upstream kind exists for `agent`, `ai-model`, or `skill-bundle`
- **THEN** the migration document specifies: "No upstream kind defined yet. Continue using current mapping until upstream stabilizes."
- **AND** the document tracks relevant upstream proposals or discussions

> **Out of scope / TBD:** `vector-store` and `ai-tool` categories are not yet confirmed as AI-asset mapping rows. See [catalog-entities spec](../../../agent-creation-discovery/specs/catalog-entities/spec.md) for tracking.

### Requirement: Consumer-Facing Changes Identified

The migration document MUST identify consumer-facing changes when transitioning to upstream kinds.

#### Scenario: Catalog UI filters impacted — kind-aligned categories (RHIDP-15302)

- **WHEN** the catalog UI filters by `kind: AIResource` + `rhdh.io/ai-asset-category: skill`
- **THEN** the migration document identifies: "After upstream alignment, filters change to `kind: AiResource` (casing change). Annotation filter still useful for category distinction."

#### Scenario: Catalog UI filters impacted — kind-changing categories (RHIDP-15302)

- **WHEN** the catalog UI filters by `kind: Resource` + `rhdh.io/ai-asset-category: model-server`
- **THEN** the migration document identifies: "If [#34476](https://github.com/backstage/backstage/pull/34476) merges, filters must change to `kind: API, spec.type: ai-model-server`."

#### Scenario: Entity refs change format (RHIDP-15302)

- **WHEN** an entity ref uses a kind that will change (e.g., model-server: `resource:default/my-server`)
- **THEN** the migration document identifies: "For model-server if [#34476](https://github.com/backstage/backstage/pull/34476) merges: `resource:default/my-server` → `api:default/my-server` (kind change `Resource` → `API`). For skills/rules: entity refs stay the same (`airesource:default/my-skill`) because Backstage lowercases kind prefixes and `AIResource` → `AiResource` produces the same ref string."
- **AND** this impacts: entity links in catalog, relationship references, API queries filtering by entity ref

#### Scenario: Queries and API calls impacted (RHIDP-15302)

- **WHEN** API clients query `GET /api/catalog/entities?filter=kind=Resource,rhdh.io/ai-asset-category=model-server`
- **THEN** the migration document identifies: "If [#34476](https://github.com/backstage/backstage/pull/34476) merges, queries must change to `?filter=kind=API,spec.type=ai-model-server`. For MCP servers: no kind change needed (already `kind: API`)."

#### Scenario: Backward compatibility strategy documented (RHIDP-15302)

- **WHEN** the migration document specifies consumer-facing changes
- **THEN** it also documents backward compatibility approach: "Keep `rhdh.io/ai-asset-category` annotation on migrated entities for one major version, allowing queries to work with both old and new filters. Deprecation notice in release notes."

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
