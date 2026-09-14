## Audit Report: mcp-registry-provider

**Last audited:** 2026-09-14T16:44:13Z

### Summary

| Category | CRITICAL | WARNING | SUGGESTION |
| -------- | -------- | ------- | ---------- |
| A        | 0        | 0       | 1          |
| B        | 0        | 0       | 0          |
| C        | 0        | 4       | 3          |
| D        | 0        | 0       | 1          |
| E        | 0        | 0       | 0          |
| F        | 0        | 0       | 0          |
| G        | 0        | 0       | 2          |
| H        | 0        | 0       | 0          |

### CRITICAL

- None

### WARNING

- **C** `openspec/changes/mcp-registry-provider/design.md:120` — `` `limit` tuning and schedule cadence are the operator's levers ``. Do not call `limit` an operator lever unless it is in D1/`config.d.ts`/spec/tasks. Otherwise strike it here and keep page size as an internal constant, matching the open question that defers exposing `limit`.
- **C** `openspec/changes/mcp-registry-provider/design.md:126` — `Rollback: remove the module registration (or the config block); ingested entities are pruned`. Pruning is specified only via this provider's successful full mutation. Removing the module or config makes the provider inert (no mutation). Require a final empty full mutation on unregister, or state that entities remain after rollback.
- **C** `openspec/changes/mcp-registry-provider/design.md:92` — `the managed-by-location annotation / locationKey`. Replace the slash (annotation or locationKey) with the spec's AND: mutation `locationKey` is `mcp-registry-provider` and the entity also carries a named managed-by-location annotation. D2 currently mentions only `locationKey`.
- **C** `openspec/changes/mcp-registry-provider/specs/mcp-registry-provider/spec.md:143` — `WHEN a page request returns a non-2xx HTTP status or the response body cannot be parsed`. This scenario covers only 2 of the 4 fail-the-run causes in the requirement/D6/task 3.5. Add WHEN/THEN coverage for unreachable host and pagination-safeguard trip, or narrow the SHALL list to match the scenario.

### SUGGESTION

- **A** `openspec/changes/mcp-registry-provider/tasks.md:17` — `schedule? (SchedulerServiceTaskScheduleDefinitionConfig)`. Use one type name across artifacts. Design D1, the proposal, and the spec say `SchedulerServiceTaskScheduleDefinition`. If the Config suffix is the Backstage `config.d.ts` type, say so and keep the runtime name for D3/spec.
- **C** `openspec/changes/mcp-registry-provider/specs/mcp-registry-provider/spec.md:44` — `or immediately when unset`. Design D3 never requires an immediate first sync when `initialDelay` is unset; task 4.2 only says honoring `initialDelay`. Add that first-run rule to D3 and 4.2, or drop it so the first tick follows `frequency` alone.
- **C** `openspec/changes/mcp-registry-provider/tasks.md:20` — Task 2.3 applies omitted-`schedule` and omitted-`apiVersion` defaults, but 2.4's test matrix omits them. Extend 2.4 (apiVersion `v1` is only checked later in 6.3).
- **C** `openspec/changes/mcp-registry-provider/tasks.md:38` — Spec scenario `Provider attribution annotations present` is not in 4.5. Assert `locationKey` `mcp-registry-provider` and the managed-by-location annotation so verification matches that WHEN/THEN.
- **D** `openspec/changes/mcp-registry-provider/proposal.md:1` — Shorten the proposal to under 500 words (`openspec/config.yaml`). Move API-version discrepancy, exact GET shape, and packaging into design.md.
- **G** `openspec/changes/mcp-registry-provider/design.md:76` — Pin the omitted-`schedule` default (frequency, timeout, `initialDelay` present or not) in D3, the spec, and task 2.3. `e.g.` leaves the documented default unspecified.
- **G** `openspec/changes/mcp-registry-provider/design.md:84` — Give numeric defaults for the page/total bound(s) in D4 and task 3.4, and state they are internal constants until the open question promotes them to config.
