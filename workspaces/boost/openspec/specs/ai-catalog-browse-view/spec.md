# ai-catalog-browse-view Specification

## Purpose

TBD - created by archiving change ai-catalog-frontend. Update Purpose after archive.

## Requirements

### Requirement: Card Grid Display

AI assets MUST render as a card or table list.

#### Scenario: Browse page loads with assets

- **WHEN** the developer navigates to `/ai-catalog`
- **THEN** the page displays a card grid (or table) of AI asset entities from the catalog
- **AND** each card shows Type, name, description, tags, owner, and provider

#### Scenario: Card navigation to entity detail

- **WHEN** the developer clicks an asset card
- **THEN** the browser navigates to the catalog entity detail page for that entity (e.g., `/catalog/default/airesource/my-skill`)
- **AND** the browse page state is preserved for back navigation

#### Scenario: Responsive layout

- **WHEN** the viewport is desktop width
- **THEN** the card grid renders 3 columns
- **WHEN** the viewport is mobile width
- **THEN** the card grid renders 1 column

### Requirement: Keyword Search

The search bar MUST filter visible cards by keyword.

#### Scenario: Search filters cards

- **WHEN** the developer types a keyword in the search bar
- **THEN** cards are filtered within 300ms (debounced)
- **AND** matching is against entity name, description, and tags

#### Scenario: Search state in URL

- **WHEN** the developer types a search term
- **THEN** the search term is reflected in the URL query params (`?q=...`)
- **AND** loading the URL directly reproduces the same filtered view

### Requirement: Multi-Faceted Filters

Filter controls MUST narrow the card grid by entity metadata.

#### Scenario: Filters combine as AND

- **WHEN** the developer selects type "skill" AND a tag
- **THEN** only cards matching both criteria are shown

#### Scenario: Filter state in URL

- **WHEN** filters are active
- **THEN** filter state is persisted in URL query params
- **AND** the URL is shareable and survives page refresh
- **AND** back/forward browser navigation updates filters correctly

#### Scenario: Clear filters

- **WHEN** the developer clears all filters
- **THEN** the URL resets to the base path
- **AND** the full unfiltered card grid is restored

### Requirement: Loading, Empty, and Error States

The page MUST provide loading, empty, and recoverable error states.

#### Scenario: Loading state

- **WHEN** the catalog API request is in progress
- **THEN** skeleton cards are shown as loading placeholders

#### Scenario: Empty state

- **WHEN** no assets match the current filters
- **THEN** the page shows "No AI assets match your filters" with a clear-filters action

#### Scenario: Error state

- **WHEN** the catalog API is unreachable
- **THEN** the page shows an error message with a Retry button
- **AND** the error does not crash the RHDH shell (error boundary)
