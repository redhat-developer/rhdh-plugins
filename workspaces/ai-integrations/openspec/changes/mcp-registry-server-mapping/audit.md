## Audit Report: mcp-registry-server-mapping

**Last audited:** 2026-09-14T16:09:22Z

### Summary

| Category | CRITICAL | WARNING | SUGGESTION |
| -------- | -------- | ------- | ---------- |
| A        | 0        | 0       | 0          |
| B        | 0        | 0       | 0          |
| C        | 0        | 5       | 4          |
| D        | 0        | 0       | 1          |
| E        | 0        | 0       | 1          |
| F        | 0        | 0       | 0          |
| G        | 0        | 0       | 1          |
| H        | 0        | 0       | 1          |

### CRITICAL

- None

### WARNING

- **C** `openspec/changes/mcp-registry-server-mapping/specs/mcp-registry-server-mapping/spec.md:72` — `WHEN two distinct (prefix, name, version) triples sanitize to the same`. The transform is a pure function of one document plus caller defaults (D6) and cannot observe another document. Rewrite the collision trigger as a per-input rule (e.g. hash-suffix when sanitization is lossy and/or the name exceeds 63 characters).
- **C** `openspec/changes/mcp-registry-server-mapping/design.md:121` — `strip trailing / and a trailing .git from repository.url`. Direct mapping consumes/normalizes `repository.url` and projection skips re-projecting it, so the original scalar is not recoverable. Project the original URL, or add an explicit round-trip exception plus scenario.
- **C** `openspec/changes/mcp-registry-server-mapping/specs/mcp-registry-annotation-projection/spec.md:70` — `the projection SHALL be skipped or disambiguated`. Pick one reserved-key collision behavior (skip, matching the scenario, or hash-suffix, matching D3) and use it in the requirement, scenario, and task 3.4.
- **C** `openspec/changes/mcp-registry-server-mapping/specs/mcp-registry-server-mapping/spec.md:102` — `the remaining repository sub-fields (source, id) are projected`. State uniformly whether `repository.subfolder` is always projected (proposal, unknown-SCM scenario, and task 3.5 say yes; this GitHub THEN omits it).
- **C** `openspec/changes/mcp-registry-server-mapping/design.md:32` — `every non-null scalar leaf is recoverable`. Narrow the Goals lossless sentence to exclude D9-redacted `isSecret` `default`/`value` leaves (and any other documented exceptions).

### SUGGESTION

- **C** `openspec/changes/mcp-registry-server-mapping/design.md:63` — Specify the sanitization replacement mapping and the hash function/encoding/suffix length used for annotation keys and `metadata.name`, so D6/task 4.3 golden fixtures are uniquely determined.
- **C** `openspec/changes/mcp-registry-server-mapping/design.md:87` — Add `metadata.links` (and an explicit `metadata.tags` sequence) to the stable-order set in D6 and the determinism spec.
- **C** `openspec/changes/mcp-registry-server-mapping/design.md:121` — Align D10 with the mapping spec: azure-devops uses `?` only when `base` has no query string, otherwise `&`.
- **C** `openspec/changes/mcp-registry-server-mapping/tasks.md:21` — Extend task 2.6 so errors also reference the MCP server schema, matching the mapping spec's missing-field requirement.
- **D** `openspec/changes/mcp-registry-server-mapping/proposal.md:1` — Shorten the proposal to the `openspec/config.yaml` 500-word cap (move the YAML example and long upstream notes into design.md / specs).
- **E** `openspec/changes/mcp-registry-server-mapping/proposal.md:29` — Name sibling `openspec/changes/mcp-registry-provider/` as the owner of ingestion in Non-goals and related “future ingestion” wording.
- **G** `openspec/changes/mcp-registry-server-mapping/tasks.md:34` — Add a no-remotes / packages-only fixture to task 4.1 so D8 (`spec.remotes: []`) is in the verification set.
- **H** `openspec/changes/mcp-registry-server-mapping/design.md:109` — Redact `choices` on `isSecret: true` inputs, or document and fixture why `choices` cannot contain secrets; keep the same rule in the projection spec and task 4.6.
