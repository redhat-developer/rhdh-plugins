# Design: AI Catalog Frontend

## Context

The AI Catalog is the first Boost frontend. It is an NFS plugin that browses
Catalog entities and adds a few cards and one tab on existing entity pages.

## Goals

- NFS-only frontend plugin using Backstage Blueprints
- Browse page for marketplace-style AI asset discovery
- Entity page extensions for asset details and adoption actions
- Dev app shell for local development
- BUI component library for new UI components

## Non-Goals

- Chat UI, admin panels, or agent gallery (future domains)
- Custom entity detail pages (use existing catalog pages)
- Custom search collator for global search (rely on default catalog indexing)
- A Boost backend plugin or any `/api/boost` client for this catalog

## Decisions

### Decision 1: NFS-only plugin, no legacy entry point

The default export from `src/index.ts` is `createFrontendPlugin`. No
`src/alpha.tsx`, no `createPlugin` from `@backstage/core-plugin-api`.

### Decision 2: Standalone browse page + entity extensions

- `PageBlueprint` at `/ai-catalog` for a card/table browse view. Catalog `/catalog`
  is a generic table; this page is for discovery with Type badges and filters.
- `EntityCardBlueprint` and `EntityContentBlueprint` on existing catalog entity
  pages. No custom detail page. Catalog About, Relations, and TechDocs stay the
  standard Catalog composition.

### Decision 3: catalogApiRef only

Browse and entity cards read Catalog entities through `catalogApiRef`. There is
no Boost API client, no download proxy, and no Boost backend plugin in this
change.

### Decision 4: Single isAiAsset filter, components handle kind differences

One `isAiAsset(entity)` condition filter for all entity page Blueprints. The
filter checks entity kind and `spec.type`. Components handle kind-specific
rendering.

### Decision 5: Client-side pagination

`catalogApi.getEntities()` returns the matching dataset. Client-side pagination
is sufficient for the Dev Preview target of ~500 assets.

### Decision 6: BUI for UI components

BUI (`@backstage/ui`) is the component library for this plugin.

### Decision 7: Usage tab is not TechDocs

`entity-content:boost/usage` is a Boost tab on AI asset pages. It is permission
gated. When allowed, it may **link** to TechDocs if `backstage.io/techdocs-ref`
is present, and it may show `metadata.links`. The Catalog TechDocs tab is
separate and is not this extension.

### Decision 8: Extensible browse filters via data-driven FilterDefinition

The browse page filter sidebar is NFS-extensible using a data-driven approach.
Filters are plain objects (`FilterDefinition`), not per-filter React components.
`FilterSidebar` renders a generic `<Select>` for each registered filter.

**Architecture:**

- A `FilterDefinition` interface defines each filter: `urlParam`, `label`, `getOptions(entities)`, `matchEntity(entity, values)`, `priority`
- `AiCatalogFilterBlueprint` wraps a `FilterDefinition` as an NFS extension (kind: `ai-catalog-filter`) with a single custom `createExtensionDataRef`
- Built-in filters are plain objects in `src/filters/builtInFilterDefinitions.ts`, registered as Blueprint extensions in `plugin.tsx`: type, provider, owner, tags
- The `aiCatalogPage` PageBlueprint uses `makeWithOverrides` to declare a `filters` input, resolves `FilterDefinition[]`, sorts by priority, and passes to the page component
- `FilterSidebar` maps over the array and renders `<Select>` for each — no per-filter component files
- `useUrlFilters` reads/writes URL params dynamically from the definition array
- `applyEntityFilters` loops over active definitions calling `matchEntity` in AND logic

**Deployer customization (app-config.yaml):**

```yaml
app:
  extensions:
    # Disable a built-in filter
    - ai-catalog-filter:boost/owner: false
    # Custom filter from a third-party module (just enable it)
    - ai-catalog-filter:my-plugin/team-filter: {}
```

**Third-party filter contribution:**

```typescript
createFrontendModule({
  pluginId: 'boost',
  extensions: [
    AiCatalogFilterBlueprint.make({
      name: 'team-filter',
      params: {
        urlParam: 'team',
        label: 'Team',
        getOptions: entities =>
          [...new Set(entities.map(e => e.spec?.team).filter(Boolean))]
            .sort()
            .map(t => ({ id: t, label: t })),
        matchEntity: (entity, values) =>
          values.some(v => v === entity.spec?.team),
        priority: 200,
      },
    }),
  ],
});
```

## Entity Model

`isAiAsset` on this plugin matches:

| Category      | Entity Kind      | spec.type       |
| ------------- | ---------------- | --------------- |
| Skills        | AiResource       | skill           |
| Rules         | AiResource       | rule            |
| Agents        | AiResource       | agent           |
| Model Servers | AiModelServerAPI | ai-model-server |
| MCP Servers   | API              | mcp-server      |
| Tools         | Resource         | ai-tool         |
| Vector Stores | Resource         | vector-store    |

## Components

### AiCatalogPage

Browse page at `/ai-catalog`. Card grid or table.

- Debounced keyword search (300ms)
- NFS filters: type, provider, owner, tags (AND logic)
- Filter/search state in URL query params
- Pagination, sort, loading / empty / error states

### AiAssetCard

Browse-grid card for one Catalog entity. This is not the Catalog About card.

- Type badge, name, description, tags, owner, provider
- Click navigates to the catalog entity detail page

### SummaryCard

`EntityCardBlueprint` on the entity overview. Extra AI fields (description,
rationale, available models, and agent operating fields when present). Catalog
About remains the standard About card.

### AdoptionCard

`EntityCardBlueprint` on the entity overview. Copy or open a URL in the
browser (skill command, OCI pull, git archive link, MCP remote). No backend.

### VersionListCard

`EntityCardBlueprint` on the entity overview. Shows only
`rhdh.io/ai-asset-version` when that annotation is present.

### UsageTab

`EntityContentBlueprint` named `usage`. Boost tab, not the Catalog TechDocs tab.

- Denied: contact-owner affordance
- Allowed: optional link to TechDocs plus entity `metadata.links`

## Design Reference

UX prototype: https://agentic-524bde.pages.redhat.com/skill-marketplace/overview (VPN required)

## Acceptance Criteria

### AiCatalogPage

- Card or table list of AI assets at `/ai-catalog`
- Search filters within 300ms
- Type / provider / owner / tag filters combine with AND logic
- Filter state in URL survives refresh
- Empty state when no match; error state when catalog unreachable

### AiAssetCard

- Browse card shows Type, name, description, tags, owner, and provider
- Click opens the catalog entity page (About / TechDocs / relations stay Catalog)

### SummaryCard

- Renders on AI asset entity pages only

### AdoptionCard

- Copy or open actions in the browser
- Hidden when there is no action

### VersionListCard

- Shows the current annotated version only

### UsageTab

- Boost Usage tab on AI assets only
- May link to TechDocs; does not replace the Catalog TechDocs tab
