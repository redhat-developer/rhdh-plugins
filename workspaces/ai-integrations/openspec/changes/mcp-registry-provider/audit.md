## Audit Report: mcp-registry-provider

**Last audited:** 2026-09-14T22:07:36Z

### Summary

| Category | CRITICAL | WARNING | SUGGESTION |
| -------- | -------- | ------- | ---------- |
| A        | 0        | 0       | 2          |
| B        | 0        | 0       | 0          |
| C        | 0        | 4       | 0          |
| D        | 0        | 0       | 2          |
| E        | 0        | 0       | 0          |
| F        | 0        | 0       | 0          |
| G        | 0        | 1       | 1          |
| H        | 0        | 0       | 0          |

### CRITICAL

- None

### WARNING

- **C** `openspec/changes/mcp-registry-provider/specs/mcp-registry-provider/spec.md:160` — `commit the complete set of produced entities to the catalog as a single **full** mutation`. Reconcile skip-on-map-failure with full-mutation membership. A skipped mapping omits the entity and will prune a still-listed registry server. Either retain last-good entities for accumulated servers that fail mapping, or state that a skip is an intentional prune.
- **C** `openspec/changes/mcp-registry-provider/specs/mcp-registry-provider/spec.md:64` — `perform an initial sync according to the schedule's initialDelay (or immediately when unset)`. Align design D3 and task 4.2 with this SHALL, or drop immediate-when-unset if `createScheduledTaskRunner` only honors `initialDelay`/`frequency`. Add a scenario for the chosen first-tick behavior.
- **C** `openspec/changes/mcp-registry-provider/design.md:76` — `a documented default (e.g. frequency: { minutes: 30 }, timeout: { minutes: 3 })`. Replace `e.g.` with the actual default `frequency`, `timeout`, and `initialDelay` (or explicitly unset) and copy those values into the spec omitted-schedule scenario and tasks 2.3/6.4.
- **C** `openspec/changes/mcp-registry-provider/design.md:126` — `ingested entities are pruned on the next catalog reconciliation because they are provider-managed via locationKey`. Rollback cannot emit a full mutation if the module is unregistered (absent config registers nothing). State orphan/retention behavior, or require an explicit empty mutation / catalog `orphanStrategy`.
- **G** `openspec/changes/mcp-registry-provider/design.md:68` — `each produced entity carries backstage.io/managed-by-location so it is visible in the catalog`. Fix the annotation value in D2 (for example `url:<baseUrl>` or a `mcp-registry-provider:` location spec) and propagate that exact value into spec scenario `Provider attribution annotations present` and tasks 4.4/4.5.

### SUGGESTION

- **A** `openspec/changes/mcp-registry-provider/proposal.md:17` — `defaultOwner — the default spec.owner (a User/Group entity reference) applied to every produced API entity`. Mark `defaultOwner` optional (omit → mapping default `unknown`), matching design D1, the spec, and tasks 2.1/5.3.
- **A** `openspec/changes/mcp-registry-provider/tasks.md:17` — `schedule? (SchedulerServiceTaskScheduleDefinitionConfig)`. Keep the Config suffix only for `config.d.ts` and state it is the config-schema counterpart of `SchedulerServiceTaskScheduleDefinition` used in design D1, the proposal, and the spec; do not silently rename the runtime type.
- **D** `openspec/changes/mcp-registry-provider/.openspec.yaml:1` — `schema: spec-driven`. Set `schema: rhdh-spec-driven` to match `openspec/config.yaml`; this repo has no `openspec/schemas/spec-driven/`.
- **D** `openspec/changes/mcp-registry-provider/proposal.md:1` — `# Proposal: MCP Registry Provider`. Shorten the proposal to under 500 words per `openspec/config.yaml` (currently ~935 words); move pagination/API detail into design.md.
- **G** `openspec/changes/mcp-registry-provider/design.md:92` — `the provider calls the mapping transform, passing defaultOwner as the caller-override owner default`. Name the mapping export and caller-defaults object in D5 (prefix, owner, and whether lifecycle is omitted so mapping default `production` stands). Point task 5.1 at that signature; mapping D5 treats lifecycle as an ingestion-layer caller default this change never passes.
