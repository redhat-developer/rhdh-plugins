# AI Catalog E2E

> **Status: Remaining — current RHDH 2.1 frontend work.**
>
> **Scope:** Playwright coverage for `plugins/boost` and its NFS development
> app. This does not add product behavior or backend integration.

The workspace MUST provide Playwright coverage for the AI Catalog browse page.

## ADDED Requirements

### Requirement: Playwright Infrastructure

The workspace MUST provide an isolated Playwright runner for the NFS development app.

#### Scenario: Release suite runs

- **WHEN** a developer runs `yarn test:e2e` in the Boost workspace
- **THEN** Playwright starts the NFS dev app, runs `e2e-tests/`, and writes an HTML report

### Requirement: Browse Page Tests

The suite MUST cover the browse page.

#### Scenario: Card grid renders with fixture data

- **WHEN** the e2e test navigates to `/ai-catalog`
- **THEN** AI asset cards are visible on the page

#### Scenario: Search filters cards

- **WHEN** the test types a keyword in the search bar
- **THEN** the visible cards are filtered to match the keyword
- **AND** the URL updates with `?q=<keyword>`

#### Scenario: Sidebar filters narrow results

- **WHEN** the test selects a type filter
- **THEN** only matching cards are shown
- **AND** the URL updates with the filter param

#### Scenario: Card click navigates to entity detail

- **WHEN** the test clicks an asset card
- **THEN** the browser navigates to that asset's catalog entity page

### Requirement: State and Accessibility

The suite MUST cover empty results and automated accessibility scans.

#### Scenario: Empty state when no assets match

- **WHEN** the test applies filters that match no assets
- **THEN** the empty state is displayed with a clear-filters action

#### Scenario: Browse page passes axe audit

- **WHEN** the browse page has loaded
- **THEN** an axe-core scan with WCAG 2.1 AA rules reports zero violations or attaches findings to the test report
