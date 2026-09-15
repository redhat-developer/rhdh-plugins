## Audit Report: mcp-registry-server-mapping

**Last audited:** 2026-09-15T18:48:24Z

### Summary

| Category | CRITICAL | WARNING | SUGGESTION |
| -------- | -------- | ------- | ---------- |
| A        | 0        | 0       | 2          |
| B        | 0        | 0       | 1          |
| C        | 0        | 0       | 0          |
| D        | 0        | 0       | 1          |
| E        | 0        | 0       | 1          |
| F        | 0        | 0       | 0          |
| G        | 0        | 0       | 4          |
| H        | 0        | 0       | 0          |

### CRITICAL

- None

### WARNING

- None

### SUGGESTION

- **A** `openspec/changes/mcp-registry-server-mapping/design.md:171` — `if subfolder is absent the result is that base URL`. Mirror mapping spec step 2: treat `repository.subfolder` as absent when unset or whitespace-only after trim, so D10 matches the repository URL combination requirement.
- **A** `openspec/changes/mcp-registry-server-mapping/proposal.md:12` — `Supply catalog-required defaults`. Mention in What Changes that `name`, `description`, and `version` are required inputs (mapping fails if omitted), matching the mapping spec validation requirement and design D5.
- **B** `openspec/changes/mcp-registry-server-mapping/specs/mcp-registry-server-mapping/spec.md:234` — `stable ordering of spec.remotes, metadata.tags, and annotation keys`. Pin canonical `metadata.tags` order (e.g. `mcp` then `ai`) and `metadata.links` order when both Website and Source Code exist, alongside lexicographic annotation keys, so task 4.3 byte-identical fixtures have a single oracle.
- **D** `openspec/changes/mcp-registry-server-mapping/.openspec.yaml:1` — `schema: spec-driven`. Align with `openspec/config.yaml` (`schema: rhdh-spec-driven`).
- **E** `openspec/changes/mcp-registry-server-mapping/design.md:133` — Provider config key mapping (`defaultOwner` / `baseName`). Add a lightweight Group 4 verification task to reconcile with `mcp-registry-provider` when both changes are apply-ready, avoiding sibling contract drift.
- **G** `openspec/changes/mcp-registry-server-mapping/specs/mcp-registry-server-mapping/spec.md:9` — Forward reference to `mapping-reference.md`. State that the table is produced by tasks 1.1–1.2, or add a minimal stub so apply is not blocked on a missing file.
- **G** `openspec/changes/mcp-registry-server-mapping/tasks.md:17` — Add or extend a task for the single public pipeline: validate → direct mapping and reserved annotations → projection → sorted output (Group 2/3 compose order).
- **G** `openspec/changes/mcp-registry-server-mapping/design.md:99` — Document one hash function, suffix format, and inputs for annotation keys vs `metadata.name` in `mapping-reference.md` (tasks 1.2–1.3).
- **G** `openspec/changes/mcp-registry-server-mapping/tasks.md:10` — Split task 1.2 (and optionally 2.3) into smaller ~2-hour chunks per `openspec/config.yaml` tasks rules.
