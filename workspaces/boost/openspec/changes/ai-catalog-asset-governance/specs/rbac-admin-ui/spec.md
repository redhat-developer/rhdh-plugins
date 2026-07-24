# RBAC Admin UI

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

Standalone admin page at `/ai-catalog/admin/rbac` for SMP Admins to manage AI Catalog visibility policies. The page calls the RBAC REST API directly and is gated by `ai-catalog.admin` permission.

**Jira references:** RHIDP-15304

## ADDED Requirements

### Requirement: Standalone Admin Page

A dedicated frontend page MUST provide AI Catalog RBAC management without requiring YAML editing.

#### Scenario: Page route and access control

- **WHEN** a user navigates to `/ai-catalog/admin/rbac`
- **THEN** the page is rendered as a standalone Backstage page (not embedded in the RBAC plugin)
- **AND** the page is gated by `ai-catalog.admin` permission via `RequirePermission`
- **AND** users without `ai-catalog.admin` see an access-denied page with instructions for requesting access

#### Scenario: Page navigation entry

- **WHEN** an admin accesses the AI Catalog section
- **THEN** a sidebar navigation item or admin panel link provides access to the RBAC admin page
- **AND** the link is only visible to users with `ai-catalog.admin` permission (via `usePermission` hook)

### Requirement: Visibility Policy Management

The admin UI MUST support viewing and managing AI Catalog visibility policies.

#### Scenario: View current policies

- **WHEN** an admin opens the RBAC admin page
- **THEN** the page displays:
  - Current default posture (allow/deny) and its scope (global, per-category, per-connector)
  - Active conditional policies affecting `ai-catalog.asset.read` and `ai-catalog.asset.read.usage-docs`
  - Roles with AI Catalog permissions and their member counts
- **AND** policies are fetched from the RBAC REST API (`GET /api/permission/policies`, `GET /api/permission/roles`)

#### Scenario: Create a category-scoped policy

- **WHEN** an admin creates a new policy via the UI
- **THEN** the admin can select:
  - Target permission (`ai-catalog.asset.read` or `ai-catalog.asset.read.usage-docs`)
  - Policy decision (ALLOW or DENY)
  - Condition rule (isAiAssetCategory, isFromConnector, isInTenant)
  - Rule parameters (category name, connector name, or tenant name)
  - Affected role(s)
- **AND** the policy is created via the RBAC REST API (`POST /api/permission/policies`)

#### Scenario: Delete an existing policy

- **WHEN** an admin deletes a policy via the UI
- **THEN** a confirmation dialog shows the policy details and impact summary
- **AND** on confirmation, the policy is deleted via the RBAC REST API (`DELETE /api/permission/policies`)
- **AND** an audit event is emitted

### Requirement: Default Posture Management

The admin UI MUST allow viewing and changing the default posture configuration.

#### Scenario: View default posture

- **WHEN** an admin views the posture section
- **THEN** the current global default posture is displayed (allow or deny)
- **AND** per-category and per-connector overrides are listed with their effective posture

#### Scenario: Change default posture

- **WHEN** an admin changes the default posture from allow to deny
- **THEN** a confirmation dialog explains that only newly ingested assets will be affected
- **AND** on confirmation, the configuration is updated
- **AND** an audit event is emitted with previous and new values

### Requirement: RBAC REST API Integration

The admin UI MUST use the existing RBAC REST API for all policy operations.

#### Scenario: API routes used

- **WHEN** the admin UI performs CRUD operations
- **THEN** it calls the RBAC plugin's REST API at `/api/permission/`:
  | Operation | HTTP Method | Path |
  |---|---|---|
  | List policies | GET | `/api/permission/policies` |
  | Create policy | POST | `/api/permission/policies` |
  | Update policy | PUT | `/api/permission/policies` |
  | Delete policy | DELETE | `/api/permission/policies` |
  | List roles | GET | `/api/permission/roles` |
  | List conditions | GET | `/api/permission/conditions` |
  | Create condition | POST | `/api/permission/conditions` |
- **AND** the admin UI does not implement its own policy storage or evaluation

#### Scenario: Error handling

- **WHEN** an RBAC REST API call fails
- **THEN** the admin UI displays a user-friendly error message
- **AND** the error includes the HTTP status code and RBAC plugin error message
- **AND** the admin UI does not expose internal server details
