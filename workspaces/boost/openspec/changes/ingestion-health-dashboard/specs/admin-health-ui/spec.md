# Admin Health UI

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

Admin dashboard section showing per-connector health cards with status indicators, timestamps, error summaries, Force Sync buttons. Neo4j panel with node/relationship counts, Force Neo4j Re-sync. Disconnected-cluster differentiation (disabled vs failing). Built on PatternFly design system.

## ADDED Requirements

### Requirement: Per-Connector Health Cards with PatternFly Design

Health cards display connector status in admin panel.

#### Scenario: Health card renders connector status

- **WHEN** the Ingestion Health admin panel loads
- **THEN** each configured connector renders as a PatternFly `Card` with `CardHeader` and `CardBody`
- **AND** the card header shows connector name, type, and status badge (PatternFly `Label` with variant `success`/`warning`/`danger`/`outline`)
- **AND** status badge colors: green for Healthy, yellow for Degraded, red for Failing, grey for Disabled, grey with "?" indicator for Unknown

#### Scenario: Health card shows timestamps

- **WHEN** a health card is rendered for a connector with sync history
- **THEN** the card body shows "Last sync attempt: [relative time]" (e.g., "5 minutes ago") using `react-time-ago`
- **AND** the card body shows "Last successful sync: [relative time]" or "Never" if no successful syncs exist
- **AND** timestamps are updated automatically as time passes (react-time-ago handles this)

#### Scenario: Health card shows sync metrics

- **WHEN** a health card is rendered for a connector with recent successful sync
- **THEN** the card body shows sync metrics: "Assets added: X, updated: Y, removed: Z"
- **AND** metrics are from the most recent successful sync attempt

#### Scenario: Health card shows error summary for failing/degraded connectors

- **WHEN** a health card is rendered for a connector with Failing or Degraded status
- **THEN** the card body shows error summary section with error type badge (auth/network/schema/rate-limit/unknown) and diagnostic guidance text
- **AND** error type badge uses PatternFly `Label` with color coding (red for auth/schema, orange for network/rate-limit, grey for unknown)

#### Scenario: Force Sync button in health card

- **WHEN** a health card is rendered for an enabled connector
- **THEN** the card footer shows a "Force Sync" button (PatternFly `Button` with variant `secondary`)
- **AND** clicking the button triggers `POST /api/boost/ingestion-health/:connectorId/force-sync`
- **AND** the button is disabled while the connector is running (shows spinner icon and "Syncing..." label)

#### Scenario: Health card disabled state

- **WHEN** a health card is rendered for a disabled connector
- **THEN** the status badge is grey with "Disabled" label
- **AND** no error summary is shown (even if last sync before disabling failed)
- **AND** the "Force Sync" button is hidden

### Requirement: Neo4j Sync Panel with Node/Relationship Counts

Neo4j graph sync status shown as separate section.

#### Scenario: Neo4j panel renders below connector cards

- **WHEN** the Ingestion Health admin panel loads
- **THEN** the Neo4j panel renders below per-connector cards, separated by PatternFly `Divider`
- **AND** the panel header shows "Knowledge Graph Sync" title with graph icon

#### Scenario: Neo4j panel shows sync status

- **WHEN** the Neo4j panel is rendered
- **THEN** the panel shows last sync timestamp (relative time), sync outcome badge (success/failure), node count, relationship count
- **AND** outcome badge uses PatternFly `Label` with variant `success` (green) or `danger` (red)

#### Scenario: Force Neo4j Re-sync action

- **WHEN** the Neo4j panel is rendered
- **THEN** the panel shows "Force Re-sync" button with mode toggle (PatternFly `ToggleGroup` with "Full" and "Incremental" options)
- **AND** clicking the button triggers `POST /api/boost/ingestion-health/neo4j/force-sync` with selected mode
- **AND** the button is disabled while Neo4j sync is running (shows spinner icon and "Syncing..." label)

#### Scenario: Neo4j panel error state

- **WHEN** the Neo4j panel is rendered and the last sync failed
- **THEN** the panel shows error summary section with error message and diagnostic guidance
- **AND** node/relationship counts show the last successful sync's counts (not current failed state)

### Requirement: Disconnected-Cluster Differentiation

Disabled connectors visually distinct from failing ones.

#### Scenario: Disabled connector uses muted treatment

- **WHEN** a connector has `boost.connectors.*.enabled: false` (runtime sync-skip via `RuntimeConfigResolver`)
- **THEN** the health card renders with grey/muted status badge (`variant="outline"` PatternFly Label) showing "Disabled"
- **AND** no red/error indicators are shown
- **AND** the card body shows "Connector is disabled. Enable in connector config to resume sync." message
- **AND** note: connectors with `catalog.providers.*.enabled: false` (startup registration gate) are never registered and absent from the UI entirely

#### Scenario: Failing connector uses alert treatment

- **WHEN** a connector is enabled but failing (last 3 sync attempts failed)
- **THEN** the health card renders with red status badge (`variant="danger"` PatternFly Label)
- **AND** error summary section is shown with diagnostic guidance
- **AND** "Force Sync" button is enabled for manual retry

#### Scenario: Healthy connector uses success treatment

- **WHEN** a connector is enabled and healthy (last 3 sync attempts succeeded)
- **THEN** the health card renders with green status badge (`variant="success"` PatternFly Label)
- **AND** no error indicators are shown
- **AND** sync metrics are displayed in card body

### Requirement: Loading States and Error Handling

UI handles loading and error states gracefully.

#### Scenario: Loading state while fetching health data

- **WHEN** the Ingestion Health admin panel mounts and API request is in flight
- **THEN** the panel shows PatternFly `Spinner` with "Loading connector health..." message
- **AND** no cards are rendered until data is available

#### Scenario: Error state for API failure

- **WHEN** the API request to `GET /api/boost/ingestion-health` fails (e.g., network error, 500 response)
- **THEN** the panel shows PatternFly `EmptyState` with error icon and message "Failed to load connector health. Refresh to retry."
- **AND** a "Refresh" button is shown that triggers API refetch

#### Scenario: Empty state for zero connectors

- **WHEN** the API returns an empty array (no connectors configured)
- **THEN** the panel shows PatternFly `EmptyState` with info icon and message "No connectors configured. Configure connectors in the admin panel."
- **AND** no cards are rendered

#### Scenario: Force Sync error handling

- **WHEN** Force Sync API call fails (e.g., 409 Conflict, 504 Timeout)
- **THEN** the health card shows PatternFly `Alert` with error message (e.g., "Connector is already running" or "Sync operation timed out")
- **AND** the "Force Sync" button re-enables after error alert is dismissed

### Requirement: Navigation Integration

Ingestion Health section integrated into admin panel navigation.

#### Scenario: Admin panel sidebar includes Ingestion Health item

- **WHEN** the admin panel loads (`/admin` route)
- **THEN** the sidebar navigation includes "Ingestion Health" item below existing sections (Model Connection, System Prompt, Agent Config)
- **AND** clicking the item navigates to `/admin/ingestion-health` route

#### Scenario: Ingestion Health route renders IngestionHealthPanel

- **WHEN** the user navigates to `/admin/ingestion-health`
- **THEN** the `IngestionHealthPanel` component is rendered in the main content area
- **AND** the sidebar "Ingestion Health" item is highlighted as active

### Requirement: Polling for Real-Time Updates

Health data refreshes automatically via polling.

#### Scenario: Health data polls every 30 seconds

- **WHEN** the Ingestion Health admin panel is mounted
- **THEN** the API `GET /api/boost/ingestion-health` is called initially and every 30 seconds thereafter
- **AND** polling uses `useSWR` with `refreshInterval: 30000` (30 seconds)
- **AND** polling stops when the panel unmounts (user navigates away)

#### Scenario: Force Sync status polling

- **WHEN** a Force Sync is triggered and the API returns a `runId`
- **THEN** the UI polls `GET /api/boost/ingestion-health/:connectorId/force-sync/:runId` every 2 seconds until status is `success` or `failure`
- **AND** the health card updates with latest sync metrics once Force Sync completes
