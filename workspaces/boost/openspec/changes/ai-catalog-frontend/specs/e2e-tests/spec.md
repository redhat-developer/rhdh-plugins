# E2E Tests

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

Playwright end-to-end tests for the AI Catalog frontend plugin. Boost is NFS-only (no legacy app), so no `APP_MODE` dual testing. Tests use translation keys instead of hardcoded strings and include axe-core accessibility audits.

## Requirements

### Requirement: Playwright Infrastructure

The workspace has a working Playwright setup following rhdh-plugins conventions.

#### Scenario: Playwright config exists

- **GIVEN** the boost workspace
- **WHEN** a developer runs `yarn test:e2e`
- **THEN** Playwright starts the dev app via `yarn start`, waits for readiness, and runs tests from `e2e-tests/`

#### Scenario: Multi-locale test projects

- **GIVEN** the Playwright config defines projects for at least `en` and one non-English locale (e.g., `ja`)
- **WHEN** the full e2e suite runs
- **THEN** tests execute against both locales
- **AND** per-locale `app-config-e2e-*.yaml` overrides configure separate ports so projects can run in parallel

#### Scenario: CI integration

- **GIVEN** CI runs `yarn playwright test` in the boost workspace
- **WHEN** the test suite completes
- **THEN** test reports are generated in `e2e-test-report/`
- **AND** test artifacts (screenshots, traces on failure) are stored in `e2e-test-results/`

### Requirement: Browse Page Tests

The AI Catalog browse page is tested end-to-end.

#### Scenario: Card grid renders with fixture data

- **WHEN** the e2e test navigates to `/ai-catalog`
- **THEN** AI asset cards are visible on the page
- **AND** cards display translated text (using translation keys, not hardcoded English)

#### Scenario: Search filters cards

- **GIVEN** the browse page has loaded with AI assets
- **WHEN** the test types a keyword in the search bar
- **THEN** the visible cards are filtered to match the keyword
- **AND** the URL updates with `?q=<keyword>`

#### Scenario: Sidebar filters narrow results

- **GIVEN** the browse page has loaded
- **WHEN** the test selects a category filter (e.g., "skill")
- **THEN** only cards matching that category are shown
- **AND** the URL updates with the filter param

#### Scenario: Multiple filters combine as AND

- **GIVEN** the browse page has loaded
- **WHEN** the test selects category "skill" AND a specific tag
- **THEN** only cards matching both criteria are shown

#### Scenario: Clear filters resets the view

- **GIVEN** filters are active and the card grid is narrowed
- **WHEN** the test clicks the clear-filters action
- **THEN** all filter URL params are removed
- **AND** the full card grid is restored

#### Scenario: Card click navigates to entity detail

- **GIVEN** AI asset cards are visible
- **WHEN** the test clicks on a card
- **THEN** the browser navigates to the catalog entity detail page for that asset

### Requirement: State and Error Handling Tests

Edge cases are covered by e2e tests.

#### Scenario: Empty state when no assets match

- **GIVEN** the browse page has loaded
- **WHEN** the test applies filters that match no assets
- **THEN** the empty state message is displayed (verified via translation key)
- **AND** the clear-filters action is visible

#### Scenario: Pagination controls work

- **GIVEN** the catalog has more assets than one page
- **WHEN** the test clicks the next-page control
- **THEN** the card grid updates to show the next page of results
- **AND** the URL updates with the page param

#### Scenario: Sort control changes order

- **GIVEN** the browse page has loaded
- **WHEN** the test changes the sort to "last updated"
- **THEN** the card order updates accordingly

### Requirement: Accessibility Audits

Every tested page passes automated accessibility checks.

#### Scenario: Browse page passes axe audit

- **WHEN** the browse page has loaded
- **THEN** an axe-core scan with WCAG 2.1 AA rules reports zero violations
- **AND** violations (if any) are attached to the test report for debugging

#### Scenario: Filtered state passes axe audit

- **GIVEN** filters are active on the browse page
- **WHEN** an axe-core scan runs
- **THEN** zero WCAG 2.1 AA violations are reported (focus management, aria-labels intact)

### Requirement: Translation Key Usage

Tests do not hardcode English strings.

#### Scenario: UI text verified via translation keys

- **GIVEN** the test needs to verify a UI label
- **WHEN** it locates the element
- **THEN** it uses the translated string from the plugin's translation module for the current locale
- **AND** the same test code works for `en`, `de`, `es`, `fr`, `it`, `ja` without modification

#### Scenario: Translation helper utility exists

- **GIVEN** a `getTranslations(locale)` utility exists in `e2e-tests/utils/`
- **WHEN** a test calls it
- **THEN** it returns the message map for that locale loaded from the plugin's translation modules
