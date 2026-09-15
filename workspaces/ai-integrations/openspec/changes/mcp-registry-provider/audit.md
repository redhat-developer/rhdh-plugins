## Audit Report: mcp-registry-provider

**Last audited:** 2026-09-15T14:54:13Z

### Summary

| Category | CRITICAL | WARNING | SUGGESTION |
| -------- | -------- | ------- | ---------- |
| A        | 0        | 0       | 4          |
| B        | 0        | 0       | 0          |
| C        | 0        | 1       | 0          |
| D        | 0        | 0       | 2          |
| E        | 0        | 0       | 0          |
| F        | 0        | 0       | 0          |
| G        | 0        | 0       | 4          |
| H        | 0        | 0       | 0          |

### CRITICAL

- None

### WARNING

- **C** `openspec/changes/mcp-registry-provider/design.md:134` — `ingested entities are pruned on the next catalog reconciliation because they are provider-managed via locationKey`. Rollback removes the provider and absent config registers nothing, so no empty full mutation runs. State orphan/retention behavior explicitly, or require an explicit empty mutation or documented catalog orphan cleanup on uninstall.

### SUGGESTION

- **A** `openspec/changes/mcp-registry-provider/proposal.md:9` — `each entity also carries backstage.io/managed-by-location`. Propagate D2/spec value form: `url:` plus normalized `baseUrl` (trailing slash stripped), distinct from mutation `locationKey` `mcp-registry-provider`.
- **A** `openspec/changes/mcp-registry-provider/proposal.md:17` — `defaultOwner — the default spec.owner`. Mark `defaultOwner` optional (omit → mapping default `unknown`), matching design D1, the spec, and tasks 2.1/5.3.
- **A** `openspec/changes/mcp-registry-provider/proposal.md:13` — `when omitted, a documented default is applied rather than failing`. Name the default schedule inline (`frequency: { minutes: 30 }`, `timeout: { minutes: 3 }`, no `initialDelay`) so proposal matches design D3, the spec, and tasks 2.3/6.4.
- **A** `openspec/changes/mcp-registry-provider/tasks.md:17` — `schedule? (SchedulerServiceTaskScheduleDefinitionConfig)`. Clarify that `SchedulerServiceTaskScheduleDefinitionConfig` is the config.d.ts schema type only; runtime scheduling uses `SchedulerServiceTaskScheduleDefinition` as in design D3 and the spec.
- **D** `openspec/changes/mcp-registry-provider/.openspec.yaml:1` — `schema: spec-driven`. Set `schema: rhdh-spec-driven` to match `openspec/config.yaml` and the repo's rhdh-spec-driven schema.
- **D** `openspec/changes/mcp-registry-provider/proposal.md:1` — `# Proposal: MCP Registry Provider`. Shorten the proposal to under 500 words per `openspec/config.yaml` (currently ~951 words); move pagination and API detail into design.md.
- **G** `openspec/changes/mcp-registry-provider/design.md:98` — `passing defaultOwner as the caller-override owner default and, when configured, baseName as the caller-override identity prefix`. Name the mapping transform export and caller-defaults shape in D5; state that lifecycle is intentionally not passed (mapping default applies). Point task 5.1 at that API per cross-change ownership.
- **G** `openspec/changes/mcp-registry-provider/specs/mcp-registry-provider/spec.md:184` — `the provider SHALL look up a last-good entity from a prior successful sync`. Add a SHALL that at sync start the provider loads provider-managed entities (via `locationKey` `mcp-registry-provider`) into the last-good index, matching design D6 and task 5.2.
- **G** `openspec/changes/mcp-registry-provider/specs/mcp-registry-provider/spec.md:88` — `or when a repeated cursor is detected`. Add a pagination scenario for repeated-cursor detection (fail run, no mutation, log safeguard), parallel to the pageLimit scenarios and tasks 3.4/3.6.
- **G** `openspec/changes/mcp-registry-provider/specs/mcp-registry-provider/spec.md:5` — `transforms each server.json document into an mcp-server API entity`. In the capability intro, note last-good retention on mapping failure so the summary matches the full-mutation and error-handling requirements.
