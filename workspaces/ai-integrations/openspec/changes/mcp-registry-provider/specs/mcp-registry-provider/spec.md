## MCP Registry Provider

This capability defines a Backstage catalog **entity provider** that ingests MCP servers from one configured [MCP Registry](https://github.com/modelcontextprotocol/registry) into the RHDH catalog as `mcp-server` `API` entities. Multiple registries are out of scope for this implementation.

On a configured schedule, the provider lists the registry's servers (`GET <baseUrl>/<apiVersion>/servers`), traverses all pages via cursor pagination, transforms each `server.json` document into an `mcp-server` `API` entity using the [`mcp-registry-server-mapping`](../../../mcp-registry-server-mapping/specs/mcp-registry-server-mapping/spec.md) contract (supplying the configured `defaultOwner` as the caller-override owner and, when present, `baseName` as the caller-override identity prefix), and commits the full set to the catalog as a single full mutation so that servers removed from the registry are pruned.

This spec covers configuration, scheduling, registry API interaction (pagination and API-version slug construction), delegation to the mapping transform, catalog mutation semantics, and error handling. It does **not** redefine the `server.json` → entity transform, which is owned by `mcp-registry-server-mapping`.

---

## ADDED Requirements

### Requirement: Configure a single MCP registry provider

The provider SHALL read its configuration from `catalog.providers.mcpRegistry` as a **single object** (not a keyed map of instances). The provider SHALL read `baseUrl` (**required**), `baseName` (optional), `apiVersion` (optional, defaulting to the constant `v1`), `schedule` (optional, a standard `SchedulerServiceTaskScheduleDefinition`), `pageLimit` (optional, the max number of pages fetched per sync, defaulting to the constant `10`), `pageSize` (optional, the registry page size sent as the `limit` query parameter; when omitted the provider SHALL leave `?limit=` unset), and `defaultOwner` (optional, a Backstage entity reference). When `baseName` is present, the provider SHALL pass it to `mcp-registry-server-mapping` as the caller-override identity prefix; when it is omitted, the provider SHALL NOT pass a prefix override, so the mapping's default prefix (`mcp.registry`) applies. The provider SHALL register at most one `EntityProvider` whose `getProviderName()` is the constant `mcp-registry-provider`, which SHALL also be the mutation `locationKey` used for full-mutation pruning. When `catalog.providers.mcpRegistry` is absent, the provider SHALL register nothing and SHALL NOT error (the module is inert unless configured). Multiple registries are out of scope: a keyed map of instance objects SHALL fail startup with an actionable error.

#### Scenario: Single registry configured

- **WHEN** `catalog.providers.mcpRegistry` is configured with a `baseUrl` and a `schedule`
- **THEN** exactly one provider is registered using the configured `baseUrl` and `schedule`, `apiVersion` defaulting to `v1`, no prefix override beyond the mapping's default, and no owner override beyond the mapping's own default

#### Scenario: baseName is accepted alongside baseUrl

- **WHEN** `catalog.providers.mcpRegistry` is configured with `baseUrl` and `baseName: com.example.registry`
- **THEN** the provider is registered, and on sync it passes `com.example.registry` as the mapping's prefix override

#### Scenario: Keyed multi-registry config is rejected

- **WHEN** `catalog.providers.mcpRegistry` is a keyed map of instance objects (e.g. keys `internal` and `public`, each with its own `baseUrl`)
- **THEN** provider startup fails with an actionable error that multiple registries are out of scope

#### Scenario: Missing required baseUrl fails fast

- **WHEN** `catalog.providers.mcpRegistry` is present but omits `baseUrl`
- **THEN** provider startup fails with an actionable error that names the missing `baseUrl` key

#### Scenario: No configuration present

- **WHEN** `catalog.providers.mcpRegistry` is not present in app-config
- **THEN** the module registers no provider and startup succeeds without error

#### Scenario: Omitted pageLimit defaults to 10 pages per sync

- **WHEN** `catalog.providers.mcpRegistry` is configured with a `baseUrl` and no `pageLimit`
- **THEN** the provider's max pages per sync is `10`

#### Scenario: Configured pageLimit is the max pages per sync

- **WHEN** `catalog.providers.mcpRegistry` is configured with `pageLimit: 3`
- **THEN** the provider's max pages per sync is `3`

#### Scenario: Omitted pageSize leaves the registry page-size query unset

- **WHEN** `catalog.providers.mcpRegistry` is configured with a `baseUrl` and no `pageSize`
- **THEN** list requests omit the `limit` query parameter and the MCP Registry default page size applies

#### Scenario: Configured pageSize is sent as the limit query parameter

- **WHEN** `catalog.providers.mcpRegistry` is configured with `pageSize: 50`
- **THEN** each servers list request includes `limit=50`

### Requirement: Sync on the configured schedule

The provider SHALL run its ingestion sync on the configured `schedule` using the Backstage `SchedulerService`. When `schedule` is omitted, the provider SHALL apply a documented default `SchedulerServiceTaskScheduleDefinition` rather than failing. The provider SHALL also perform an initial sync according to the schedule's `initialDelay` (or immediately when unset) after registration.

#### Scenario: Scheduled sync runs at the configured frequency

- **WHEN** the provider is configured with a `schedule` of `frequency: { minutes: 30 }`
- **THEN** the provider runs a full ingestion sync approximately every 30 minutes via the scheduler

#### Scenario: Schedule omitted uses the default

- **WHEN** the provider is configured without a `schedule`
- **THEN** the provider applies the documented default schedule and syncs on that cadence without error

### Requirement: List registry servers with cursor pagination

During a sync, the provider SHALL request the registry's servers from `<baseUrl>/<apiVersion>/servers` and SHALL traverse pages using the registry's cursor pagination: it SHALL read `metadata.nextCursor` from each response and, when that value is present and non-empty, issue the next request with that value as the `cursor` query parameter, repeating until `metadata.nextCursor` is absent, null, or empty. Cursors SHALL be treated as opaque strings (never constructed or modified). All `servers[]` entries across fetched pages SHALL be accumulated for the sync. When `pageSize` is set, the provider SHALL send it as the `limit` query parameter on every list request in the sync. When `pageSize` is omitted, the provider SHALL omit `?limit=` so the MCP Registry default page size applies. The provider SHALL NOT send `pageLimit` as the registry `?limit=` query parameter; `pageLimit` is a local max-pages bound only. The provider SHALL fail the run with no mutation when it would fetch more pages than `pageLimit` (default `10`) while `metadata.nextCursor` is still present and non-empty, or when a repeated cursor is detected.

#### Scenario: Multi-page traversal

- **WHEN** the registry returns a first page with `metadata.nextCursor` set and a second page with no `nextCursor`
- **THEN** the provider fetches both pages, passing the first page's `nextCursor` as the `cursor` parameter on the second request, and accumulates the servers from both pages

#### Scenario: Single-page result

- **WHEN** the registry returns a page whose `metadata.nextCursor` is absent or empty
- **THEN** the provider stops after that single request and processes only the accumulated servers

#### Scenario: Opaque cursor is passed unchanged

- **WHEN** a response's `metadata.nextCursor` is an opaque token
- **THEN** the provider passes that token verbatim as the `cursor` query parameter without parsing or altering it

#### Scenario: Omitted pageSize does not send limit on list requests

- **WHEN** `pageSize` is omitted
- **THEN** each servers list request has no `limit` query parameter

#### Scenario: Configured pageSize is present on every page request

- **WHEN** the provider is configured with `pageSize: 50` and the registry returns a first page with `metadata.nextCursor` set
- **THEN** both the first request and the follow-up request include `limit=50`

#### Scenario: Default pageLimit trips when an 11th page is required

- **WHEN** `pageLimit` is omitted (default `10`) and the 10th page still has a non-empty `metadata.nextCursor`
- **THEN** the provider does not fetch an 11th page, logs the pagination-safeguard trip, and does not commit a mutation for this run

#### Scenario: Configured pageLimit trips before the cursor ends

- **WHEN** the provider is configured with `pageLimit: 2` and the 2nd page still has a non-empty `metadata.nextCursor`
- **THEN** the provider does not fetch a 3rd page, logs the pagination-safeguard trip, and does not commit a mutation for this run

### Requirement: Construct the servers endpoint from apiVersion

The provider SHALL construct the servers endpoint as `<baseUrl>/<apiVersion>/servers`, where `apiVersion` is the configured value or the `v1` default. The provider SHALL join `baseUrl` and the version segment without duplicating or dropping path separators, regardless of whether `baseUrl` has a trailing slash.

#### Scenario: Default apiVersion

- **WHEN** the provider is configured with `baseUrl: https://registry.example.com` and no `apiVersion`
- **THEN** the provider requests `https://registry.example.com/v1/servers`

#### Scenario: Overridden apiVersion

- **WHEN** the provider is configured with `baseUrl: https://registry.example.com/` (trailing slash) and `apiVersion: v0`
- **THEN** the provider requests `https://registry.example.com/v0/servers` with exactly one separator between segments

### Requirement: Map each registry server to an mcp-server API entity

For every accumulated server entry, the provider SHALL extract the `server.json` document from the list entry's `.server` object and produce an `mcp-server` `API` entity by applying the `mcp-registry-server-mapping` transform, supplying the configured `defaultOwner` as the caller-override owner default and, when `baseName` is present, supplying `baseName` as the caller-override identity prefix. The provider SHALL NOT reimplement or alter the field mapping, annotation projection, or identity rules defined by `mcp-registry-server-mapping`. Each produced entity SHALL be emitted with mutation `locationKey` `mcp-registry-provider` **and** SHALL carry `backstage.io/managed-by-location` so the catalog attributes the entity to this provider.

#### Scenario: Server mapped with configured default owner

- **WHEN** a sync retrieves a `server.json` and the provider is configured with `defaultOwner: group:default/mcp-admins`
- **THEN** the produced `mcp-server` `API` entity has `spec.owner: group:default/mcp-admins` (the caller override), with all other fields set by the `mcp-registry-server-mapping` transform

#### Scenario: Default owner omitted falls back to the mapping default

- **WHEN** a sync retrieves a `server.json` and the provider is configured with no `defaultOwner`
- **THEN** the produced entity's `spec.owner` is the `mcp-registry-server-mapping` default (`unknown`)

#### Scenario: baseName overrides the mapping identity prefix

- **WHEN** a sync retrieves a `server.json` with `name: io.github.user/weather` and `version: 1.0.2`, and the provider is configured with `baseName: com.example.registry`
- **THEN** the mapping is invoked with prefix override `com.example.registry` and the produced entity's `metadata.name` is the sanitized stem `com.example.registry__io.github.user-weather__1.0.2` plus a stable hash suffix (sanitization changed the identity)

#### Scenario: baseName omitted uses the mapping default prefix

- **WHEN** a sync retrieves a `server.json` with `name: io.github.user/weather` and `version: 1.0.2`, and the provider is configured with no `baseName`
- **THEN** the mapping is invoked with no prefix override and the produced entity's `metadata.name` uses the mapping default prefix stem (`mcp.registry__io.github.user-weather__1.0.2`) plus a stable hash suffix (sanitization changed the identity)

#### Scenario: Provider attribution annotations present

- **WHEN** the provider produces an entity
- **THEN** the entity's mutation `locationKey` is `mcp-registry-provider` and the entity carries `backstage.io/managed-by-location` so the catalog associates the entity with this provider and can prune it on removal

### Requirement: Commit ingested entities as a full mutation

At the end of each successful sync, the provider SHALL commit the complete set of produced entities to the catalog as a single **full** mutation (not incremental), so that entities for servers no longer present in the registry are removed from the catalog and re-added/updated entities reflect the latest `server.json`. The provider SHALL NOT emit a mutation for a sync run that failed to complete (see error handling), leaving the prior catalog state intact.

#### Scenario: Removed server is pruned

- **WHEN** a server present in a prior sync is absent from the current sync's accumulated servers
- **THEN** the current sync's full mutation omits that server's entity, and the catalog removes it

#### Scenario: Updated server reflects latest state

- **WHEN** a server's `server.json` changes between syncs (e.g. a new description)
- **THEN** the produced entity in the current full mutation reflects the latest `server.json`

### Requirement: Resilient, agent-native error handling

A single server entry that cannot be mapped (e.g. it omits a `server.json`-required field and the mapping rejects it) SHALL be logged with an actionable message identifying the entry and SHALL be skipped, without aborting the sync or discarding the other entries. A registry transport or protocol error (unreachable host, non-2xx HTTP status, unparseable response body, or pagination-safeguard trip) SHALL fail the current sync run: the provider SHALL NOT commit a partial full mutation, SHALL log the error, and SHALL retry on the next scheduled tick, leaving the prior catalog state intact.

#### Scenario: One malformed server does not abort the sync

- **WHEN** one accumulated server entry fails mapping while the others succeed
- **THEN** the provider logs the failing entry, skips it, and commits a full mutation containing the successfully mapped entities

#### Scenario: Registry fetch error aborts the run without a mutation

- **WHEN** a page request returns a non-2xx HTTP status or the response body cannot be parsed
- **THEN** the provider logs the error, does not commit any mutation for this run, leaves the previously committed catalog entities intact, and retries on the next scheduled tick
