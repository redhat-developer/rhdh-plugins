## MCP Registry Provider

This capability defines a Backstage catalog **entity provider** that ingests MCP servers from one or more configured [MCP Registries](https://github.com/modelcontextprotocol/registry) into the RHDH catalog as `mcp-server` `API` entities.

On a configured schedule, each provider instance lists the registry's servers (`GET <baseUrl>/<apiVersion>/servers`), traverses all pages via cursor pagination, transforms each `server.json` document into an `mcp-server` `API` entity using the [`mcp-registry-server-mapping`](../../../mcp-registry-server-mapping/specs/mcp-registry-server-mapping/spec.md) contract (supplying the configured `defaultOwner` as the caller-override owner), and commits the full set to the catalog as a single full mutation so that servers removed from the registry are pruned.

This spec covers configuration, scheduling, registry API interaction (pagination and API-version slug construction), delegation to the mapping transform, catalog mutation semantics, and error handling. It does **not** redefine the `server.json` → entity transform, which is owned by `mcp-registry-server-mapping`.

---

## ADDED Requirements

### Requirement: Configure MCP registry provider instances

The provider SHALL read its configuration from `catalog.providers.mcpRegistry`, treated as a keyed map where each key is a caller-chosen instance `<id>` and each value configures one registry. For each instance the provider SHALL read `baseUrl` (**required**), `apiVersion` (optional, defaulting to the constant `v1`), `schedule` (optional, a standard `SchedulerServiceTaskScheduleDefinition`), and `defaultOwner` (optional, a Backstage entity reference). The provider SHALL register one independent provider instance per configured `<id>`. When `catalog.providers.mcpRegistry` is absent, the provider SHALL register nothing and SHALL NOT error (the module is inert unless configured).

#### Scenario: Single registry instance configured

- **WHEN** `catalog.providers.mcpRegistry.redhatEcosystem` is configured with a `baseUrl` and a `schedule`
- **THEN** exactly one provider instance is registered for the `redhatEcosystem` id, using the configured `baseUrl` and `schedule`, `apiVersion` defaulting to `v1`, and no owner override beyond the mapping's own default

#### Scenario: Multiple registry instances configured

- **WHEN** `catalog.providers.mcpRegistry` contains two keys `internal` and `public`, each with its own `baseUrl` and `schedule`
- **THEN** two independent provider instances are registered, each syncing its own registry on its own schedule

#### Scenario: Missing required baseUrl fails fast

- **WHEN** a configured instance omits `baseUrl`
- **THEN** provider startup fails with an actionable error that names the offending instance `<id>` and the missing `baseUrl` key

#### Scenario: No configuration present

- **WHEN** `catalog.providers.mcpRegistry` is not present in app-config
- **THEN** the module registers no provider instances and startup succeeds without error

### Requirement: Sync on the configured schedule

Each provider instance SHALL run its ingestion sync on the configured `schedule` using the Backstage `SchedulerService`. When `schedule` is omitted for an instance, the provider SHALL apply a documented default `SchedulerServiceTaskScheduleDefinition` rather than failing. The provider SHALL also perform an initial sync according to the schedule's `initialDelay` (or immediately when unset) after registration.

#### Scenario: Scheduled sync runs at the configured frequency

- **WHEN** an instance is configured with a `schedule` of `frequency: { minutes: 30 }`
- **THEN** the provider runs a full ingestion sync approximately every 30 minutes via the scheduler, independently of other instances

#### Scenario: Schedule omitted uses the default

- **WHEN** an instance is configured without a `schedule`
- **THEN** the provider applies the documented default schedule and syncs on that cadence without error

### Requirement: List all registry servers with cursor pagination

During a sync, the provider SHALL request the registry's servers from `<baseUrl>/<apiVersion>/servers` and SHALL traverse every page using the registry's cursor pagination: it SHALL read `metadata.nextCursor` from each response and, when that value is present and non-empty, issue the next request with that value as the `cursor` query parameter, repeating until `metadata.nextCursor` is absent, null, or empty. Cursors SHALL be treated as opaque strings (never constructed or modified). All `servers[]` entries across all pages SHALL be accumulated for the sync. The provider SHALL guard against a non-terminating cursor loop with a documented safeguard.

#### Scenario: Multi-page traversal

- **WHEN** the registry returns a first page with `metadata.nextCursor` set and a second page with no `nextCursor`
- **THEN** the provider fetches both pages, passing the first page's `nextCursor` as the `cursor` parameter on the second request, and accumulates the servers from both pages

#### Scenario: Single-page result

- **WHEN** the registry returns a page whose `metadata.nextCursor` is absent or empty
- **THEN** the provider stops after that single request and processes only the accumulated servers

#### Scenario: Opaque cursor is passed unchanged

- **WHEN** a response's `metadata.nextCursor` is an opaque token
- **THEN** the provider passes that token verbatim as the `cursor` query parameter without parsing or altering it

### Requirement: Construct the servers endpoint from apiVersion

The provider SHALL construct the servers endpoint as `<baseUrl>/<apiVersion>/servers`, where `apiVersion` is the configured value or the `v1` default. The provider SHALL join `baseUrl` and the version segment without duplicating or dropping path separators, regardless of whether `baseUrl` has a trailing slash.

#### Scenario: Default apiVersion

- **WHEN** an instance configures `baseUrl: https://registry.example.com` and no `apiVersion`
- **THEN** the provider requests `https://registry.example.com/v1/servers`

#### Scenario: Overridden apiVersion

- **WHEN** an instance configures `baseUrl: https://registry.example.com/` (trailing slash) and `apiVersion: v0`
- **THEN** the provider requests `https://registry.example.com/v0/servers` with exactly one separator between segments

### Requirement: Map each registry server to an mcp-server API entity

For every accumulated server entry, the provider SHALL extract its `server.json` document and produce an `mcp-server` `API` entity by applying the `mcp-registry-server-mapping` transform, supplying the instance's configured `defaultOwner` as the caller-override owner default. The provider SHALL NOT reimplement or alter the field mapping, annotation projection, or identity rules defined by `mcp-registry-server-mapping`. Each produced entity SHALL carry the provider's location/ownership annotations so the catalog attributes the entity to this provider instance.

#### Scenario: Server mapped with configured default owner

- **WHEN** a sync retrieves a `server.json` and the instance configures `defaultOwner: group:default/mcp-admins`
- **THEN** the produced `mcp-server` `API` entity has `spec.owner: group:default/mcp-admins` (the caller override), with all other fields set by the `mcp-registry-server-mapping` transform

#### Scenario: Default owner omitted falls back to the mapping default

- **WHEN** a sync retrieves a `server.json` and the instance configures no `defaultOwner`
- **THEN** the produced entity's `spec.owner` is the `mcp-registry-server-mapping` default (`unknown`)

#### Scenario: Provider attribution annotations present

- **WHEN** the provider produces an entity
- **THEN** the entity carries the provider instance's managed-location annotation so the catalog associates the entity with this provider and can prune it on removal

### Requirement: Commit ingested entities as a full mutation

At the end of each successful sync, the provider SHALL commit the complete set of produced entities to the catalog as a single **full** mutation (not incremental), so that entities for servers no longer present in the registry are removed from the catalog and re-added/updated entities reflect the latest `server.json`. The provider SHALL NOT emit a mutation for a sync run that failed to complete (see error handling), leaving the prior catalog state intact.

#### Scenario: Removed server is pruned

- **WHEN** a server present in a prior sync is absent from the current sync's accumulated servers
- **THEN** the current sync's full mutation omits that server's entity, and the catalog removes it

#### Scenario: Updated server reflects latest state

- **WHEN** a server's `server.json` changes between syncs (e.g. a new description)
- **THEN** the produced entity in the current full mutation reflects the latest `server.json`

### Requirement: Resilient, agent-native error handling

A single server entry that cannot be mapped (e.g. it omits a `server.json`-required field and the mapping rejects it) SHALL be logged with an actionable message identifying the entry and SHALL be skipped, without aborting the sync or discarding the other entries. A registry transport or protocol error (unreachable host, non-success HTTP status, or unparseable response body) SHALL fail the current sync run: the provider SHALL NOT commit a partial full mutation, SHALL log the error, and SHALL retry on the next scheduled tick, leaving the prior catalog state intact.

#### Scenario: One malformed server does not abort the sync

- **WHEN** one accumulated server entry fails mapping while the others succeed
- **THEN** the provider logs the failing entry, skips it, and commits a full mutation containing the successfully mapped entities

#### Scenario: Registry fetch error aborts the run without a mutation

- **WHEN** a page request returns a non-success HTTP status or the response body cannot be parsed
- **THEN** the provider logs the error, does not commit any mutation for this run, leaves the previously committed catalog entities intact, and retries on the next scheduled tick
