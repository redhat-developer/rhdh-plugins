# Config Admin UI

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

Admin UI section for toggling connectors, setting endpoints/schedules, referencing K8s Secrets. Changes saved via `AdminConfigService` DB overrides. Takes effect via `RuntimeConfigResolver` hot-reload pattern. RBAC gating: admin-only access.

## EXISTING Requirements

### Requirement: Connector Toggle UI

Admin UI provides toggle controls for enabling/disabling connectors.

#### Scenario: Connector toggle list

- **WHEN** admin opens connector config section
- **THEN** UI displays list of all configured connectors (Jira, GitHub, GitLab)
- **AND** each connector has a toggle switch showing current `enabled` state
- **AND** toggle state reflects merged config (YAML baseline + DB override)

#### Scenario: Toggle connector off

- **WHEN** admin clicks toggle to disable Jira connector
- **THEN** frontend calls `POST /admin/config/connectors.jira` with `{ enabled: false }`
- **AND** backend validates via Zod schema, writes DB override, invalidates cache
- **AND** frontend shows immediate visual feedback: "Saved — will take effect within 30 seconds"
- **AND** toggle UI updates to show "Disabled" state

#### Scenario: Toggle connector on

- **WHEN** admin clicks toggle to enable previously disabled Jira connector
- **THEN** frontend calls `POST /admin/config/connectors.jira` with `{ enabled: true }`
- **AND** backend writes DB override, invalidates cache
- **AND** frontend shows immediate visual feedback
- **AND** toggle UI updates to show "Enabled" state

### Requirement: Endpoint and Schedule Form Fields

Admin UI provides form fields for endpoint URL and sync schedule configuration.

#### Scenario: Endpoint URL field

- **WHEN** admin opens Jira connector config detail view
- **THEN** UI displays input field for `endpoint` pre-populated with current merged config value
- **AND** field includes validation indicator (URL format check)
- **AND** field shows help text: "Jira instance URL (e.g., https://jira.example.com)"

#### Scenario: Change endpoint URL

- **WHEN** admin edits endpoint URL to `https://jira-staging.example.com` and saves
- **THEN** frontend validates URL format before submitting
- **AND** frontend calls `POST /admin/config/connectors.jira` with `{ endpoint: "https://jira-staging.example.com" }`
- **AND** backend validates, writes DB override, invalidates cache
- **AND** UI shows: "Saved — new endpoint will be used on next sync (within schedule interval)"

#### Scenario: Schedule interval field

- **WHEN** admin opens connector config detail view
- **THEN** UI displays input field for `schedule.intervalMs` with human-readable conversion (e.g., "5 minutes" displayed as 300000 ms)
- **AND** field includes slider or dropdown for common intervals: 1m, 5m, 10m, 30m, 1h, 6h, 12h, 24h

#### Scenario: Change schedule interval

- **WHEN** admin changes schedule from "5 minutes" to "10 minutes" and saves
- **THEN** frontend calls `POST /admin/config/connectors.jira` with `{ schedule: { intervalMs: 600000 } }`
- **AND** backend validates, writes DB override, invalidates cache
- **AND** UI shows: "Saved — new schedule will take effect on next cycle"

#### Scenario: Cron schedule field

- **WHEN** admin switches from interval to cron schedule
- **THEN** UI displays cron expression input field with validation
- **AND** UI provides cron builder helper (dropdowns for hour, day of week, etc.)
- **AND** field shows example: "0 _/2 _ \* \* = every 2 hours"

### Requirement: K8s Secret Reference Field

Admin UI displays K8s Secret references as read-only info (deployment-time config).

#### Scenario: Secret reference displayed as read-only

- **WHEN** admin opens connector config detail view
- **THEN** UI displays `credentials.secretRef` and `credentials.secretKey` as read-only text fields
- **AND** fields show current YAML baseline values (e.g., `secretRef: "jira-credentials"`, `secretKey: "api-token"`)
- **AND** fields include tooltip: "Deployment-time config. Edit YAML to change. See [docs] for credential rotation."

#### Scenario: Secret reference cannot be edited via UI

- **WHEN** admin attempts to edit `credentials.secretRef` field
- **THEN** UI field is disabled (grayed out, no cursor)
- **AND** tooltip explains: "Secret references cannot be changed at runtime. Update app-config.yaml and redeploy."

### Requirement: DB Override Save via AdminConfigService

Admin UI saves connector config changes via `AdminConfigService` with schema validation.

#### Scenario: Save endpoint change via AdminConfigService

- **WHEN** admin changes endpoint and clicks "Save"
- **THEN** frontend calls `POST /api/boost/admin/config` with payload:
  ```json
  {
    "key": "connectors.jira",
    "value": { "endpoint": "https://jira-staging.example.com" }
  }
  ```
- **AND** backend `AdminConfigService.setConfig()` validates via Jira connector Zod schema
- **AND** backend writes DB override to `admin_config` table
- **AND** backend calls `RuntimeConfigResolver.invalidate('connectors.jira')`
- **AND** backend returns success response
- **AND** frontend displays success notification

#### Scenario: Save rejected by schema validation

- **WHEN** admin enters invalid endpoint URL "not-a-url" and clicks "Save"
- **THEN** frontend calls `POST /api/boost/admin/config`
- **AND** backend validates via Zod schema, rejects with error: "Invalid URL format for endpoint"
- **AND** backend returns 400 error response
- **AND** frontend displays validation error below field: "Invalid URL format"

### Requirement: Validation Feedback

Admin UI provides immediate validation feedback before and after save.

#### Scenario: Client-side validation before save

- **WHEN** admin enters invalid endpoint URL
- **THEN** UI field shows red border and error icon
- **AND** UI displays validation message: "Please enter a valid URL"
- **AND** "Save" button is disabled until validation passes

#### Scenario: Server-side validation error feedback

- **WHEN** admin saves config and server rejects with validation error
- **THEN** UI displays error notification at top of form: "Failed to save: [error message]"
- **AND** field that caused error is highlighted
- **AND** focus returns to invalid field

#### Scenario: Successful save confirmation

- **WHEN** admin saves valid config change
- **THEN** UI displays success notification: "Connector config saved successfully"
- **AND** notification includes propagation info: "Changes will take effect within 30 seconds"
- **AND** notification auto-dismisses after 5 seconds

### Requirement: RBAC Gating

Admin UI connector config section requires admin role (RBAC permission check).

#### Scenario: Admin user accesses connector config

- **WHEN** user with `boost.admin` permission opens connector config section
- **THEN** UI displays full connector config form with edit capabilities
- **AND** all fields (except yaml-only) are editable
- **AND** "Save" button is enabled

#### Scenario: Non-admin user blocked from connector config

- **WHEN** user without `boost.admin` permission attempts to access connector config section
- **THEN** UI displays permission error: "You do not have permission to configure connectors"
- **AND** config section is not rendered
- **AND** user is redirected to unauthorized page

#### Scenario: Non-admin user sees read-only connector status

- **WHEN** connector config section is configured to allow read-only access for non-admin users
- **THEN** UI displays connector list with read-only toggle states and settings
- **AND** all form fields are disabled
- **AND** "Save" button is hidden
- **AND** UI shows info banner: "Read-only view. Contact administrator to change connector settings."

### Requirement: Immediate Visual Feedback

Admin UI provides immediate visual feedback on save without waiting for propagation.

#### Scenario: Optimistic UI update on save

- **WHEN** admin saves connector config change
- **THEN** UI immediately updates displayed values to reflect new config (before backend response)
- **AND** UI shows loading spinner during save request
- **AND** UI reverts to old values if save fails

#### Scenario: Propagation delay communication

- **WHEN** admin saves connector config change
- **THEN** success notification includes: "Saved — will take effect within 30 seconds (cache TTL) + next reconciliation cycle"
- **AND** UI provides link to connector health dashboard to monitor effect

#### Scenario: Config change history

- **WHEN** admin views connector config section
- **THEN** UI displays recent config change history (last 10 changes)
- **AND** history includes: timestamp, changed fields, old/new values, user who made change
- **AND** history is sourced from audit log (via `AdminConfigService`)

## ADDED Requirements

### Requirement: Specification Coverage

This capability area MUST have its existing behavior documented as baseline acceptance criteria.

#### Scenario: Baseline validation

- **WHEN** the existing implementation is validated against this specification
- **THEN** all scenarios described in the EXISTING Requirements section MUST pass
