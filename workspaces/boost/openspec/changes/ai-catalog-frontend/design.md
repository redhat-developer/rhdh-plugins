# Design: AI Catalog Frontend

## Context

Boost has a backend with 30+ API routes and 9 plugin packages but no frontend. The AI Catalog is the first frontend feature. The plugin architecture must support future domains (chat, admin, agent gallery) without restructuring.

## Goals

- NFS-only frontend plugin using Backstage Blueprints
- Browse page for marketplace-style AI asset discovery
- Entity page extensions for asset details and adoption actions
- Dev app shell for local development
- BUI component library for new UI components

## Non-Goals

- Chat UI, admin panels, or agent gallery (future domains)
- Custom entity detail pages (use existing catalog pages)
- RHDH dynamic plugin packaging (Scalprum/export-dynamic deferred)
- Custom search collator for global search (rely on default catalog indexing)

## Decisions

### Decision 1: NFS-only plugin, no legacy entry point

This is a new plugin with no existing consumers. The default export from `src/index.ts` is `createFrontendPlugin`. No `src/alpha.tsx`, no `createPlugin` from `@backstage/core-plugin-api`.

### Decision 2: Standalone browse page + entity extensions

Two surface types:

- `PageBlueprint` at `/ai-catalog` for the card grid browse view. The existing catalog table at `/catalog` does not support card layout, category grouping, or inline adoption actions — a dedicated page is needed.
- `EntityCardBlueprint` and `EntityContentBlueprint` on existing catalog entity pages for AI-specific cards and tabs. No custom detail page.

### Decision 3: catalogApiRef for data, BoostApiClient for download proxy only

The browse page queries AI assets through the standard `catalogApiRef` — no custom boost backend routes for browsing. The only custom backend interaction is the download proxy route for git-hosted asset ZIP downloads.

### Decision 4: Single isAiAsset filter, components handle kind differences

One `isAiAsset(entity)` condition filter for all entity page Blueprints. The filter checks entity kind and `spec.type` against the AI asset entity model (see below). Individual components handle kind-specific rendering differences internally — e.g., the download card checks `spec.location.type` and renders nothing when absent.

### Decision 5: Client-side pagination

`catalogApi.getEntities()` returns the full matching dataset. Client-side pagination is sufficient for the Dev Preview target of ~500 assets. If catalogs grow beyond this, the hook internals can switch to `queryEntities` (cursor-based) without changing components.

### Decision 6: BUI for UI components, PatternFly chatbot for future chat

BUI (`@backstage/ui`) is the component library for all new UI. MUI v5 as fallback where BUI lacks coverage. PatternFly AI chatbot (`@patternfly/chatbot`) is reserved for the future chat domain to maintain consistency with Lightspeed.

### Decision 7: RBAC graceful degradation

Permission checks for `ai-catalog.asset.read.usage-docs` default to allow when the permission is not yet registered (RHDHPLAN-1508 not built). Content is shown, and enforcement activates automatically when RBAC lands.

## Entity Model

Backstage v1.51.0 introduced `AiResource` kind and `API` with `spec.type: mcp-server` via `@backstage/plugin-catalog-backend-module-ai-model`. Boost uses upstream kinds where available:

| Category      | Entity Kind | spec.type    | Notes                                                |
| ------------- | ----------- | ------------ | ---------------------------------------------------- |
| Skills        | AiResource  | skill        | Upstream. disciplines, categories, agents, dependsOn |
| Rules         | AiResource  | rule         | Upstream. category (required), rationale (required)  |
| MCP Servers   | API         | mcp-server   | Upstream. spec.remotes list                          |
| Agents        | Component   | ai-agent     | Boost-defined                                        |
| Models        | Resource    | ai-model     | Boost-defined. RFC #33060 pending                    |
| Tools         | Resource    | ai-tool      | Boost-defined (Kagenti)                              |
| Vector Stores | Resource    | vector-store | Boost-defined                                        |

## Components

### AiCatalogPage

Browse page with card grid, search, and filters. PluginHeader provided by the framework.

- Card grid grouped by category with responsive layout
- Debounced keyword search (300ms)
- Filter controls: category, lifecycle, tags, owner, source connector (AND logic)
- Filter/search state in URL query params
- Pagination, sort (name, last updated)
- Loading skeletons, empty state with clear-filters, error state with retry

### AiAssetCard

Card displaying key metadata for one AI asset. Used in the browse grid.

- Name, truncated description, category icon/badge, lifecycle badge
- Tags, owner, version, source connector indicator
- Click navigates to catalog entity detail page

### AiAssetSummaryCard

EntityCardBlueprint on entity overview. Shows AI-specific metadata.

- Category badge, current/recommended version, source attribution, lifecycle

### DownloadAdoptCard

EntityCardBlueprint on entity overview. Conditional on spec.location.type.

- git: Download button triggers ZIP download via backend proxy
- oci: docker/podman toggle with copyable pull command
- Absent: card not rendered

### VersionListCard

EntityCardBlueprint on entity overview. Shows all versions of the asset.

- Current/recommended highlighted
- Click navigates to that version's entity page

### UsageTab

EntityContentBlueprint tab. RBAC-gated usage documentation.

- With usage-docs permission: TechDocs content or external links
- Without permission: "Contact owner for access" affordance

## Design Reference

UX prototype: https://agentic-524bde.pages.redhat.com/skill-marketplace/overview (VPN required)

## Acceptance Criteria

### AiCatalogPage

- Developer sees card grid grouped by category at /ai-catalog
- Search filters cards within 300ms
- Multiple filters narrow results with AND logic
- Filter state in URL survives refresh and is shareable
- Empty state when no match; error state when catalog unreachable
- Keyboard navigable through all interactive elements

### AiAssetCard

- Card displays all metadata fields from entity
- Click navigates to catalog entity detail page

### AiAssetSummaryCard

- Renders on AI asset entity pages only
- Shows category, version, source, lifecycle

### DownloadAdoptCard

- Download button on git assets triggers ZIP download
- Docker/podman toggle on OCI assets with copyable pull command
- Not rendered when spec.location.type absent

### VersionListCard

- Shows all versions; current highlighted
- Click navigates to version's entity page

### UsageTab

- Renders TechDocs when annotation present; external links as fallback
- Shows "Contact owner" when user lacks usage-docs permission
- Tab only appears on AI asset entities
