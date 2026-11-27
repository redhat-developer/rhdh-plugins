## Audit Report: mcp-registry-server-mapping

**Last audited:** 2026-11-10T14:44:19Z (limited task-status reconciliation review)

**Previous full artifact audit:** 2026-09-15T19:51:11Z. Its findings and counts
below remain historical; this follow-up does not clear them.

### Task-status reconciliation follow-up (RHIDP-18761)

Compared the task checklist with the PR base and reviewed the 2026-11-09 journal
entries. Only completion checkboxes changed; task wording, acceptance criteria,
and design/specification contracts are unchanged. Task 4.2 remains open pending
explicit upstream schema-validator evidence for every mapped entity. This review
records the status-only reconciliation, not a new full artifact or implementation
audit. No tests were run for this follow-up.

### Summary

| Category | CRITICAL | WARNING | SUGGESTION |
| -------- | -------- | ------- | ---------- |
| A        | 0        | 0       | 0          |
| B        | 0        | 0       | 1          |
| C        | 0        | 0       | 0          |
| D        | 0        | 0       | 0          |
| E        | 0        | 0       | 1          |
| F        | 0        | 0       | 0          |
| G        | 0        | 0       | 3          |
| H        | 0        | 0       | 0          |

### CRITICAL

- None

### WARNING

- None

### SUGGESTION

- **B** `openspec/changes/mcp-registry-server-mapping/specs/mcp-registry-server-mapping/spec.md:244` — `stable ordering of spec.remotes, metadata.tags, and annotation keys`. Pin canonical order for `metadata.tags` (e.g. `mcp` then `ai`) and for `metadata.links` when both Website and Source Code are present, in addition to lexicographic annotation keys, so task 4.3 byte-identical fixtures have one oracle.
- **E** `openspec/changes/mcp-registry-server-mapping/design.md:133` — Provider caller-default mappings (`defaultOwner` / `baseName`). Add a lightweight Group 4 verification task to reconcile with `mcp-registry-provider` when both changes are apply-ready.
- **G** `openspec/changes/mcp-registry-server-mapping/specs/mcp-registry-server-mapping/spec.md:9` — Forward reference to `mapping-reference.md`. State it is produced by tasks 1.1–1.2, or add a minimal stub at apply start.
- **G** `openspec/changes/mcp-registry-server-mapping/tasks.md:17` — Add or extend a task for the single public pipeline: validate → direct mapping → projection → deterministic sort.
- **G** `openspec/changes/mcp-registry-server-mapping/design.md:99` — Document one hash function, suffix format, and inputs for annotation-key vs `metadata.name` hashing in `mapping-reference.md` (tasks 1.2–1.3).
- **G** `openspec/changes/mcp-registry-server-mapping/tasks.md:10` — Split task 1.2 (and optionally 2.3) into smaller ~2-hour chunks per `openspec/config.yaml` tasks rules.
