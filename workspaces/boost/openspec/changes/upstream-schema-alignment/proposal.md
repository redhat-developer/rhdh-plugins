# Proposal: Upstream Schema Alignment Readiness

> **Workspace status:** Follow-on schema-alignment and migration-readiness
> planning; not part of the current RHDH 2.1 frontend and OGX release
> baseline.

## Why

> **RHDHPLAN-1513 Consolidation (2026-07-08):** Epic RHIDP-15333 (Ingestion Audit Logging & Metrics) was closed — its scope has been absorbed by RHIDP-15277 (AI Catalog RBAC Audit Logging) under RHDHPLAN-1508. This schema alignment epic (RHIDP-15334) is unaffected — it remains a surviving RHDHPLAN-1513 epic alongside RHIDP-15331 (Ingestion Health Dashboard) and RHIDP-15332 (Connector Config Hot-Reload). The annotation specification (RHIDP-15346) depends on RHDHPLAN-1507's Entity-Provider SDK (RHIDP-15258) which now includes the annotation scheme after consolidation.

Customers adopting RHDH AI Catalog early need assurance that their catalog entities won't become a dead end when upstream Backstage entity kinds stabilize. A documented mapping from current RHDH annotations to draft upstream RFC entity kinds, plus a dry-run migration-readiness tool, provides that assurance without premature migration.

This addresses the gap between RHDH's current AI Asset annotations (`rhdh.io/ai-asset-category`, `rhdh.io/ai-asset-version`, entity `spec.type` values like `agent`, `mcp-server`) and the evolving upstream Backstage entity kinds:

- **MCP servers:** Upstream keeps `kind: API`, `spec.type: mcp-server` with structured `spec.remotes` (`McpServerApiEntity`, shipped in [backstage#34016](https://github.com/backstage/backstage/pull/34016)). No kind rename to `McpServer`. RFC [#32062](https://github.com/backstage/backstage/issues/32062) Option 3 confirmed.
- **Model servers:** Candidate `kind: API`, `spec.type: ai-model-server` ([backstage#34476](https://github.com/backstage/backstage/pull/34476), open PR).
- **Skills / rules:** `AiResource` kind shipped upstream (see [#33575](https://github.com/backstage/backstage/issues/33575) lineage).
- **AI models:** No solid upstream kind yet.
- **Agents:** Agent-kind ownership tracked separately; not attributed to RFC #32062.

The mapping document and dry-run tool make the migration path transparent and measurable. Customers can enumerate their entities, see how they'd map to upstream kinds, and understand what field-level transformations would be required — all without executing an actual migration.

## What Boost Builds

### Annotation Specification Document

A formal specification covering the five minimum AI Asset categories and the
existing `rule` compatibility value:

- `rhdh.io/ai-asset-category` values: `agent`, `skill`, `mcp-server`, `ai-model`, and `model-server`; document `rule` as a compatibility value, not a sixth minimum category
- `rhdh.io/ai-asset-version` annotation format and normalization rules
- `rhdh.io/ai-asset-source` annotation format
- Entity kind + `spec.type` mapping table showing current state → upstream target kind

Explicit mapping to upstream entity kinds with confidence levels per mapping (high/medium–high/medium–low/low based on upstream stability). Published in a location accessible to platform engineers alongside existing Boost specifications. Current-state source of truth: [ai-catalog-entity-model/design.md Decision 1](../ai-catalog-entity-model/design.md).

The actual migration is explicitly framed as future work dependent on RFC finalization.

### Dry-Run Migration-Readiness Tooling

A read-only CLI command that enumerates AI Asset catalog entities and reports migration readiness:

- Queries catalog API for entities with `rhdh.io/ai-asset-category` annotation
- Generates per-entity report: current kind/type → target RFC kind, fields requiring transformation, confidence level
- Outputs both JSON (machine-readable) and human-readable formats
- Handles entities with missing/partial annotations gracefully
- No destructive changes — read-only analysis only

The tool is a scaffold — it establishes the structure for migration-readiness assessment without executing the actual migration.

### Current RHDH AI Asset Entity Mapping

> **Current-state source of truth:** [ai-catalog-entity-model/design.md Decision 1](../ai-catalog-entity-model/design.md).

| AI Asset             | Current Kind     | Current spec.type | Upstream Target (today)                                                                                 | Confidence  | Notes                                                                                                                                            |
| -------------------- | ---------------- | ----------------- | ------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| MCP Server           | API              | mcp-server        | Same — `McpServerApiEntity` ([#34016](https://github.com/backstage/backstage/pull/34016), merged)       | High        | Kind already aligned. Field/module gaps: `spec.remotes` vs `spec.definition`, catalog-model AI module opt-in. Flag fallback `Resource` entities. |
| Model Server         | AiModelServerAPI | ai-model-server   | Candidate `API` / `ai-model-server` ([#34476](https://github.com/backstage/backstage/pull/34476), open) | Medium/Low  | `AiModelServerAPI` → `API` kind change + field mapping. Hedge on open PR — **not** a new kind named `ai-model-server`.                           |
| AI Model             | Resource         | ai-model          | No solid upstream kind yet                                                                              | Low         | Explicit uncertainty. Continue using current mapping until upstream stabilizes.                                                                  |
| Skill                | AiResource       | skill             | `AiResource` (shipped; [#33575](https://github.com/backstage/backstage/issues/33575) lineage)           | Medium–High | Kind/name aligned. Field alignment needed.                                                                                                       |
| Rule (compatibility) | AiResource       | rule              | `AiResource` (shipped; [#33575](https://github.com/backstage/backstage/issues/33575) lineage)           | Medium–High | Compatibility mapping only; not a sixth minimum category. Kind/name aligned. Field alignment needed.                                             |
| Agent                | AiResource       | agent             | Upstream agent-schema alignment remains separate from MCP-only RFC #32062                               | Low         | Keep the settled RHDH `AiResource` / `agent` mapping; track future upstream alignment under RHDHPLAN-1113.                                       |

> **Out of scope:** `skill-bundle` and its SkillBundle/`skillcard.yaml` contracts were removed from the minimum baseline by RHIDP-18761 and are archived; `vector-store` and `ai-tool` are not annotation categories for this readiness work (confirmed in [#4042 gate comment §0](https://github.com/redhat-developer/rhdh-plugins/issues/4042#issuecomment-5204217995)). The source of truth for the five minimum categories and retained `rule` compatibility value is [ai-catalog-entity-model/design.md Decision 1](../ai-catalog-entity-model/design.md#decision-1-annotation-independence-from-entity-kinds).

## Capabilities

### New Capabilities

- `annotation-specification`: Formal specification of RHDH AI Asset annotations and entity kinds, with explicit mapping to upstream Backstage entity kind targets and confidence levels.
- `migration-readiness-tooling`: Read-only CLI command that enumerates AI Asset catalog entities and reports migration readiness without executing changes.

### Modified Capabilities

None.

## Impact

- **Documentation:** New annotation specification document in `workspaces/boost/specifications/` directory
- **CLI Tooling:** New `@red-hat-developer-hub/backstage-plugin-boost-migration-readiness` package with read-only catalog analysis
- **No Production Changes:** No modifications to existing catalog entities, no catalog processor changes
- **Customer Communication:** Migration-readiness assessment available, but actual migration is explicit future work
