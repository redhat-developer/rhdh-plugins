# AI Catalog E2E

> **Status:** Implemented by PR #4501.

## ADDED Requirements

### Requirement: Playwright Infrastructure

The workspace MUST provide a Playwright runner for the NFS development app.

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

#### Scenario: Type filter narrows results

- **WHEN** the test selects a type filter
- **THEN** only matching cards are shown
- **AND** the URL updates with the filter param

#### Scenario: Table view renders assets

- **WHEN** the test selects table view
- **THEN** both fixture assets appear in the table
- **AND** the URL records the table view

### Requirement: State and Accessibility

The suite MUST cover empty results and automated accessibility scans.

#### Scenario: Empty state when no assets match

- **WHEN** the test applies filters that match no assets
- **THEN** the empty state is displayed with a clear-filters action
- **AND** clearing filters restores the fixture assets

#### Scenario: Catalog request fails

- **WHEN** the Catalog API request fails
- **THEN** the error state and retry action are displayed

#### Scenario: Browse page passes axe audit

- **WHEN** the empty browse page has loaded
- **THEN** an axe-core scan with WCAG 2.1 AA rules runs with documented exceptions
- **AND** the scan report is attached to the test result
