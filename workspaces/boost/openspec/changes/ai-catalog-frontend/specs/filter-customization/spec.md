# Filter Customization

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

The AI Catalog browse page filter sidebar becomes extensible via the Backstage New Frontend System (NFS). Deployers can enable/disable built-in filters and third-party plugins can contribute new filters — all without modifying boost source code.

## Requirements

### Requirement: AiCatalogFilterBlueprint

A custom Blueprint defines the contract for browse page filters.

#### Scenario: Filter extension provides required params

- **GIVEN** a filter extension created via `AiCatalogFilterBlueprint.make`
- **THEN** it provides a `urlParam` (string) for URL state persistence
- **AND** it provides a `filterFn(entity, selectedValues) => boolean` for client-side filtering
- **AND** it provides a `loader` returning a React component for the sidebar UI
- **AND** optionally provides a `priority` (number) controlling render order in the sidebar

#### Scenario: Filter extension receives standardized props

- **WHEN** the filter sidebar renders a filter extension
- **THEN** the extension component receives `entities` (all unfiltered AI assets for option derivation)
- **AND** receives `selectedValues` (current selections from URL state)
- **AND** receives `onChange(values: string[])` callback to update the filter

### Requirement: Built-in Filters as Extensions

Existing hardcoded filters are converted to default Blueprint extensions.

#### Scenario: Default filter set matches current behavior

- **WHEN** no app-config overrides are present
- **THEN** the browse page renders the same four filters as before: category (type), provider, owner, tags
- **AND** filter behavior (AND logic, URL params, dynamic options) is unchanged

#### Scenario: Lifecycle filter added as built-in

- **WHEN** no app-config overrides are present
- **THEN** a lifecycle filter (`spec.lifecycle`) is available in the sidebar
- **AND** options are dynamically derived from loaded entities (e.g., production, experimental, deprecated)
- **AND** the URL param is `lifecycle`

### Requirement: Disable Filters via app-config

Deployers can disable any built-in filter.

#### Scenario: Disable a single filter

- **GIVEN** the deployer sets `ai-catalog-filter:boost/owner: false` in `app.extensions`
- **WHEN** the developer navigates to `/ai-catalog`
- **THEN** the owner filter is not rendered in the sidebar
- **AND** the `owner` URL param has no effect on filtering
- **AND** the remaining filters (category, provider, tags, lifecycle) work normally

#### Scenario: Disable multiple filters

- **GIVEN** the deployer disables both `ai-catalog-filter:boost/tags` and `ai-catalog-filter:boost/lifecycle`
- **WHEN** the developer navigates to `/ai-catalog`
- **THEN** neither filter appears in the sidebar
- **AND** the category, provider, and owner filters render normally

#### Scenario: Disable all filters

- **GIVEN** the deployer disables all filter extensions
- **WHEN** the developer navigates to `/ai-catalog`
- **THEN** the filter sidebar is not rendered
- **AND** the search bar still works
- **AND** the card grid shows all AI assets

### Requirement: Configure Filters via app-config

Deployers can configure built-in filter behavior.

#### Scenario: Collapse a filter by default

- **GIVEN** the deployer sets `ai-catalog-filter:boost/tags` with `config.collapsed: true`
- **WHEN** the developer navigates to `/ai-catalog`
- **THEN** the tags filter section is rendered in collapsed state
- **AND** clicking it expands to show the filter options

#### Scenario: Reorder filters via priority

- **GIVEN** the deployer configures `ai-catalog-filter:boost/owner` with a lower priority number than `ai-catalog-filter:boost/category`
- **WHEN** the developer navigates to `/ai-catalog`
- **THEN** the owner filter renders above the category filter in the sidebar

### Requirement: Add Custom Filters via NFS Module

Third-party plugins can contribute new filters.

#### Scenario: Third-party filter appears in sidebar

- **GIVEN** a third-party plugin registers a filter via `createFrontendModule({ pluginId: 'boost' })` using `AiCatalogFilterBlueprint.make`
- **AND** the filter provides `urlParam: 'team'`, a `filterFn`, and a sidebar component
- **WHEN** the developer navigates to `/ai-catalog`
- **THEN** the custom "team" filter appears in the sidebar alongside built-in filters
- **AND** selecting a value in the custom filter narrows the card grid using the provided `filterFn`
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

#### Scenario: useUrlFilters reads registered filters

- **WHEN** the page initializes
- **THEN** `useUrlFilters` reads URL params for all registered filter extensions (not a hardcoded list)
- **AND** unrecognized URL params from disabled or removed filters are ignored (not cleared)

#### Scenario: applyEntityFilters uses registered filterFns

- **WHEN** the card grid is filtered
- **THEN** `applyEntityFilters` iterates over all registered filter extensions' `filterFn` functions
- **AND** applies them in AND logic
- **AND** does not reference hardcoded filter field names

#### Scenario: Clear filters resets all registered filters

- **WHEN** the developer clicks "Clear filters"
- **THEN** all registered filter URL params are cleared
- **AND** custom filter params are also cleared
- **AND** the full unfiltered card grid is restored

#### Scenario: Active filter detection includes custom filters

- **WHEN** only a custom filter has a selection (no built-in filters active)
- **THEN** the "has active filters" indicator is shown
- **AND** the empty state shows "Clear filters" when results are empty

### Requirement: Page Extension Input

The AI Catalog page declares a filters input for child extensions.

#### Scenario: Page collects filter extensions

- **GIVEN** the `aiCatalogPage` extension is defined with `PageBlueprint.makeWithOverrides`
- **AND** it declares a `filters` input of kind `ai-catalog-filter`
- **WHEN** the page renders
- **THEN** it receives all enabled `ai-catalog-filter` extensions as resolved inputs
- **AND** passes them to the filter sidebar and filter pipeline

#### Scenario: No filters input graceful fallback

- **WHEN** zero filter extensions are registered (all disabled)
- **THEN** the page renders without a filter sidebar
- **AND** search still works
- **AND** the page does not crash
