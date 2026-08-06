# Design: Upstream Schema Alignment Readiness

## Context

> **RHDHPLAN-1513 Consolidation (2026-07-08):** Epic RHIDP-15333 (Ingestion Audit Logging & Metrics) was closed and consolidated into RHIDP-15277 (RHDHPLAN-1508). This schema alignment epic is unaffected. The annotation scheme formalized here depends on RHDHPLAN-1507's Entity-Provider SDK (RHIDP-15258), which now includes annotation definitions after consolidation.

RHDH Boost has defined a set of AI Asset annotations and entity type conventions to represent agents, skills, MCP servers, AI models, and model servers in the Backstage catalog. These annotations (`rhdh.io/ai-asset-category`, `rhdh.io/ai-asset-version`) and `spec.type` values (`ai-agent`, `mcp-server`, etc.) are documented in the `agent-creation-discovery` change's `catalog-entities/spec.md`.

Meanwhile, upstream Backstage entity kinds are evolving:

- **MCP servers:** RFC [#32062](https://github.com/backstage/backstage/issues/32062) Option 3 shipped as `McpServerApiEntity` in [backstage#34016](https://github.com/backstage/backstage/pull/34016) — keeps `kind: API`, `spec.type: mcp-server` with structured `spec.remotes`. **No kind rename to `McpServer`.**
- **Skills / rules:** `AiResource` kind shipped upstream (see [#33575](https://github.com/backstage/backstage/issues/33575) lineage).
- **Model servers:** Candidate `kind: API` / `ai-model-server` proposed in [backstage#34476](https://github.com/backstage/backstage/pull/34476) (open PR).
- **AI models:** No solid upstream kind yet.
- **Agents:** Agent-kind ownership tracked separately (RHDHPLAN-1113); **not** attributed to RFC #32062.

Some upstream targets are stable (MCP servers), others are still evolving. RHDH must track these developments and prepare for eventual field-level alignment, but premature kind migration risks churn.

The solution: a documented mapping from current RHDH annotations to upstream targets (with confidence levels), plus a dry-run tool that reports what field-level alignment would require — without executing it.

## Goals

- Document explicit mapping from current RHDH AI Asset annotations to upstream entity kind targets
- Provide confidence levels per mapping (high/medium–high/medium–low/low) based on upstream stability
- Build read-only migration-readiness tooling that enumerates entities and reports transformation requirements
- Frame actual migration as explicit future work dependent on RFC finalization
- Make the specification accessible to platform engineers and customers

## Non-Goals

- Executing the actual migration (future work once upstream targets stabilize)
- Defining new upstream entity kinds or modifying RFCs
- Modifying existing catalog entities in production
- Implementing a catalog processor for migration (future work)
- Making claims about RFC finalization timelines

## Decisions

### Decision 1: Specification as living document

The annotation specification maps current RHDH annotations to upstream entity kind targets. As upstream kinds evolve, the mapping updates. The document explicitly states the confidence level and stability of each target.

**Why:** Some upstream targets are shipped and stable (MCP `McpServerApiEntity`, `AiResource`), while others are open PRs or not yet proposed. The mapping document must capture this spectrum of certainty and evolve alongside upstream changes. Current-state source of truth: [ai-catalog-entity-model/design.md Decision 1](../ai-catalog-entity-model/design.md).

**How to apply:** Published alongside existing specs in `workspaces/boost/specifications/`. The document includes a header stating the draft status and last-updated date. Each mapping includes a confidence level and notes on RFC stability.

### Decision 2: Mapping table structure with confidence levels

For each RHDH entity type, the mapping table shows:

- Current kind + `spec.type`
- Upstream target kind
- Fields requiring transformation
- Confidence level (high/medium–high/medium–low/low)

**Confidence levels:**

- **High:** Upstream kind shipped and stable, fields well-defined, kind already aligned
- **Medium–High:** Upstream kind shipped but field/name alignment work remains
- **Medium/Low:** Upstream target proposed in an open PR; hedge accordingly
- **Low:** No solid upstream kind yet, or mapping is speculative

**Why:** Upstream targets exist on a spectrum from shipped-and-stable to not-yet-proposed. A confidence level makes it clear which mappings are ready for field-level alignment vs. which require continued tracking.

**How to apply:** Each row in the mapping table includes a confidence column. The specification document includes a section explaining confidence levels and what they mean for migration planning.

**Example mapping entries:**

| AI Asset     | Current Kind | spec.type       | Upstream Target                                                                                   | Confidence  | Transformation Requirements                                                                                                                          |
| ------------ | ------------ | --------------- | ------------------------------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| MCP Server   | API          | mcp-server      | Same — `McpServerApiEntity` ([#34016](https://github.com/backstage/backstage/pull/34016))         | High        | No kind change. Field gaps: adopt `spec.remotes` instead of `spec.definition`; opt in to catalog-model AI module. Flag fallback `Resource` entities. |
| Skill        | AIResource   | skill           | `AiResource` ([#33575](https://github.com/backstage/backstage/issues/33575))                      | Medium–High | Kind/name casing alignment (`AIResource` → `AiResource`). Field alignment per upstream schema.                                                       |
| Model Server | Resource     | ai-model-server | Candidate `API` / `ai-model-server` ([#34476](https://github.com/backstage/backstage/pull/34476)) | Medium/Low  | `Resource` → `API` kind change + field mapping. Hedge on open PR status.                                                                             |
| AI Model     | Resource     | ai-model        | No solid upstream kind yet                                                                        | Low         | Continue using current mapping. Track future upstream proposals.                                                                                     |

### Decision 3: Dry-run tool as external CLI command

The dry-run tool runs externally against the catalog API, not as a catalog processor. It's a standalone CLI command: `npx @red-hat-developer-hub/backstage-plugin-boost-migration-readiness --catalog-url <url>` (workspace path: `plugins/boost-migration-readiness/`).

**Why:** External CLI is simpler and safer for read-only analysis. A catalog processor hook is future work once RFCs finalize and actual migration begins.

**How to apply:**

- Tool queries catalog API for entities with `rhdh.io/ai-asset-category` annotation
- Outputs per-entity report: current kind/type → target RFC kind, fields needing transformation, confidence level, incompatibilities
- JSON + human-readable output formats
- CLI arguments: `--catalog-url`, `--output-format`, `--filter`

### Decision 4: No processor extension point (yet)

The dry-run tool does NOT use a catalog processor hook. It operates externally via catalog API queries.

**Why:** A processor hook would execute on every entity fetch/refresh, which is unnecessary for a one-time readiness assessment. The read-only CLI approach is safer, doesn't require catalog configuration changes, and avoids polluting the catalog processing pipeline during exploratory analysis.

**How to apply:** The tool uses Backstage's catalog client library to query entities. In a future migration implementation (post-RFC-finalization), a processor hook would make sense — but that's out of scope for this change.

### Decision 5: Explicit "future work" framing

The tooling scaffold and spec document are NOT the migration. The actual migration (re-mapping entities to finalized upstream kinds) is a separate future effort dependent on RFC finalization.

**Why:** Critical for customer communication. Customers need to know: (1) RHDH is tracking upstream RFCs, (2) migration readiness is assessable today, but (3) the actual migration waits for RFC finalization to avoid churn.

**How to apply:**

- The specification document includes a "Future Work" section explicitly listing: actual entity migration, catalog processor for automated migration, entity kind transition plan
- The dry-run tool output includes a footer: "This is a migration-readiness assessment. Actual migration is future work pending upstream stabilization."
- Customer-facing messaging emphasizes readiness assessment, not migration execution

## Risks

- **Upstream target instability:** If open PRs (e.g., #34476 for model-server) are declined or schemas change, the mapping document must update. Mitigated by: confidence levels reflecting actual upstream status, living-document approach.
- **Premature migration expectations:** Customers might interpret the dry-run tool as migration execution. Mitigated by: explicit "future work" messaging in spec, tool output, and customer communication.
- **Mapping ambiguity:** Some RHDH entity types (e.g., agents, AI models) don't have upstream kind targets yet. Mitigated by: low confidence level, explicit uncertainty notes in mapping table, and recommendation to track future upstream proposals. Skills/rules are better positioned — `AiResource` is shipped upstream.
