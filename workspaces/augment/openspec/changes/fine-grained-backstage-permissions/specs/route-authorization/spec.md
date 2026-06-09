# Spec: route-authorization

Replacement of all inline route-level authorization guards in augment route handlers with Backstage permission framework calls. This spec defines the mapping from each augment route (agent lifecycle, tool lifecycle, Kagenti infrastructure) to its specific permission, conditional rules, and fallback behavior. The RBAC plugin evaluates the policies; this spec defines what the augment plugin _asks_ the permission framework to evaluate for each operation and how it interprets the result.

## ADDED Requirements

### Requirement: Agent list visibility filtering

The GET /agents route SHALL use `augment.agent.list` (basic permission) to control visibility. ALLOW SHALL show all agents. DENY SHALL filter to published agents plus the requesting user's own agents.

#### Scenario: Admin sees all agents

- **WHEN** a user with `augment.agent.list` ALLOW calls GET /agents
- **THEN** all agents across all lifecycle stages SHALL be returned

#### Scenario: Non-admin sees filtered agents

- **WHEN** a user with `augment.agent.list` DENY calls GET /agents
- **THEN** only published agents and agents where `createdBy` matches the user SHALL be returned

### Requirement: Agent registration authorization

The PUT register route SHALL use `augment.agent.register` with fallback to `augment.admin`, replacing the `requireAdminAccess` middleware.

#### Scenario: User with register permission

- **WHEN** a user with `augment.agent.register` ALLOW calls PUT register
- **THEN** the registration SHALL proceed

#### Scenario: User with only admin permission

- **WHEN** a user without `augment.agent.register` but with `augment.admin` ALLOW calls PUT register
- **THEN** the registration SHALL proceed via fallback

### Requirement: Agent promote authorization (draft to pending)

The PUT promote route for draft-to-pending transitions SHALL use `augment.agent.promote` with `IS_OWNER` and `HAS_LIFECYCLE_STAGE(draft)` conditions, replacing the inline `createdBy` and stage checks.

#### Scenario: Owner promotes own draft agent

- **WHEN** the agent's `createdBy` matches the requesting user and the agent is in `draft` stage
- **THEN** the promote SHALL proceed

#### Scenario: Non-owner cannot promote

- **WHEN** the agent's `createdBy` does not match the requesting user and the user does not have `augment.admin`
- **THEN** the promote SHALL be denied

### Requirement: Agent approve authorization (pending to published)

The PUT promote route for pending-to-published transitions SHALL use `augment.agent.approve` with `IS_NOT_CREATOR` condition. The existing hard-coded self-approval prevention check SHALL be retained as defense-in-depth.

#### Scenario: Different user can approve

- **WHEN** the agent's `createdBy` does not match the requesting user and the user has `augment.agent.approve`
- **THEN** the approval SHALL proceed

#### Scenario: Creator cannot self-approve

- **WHEN** the agent's `createdBy` matches the requesting user
- **THEN** the approval SHALL be denied by both the `IS_NOT_CREATOR` rule and the hard-coded check

### Requirement: Agent demote authorization

The PUT demote route SHALL use `augment.agent.demote` with fallback to `augment.admin`, replacing `requireAdminAccess`.

#### Scenario: User with demote permission

- **WHEN** a user with `augment.agent.demote` ALLOW calls PUT demote
- **THEN** the demote SHALL proceed

### Requirement: Agent publish and unpublish authorization

The PUT publish, PUT unpublish, and PUT bulk-publish routes SHALL use `augment.agent.publish` with fallback to `augment.admin`, replacing `requireAdminAccess`.

#### Scenario: User with publish permission

- **WHEN** a user with `augment.agent.publish` ALLOW calls PUT publish
- **THEN** the publish SHALL proceed

#### Scenario: Bulk publish checks per item

- **WHEN** a user calls PUT bulk-publish
- **THEN** `augment.agent.publish` SHALL be checked for each agent in the batch

### Requirement: Agent request-unpublish authorization

The PUT request-unpublish route SHALL use `augment.agent.unpublish` with `IS_OWNER` condition and fallback to `augment.admin`, replacing the inline `isRequestOwner OR isAdmin` check.

#### Scenario: Owner can request unpublish

- **WHEN** the agent's `createdBy` matches the requesting user
- **THEN** the request-unpublish SHALL proceed

#### Scenario: Admin can request unpublish for any agent

- **WHEN** the user has `augment.admin` regardless of ownership
- **THEN** the request-unpublish SHALL proceed via fallback

### Requirement: Agent withdraw authorization

The PUT withdraw route SHALL use `augment.agent.withdraw` with `IS_OWNER` condition and fallback to `augment.admin`, replacing the inline `isOwner OR isAdmin` check.

#### Scenario: Owner can withdraw

- **WHEN** the agent's `createdBy` matches the requesting user
- **THEN** the withdraw SHALL proceed

### Requirement: Agent configure authorization

The PUT config route SHALL use `augment.agent.configure` with fallback to `augment.admin`, replacing `requireAdminAccess`.

#### Scenario: User with configure permission

- **WHEN** a user with `augment.agent.configure` ALLOW calls PUT config
- **THEN** the configuration update SHALL proceed

### Requirement: Agent delete authorization

The DELETE route SHALL use `augment.agent.delete` with `IS_OWNER` and `HAS_LIFECYCLE_STAGE(draft)` conditions for non-admin users, replacing the inline draft-only and ownership checks.

#### Scenario: Owner deletes own draft agent

- **WHEN** the agent's `createdBy` matches the requesting user and the agent is in `draft` stage
- **THEN** the delete SHALL proceed

#### Scenario: Non-owner cannot delete

- **WHEN** the agent's `createdBy` does not match the requesting user and the user does not have `augment.admin`
- **THEN** the delete SHALL be denied

#### Scenario: Admin can delete any agent

- **WHEN** a user with `augment.admin` calls DELETE regardless of ownership or stage
- **THEN** the delete SHALL proceed via fallback

### Requirement: Tool lifecycle authorization

The tool lifecycle routes SHALL use the corresponding `augment.tool.*` permissions with the same patterns as agent routes:

| Route                           | Permission               | Conditions                |
| ------------------------------- | ------------------------ | ------------------------- |
| PUT promote (draft-to-pending)  | `augment.tool.promote`   | IS_OWNER                  |
| PUT promote (other transitions) | `augment.tool.approve`   | Fallback to augment.admin |
| PUT demote                      | `augment.tool.demote`    | Fallback to augment.admin |
| PUT publish                     | `augment.tool.publish`   | Fallback to augment.admin |
| PUT unpublish                   | `augment.tool.unpublish` | Fallback to augment.admin |

#### Scenario: Tool owner promotes draft tool

- **WHEN** the tool's `createdBy` matches the requesting user and the tool is in `draft` stage
- **THEN** the promote SHALL proceed via `augment.tool.promote` with `IS_OWNER`

#### Scenario: Tool admin operations fall back

- **WHEN** a user with `augment.admin` but without specific tool permissions calls a tool lifecycle route
- **THEN** the operation SHALL proceed via the `augment.admin` fallback

### Requirement: Kagenti infrastructure route authorization

The Kagenti infrastructure routes (DELETE, migrate, build, parse-env, fetch-env) SHALL use `augment.kagenti.admin` (basic permission) with fallback to `augment.admin`, replacing `requireAdminAccess`.

#### Scenario: User with kagenti admin permission

- **WHEN** a user with `augment.kagenti.admin` ALLOW calls a Kagenti infrastructure route
- **THEN** the operation SHALL proceed

#### Scenario: Fallback to general admin

- **WHEN** a user without `augment.kagenti.admin` but with `augment.admin` ALLOW calls a Kagenti infrastructure route
- **THEN** the operation SHALL proceed via fallback

### Requirement: Permission integration router

The `augment-backend` plugin SHALL register a permission integration router via `createPermissionIntegrationRouter` with both resource types (`augment-agent`, `augment-tool`) and all three permission rules. All 16 new permissions SHALL be registered via `permissionsRegistry.addPermissions`.

#### Scenario: Permission integration active

- **WHEN** the augment backend plugin starts
- **THEN** the permission integration router SHALL be mounted and all permissions SHALL be registered with the Backstage permission framework

### Requirement: Backward compatibility with existing policies

With no fine-grained RBAC policies configured, all authorization behavior SHALL be identical to the current system. The fallback to `augment.admin` SHALL ensure that existing `augment.access` + `augment.admin` policies continue to work without any policy changes.

#### Scenario: No fine-grained policies configured

- **WHEN** a deployment has only `augment.access` and `augment.admin` policies
- **THEN** all authorization decisions SHALL produce the same results as the current inline guard implementation
