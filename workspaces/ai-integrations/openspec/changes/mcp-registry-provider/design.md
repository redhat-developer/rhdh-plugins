# Design: MCP Registry Provider

## Canonical Touchpoints

Carried forward from the proposal:

- **PRDs (`specifications/prd/`)**: None
- **ADRs (`specifications/adr/`)**: None
- **Long-lived specs (`openspec/specs/`)**: None

No canonical document updates. This change introduces a new capability only and does not modify any existing canonical document or long-lived spec. It **consumes** the sibling [`mcp-registry-server-mapping`](../mcp-registry-server-mapping/design.md) transform contract without altering it.

## Context

[`mcp-registry-server-mapping`](../mcp-registry-server-mapping/proposal.md) defines a pure, deterministic `server.json` → `mcp-server` `API` entity transform and explicitly scopes out ingestion. This change supplies the runtime that calls that transform: a Backstage catalog **entity provider** that fetches servers from an [MCP Registry](https://github.com/modelcontextprotocol/registry) on a schedule and populates the catalog.

**Reference prototype.** The [`mcp-reg-proxy-proto`](https://github.com/gabemontero/rhdh-plugins/tree/mcp-reg-proxy-proto) branch of `rhdh-plugins` (plugin at `workspaces/ai-integrations/plugins/mcp-registry-proxy-backend/`) is a _proxy_ — it re-exposes registry endpoints through RHDH. It is a **design reference only**; this change is a _provider_ (one-way ingestion into the catalog), not a proxy. Two lessons carry over:

1. **Config shape.** The prototype placed config under `mcp.registry.proxy.<id>` reading `baseUrl` and `registryVersion`. This change instead uses the idiomatic Backstage catalog-provider location `catalog.providers.mcpRegistry` as a **single object** (see D1). Multi-registry keyed maps are out of scope for the initial implementation; `baseName` is the forward-compatible hook for a later change.
2. **Pagination gap.** The prototype defined a `PaginatedResponse` type but **only fetched the first page** — it never followed `nextCursor`. This change treats full cursor traversal as a first-class requirement (see D4).

**Registry API.** Per the [generic registry API](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/api/generic-registry-api.md#basic-example-list-servers), `GET <baseUrl>/<apiVersion>/servers?cursor=<opaque>&limit=<n>` returns:

```json
{
  "servers": [ { "server": { "name": "...", "description": "...", "version": "..." }, "_meta": { ... } } ],
  "metadata": { "count": 10, "nextCursor": "..." }
}
```

Pagination is cursor-based: omit `cursor` on the first request; pass the prior `metadata.nextCursor` on each subsequent request; stop when it is absent/empty. Cursors are opaque.

**Backstage integration.** The plugin is a `catalog-backend-module` that registers one `EntityProvider` and schedules it via `SchedulerService`. On each tick it lists servers, maps them, and calls `connection.applyMutation({ type: 'full', entities })`.

## Goals / Non-Goals

**Goals:**

- A scheduled catalog entity provider that ingests MCP servers from one configured registry into the RHDH catalog as `mcp-server` `API` entities.
- Complete ingestion via full cursor pagination (the gap left by the reference prototype).
- Idiomatic, upstream-aligned configuration (`catalog.providers.mcpRegistry`) for a single registry, with optional `baseName` overriding the mapping identity prefix.
- Clean delegation to `mcp-registry-server-mapping` — the provider never reimplements the transform.
- Full-mutation semantics so the catalog converges to the registry's current state (adds, updates, prunes).
- Resilient, predictable (agent-native) error handling: skip a bad entry, fail a bad run without corrupting catalog state.

**Non-Goals:**

- The `server.json` → entity transform, annotation projection, secret redaction (owned by `mcp-registry-server-mapping`).
- A registry proxy / pass-through API.
- Registry authentication / write access, or per-registry credentials.
- Multiple registries (keyed `catalog.providers.mcpRegistry.<id>` map). `baseName` is reserved as the per-source mapping-prefix override for a future change.
- Runtime invocation, health checking, or tool discovery of ingested servers.
- Cross-registry dedup/merge of the same server.
- Frontend / catalog UI changes.

## Decisions

### D1: Configuration under `catalog.providers.mcpRegistry` (single registry; `baseName` for future multi-registry)

**Choice:** Config is a single object at `catalog.providers.mcpRegistry` with `baseUrl` (required), `baseName` (optional; passed as the mapping's prefix override), `apiVersion` (default `v1`), `schedule` (`SchedulerServiceTaskScheduleDefinition`), and `defaultOwner` (entity ref). A keyed map of instances is rejected at startup. A `config.d.ts` declares the schema so app-config validation and IDE assistance work.

**Alternatives considered:** (a) The prototype's `mcp.registry.proxy.<id>` namespace — rejected; that namespace reads as proxy/pass-through config and is not where catalog operators look for entity providers. (b) A keyed map `catalog.providers.mcpRegistry.<id>` matching `github`/`ldap` providers — deferred; multiple registries are out of scope for the initial implementation. `baseName` is the hook that change would use so each source can override the mapping `prefix` (`<prefix>__<name>__<version>`).

**Rationale:** A flat block matches the initial single-registry scope. `baseName` alongside `baseUrl` is cheap now and avoids a mapping redesign when a later change adds more sources.

### D2: Package as a `catalog-backend-module` with a single `EntityProvider`

**Choice:** The plugin is a backend module registered via `createBackendModule` that extends the catalog via `catalogProcessingExtensionPoint.addEntityProvider(...)`, adding one `EntityProvider`. The provider owns `getProviderName()` (`mcp-registry-provider`), which becomes the entities' `locationKey` and drives full-mutation pruning scoping.

**Alternatives considered:** (a) One `EntityProvider` per registry id — deferred with multi-registry support; independent schedules and per-source `locationKey` pruning are the reasons to revisit this. (b) A standalone backend plugin with its own router — rejected; ingestion needs the catalog extension point, not an HTTP surface (that would be the proxy pattern).

**Rationale:** One registry, one provider: scheduling, failure isolation, and `locationKey` pruning stay straightforward.

### D3: Schedule via `SchedulerService`; omitted `schedule` uses a documented default

**Choice:** The provider is driven by `scheduler.createScheduledTaskRunner(schedule)` and refreshes on the configured `SchedulerServiceTaskScheduleDefinition`. When `schedule` is omitted, a documented default (e.g. `frequency: { minutes: 30 }`, `timeout: { minutes: 3 }`) is applied rather than failing. The provider connects via the standard `EntityProvider.connect` + scheduled `run()` pattern.

**Alternative considered:** Require `schedule` and fail if absent — rejected; a sensible default keeps first-run setup simple, consistent with the mapping's "never fail for a supplyable default" stance.

**Rationale:** A missing schedule should not block ingestion. A sensible default keeps first-run setup simple.

### D4: Full cursor pagination is mandatory

**Choice:** The provider loops: request `<baseUrl>/<apiVersion>/servers`, accumulate `servers[]`, read `metadata.nextCursor`, and re-request with `?cursor=<value>` until the cursor is absent/empty. Cursors are opaque and passed verbatim. A **loop safeguard** (max-pages / max-total bound, plus detecting a repeated cursor) prevents a misbehaving registry from spinning forever; hitting the bound fails the run (D6) rather than committing a partial catalog.

**Alternative considered:** Trust a single page (prototype behavior) — rejected; silently truncates ingestion for any registry larger than one page.

**Rationale:** Unlike the reference prototype (first page only), full cursor pagination ensures complete ingestion for registries of any size.

### D5: Delegate wholly to `mcp-registry-server-mapping`; supply `defaultOwner` and `baseName` as caller overrides

**Choice:** For each server the provider calls the mapping transform, passing `defaultOwner` as the caller-override owner default and, when configured, `baseName` as the caller-override identity prefix (mapping D4). When `baseName` is omitted the mapping's default prefix `mcp.registry` applies. The provider adds only provider-level concerns on top of the transform's output: the managed-by-location annotation / `locationKey` for catalog attribution and pruning. It never re-derives names, annotations, or `spec.remotes`.

**Alternative considered:** Inline a copy of the mapping for "performance" — rejected; violates the single-contract goal and would drift.

**Rationale:** The mapping is the single source of truth for entity shape; a mapping change automatically flows through the provider. `baseName` is how this provider consumes the mapping's prefix override without inventing a second identity scheme.

### D6: Failure isolation — skip bad entries, fail bad runs atomically

**Choice:** Two failure tiers: (a) a single server that the mapping rejects (missing required `server.json` field) is logged with an identifying message and skipped; the run proceeds and commits the rest. (b) A registry-level error (unreachable, non-2xx, unparseable body, or pagination-safeguard trip) fails the whole run: **no** `applyMutation` is emitted, so the last-good catalog state is preserved, and the next scheduled tick retries.

**Alternative considered:** Commit whatever was fetched before an error — rejected; a partial full mutation prunes entities that still exist, causing catalog flapping.

**Rationale:** Matches the agent-native principle (predictable errors) and the full-mutation model (a partial full mutation would wrongly prune healthy entities).

### D7: API-version slug is configurable, defaults to `v1`, discrepancy documented

**Choice:** The endpoint is `<baseUrl>/<apiVersion>/servers` with `apiVersion` defaulting to `v1`. The current reference registry actually serves `/v0` (prototype) or `/v0.1` (docs); the default follows the proposal's stated `v1` and operators override `apiVersion` to match their registry. URL joining normalizes trailing/leading slashes so `baseUrl` with or without a trailing `/` yields exactly one separator. This is captured as a risk below and an open question.

**Alternative considered:** Default `v0` to match today's registry — considered and deferred to the user's explicit choice of `v1`.

**Rationale:** Following the proposal's stated `v1` establishes the forward-looking default; operators override `apiVersion` to match their registry's actual version.

## Risks / Trade-offs

- **apiVersion default (`v1`) does not match the live registry (`/v0`, `/v0.1`)** → Operators must set `apiVersion` to their registry's actual version; the default is documented and overridable, and startup/first-sync errors name the endpoint that was requested. Revisit the default if the registry standardizes on a version.
- **Non-terminating or repeating cursor from a buggy registry** → D4 loop safeguard (max pages/total + repeated-cursor detection) trips and fails the run (D6) rather than looping forever or committing a partial catalog.
- **Partial-page fetch failure mid-pagination** → D6 fails the whole run with no mutation, preserving prior catalog state; no partial full mutation is ever committed.
- **`metadata.name` collisions across registries** (same name+version from two registries) → Out of scope: this implementation ingests one registry. `baseName` is the future per-source prefix override so a later multi-registry change can keep identities distinct via mapping D4; true dedup/merge remains deferred.
- **Large registries** → Pagination handles arbitrary size, but a very large registry produces a large full mutation each tick; `limit` tuning and schedule cadence are the operator's levers. Batching/streaming the mutation is a possible future optimization.
- **Mapping contract drift** → The provider depends on `mcp-registry-server-mapping`; because it delegates wholly (D5), a mapping change flows through automatically, but a breaking signature change to the transform would require a coordinated update here.
- **Unauthenticated registry assumption** → Auth is a non-goal; a registry requiring credentials will fail at fetch (D6) until a future auth extension lands.

## Migration Plan

Not applicable to existing data — this is additive and introduces no migration of prior state. Deployment: publish the backend module package, add it to the backend via `backend.add(...)`, and configure `catalog.providers.mcpRegistry` with a `baseUrl` (optional `baseName`, `apiVersion`, `schedule`, `defaultOwner`). Rollback: remove the module registration (or the config block); ingested entities are pruned on the next catalog reconciliation because they are provider-managed via `locationKey`. The provider is inert when unconfigured, so shipping the package without config is a safe no-op.

## Open Questions

- **apiVersion default** — should the default track the live registry (`v0`/`v0.1`) instead of `v1` once the registry's versioning stabilizes? Currently `v1` per the proposal; revisit when the MCP Registry pins a stable API version.
- **`limit` / page-size configuration** — expose a `limit` (and pagination safeguard bounds) as config, or keep them internal constants? Deferred until real registry sizes inform sensible defaults.
- **Registry authentication** — token/header auth is out of scope now; what shape (static token, `${ENV}` substitution, Backstage auth integration) should it take when added?
- **Multiple registries** — deferred. A later change would likely restore a keyed `catalog.providers.mcpRegistry.<id>` map, using each instance's `baseName` as the mapping prefix override so `<prefix>__<name>__<version>` stays unique per source. Cross-registry dedup/merge remains a separate question.
