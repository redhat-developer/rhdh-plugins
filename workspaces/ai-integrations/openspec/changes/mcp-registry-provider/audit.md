## Audit Report: mcp-registry-provider

**Last audited:** 2026-09-15T18:03:43Z

### Summary

| Category | CRITICAL | WARNING | SUGGESTION |
| -------- | -------- | ------- | ---------- |
| A        | 0        | 0       | 0          |
| B        | 0        | 0       | 0          |
| C        | 0        | 0       | 1          |
| D        | 0        | 0       | 1          |
| E        | 0        | 0       | 0          |
| F        | 0        | 0       | 0          |
| G        | 0        | 0       | 2          |
| H        | 0        | 0       | 1          |

### CRITICAL

- None

### WARNING

- None

### SUGGESTION

- **C** `openspec/changes/mcp-registry-provider/design.md:142` — `ingested entities are pruned on the next catalog reconciliation because they are provider-managed via locationKey`. Clarify rollback/lifecycle: after module removal or absent config (no provider, no empty full mutation), state whether orphaned entities linger, require an explicit empty mutation on shutdown, or depend on catalog reconciliation behavior—so operators know cleanup expectations.
- **D** `openspec/changes/mcp-registry-provider/proposal.md:1` — `# Proposal: MCP Registry Provider`. Shorten the proposal to under 500 words per `openspec/config.yaml` (currently ~996 words); keep ingestion intent and capability summary here and leave pagination, defaults, and error tiers in design.md and the capability spec.
- **G** `openspec/changes/mcp-registry-provider/design.md:96` — `For each server the provider calls the mapping transform, passing defaultOwner as the caller-override owner default and, when configured, baseName as the caller-override identity prefix`. In D5, name the sibling `mcp-registry-server-mapping` public entrypoint (function/module) and the caller-overrides object shape; reference it explicitly in task 5.1 so implementers can trace the cross-change contract without re-reading the sibling change.
- **G** `openspec/changes/mcp-registry-provider/tasks.md:1` — `After each completed task, commit the changes.`. `openspec/config.yaml` requires `journal.jsonl` turn bookending for load-bearing work; add a task or note in group 6 to emit `turn.start`/`turn.end` (and `artifact.revised`) via `scripts/openspec-journal.py` during apply, or drop the per-task commit comment if it is not repo policy.
- **H** `openspec/changes/mcp-registry-provider/design.md:138` — `Unauthenticated registry assumption — Auth is a non-goal`. Add a brief risk that operator-supplied `baseUrl` triggers server-side HTTP fetches (SSRF/classic egress); document that only trusted registry URLs should be configured until auth and allowlisting are in scope.
