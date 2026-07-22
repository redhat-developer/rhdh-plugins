# Tasks: AI Catalog Frontend

## 1. Plugin Scaffold and Dev App (RHIDP-15165)

- [ ] 1.1 Scaffold `plugins/boost` via `backstage-cli new` (NFS frontend-plugin template). Do not create plugin files manually — if the CLI fails, report the error.
- [ ] 1.2 Configure `createFrontendPlugin` with `PageBlueprint` at `/ai-catalog` as default export
- [ ] 1.3 Add `EntityCardBlueprint` stubs (summary, download, version) with `isAiAsset` filter
- [ ] 1.4 Add `EntityContentBlueprint` stub (usage tab) with `isAiAsset` filter
- [ ] 1.5 Implement `isAiAsset(entity)` condition filter checking kind + `spec.type`
- [ ] 1.6 Implement `useAiAssets(filters)` hook wrapping `catalogApiRef`
- [ ] 1.7 Create placeholder `AiCatalogPage` component
- [ ] 1.8 Scaffold dev app and backend: run `npx @backstage/create-app` in a temp directory, copy `packages/app` and `packages/backend` into the boost workspace, then adapt. Do not create these packages manually — if the CLI fails, report the error.
- [ ] 1.9 Adapt dev app to NFS pattern (createApp from frontend-defaults, nav module, sign-in module) and dev backend (app-backend, catalog-backend, auth + guest provider, boost-backend)
- [ ] 1.10 Create sample `catalog-info.yaml` fixtures for all AI asset types (AiResource/skill, AiResource/rule, API/mcp-server, Component/ai-agent, Resource/ai-model) with `rhdh.io/ai-asset-*` annotations
- [ ] 1.11 Add `app-config.yaml` with catalog fixture locations
- [ ] 1.12 Set up i18n scaffold: translation resource file, TranslationBlueprint module
- [ ] 1.13 Add first unit test using `TestApiProvider` + `renderInTestApp`
- [ ] 1.14 Verify `yarn start` launches dev app with AI Catalog in sidebar
- [ ] 1.15 Verify `yarn test` passes

## 2. Browse Page with Search and Filters (RHIDP-15166)

- [ ] 2.1 Implement `AiCatalogPage` with responsive card grid layout (BUI Grid.Root/Grid.Item, 3 columns desktop, 1 mobile)
- [ ] 2.2 Implement `AiAssetCard` with BUI Card — name, description, category badge, lifecycle, tags, owner, version, source
- [ ] 2.3 Add category grouping (tabs or section headers for each asset category)
- [ ] 2.4 Implement debounced search bar (BUI SearchField, 300ms, filters by name/description/tags)
- [ ] 2.5 Implement filter controls — category (CheckboxGroup), lifecycle (CheckboxGroup), tags (Select multi), owner (SearchAutocomplete), source (CheckboxGroup)
- [ ] 2.6 Filters combine as AND; URL query param sync for all filter + search state
- [ ] 2.7 Add client-side pagination (BUI TablePagination) and sort control (name, last updated)
- [ ] 2.8 Implement loading state (BUI Skeleton cards), empty state ("No AI assets match" + clear-filters), error state (BUI Alert + Retry)
- [ ] 2.9 Add error boundary so catalog-unreachable does not crash RHDH shell
- [ ] 2.10 Card click navigates to catalog entity detail page (`/catalog/:namespace/:kind/:name`)
- [ ] 2.11 i18n: all user-facing strings via translation resources
- [ ] 2.12 WCAG 2.1 AA: keyboard nav, screen reader labels, focus management on filter changes
- [ ] 2.13 Unit tests for card rendering, filter logic, search, pagination, empty/error states

## 3. Entity Page Extensions and Adoption Actions (RHIDP-15167)

- [ ] 3.1 Implement `AiAssetSummaryCard` — category badge, version, source, lifecycle
- [ ] 3.2 Implement `DownloadAdoptCard` — conditional on `spec.location.type`:
  - git: Download button, calls backend proxy, loading spinner, error toast
  - oci: BUI Tabs for docker/podman toggle, pull command from `spec.location.target`, Copy button
  - absent: card not rendered
- [ ] 3.3 Implement `VersionListCard` — list all versions, highlight current/recommended, click navigates
- [ ] 3.4 Implement `UsageTab` — TechDocs when `backstage.io/techdocs-ref` present, external links fallback, "Contact owner" when permission missing (defaults to allow until RHDHPLAN-1508 lands)
- [ ] 3.5 Wire all cards and tab into plugin via EntityCardBlueprint/EntityContentBlueprint with `isAiAsset` filter
- [ ] 3.6 Add backend download proxy route in `boost-backend`: `GET /api/boost/catalog/download` — accepts entity ref, resolves `spec.location.target`, authenticates to GitHub via `@backstage/integration`, streams ZIP
- [ ] 3.7 Permission check on download proxy (catalog entity read permission, AI Catalog permissions when available)
- [ ] 3.8 i18n: all user-facing strings via translation resources
- [ ] 3.9 WCAG 2.1 AA for all interactive elements
- [ ] 3.10 Unit tests for each card/tab, RBAC-gated rendering, download/copy behavior

## 4. Extensible Browse Filters via NFS (RHIDP-15449)

- [ ] 4.1 Define `FilterDefinition` interface in `src/blueprints/AiCatalogFilterBlueprint.ts` — fields: `urlParam` (string), `label` (string), `getOptions(entities) => {id, label}[]`, `matchEntity(entity, values) => boolean`, `priority` (number)
- [ ] 4.2 Create single `filterDefinitionDataRef` via `createExtensionDataRef<FilterDefinition>` in same file
- [ ] 4.3 Create `AiCatalogFilterBlueprint` via `createExtensionBlueprint` — kind `ai-catalog-filter`, attaches to `page:boost/ai-catalog` input `filters`, params are `FilterDefinition` fields, no config schema. Factory outputs the `FilterDefinition` via the single data ref.
- [ ] 4.4 Create `src/filters/builtInFilterDefinitions.ts` with 4 plain `FilterDefinition` objects:
  - `categoryFilter` — urlParam `type`, getOptions from `getAllCategories()`, matchEntity checks `spec.type`, priority 100
  - `providerFilter` — urlParam `provider`, getOptions from `rhdh.io/ai-asset-source` annotation, priority 200
  - `ownerFilter` — urlParam `owner`, getOptions from `spec.owner`, priority 300
  - `tagsFilter` — urlParam `tag`, getOptions from `metadata.tags`, priority 400
- [ ] 4.5 Register 4 built-in filters as `AiCatalogFilterBlueprint.make(...)` extensions in `plugin.tsx`, add to `createFrontendPlugin({ extensions: [...] })`
- [ ] 4.6 Upgrade `aiCatalogPage` to `PageBlueprint.makeWithOverrides` with `name: 'ai-catalog'` — declare `filters` input via `createExtensionInput` accepting `ai-catalog-filter` extensions. Factory resolves `FilterDefinition[]`, sorts by priority, passes to page component as prop.
- [ ] 4.7 Refactor `FilterSidebar` — receive `FilterDefinition[]` + URL values. Map over definitions, render `<Select>` for each using `getOptions(allEntities)`. Return `null` when array is empty.
- [ ] 4.8 Refactor `useUrlFilters` — accept `urlParam[]` from resolved definitions instead of hardcoded param names. Replace `setCategory`/`setProvider`/`setOwner`/`setTag` with generic `setFilter(urlParam, values)`. Keep `setSearch`, `setViewMode`, `setPage`, `setPageSize` unchanged. `clearFilters` resets registered filter params + search only (preserves view/pageSize).
- [ ] 4.9 Refactor `applyEntityFilters` in `entityHelpers.ts` — replace 5 hardcoded `if` blocks with one loop: for each `FilterDefinition` with active values, call `matchEntity(entity, values)`. AND logic. Search filter stays built-in. Remove old `EntityFilters` interface.
- [ ] 4.10 Update `AiCatalogPage.tsx` — receive `FilterDefinition[]` from page factory, pass to `FilterSidebar` and `useUrlFilters`. `hasActiveFilters` checks all registered urlParams dynamically.
- [ ] 4.11 Export `AiCatalogFilterBlueprint` and `FilterDefinition` from `src/index.ts`
- [ ] 4.12 Add dev app example: `packages/app/src/modules/sampleFilter/` — a lifecycle filter via `createFrontendModule({ pluginId: 'boost' })` demonstrating third-party contribution (lifecycle is not built-in, shown as custom filter example)
- [ ] 4.13 Add app-config example showing filter disable (`ai-catalog-filter:boost/owner: false`)
- [ ] 4.14 Add lifecycle filter label to `ref.ts` translation keys
- [ ] 4.15 WCAG 2.1 AA: keyboard navigation through dynamically rendered filters, aria-labels on each `<Select>`
- [ ] 4.16 Unit tests: `builtinFilters` (getOptions returns correct options, matchEntity matches correctly), `FilterSidebar` (renders N selects from definitions, returns null when empty), `useUrlFilters` (dynamic param read/write, setFilter, clearFilters preserves view/pageSize), `applyEntityFilters` (AND loop with matchEntity, search + filters combined), priority ordering

## 5. Add Translations for Supported Languages (RHIDP-15479)

- [ ] 5.1 Create `src/translations/de.ts` — German translations using `createTranslationMessages` referencing `boostTranslationRef`, flattened dot-notation keys
- [ ] 5.2 Create `src/translations/es.ts` — Spanish translations
- [ ] 5.3 Create `src/translations/fr.ts` — French translations
- [ ] 5.4 Create `src/translations/it.ts` — Italian translations
- [ ] 5.5 Create `src/translations/ja.ts` — Japanese translations
- [ ] 5.6 Update `src/translations/index.ts` — register all 5 locales in `createTranslationResource` with lazy imports (`de: () => import('./de')`, etc.)
- [ ] 5.7 Audit all user-facing strings in browse page, filter sidebar, entity cards, entity tabs, empty/error/loading states — ensure every string uses `useTranslationRef` with a key in `ref.ts`
- [ ] 5.8 Add missing keys to `ref.ts` if any strings are found not externalized
- [ ] 5.9 Ensure interpolation placeholders (e.g., `{{count}}`) are preserved in all locale files
- [ ] 5.10 Add separate entry point for translation module auto-discovery — re-export `boostTranslationsModule` as default from a dedicated file, add entry to `package.json` `exports`
- [ ] 5.11 Verify locale switching in dev app — switch locale via Settings, confirm all AI Catalog strings update without page reload
- [ ] 5.12 Verify English fallback — if a key is missing from a locale file, English is shown (not a raw key or empty string)

## 6. E2E Tests with Playwright (RHIDP-15480)

- [ ] 6.1 Install `@playwright/test` and `@backstage/e2e-test-utils` as devDependencies
- [ ] 6.2 Create `playwright.config.ts` at workspace root — `webServer` starts `yarn start`, `testDir: 'e2e-tests'`, NFS-only (no `APP_MODE`)
- [ ] 6.3 Add Playwright projects for at least `en` and one non-English locale (e.g., `ja`) with separate ports
- [ ] 6.4 Create `e2e-tests/test_yamls/` with per-locale `app-config-e2e-*.yaml` overrides (baseUrl, backend port, CORS)
- [ ] 6.5 Add `package.json` scripts: `test:e2e` → `playwright test`, `playwright` → forwarding script
- [ ] 6.6 Create `e2e-tests/utils/translations.ts` — `getTranslations(locale)` helper loading messages from plugin translation modules
- [ ] 6.7 Create `e2e-tests/utils/accessibility.ts` — axe-core audit helper with WCAG 2.1 AA tags, attaches results to `TestInfo`
- [ ] 6.8 Test: browse page renders card grid with fixture data — verify cards visible using translation keys
- [ ] 6.9 Test: search filters cards by keyword — type in search, verify URL updates, cards filtered
- [ ] 6.10 Test: sidebar filter narrows results — select category, verify only matching cards shown
- [ ] 6.11 Test: multiple filters combine as AND — select category + tag, verify intersection
- [ ] 6.12 Test: clear filters resets view — click clear, verify URL params removed, full grid restored
- [ ] 6.13 Test: card click navigates to entity detail — click card, verify URL changes to catalog entity page
- [ ] 6.14 Test: empty state when no matches — apply impossible filter combination, verify empty state message
- [ ] 6.15 Test: pagination controls — navigate pages, verify card grid updates
- [ ] 6.16 Test: sort control — change sort order, verify card reordering
- [ ] 6.17 Accessibility: axe-core audit on browse page (unfiltered)
- [ ] 6.18 Accessibility: axe-core audit on browse page (with active filters)
- [ ] 6.19 Verify same tests pass for non-English locale project

## 7. Dynamic Plugin Export and Overlay Registration (RHIDP-15481)

- [ ] 7.1 Add `"export-dynamic": "rhdh-cli plugin export"` script to `plugins/boost/package.json`
- [ ] 7.2 Add `"dist-dynamic/*.*"` and `"dist-dynamic/dist/**"` to `files` array in `plugins/boost/package.json`
- [ ] 7.3 Run `yarn export-dynamic` and verify `dist-dynamic/` is produced without errors
- [ ] 7.4 Create `plugins/boost/app-config.dynamic.yaml` with default `app.extensions` config:
  - `page:boost/ai-catalog` at `/ai-catalog`
  - `entity-card:boost/summary`, `entity-card:boost/adoption`, `entity-card:boost/version-list` with AI asset filter
  - `entity-content:boost/usage` tab with title and group
- [ ] 7.5 Add boost frontend plugin entry to `redhat-developer/rhdh-plugin-export-overlays` — PR with overlay config for OCI image build
- [ ] 7.6 Update workspace `dynamic-plugins-image-reference.yaml` with the published OCI image ref for the frontend plugin
- [ ] 7.7 Verify plugin loads in RHDH with `ENABLE_STANDARD_MODULE_FEDERATION=true` — AI Catalog nav item appears, browse page renders
- [ ] 7.8 Verify entity page extensions mount on AI asset entities and are absent on non-AI entities
- [ ] 7.9 Verify adopter overrides via `app.extensions` — disable a card, rename a tab, change entity filter
- [ ] 7.10 Verify `page:boost/ai-catalog: false` removes the nav item and page
