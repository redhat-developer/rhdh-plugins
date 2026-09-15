## Audit Report: mcp-registry-server-mapping

**Last audited:** 2026-09-15T13:54:55Z  
**Autofix pass:** 2026-09-15 (batch applied: task 2.2 hash trigger, remotes scenario, D3↔D4 identity sanitization, descriptive-metadata D11 scenario, `.openspec.yaml` schema)

### Summary

| Category | CRITICAL | WARNING | SUGGESTION |
| -------- | -------- | ------- | ---------- |
| A        | 0        | 0       | 0          |
| B        | 0        | 0       | 0          |
| C        | 0        | 2       | 0          |
| D        | 0        | 0       | 1          |
| E        | 0        | 1       | 0          |
| F        | 0        | 0       | 0          |
| G        | 0        | 0       | 2          |
| H        | 0        | 0       | 0          |

### CRITICAL

- None

### WARNING

- **C** `openspec/changes/mcp-registry-server-mapping/specs/mcp-registry-annotation-projection/spec.md:80` — `the projection SHALL be skipped or disambiguated`. Pick one deterministic behavior: skip generic projection when the source path was consumed by direct mapping; use D3 hash-suffix disambiguation when a **distinct** source path sanitizes to a reserved key. Remove “or” and align the Direct-mapping annotation wins scenario.
- **C** `openspec/changes/mcp-registry-server-mapping/specs/mcp-registry-annotation-projection/spec.md:113` — `Null values and empty containers MAY be omitted per a documented rule`. Define the null/empty-container omission rule in `design.md` and state it normatively here (SHALL, not MAY) so it matches the Nulls and empty containers scenario and round-trip requirement.
- **E** `openspec/changes/mcp-registry-server-mapping/design.md:115` — Document caller override inputs expected by sibling `mcp-registry-provider` (`defaultOwner`, optional `baseName` as identity `prefix`) or state explicitly that only documented defaults (prefix/owner/lifecycle) are in scope.

### SUGGESTION

- **G** `openspec/changes/mcp-registry-server-mapping/tasks.md:12` — Spell out null/empty-container omission rule content in task 1.4 and `design.md`, not only in `mapping-reference.md`.
- **G** `openspec/changes/mcp-registry-server-mapping/design.md:115` — Clarify that missing required `server.json` fields (`name`, `description`, `version`) still fail (task 2.6), distinct from D5 never failing for missing owner.
- **D** `openspec/changes/mcp-registry-server-mapping/tasks.md:1` — Add openspec journal bookends per `openspec/config.yaml`, or note journaling is handled outside this task list.
