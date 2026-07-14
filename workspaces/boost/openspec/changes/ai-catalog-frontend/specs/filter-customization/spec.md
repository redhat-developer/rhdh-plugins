# Filter Customization

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

The AI Catalog browse page filter sidebar becomes extensible via the Backstage New Frontend System (NFS). Deployers can enable/disable built-in filters and third-party plugins can contribute new filters — all without modifying boost source code.

## Design Approach

Filters are **data, not components**. Each filter is a `FilterDefinition` — a plain object with a URL param name, a label, a function to extract options from entities, and a function to match an entity against selected values. The `FilterSidebar` renders a generic `<Select>` for each definition. No per-filter React components, no lazy loading, no custom data refs per field.

The NFS extension system handles enable/disable/add via `app.extensions`. The `AiCatalogFilterBlueprint` wraps a `FilterDefinition` in an extension. A single custom `createExtensionDataRef` carries the whole definition object. No `config` schema — deployers control filter visibility via NFS disable (`ai-catalog-filter:boost/owner: false`) and filter render order via `priority` in params.

## Requirements

### Requirement: FilterDefinition and AiCatalogFilterBlueprint

A `FilterDefinition` interface defines the contract. A Blueprint wraps it as an NFS extension.

#### Scenario: FilterDefinition provides required fields

- **GIVEN** a `FilterDefinition` object
- **THEN** it has `urlParam` (string) for URL state persistence
- **AND** it has `label` (string) for the sidebar heading (i18n key or plain text)
- **AND** it has `getOptions(entities) => { id, label }[]` for deriving select options from loaded entities
- **AND** it has `matchEntity(entity, selectedValues) => boolean` for client-side filtering
- **AND** it has `priority` (number) controlling render order in the sidebar

#### Scenario: Blueprint wraps FilterDefinition as NFS extension

- **GIVEN** a filter created via `AiCatalogFilterBlueprint.make`
- **THEN** it outputs a `FilterDefinition` via a single extension data ref
- **AND** the extension kind is `ai-catalog-filter`
- **AND** the extension attaches to `page:boost/ai-catalog` input `filters`
- **AND** the Blueprint has no `config` schema (no deployer YAML config per filter)

#### Scenario: FilterSidebar renders generic Select for each filter

- **WHEN** the filter sidebar renders
- **THEN** it maps over resolved `FilterDefinition[]` and renders a `<Select>` for each
- **AND** each `<Select>` uses `getOptions(allEntities)` for its options list
- **AND** each `<Select>` binds to URL state via `urlParam`

### Requirement: Built-in Filters as Extensions

Existing hardcoded filters are converted to `FilterDefinition` objects registered as default Blueprint extensions.

#### Scenario: Default filter set matches current behavior

- **WHEN** no app-config overrides are present
- **THEN** the browse page renders the same four filters as before: category (type), provider, owner, tags
- **AND** filter behavior (AND logic, URL params, dynamic options) is unchanged

#### Scenario: Built-in filters are plain objects

- **GIVEN** the 4 built-in filter definitions (category, provider, owner, tags)
- **THEN** each is a plain object in `src/filters/builtinFilters.ts`
- **AND** no filter has its own React component file
- **AND** all share the same generic `<Select>` rendering in `FilterSidebar`

### Requirement: Disable Filters via app-config

Deployers can disable any built-in filter using NFS extension disable.

#### Scenario: Disable a single filter

- **GIVEN** the deployer sets `ai-catalog-filter:boost/owner: false` in `app.extensions`
- **WHEN** the developer navigates to `/ai-catalog`
- **THEN** the owner filter is not rendered in the sidebar
- **AND** the `owner` URL param has no effect on filtering
- **AND** the remaining filters (category, provider, tags) work normally

#### Scenario: Disable multiple filters

- **GIVEN** the deployer disables both `ai-catalog-filter:boost/tags` and `ai-catalog-filter:boost/owner`
- **WHEN** the developer navigates to `/ai-catalog`
- **THEN** neither filter appears in the sidebar
- **AND** the category, provider, and owner filters render normally

#### Scenario: Disable all filters

- **GIVEN** the deployer disables all filter extensions
- **WHEN** the developer navigates to `/ai-catalog`
- **THEN** the filter sidebar is not rendered
- **AND** the search bar still works
- **AND** the card grid shows all AI assets

### Requirement: Add Custom Filters via NFS Module

Third-party plugins can contribute new filters by providing a `FilterDefinition`.

#### Scenario: Third-party filter appears in sidebar

- **GIVEN** a third-party plugin registers a filter via `createFrontendModule({ pluginId: 'boost' })` using `AiCatalogFilterBlueprint.make`
- **AND** the filter provides a `FilterDefinition` with `urlParam: 'team'`, `getOptions`, and `matchEntity`
- **WHEN** the developer navigates to `/ai-catalog`
- **THEN** the custom "team" filter appears as a `<Select>` in the sidebar alongside built-in filters
- **AND** selecting a value narrows the card grid using the provided `matchEntity`
- **AND** the `team` URL param persists the selection

#### Scenario: Custom filter participates in AND logic

- **GIVEN** a custom filter is active with a selected value
- **AND** the built-in category filter also has a selected value
- **WHEN** the card grid is filtered
- **THEN** only entities matching both the custom filter AND the category filter are shown

#### Scenario: Custom filter state in URL

- **GIVEN** a custom filter has a selection
- **WHEN** the URL is copied and opened in a new tab
- **THEN** the custom filter selection is restored from the URL
- **AND** the card grid shows the same filtered results

#### Scenario: Custom filter disabled by deployer

- **GIVEN** a third-party plugin registers `ai-catalog-filter:my-plugin/team-filter`
- **AND** the deployer sets `ai-catalog-filter:my-plugin/team-filter: false` in `app.extensions`
- **WHEN** the developer navigates to `/ai-catalog`
- **THEN** the custom team filter is not rendered

### Requirement: Dynamic Filter Architecture

The filter pipeline adapts to the registered filter set.

#### Scenario: useUrlFilters reads registered filters dynamically

- **GIVEN** the page receives a resolved `FilterDefinition[]`
- **WHEN** the page initializes
- **THEN** `useUrlFilters` reads URL params for each definition's `urlParam` (not a hardcoded list)
- **AND** unrecognized URL params from disabled or removed filters are ignored (not cleared)

#### Scenario: applyEntityFilters uses registered matchEntity functions

- **WHEN** the card grid is filtered
- **THEN** `applyEntityFilters` iterates over all active `FilterDefinition` entries
- **AND** for each with selected values, calls `matchEntity(entity, values)`
- **AND** applies all in AND logic
- **AND** does not reference hardcoded filter field names

#### Scenario: Clear filters resets registered filters and search only

- **WHEN** the developer clicks "Clear filters"
- **THEN** all registered filter URL params are cleared
- **AND** the search param (`q`) is cleared
- **AND** view mode (`view`) and page size (`pageSize`) are preserved
- **AND** the full unfiltered card grid is restored

#### Scenario: Active filter detection includes custom filters

- **WHEN** only a custom filter has a selection (no built-in filters active)
- **THEN** the "has active filters" indicator is shown
- **AND** the empty state shows "Clear filters" when results are empty

### Requirement: Page Extension Input

The AI Catalog page declares a filters input for child extensions.

#### Scenario: Page collects filter extensions

- **GIVEN** the `aiCatalogPage` extension is defined with `PageBlueprint.makeWithOverrides` and `name: 'ai-catalog'`
- **AND** it declares a `filters` input of kind `ai-catalog-filter`
- **WHEN** the page renders
- **THEN** it receives all enabled `ai-catalog-filter` extensions as resolved `FilterDefinition[]`
- **AND** sorts them by priority
- **AND** passes the sorted array to the filter sidebar and filter pipeline

#### Scenario: No filters input graceful fallback

- **WHEN** zero filter extensions are registered (all disabled)
- **THEN** the page renders without a filter sidebar
- **AND** search still works
- **AND** the page does not crash
