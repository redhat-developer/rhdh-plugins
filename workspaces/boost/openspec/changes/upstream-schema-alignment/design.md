# Design: Upstream Schema Alignment Readiness

## Context

> **RHDHPLAN-1513 Consolidation (2026-07-08):** Epic RHIDP-15333 (Ingestion Audit Logging & Metrics) was closed and consolidated into RHIDP-15277 (RHDHPLAN-1508). This schema alignment epic is unaffected. The annotation scheme formalized here depends on RHDHPLAN-1507's Entity-Provider SDK (RHIDP-15258), which now includes annotation definitions after consolidation.

RHDH Boost has defined a set of AI Asset annotations and entity type conventions to represent agents, skills, MCP servers, AI models, and model servers in the Backstage catalog. These annotations (`rhdh.io/ai-asset-category`, `rhdh.io/ai-asset-version`) and `spec.type` values (`ai-agent`, `mcp-server`, etc.) are documented in the `agent-creation-discovery` change's `catalog-entities/spec.md`.

Meanwhile, upstream Backstage has draft RFCs proposing new entity kinds:

- **RFC #32062**: `McpServer` entity kind for MCP servers
- **RFC #33060**: `ai-model` and `ai-model-server` entity kinds

These RFCs are in draft status — their schemas and field names may still change. RHDH must track these RFCs and prepare for eventual migration, but premature migration risks churn if RFC schemas change.

The solution: a documented mapping from current RHDH annotations to draft RFC kinds (with confidence levels), plus a dry-run tool that reports what a migration would require — without executing it.

## Goals

- Document explicit mapping from current RHDH AI Asset annotations to draft upstream RFC entity kinds
- Provide confidence levels per mapping (high/medium/low) based on RFC stability
- Build read-only migration-readiness tooling that enumerates entities and reports transformation requirements
- Frame actual migration as explicit future work dependent on RFC finalization
- Make the specification accessible to platform engineers and customers

## Non-Goals

- Executing the actual migration (future work once RFCs finalize)
- Defining new upstream entity kinds or modifying RFCs
- Modifying existing catalog entities in production
- Implementing a catalog processor for migration (future work)
- Making claims about RFC finalization timelines

## Decisions

### Decision 1: Specification as living document

The annotation specification maps current RHDH annotations to DRAFT RFC kinds. As RFCs evolve, the mapping updates. The document explicitly states "draft mapping, subject to RFC finalization."

**Why:** RFCs #32062 and #33060 are in early draft. The mapping document must capture uncertainty and evolve alongside RFC changes.

**How to apply:** Published alongside existing specs in `workspaces/boost/specifications/`. The document includes a header stating the draft status and last-updated date. Each mapping includes a confidence level and notes on RFC stability.

### Decision 2: Mapping table structure with confidence levels

For each RHDH entity type, the mapping table shows:

- Current kind + `spec.type`
- Proposed RFC kind
- Fields requiring transformation
- Confidence level (high/medium/low)

**Confidence levels:**

- **High:** RFC schema is stable, fields are well-defined, unlikely to change
- **Medium:** RFC is active but still has open questions or alternative options under discussion
- **Low:** RFC hasn't addressed this entity type, or the mapping is speculative

**Why:** RFCs evolve. A confidence level makes it clear which mappings are stable vs. which are subject to change. If RFCs adopt different schema options, the mapping document can capture "if RFC adopts option A, mapping is X; if option B, mapping is Y."

**How to apply:** Each row in the mapping table includes a confidence column. The specification document includes a section explaining confidence levels and what they mean for migration planning.

**Example mapping entries:**

| AI Asset   | Current Kind | spec.type  | Target RFC Kind        | Confidence | Transformation Requirements                                       |
| ---------- | ------------ | ---------- | ---------------------- | ---------- | ----------------------------------------------------------------- |
| MCP Server | API          | mcp-server | McpServer (RFC #32062) | Medium     | Migrate kind from API → McpServer; preserve `spec.type` as `type` |
| AI Model   | Resource     | ai-model   | ai-model (RFC #33060)  | Medium     | Migrate kind from Resource → ai-model                             |

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
- The dry-run tool output includes a footer: "This is a migration-readiness assessment. Actual migration is future work pending RFC finalization."
- Customer-facing messaging emphasizes readiness assessment, not migration execution

## Risks

- **RFC instability:** If RFCs #32062 and #33060 change significantly, the mapping document must update. Mitigated by: confidence levels, explicit "draft mapping" framing, and living-document approach.
- **Premature migration expectations:** Customers might interpret the dry-run tool as migration execution. Mitigated by: explicit "future work" messaging in spec, tool output, and customer communication.
- **Mapping ambiguity:** Some RHDH entity types (e.g., agents, skills) don't have corresponding RFCs yet. Mitigated by: low confidence level, clear "no RFC yet" notes in mapping table, and recommendation to track future RFCs.
