# Graduated Visibility Permissions

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

Three AI Catalog permissions implement a two-tier visibility model with field-level filtering. Tier 1 (discovery) shows basic metadata; Tier 2 (sensitive details) adds usage documentation, connection endpoints, and configuration. A third admin permission gates management actions.

**Jira references:** RHIDP-15270, RHIDP-15271, RHIDP-15272, RHIDP-15273

## ADDED Requirements

### Requirement: AI Catalog Permission Definitions

Three permissions MUST be registered via `permissionsRegistry.addPermissions()` at plugin startup.

#### Scenario: Permission registration

- **WHEN** the AI Catalog backend module starts
- **THEN** the following permissions are registered:
  | Permission | Action | Resource Type | Purpose |
  |---|---|---|---|
  | `ai-catalog.asset.read` | read | `ai-catalog-asset` | Tier 1: basic discovery (name, description, type, lifecycle stage) |
  | `ai-catalog.asset.read.usage-docs` | read | `ai-catalog-asset` | Tier 2: usage docs, connection endpoints, configuration |
  | `ai-catalog.admin` | update | — (basic) | Management actions, posture config, admin UI access |
- **AND** both read permissions are resource-based to support CONDITIONAL evaluation via RBAC conditional policies
- **AND** `ai-catalog.admin` is basic (binary ALLOW/DENY) because management actions are not scoped to individual assets

#### Scenario: Permission constant exports

- **WHEN** frontend or backend code needs AI Catalog permission references
- **THEN** all permission constants are exported from `@red-hat-developer-hub/backstage-plugin-boost-common`
- **AND** resource permissions use `createPermission` with `resourceType: 'ai-catalog-asset'`
- **AND** a `AI_CATALOG_ASSET_RESOURCE_TYPE` constant is exported for shared reference

### Requirement: Two-Tier Field-Level Filtering

API responses MUST omit Tier 2 fields when the requesting user lacks `ai-catalog.asset.read.usage-docs` permission.

#### Scenario: Tier 1 access (discovery only)

- **WHEN** a user with `ai-catalog.asset.read` but without `ai-catalog.asset.read.usage-docs` requests an AI asset detail page
- **THEN** the response includes Tier 1 fields: name, description, category, lifecycle stage, version count, tags
- **AND** Tier 2 fields are omitted: usage documentation, connection endpoints, configuration blocks, deployment parameters

#### Scenario: Tier 2 access (full details)

- **WHEN** a user with both `ai-catalog.asset.read` and `ai-catalog.asset.read.usage-docs` requests an AI asset detail page
- **THEN** the response includes all Tier 1 and Tier 2 fields

#### Scenario: No read access

- **WHEN** a user without `ai-catalog.asset.read` requests an AI asset list or detail page
- **THEN** the asset is excluded from list results
- **AND** detail page requests return 403

#### Scenario: Filtering happens at API layer, not database layer

- **WHEN** a backend handler prepares an AI asset response
- **THEN** field-level filtering for Tier 2 is applied after the full entity is loaded from the database
- **AND** entity-level filtering (which assets appear in lists) uses `authorizeConditional()` + `toQuery()` for database-level filtering when conditional policies are configured
- **AND** this matches the pattern used by Backstage's `AuthorizedEntitiesCatalog`

### Requirement: Frontend Permission Gating

Frontend components MUST gate Tier 2 sections using `RequirePermission`.

#### Scenario: Asset detail page with restricted sections

- **WHEN** the frontend renders an AI asset detail page
- **THEN** Tier 2 sections (usage docs, connection endpoints, configuration) are wrapped in `<RequirePermission permission={aiCatalogAssetReadUsageDocsPermission}>`
- **AND** when permission is denied, a restricted-access placeholder is shown instead of the section content
- **AND** the placeholder explains what permission is needed to view the content

#### Scenario: Asset list page with conditional filtering

- **WHEN** the frontend renders an AI asset list page
- **THEN** the list respects backend filtering — only assets the user can see appear in results
- **AND** total counts reflect the filtered set, not the global count

### Requirement: List Endpoint 3-Tier Evaluation

AI asset list endpoints MUST support 3-tier evaluation (ALLOW/DENY/CONDITIONAL) for `ai-catalog.asset.read`.

#### Scenario: Conditional list filtering

- **WHEN** `ai-catalog.asset.read` is evaluated for a list endpoint (no specific resourceRef)
- **THEN** the backend calls `permissions.authorizeConditional()` which returns one of:
  - **ALLOW** — return all assets (no filtering)
  - **DENY** — fall back to `ai-catalog.admin` check; if also denied, return 403 Unauthorized
  - **CONDITIONAL** — apply conditions as database query filters via `toQuery()`
- **AND** deployers can configure visibility rules via RBAC policies scoped to category, connector, or tenant

### Requirement: Performance Considerations

Permission checks MUST not degrade list endpoint performance.

#### Scenario: Batch permission evaluation

- **WHEN** a list endpoint returns N assets
- **THEN** `ai-catalog.asset.read.usage-docs` is evaluated once via `authorizeConditional()`, not per-asset
- **AND** the CONDITIONAL result applies uniformly to all assets in the response
- **AND** if per-asset Tier 2 visibility is needed in the future, it uses `applyConditions()` with the batch result
