# Proposal: Upstream Schema Alignment Readiness

## Why

> **RHDHPLAN-1513 Consolidation (2026-07-08):** Epic RHIDP-15333 (Ingestion Audit Logging & Metrics) was closed — its scope has been absorbed by RHIDP-15277 (AI Catalog RBAC Audit Logging) under RHDHPLAN-1508. This schema alignment epic (RHIDP-15334) is unaffected — it remains a surviving RHDHPLAN-1513 epic alongside RHIDP-15331 (Ingestion Health Dashboard) and RHIDP-15332 (Connector Config Hot-Reload). The annotation specification (RHIDP-15346) depends on RHDHPLAN-1507's Entity-Provider SDK (RHIDP-15258) which now includes the annotation scheme after consolidation.

Customers adopting RHDH AI Catalog early need assurance that their catalog entities won't become a dead end when upstream Backstage entity kinds stabilize. A documented mapping from current RHDH annotations to draft upstream RFC entity kinds, plus a dry-run migration-readiness tool, provides that assurance without premature migration.

This addresses the gap between RHDH's current AI Asset annotations (`rhdh.io/ai-asset-category`, `rhdh.io/ai-asset-version`, entity `spec.type` values like `ai-agent`, `mcp-server`) and the evolving upstream Backstage entity kinds:

- **MCP servers:** Upstream keeps `kind: API`, `spec.type: mcp-server` with structured `spec.remotes` (`McpServerApiEntity`, shipped in [backstage#34016](https://github.com/backstage/backstage/pull/34016)). No kind rename to `McpServer`. RFC [#32062](https://github.com/backstage/backstage/issues/32062) Option 3 confirmed.
- **Model servers:** Candidate `kind: API`, `spec.type: ai-model-server` ([backstage#34476](https://github.com/backstage/backstage/pull/34476), open PR).
- **Skills / rules:** `AiResource` kind shipped upstream (see [#33575](https://github.com/backstage/backstage/issues/33575) lineage).
- **AI models:** No solid upstream kind yet.
- **Agents:** Agent-kind ownership tracked separately; not attributed to RFC #32062.

The mapping document and dry-run tool make the migration path transparent and measurable. Customers can enumerate their entities, see how they'd map to upstream kinds, and understand what field-level transformations would be required — all without executing an actual migration.

## What Boost Builds

### Annotation Specification Document

A formal specification covering all RHDH AI Asset annotations and entity kinds:

- `rhdh.io/ai-asset-category` values (agent, skill, rule, skill-bundle, mcp-server, ai-model, model-server)
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

> **Current-state source of truth:** [ai-catalog-entity-model/design.md Decision 1](../ai-catalog-entity-model/design.md). The [catalog-entities spec](../agent-creation-discovery/specs/catalog-entities/spec.md) is supplementary context, not a competing SoT for readiness.

| AI Asset     | Current Kind | Current spec.type | Upstream Target (today)                                                                                 | Confidence  | Notes                                                                                                                                            |
| ------------ | ------------ | ----------------- | ------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| MCP Server   | API          | mcp-server        | Same — `McpServerApiEntity` ([#34016](https://github.com/backstage/backstage/pull/34016), merged)       | High        | Kind already aligned. Field/module gaps: `spec.remotes` vs `spec.definition`, catalog-model AI module opt-in. Flag fallback `Resource` entities. |
| Model Server | Resource     | ai-model-server   | Candidate `API` / `ai-model-server` ([#34476](https://github.com/backstage/backstage/pull/34476), open) | Medium/Low  | `Resource` → `API` kind change + field mapping. Hedge on open PR — **not** a new kind named `ai-model-server`.                                   |
| AI Model     | Resource     | ai-model          | No solid upstream kind yet                                                                              | Low         | Explicit uncertainty. Continue using current mapping until upstream stabilizes.                                                                  |
| Skill        | AIResource   | skill             | `AiResource` (shipped; [#33575](https://github.com/backstage/backstage/issues/33575) lineage)           | Medium–High | Kind/name alignment (`AIResource` → `AiResource` casing). Field alignment needed.                                                                |
| Rule         | AIResource   | rule              | `AiResource` (shipped; [#33575](https://github.com/backstage/backstage/issues/33575) lineage)           | Medium–High | Kind/name alignment (`AIResource` → `AiResource` casing). Field alignment needed.                                                                |
| Skill Bundle | AIResource   | ai-skill-bundle   | No upstream kind                                                                                        | Low         | Stay on current mapping; track future RFCs.                                                                                                      |
| Agent        | Component    | ai-agent          | No upstream kind via RFC #32062 (that RFC is MCP-only)                                                  | Low         | Track agent-kind ownership under RHDHPLAN-1113. Do not attribute agent kind to RFC #32062.                                                       |

> **Out of scope / TBD:** `vector-store` and `ai-tool` categories are not yet confirmed as AI-asset mapping rows. See [catalog-entities spec](../agent-creation-discovery/specs/catalog-entities/spec.md) for tracking.

## Impact

- **Documentation:** New annotation specification document in `workspaces/boost/specifications/` directory
- **CLI Tooling:** New `@red-hat-developer-hub/backstage-plugin-boost-migration-readiness` package with read-only catalog analysis
- **No Production Changes:** No modifications to existing catalog entities, no catalog processor changes
- **Customer Communication:** Migration-readiness assessment available, but actual migration is explicit future work
