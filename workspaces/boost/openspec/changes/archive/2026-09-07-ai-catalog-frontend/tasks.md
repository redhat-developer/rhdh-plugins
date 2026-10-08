# Tasks: AI Catalog Frontend

Translations (RHIDP-15479) moved to `ai-catalog-frontend-translations`.
Playwright E2E (RHIDP-15480) moved to `ai-catalog-frontend-e2e`.

## 1. Plugin Scaffold and Dev App (RHIDP-15165)

- [x] 1.1 Scaffold `plugins/boost` via `backstage-cli new` (NFS frontend-plugin template). Do not create plugin files manually — if the CLI fails, report the error.
- [x] 1.2 Configure `createFrontendPlugin` with `PageBlueprint` at `/ai-catalog` as default export
- [x] 1.3 Add `EntityCardBlueprint` stubs (summary, download, version) with `isAiAsset` filter
- [x] 1.4 Add `EntityContentBlueprint` stub (usage tab) with `isAiAsset` filter
- [x] 1.5 Implement `isAiAsset(entity)` condition filter checking kind + `spec.type`
- [x] 1.6 Implement `useAiAssets(filters)` hook wrapping `catalogApiRef`
- [x] 1.7 Create placeholder `AiCatalogPage` component
- [x] 1.8 Scaffold dev app and backend: run `npx @backstage/create-app` in a temp directory, copy `packages/app` and `packages/backend` into the boost workspace, then adapt. Do not create these packages manually — if the CLI fails, report the error.
- [x] 1.9 Adapt dev app to NFS pattern (createApp from frontend-defaults, nav module, sign-in module) and dev backend (app-backend, catalog-backend, auth + guest provider, boost-backend)
- [x] 1.10 Create sample `catalog-info.yaml` fixtures for all AI asset types (AiResource/skill, AiResource/rule, API/mcp-server, Component/ai-agent, Resource/ai-model) with `rhdh.io/ai-asset-*` annotations
- [x] 1.11 Add `app-config.yaml` with catalog fixture locations
- [x] 1.12 Set up i18n scaffold: translation resource file, TranslationBlueprint module
- [x] 1.13 Add first unit test using `TestApiProvider` + `renderInTestApp`
- [x] 1.14 Verify `yarn start` launches dev app with AI Catalog in sidebar
- [x] 1.15 Verify `yarn test` passes

## 2. Browse Page with Search and Filters (RHIDP-15166)

- [x] 2.1 Implement `AiCatalogPage` with responsive card grid layout (BUI Grid.Root/Grid.Item, 1/2/4 columns by breakpoint)
- [x] 2.2 Implement `AiAssetCard` with BUI Card — name, description, category badge, lifecycle, tags, owner, version, source
- [x] 2.3 Type is a badge on each card and a filter
- [x] 2.4 Implement debounced search bar (BUI SearchField, 300ms, filters by name/description/tags)
- [x] 2.5 Implement category (type), provider, owner, and tags filters through the generic multi-select sidebar
- [x] 2.6 Filters combine as AND; URL query param sync for all filter + search state
- [x] 2.7 Add client-side pagination (BUI TablePagination), grid/table toggle, and table sorting by name, type, owner, or provider
- [x] 2.8 Implement loading state (BUI Skeleton cards), empty state ("No AI assets match" + clear-filters), error state (BUI Alert + Retry)
- [x] 2.9 Add error boundary so catalog-unreachable does not crash RHDH shell
- [x] 2.10 Card click navigates to catalog entity detail page (`/catalog/:namespace/:kind/:name`)
- [x] 2.11 i18n: all user-facing strings via translation resources
- [x] 2.12 WCAG 2.1 AA: keyboard nav, screen reader labels, focus management on filter changes
- [x] 2.13 Unit tests for card rendering, filter logic, search, pagination, empty/error states

## 3. Entity Page Extensions and Adoption Actions (RHIDP-15167)

- [x] 3.1 Implement `SummaryCard` on the entity overview (not Catalog About)
- [x] 3.2 Implement `AdoptionCard` — copy or open a URL in the browser (skill command, OCI pull, git archive link, MCP remote). No Boost backend.
- [x] 3.3 Implement `VersionListCard` — show only `rhdh.io/ai-asset-version` when present
- [x] 3.4 Implement `UsageTab` — Boost entity-content tab; contact-owner when permission is denied; when allowed, link to TechDocs if annotated and show `metadata.links`
- [x] 3.5 Wire cards and Usage tab via EntityCardBlueprint/EntityContentBlueprint with `isAiAsset` filter
- [x] 3.6 i18n: all user-facing strings via translation resources
- [x] 3.7 WCAG 2.1 AA for all interactive elements
- [x] 3.8 Unit tests for each card and the Usage tab

## 4. Extensible Browse Filters via NFS (RHIDP-15449)

- [x] 4.1 Define `FilterDefinition` interface in `src/blueprints/AiCatalogFilterBlueprint.ts` — fields: `urlParam` (string), `label` (string fallback), optional `labelKey` (translated heading), `getOptions(entities) => {id, label}[]`, `matchEntity(entity, values) => boolean`, `priority` (number)
- [x] 4.2 Create single `filterDefinitionDataRef` via `createExtensionDataRef<FilterDefinition>` in same file
- [x] 4.3 Create `AiCatalogFilterBlueprint` via `createExtensionBlueprint` — kind `ai-catalog-filter`, attaches to `page:boost/ai-catalog` input `filters`, params are `FilterDefinition` fields, no config schema. Factory outputs the `FilterDefinition` via the single data ref.
- [x] 4.4 Create `src/filters/builtInFilterDefinitions.ts` with 4 plain `FilterDefinition` objects:
  - `categoryFilter` — urlParam `type`, getOptions from `getAllCategories()`, matchEntity checks `spec.type`, priority 100
  - `providerFilter` — urlParam `provider`, getOptions from `rhdh.io/ai-asset-source` annotation, priority 200
  - `ownerFilter` — urlParam `owner`, getOptions from `spec.owner`, priority 300
  - `tagsFilter` — urlParam `tag`, getOptions from `metadata.tags`, priority 400
- [x] 4.5 Register 4 built-in filters as `AiCatalogFilterBlueprint.make(...)` extensions in `plugin.tsx`, add to `createFrontendPlugin({ extensions: [...] })`
- [x] 4.6 Upgrade `aiCatalogPage` to `PageBlueprint.makeWithOverrides` with `name: 'ai-catalog'` — declare `filters` input via `createExtensionInput` accepting `ai-catalog-filter` extensions. Factory resolves `FilterDefinition[]`, sorts by priority, passes to page component as prop.
- [x] 4.7 Refactor `FilterSidebar` — receive `FilterDefinition[]` + URL values. Map over definitions, render `<Select>` for each using `getOptions(allEntities)`. Return `null` when array is empty.
- [x] 4.8 Refactor `useUrlFilters` — accept `urlParam[]` from resolved definitions instead of hardcoded param names. Replace `setCategory`/`setProvider`/`setOwner`/`setTag` with generic `setFilter(urlParam, values)`. Keep `setSearch`, `setViewMode`, `setPage`, `setPageSize` unchanged. `clearFilters` resets registered filter params + search only (preserves view/pageSize).
- [x] 4.9 Refactor `applyEntityFilters` in `entityHelpers.ts` — replace 5 hardcoded `if` blocks with one loop: for each `FilterDefinition` with active values, call `matchEntity(entity, values)`. AND logic. Search filter stays built-in. Remove old `EntityFilters` interface.
- [x] 4.10 Update `AiCatalogPage.tsx` — receive `FilterDefinition[]` from page factory, pass to `FilterSidebar` and `useUrlFilters`. `hasActiveFilters` checks all registered urlParams dynamically.
- [x] 4.11 Export `AiCatalogFilterBlueprint` and `FilterDefinition` from `src/index.ts`
- [x] 4.12 Add dev app example: `packages/app/src/modules/sampleFilter/` — a lifecycle filter via `createFrontendModule({ pluginId: 'boost' })` demonstrating third-party contribution (lifecycle is not built-in, shown as custom filter example)
- [x] 4.13 Add app-config example showing filter disable (`ai-catalog-filter:boost/owner: false`)
- [x] 4.14 Add lifecycle filter label to `ref.ts` translation keys
- [x] 4.15 WCAG 2.1 AA: keyboard navigation through dynamically rendered filters, aria-labels on each `<Select>`
- [x] 4.16 Unit tests: `builtinFilters` (getOptions returns correct options, matchEntity matches correctly), `FilterSidebar` (renders N selects from definitions, returns null when empty), `useUrlFilters` (dynamic param read/write, setFilter, clearFilters preserves view/pageSize), `applyEntityFilters` (AND loop with matchEntity, search + filters combined), priority ordering

## 5. Dynamic Plugin Export and Overlay Registration (RHIDP-15481)

Done in `redhat-developer/rhdh-plugin-export-overlays`. `plugins-list.yaml` lists `plugins/boost` and `plugins/ogx-entity-provider`. Overlay CI runs `rhdh-cli plugin export`. A local `export-dynamic` script and `app-config.dynamic.yaml` in this package are not required. Spec: `ai-catalog-dynamic-plugin`.

- [x] 5.1 Frontend package listed in overlays `workspaces/boost/plugins-list.yaml`
- [x] 5.2 OGX entity provider listed in the same overlays workspace
- [x] 5.3 OCI image published for `red-hat-developer-hub-backstage-plugin-boost`
- [x] 5.4 Overlay CI runs `rhdh-cli plugin export` (no local `export-dynamic` script required)
