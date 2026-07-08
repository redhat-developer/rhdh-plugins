# MCP Catalog Source

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

The MCP catalog source connects to RHOAI 3.4's developer-preview MCP catalog API, ingests MCP server metadata, and emits RHDH catalog entities. This source gracefully handles API absence on older RHOAI versions.

## EXISTING Requirements

None. This is a new EntityProvider implementation.

## ADDED Requirements

### Requirement: RHOAI MCP Catalog API Connection

The provider must connect to the RHOAI MCP catalog API and handle developer-preview API availability.

#### Scenario: Provider connects to MCP catalog API

- **WHEN** the `RhoaiMcpCatalogProvider` starts
- **THEN** it reads endpoint URL from `catalog.providers.rhoai.mcpCatalog.endpoint`
- **AND** it loads credentials from K8s Secret referenced in `catalog.providers.rhoai.mcpCatalog.auth.secretRef`
- **AND** it loads custom CA bundle from `catalog.providers.rhoai.mcpCatalog.tls.caBundle` (if configured)
- **AND** it validates connectivity by calling `GET /api/mcp/v1/servers?limit=1`
- **AND** on successful response, it marks `mcpApiAvailable = true`

#### Scenario: MCP catalog API is absent (RHOAI < 3.4)

- **WHEN** the provider tries to connect to the MCP catalog API
- **AND** the API returns 404 Not Found or connection refused
- **THEN** the provider logs a warning: `MCP catalog API not available (RHOAI 3.4+ required), disabling MCP source for this cycle`
- **AND** it sets internal flag `mcpApiAvailable = false`
- **AND** it returns empty entity array from `read()` without throwing an error
- **AND** on subsequent refresh cycles, it skips API calls while flag is false
- **AND** every 10th refresh cycle, it retries the API connection (in case RHOAI was upgraded)

### Requirement: MCP Server Entity Emission

MCP catalog entries must map to Resource entities with `spec.type: mcp-server`.

#### Scenario: MCP server is mapped to Resource entity

- **WHEN** the provider fetches MCP servers from `GET /api/mcp/v1/servers`
- **THEN** each MCP server entry is converted to a Resource entity
- **AND** `metadata.name` is set to the server's `name` (slugified if needed)
- **AND** `metadata.title` is set to the server's `displayName` (fallback to `name`)
- **AND** `spec.type` is set to `mcp-server`
- **AND** `metadata.annotations['rhdh.io/mcp-protocol-version']` is set to the server's protocol version (e.g., `1.0.0`)
- **AND** `metadata.annotations['rhdh.io/mcp-endpoint']` is set to the server's endpoint URL
- **AND** `metadata.description` is set to the server's `description` (if present)

#### Scenario: MCP server with capability metadata

- **WHEN** an MCP server entry includes capability metadata (e.g., supported tools, resources)
- **THEN** `metadata.annotations['rhdh.io/mcp-capabilities']` is set to a JSON string of the capabilities object
- **AND** `metadata.tags` includes tags derived from capability types (e.g., `mcp-tools`, `mcp-resources`)

### Requirement: Graceful Degradation on API Absence

The provider must not block catalog startup when the MCP catalog API is unavailable.

#### Scenario: Provider starts with MCP API unavailable

- **WHEN** the provider's `connect()` method is called
- **AND** the MCP catalog API is unreachable (404, connection error, timeout)
- **THEN** the provider completes `connect()` without throwing an error
- **AND** it logs a single warning message (not repeated on every refresh)
- **AND** the Model Registry provider (separate instance) continues syncing entities

#### Scenario: Provider retries API connection after upgrade

- **WHEN** the MCP API was unavailable on the first 9 refresh cycles
- **AND** the 10th refresh cycle runs
- **THEN** the provider retries the API connection
- **AND** if the API is now available (RHOAI was upgraded), it starts syncing MCP server entities
- **AND** it logs an info message: `MCP catalog API is now available, resuming sync`

### Requirement: Developer-Preview API Stability Handling

The MCP catalog API is developer preview and may change between RHOAI versions.

#### Scenario: API response schema validation

- **WHEN** the provider receives a response from the MCP catalog API
- **THEN** it validates the response schema using Zod
- **AND** on validation failure, it logs an error with the response body and Zod error details
- **AND** it returns the previously cached entity list (if available) or an empty array
- **AND** it includes the API version in the error log for debugging

#### Scenario: API version mismatch warning

- **WHEN** the provider detects an API version mismatch (response `apiVersion` field ≠ expected `v1`)
- **THEN** it logs a warning: `MCP catalog API version mismatch: expected v1, got {actual}. Entity mapping may be incomplete.`
- **AND** it continues processing the response (best-effort compatibility)
- **AND** it includes `metadata.annotations['rhdh.io/api-version-mismatch']` on all emitted entities for audit

### Requirement: Annotation Population

All emitted MCP server entities must include standard RHDH annotations.

#### Scenario: MCP server entities include standard annotations

- **WHEN** the provider emits an MCP server entity
- **THEN** it includes `metadata.annotations['backstage.io/source-location']` pointing to the MCP catalog API URL
- **AND** it includes `metadata.annotations['backstage.io/managed-by-location']` set to the provider's location string
- **AND** it includes `metadata.annotations['rhdh.io/connector-type']` set to `rhoai-mcp-catalog`
- **AND** it includes `metadata.annotations['rhdh.io/last-sync-time']` with the current timestamp
- **AND** it includes `metadata.annotations['rhdh.io/api-version']` with the MCP catalog API version

### Requirement: Full Sync via applyMutation

The provider must use Backstage's `applyMutation` for full sync and incremental updates.

#### Scenario: Initial sync of all MCP servers

- **WHEN** the provider connects for the first time and the MCP API is available
- **THEN** it fetches all MCP servers from the API
- **AND** it calls `applyMutation({ type: 'full', entities: [...allMcpServers] })`
- **AND** previously existing MCP server entities not in the current fetch are marked for deletion

#### Scenario: Incremental refresh with added MCP servers

- **WHEN** the provider refreshes on a subsequent cycle
- **AND** new MCP servers are detected
- **THEN** it includes the new entities in the next `applyMutation` call
- **AND** the catalog processes additions and updates without duplicate entity errors
