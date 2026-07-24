# Proposal: Upstream Schema Alignment Readiness

## Why

> **RHDHPLAN-1513 Consolidation (2026-07-08):** Epic RHIDP-15333 (Ingestion Audit Logging & Metrics) was closed — its scope has been absorbed by RHIDP-15277 (AI Catalog RBAC Audit Logging) under RHDHPLAN-1508. This schema alignment epic (RHIDP-15334) is unaffected — it remains a surviving RHDHPLAN-1513 epic alongside RHIDP-15331 (Ingestion Health Dashboard) and RHIDP-15332 (Connector Config Hot-Reload). The annotation specification (RHIDP-15346) depends on RHDHPLAN-1507's Entity-Provider SDK (RHIDP-15258) which now includes the annotation scheme after consolidation.

Customers adopting RHDH AI Catalog early need assurance that their catalog entities won't become a dead end when upstream Backstage entity kinds stabilize. A documented mapping from current RHDH annotations to draft upstream RFC entity kinds, plus a dry-run migration-readiness tool, provides that assurance without premature migration.

This addresses the gap between RHDH's current AI Asset annotations (`rhdh.io/ai-asset-category`, `rhdh.io/ai-asset-version`, entity `spec.type` values like `ai-agent`, `mcp-server`) and the draft Backstage RFCs that propose upstream entity kinds:

- RFC #32062: `McpServer` entity kind
- RFC #33060: `ai-model` and `ai-model-server` entity kinds

The mapping document and dry-run tool make the migration path transparent and measurable. Customers can enumerate their entities, see how they'd map to upstream kinds once RFCs finalize, and understand what transformations would be required — all without executing an actual migration.

## What Boost Builds

### Annotation Specification Document

A formal specification covering all RHDH AI Asset annotations and entity kinds:

- `rhdh.io/ai-asset-category` values (agent, skill, rule, skill-bundle, mcp-server, ai-model, model-server)
- `rhdh.io/ai-asset-version` annotation format and normalization rules
- `rhdh.io/ai-asset-source` annotation format
- Entity kind + `spec.type` mapping table showing current state → proposed RFC kind

Explicit mapping to draft RFCs #32062 and #33060, with confidence levels per mapping (high/medium/low based on RFC stability). Published in a location accessible to platform engineers alongside existing Boost specifications.

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

| AI Asset     | Current Kind | Current spec.type | Target RFC Kind (draft)      | Confidence |
| ------------ | ------------ | ----------------- | ---------------------------- | ---------- |
| Agent        | Component    | ai-agent          | (no RFC yet)                 | Low        |
| Skill        | AIResource   | skill             | (no RFC yet)                 | Low        |
| MCP Server   | API          | mcp-server        | McpServer (RFC #32062)       | Medium     |
| AI Model     | Resource     | ai-model          | ai-model (RFC #33060)        | Medium     |
| Rule         | AIResource   | rule              | (no RFC yet)                 | Low        |
| Skill Bundle | AIResource   | ai-skill-bundle   | (no RFC yet)                 | Low        |
| Model Server | Resource     | ai-model-server   | ai-model-server (RFC #33060) | Medium     |

> **Note:** If the upstream Backstage API extension for capturing AI model servers ([backstage/backstage#34476](https://github.com/backstage/backstage/pull/34476)) becomes available, the Model Server mapping will pivot to use that upstream kind instead of the current `Resource` mapping.

## Impact

- **Documentation:** New annotation specification document in `workspaces/boost/specifications/` directory
- **CLI Tooling:** New `@red-hat-developer-hub/backstage-plugin-boost-migration-readiness` package with read-only catalog analysis
- **No Production Changes:** No modifications to existing catalog entities, no catalog processor changes
- **Customer Communication:** Migration-readiness assessment available, but actual migration is explicit future work
