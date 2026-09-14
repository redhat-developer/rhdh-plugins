# Audit: MCP Registry Provider

## Audit Report: mcp-registry-provider

**Last audited:** 2026-08-27T18:25:00Z

### Summary

| Category                   | CRITICAL | WARNING | SUGGESTION |
| -------------------------- | -------- | ------- | ---------- |
| A — Entity propagation     | 0        | 0       | 0          |
| B — Enum / vocabulary      | 0        | 0       | 0          |
| C — Semantic contradiction | 0        | 01      | 0          |
| D — Codebase & convention  | 0        | 1      | 0          |
| E — Namespace & ownership  | 0        | 1       | 0          |
| F — Template / copy-paste  | 0        | 0       | 0          |
| G — Extended coherence     | 0        | 2       | 1          |
| H — Security lint          | 0        | 0       | 0          |
| **Total**                  | **0**    | **0**   | **0**      |

### CRITICAL

- None

### WARNING

- **[C]** [`openspec/changes/mcp-registry-provider/proposal.md:13`](proposal.md#L13) — The proposal chooses a `v1` default while documenting that the cited reference registry serves `v0`/`v0.1`, but does not define how the default is validated or made operationally safe. Resolve the intended compatibility policy and add a test for the default endpoint (or explicitly label the default as a forward-looking contract).
- **[D]** [`openspec/changes/mcp-registry-provider/tasks.md:17`](tasks.md#L17) — The config task does not require `@visibility backend` on `baseUrl` and other backend-only provider settings. Require those annotations in `config.d.ts`, per `AGENTS.md`, so registry endpoints are not exposed to the frontend config surface.
- **[E]** [`openspec/changes/mcp-registry-provider/design.md:118`](design.md#L118) — The design defers same `(kind, namespace, name)` output from multiple registries as “dedup/merge,” but `locationKey` does not remove catalog identity collisions. Define whether one provider wins, the mapping name is source-qualified, or configuration rejects this case; add a scenario covering two registries publishing the same server version.
- **[G]** [`openspec/changes/mcp-registry-provider/specs/mcp-registry-provider/spec.md:119`](specs/mcp-registry-provider/spec.md#L119) — A mapping failure is skipped and the next full mutation contains only successful entries, but behavior when an already-ingested entity becomes unmappable is unspecified. State and test whether that prior entity is pruned or retained on the next sync.
- **[G]** [`openspec/changes/mcp-registry-provider/design.md:91`](design.md#L91) — “managed-by-location annotation / `locationKey`” conflates an entity annotation with the provider mutation’s `locationKey`. Define the exact Backstage mechanism and whether the implementation adds `backstage.io/managed-by-location` or relies solely on provider `locationKey`; update the task and scenario consistently.

### SUGGESTION

- **[G]** [`openspec/changes/mcp-registry-provider/design.md:83`](design.md#L83) — “max-pages / max-total bound” has no concrete value or configuration source, while the open question defers those bounds. Specify deterministic defaults (and their precedence if configurable) so implementations and tests cannot choose incompatible safeguards.
