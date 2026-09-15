## Audit Report: mcp-registry-server-mapping

**Last audited:** 2026-09-15T14:24:44Z

### Summary

| Category | CRITICAL | WARNING | SUGGESTION |
| -------- | -------- | ------- | ---------- |
| A        | 0        | 0       | 2          |
| B        | 0        | 1       | 0          |
| C        | 0        | 0       | 0          |
| D        | 0        | 0       | 1          |
| E        | 0        | 0       | 0          |
| F        | 0        | 0       | 0          |
| G        | 0        | 0       | 3          |
| H        | 0        | 0       | 0          |

### CRITICAL

- None

### WARNING

- **B** `openspec/changes/mcp-registry-server-mapping/.openspec.yaml:1` — `schema: spec-driven`. Align the change schema with repo OpenSpec config (`openspec/config.yaml` declares `schema: rhdh-spec-driven`) unless this change intentionally uses a different schema; mismatch can drop journal/rules expectations during apply.

### SUGGESTION

- **A** `openspec/changes/mcp-registry-server-mapping/proposal.md:12` — `round-trip rules (with documented exceptions for secrets and refused URLs)`. Extend the proposal’s round-trip exception list to include D12 omissions (null scalars and empty containers), matching design D12 and the annotation-projection round-trip requirement.
- **A** `openspec/changes/mcp-registry-server-mapping/design.md:131` — `Unset, empty, or sanitizes-to-empty prefix falls back to mcp.registry`. Document whether empty caller `owner` or `lifecycle` values fall back to `unknown`/`production` or are passed through, and add matching spec scenarios so provider `defaultOwner` edge cases are unambiguous.
- **G** `openspec/changes/mcp-registry-server-mapping/specs/mcp-registry-server-mapping/spec.md:60` — Identity-sanitization example conflates leading `_` → `x` with `/` → `-` in one parenthetical; split into separate examples for the two D3 rules.
- **G** `openspec/changes/mcp-registry-server-mapping/tasks.md:13` — In task 1.4, note that `mcp-registry-provider` does not currently pass a `lifecycle` caller override (per design), so lifecycle defaults stay mapping-side until provider adds config.
- **G** `openspec/changes/mcp-registry-server-mapping/tasks.md:36` — Add conformance fixtures for caller `owner` and `lifecycle` overrides (and optional empty-string cases once defined) to match the caller-defaults and field-supply requirements.
- **D** `openspec/changes/mcp-registry-server-mapping/tasks.md:1` — Add a tasks note or checklist item for `openspec/config.yaml` journal bookends (`scripts/openspec-journal.py` turn.start/turn.end during apply).
