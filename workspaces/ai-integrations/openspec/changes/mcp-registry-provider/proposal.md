## Why

The [`mcp-registry-server-mapping`](../mcp-registry-server-mapping/proposal.md) change defines the pure `server.json` → `mcp-server` `API` entity transform, but explicitly leaves ingestion out of scope: nothing yet fetches entries from an [MCP Registry](https://github.com/modelcontextprotocol/registry) and puts the resulting entities into the Backstage catalog. Without a provider, an operator who points RHDH at a registry gets no catalog entities. This change delivers that missing runtime component — a Backstage catalog **entity provider** that periodically reads a registry's `server.json` entries and populates the catalog with `mcp-server` `API` entities — so MCP servers published to a registry become discoverable in RHDH.

## What Changes

- Introduce a **backend catalog entity provider plugin** (a Backstage `catalog-backend-module`) that, on a configured schedule, lists MCP servers from a configured registry and applies the [`mcp-registry-server-mapping`](../mcp-registry-server-mapping/proposal.md) transform to produce `mcp-server` `API` entities, then commits them to the catalog as a **full mutation** (so servers removed from the registry are pruned).
- Support **multiple registry instances** via idiomatic Backstage entity-provider configuration under `catalog.providers.mcpRegistry.<id>`, each instance configuring:
  - `baseUrl` — the URL of the MCP Registry (**required**).
  - `schedule` — sync frequency as a standard `SchedulerServiceTaskScheduleDefinition` (`frequency`, `timeout`, optional `initialDelay`).
  - `apiVersion` — the version segment used in the API endpoint slug; **defaults to `v1`**.
  - `defaultOwner` — the default `spec.owner` (a `User`/`Group` entity reference) applied to every produced `API` entity, passed as the caller-override default into the mapping.
- Implement **cursor pagination**: the servers endpoint (`<baseUrl>/<apiVersion>/servers`) is traversed by passing the prior response's `metadata.nextCursor` as the `cursor` query parameter until the cursor is absent/empty (per the [generic registry API](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/api/generic-registry-api.md#basic-example-list-servers)), so all servers are ingested regardless of page size.
- Specify **resilient, agent-native sync behavior**: a single server entry that fails to map is logged and skipped without aborting the run; a registry transport/protocol error fails that sync run (leaving the prior catalog state intact) and is retried on the next scheduled tick.

## Capabilities

### New Capabilities

- `mcp-registry-provider`: A scheduled Backstage catalog entity provider that reads MCP servers from one or more configured MCP Registries (with cursor pagination), maps each `server.json` to an `mcp-server` `API` entity via [`mcp-registry-server-mapping`](../mcp-registry-server-mapping/proposal.md), and commits them to the catalog as a full mutation — including configuration (`catalog.providers.mcpRegistry.<id>`), scheduling, API-version slug construction, and error handling.

### Modified Capabilities

_(none — no long-lived specs exist under `openspec/specs/` yet; this change introduces a new capability and **consumes** the sibling `mcp-registry-server-mapping` capability as its transform.)_

## Non-goals

- **The mapping itself.** The `server.json` → entity transform, annotation projection, secret redaction, and identity/name rules are owned by [`mcp-registry-server-mapping`](../mcp-registry-server-mapping/proposal.md) and consumed here unchanged.
- **A registry proxy or pass-through API.** Unlike the [reference proxy prototype](https://github.com/gabemontero/rhdh-plugins/tree/mcp-reg-proxy-proto), this plugin does not expose registry endpoints through RHDH; it is a one-way ingestion provider into the catalog.
- **Registry authentication / write access.** Assumes an unauthenticated (or externally-fronted) read-only registry endpoint; per-registry auth credentials are a future extension.
- **Runtime invocation, health checking, or tool discovery** of the ingested MCP servers.
- **Cross-registry deduplication / merge** of the same server published to multiple registries (carried over from the mapping's non-goals).
- **Frontend / catalog UI** changes; produced entities render via existing upstream `mcp-server` `API` entity support.

## Canonical Touchpoints

- **PRDs (`specifications/prd/`)**: None
- **ADRs (`specifications/adr/`)**: None
- **Long-lived specs (`openspec/specs/`)**: None (new capability only; `openspec/specs/` does not yet exist)

**Change type**: feature-spec

## Impact

- **Depends on the sibling `mcp-registry-server-mapping` change** for the transform contract; this provider is the first consumer of that mapping and passes `defaultOwner` as the caller-override owner default.
- **Depends on Backstage backend framework**: the catalog `EntityProvider` interface, `SchedulerService` (`SchedulerServiceTaskScheduleDefinition`), the new backend system (`createBackendModule` / `coreServices`), and `RootConfigService` for reading `catalog.providers.mcpRegistry.<id>`.
- **Source API**: MCP Registry generic API — `GET <baseUrl>/<apiVersion>/servers?cursor=<opaque>`; response `{ servers: [...], metadata: { count, nextCursor } }`. Cursors are opaque and traversed until absent.
- **API-version discrepancy** (documented risk): the current reference registry serves `/v0` (proxy prototype) / `/v0.1` (docs), while `apiVersion` defaults to `v1` per this proposal; operators override `apiVersion` to match their registry.
- **Consumers**: RHDH operators who configure a registry; developers and AI agents who then discover MCP servers via catalog search/filter over the `mcp-server` entities and their `modelcontextprotocol.io/*` annotations.
- **Packaging**: a new backend plugin package (Backstage catalog-backend-module naming convention), wired into the backend via `backend.add(...)`.
- **Upstream**: keep aligned with Backstage's entity-provider / scheduler APIs and the MCP Registry generic API as both evolve.
