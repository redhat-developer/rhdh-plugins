## Audit Report: mcp-registry-server-mapping

**Last audited:** 2026-09-14T21:28:22Z

### Summary

| Category | CRITICAL | WARNING | SUGGESTION |
| -------- | -------- | ------- | ---------- |
| A        | 0        | 0       | 0          |
| B        | 0        | 0       | 0          |
| C        | 0        | 3       | 0          |
| D        | 0        | 0       | 1          |
| E        | 0        | 0       | 0          |
| F        | 0        | 1       | 0          |
| G        | 0        | 0       | 1          |
| H        | 0        | 0       | 0          |

### CRITICAL

- None

### WARNING

- **C** `openspec/changes/mcp-registry-server-mapping/specs/mcp-registry-annotation-projection/spec.md:80` — `the projection SHALL be skipped or disambiguated`. Pick one reserved-key collision behavior. Skip only when re-projecting a field already consumed by the direct mapping (matches Direct-mapping annotation wins). Require D3 hash-suffix disambiguation when a different source path sanitizes to a reserved key; skip in that case would violate Scalar round-trip fidelity.
- **C** `openspec/changes/mcp-registry-server-mapping/specs/mcp-registry-annotation-projection/spec.md:113` — `Null values and empty containers MAY be omitted per a documented rule`. Replace MAY with SHALL to match the Nulls and empty containers scenario, and state the rule in this requirement (what is omitted vs retained: null, [], {} vs empty string, 0, false). Restate that rule in design.md and tasks 1.4/3.3; they currently cite a rule that is not written down.
- **C** `openspec/changes/mcp-registry-server-mapping/specs/mcp-registry-server-mapping/spec.md:68` — `stem mcp.registry__io.github.user-weather__1.0.2 plus a stable hash suffix`. State in the identity requirement and design D4 the substitutions that produce this stem (at least `/` → `-`). “Sanitized” plus the Backstage charset does not uniquely determine that THEN; other replacements would still be catalog-valid.
- **F** `openspec/changes/mcp-registry-server-mapping/.openspec.yaml:1` — `schema: spec-driven`. Set `schema` to `rhdh-spec-driven` to match `openspec/config.yaml` and `openspec/schemas/rhdh-spec-driven/schema.yaml`.

### SUGGESTION

- **G** `openspec/changes/mcp-registry-server-mapping/design.md:63` — `Path segments are sanitized (illegal characters and leading _ replaced)`. Specify the replacement character(s) for illegal annotation-key characters and leading `_`, then copy the same substitutions into the annotation-projection Produce catalog-valid annotation keys requirement and task 3.2. The `_meta` scenario only says “allowed characters.”
- **D** `openspec/changes/mcp-registry-server-mapping/proposal.md:1` — `# Proposal: MCP Registry Server Mapping`. Shorten proposal.md to the config.yaml proposal rule of under 500 words. Move mapping-table detail and long upstream schema excerpts into design.md or the mapping spec.
