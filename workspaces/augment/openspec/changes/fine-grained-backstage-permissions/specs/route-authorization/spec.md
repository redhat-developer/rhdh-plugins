# Spec: route-authorization

Replacement of all inline route-level authorization guards in augment route handlers with Backstage permission framework calls. This spec defines the mapping from each augment route (agent lifecycle, tool lifecycle, Kagenti infrastructure) to its specific permission, conditional rules, and fallback behavior. The RBAC plugin evaluates the policies; this spec defines what the augment plugin _asks_ the permission framework to evaluate for each operation and how it interprets the result.

## ADDED Requirements

### Requirement: Agent list visibility filtering

The GET /agents route SHALL use `augment.agent.list` (resource-based permission with resource type `augment-agent`) to control visibility via 3-tier evaluation:

- **ALLOW** — return all agents
- **DENY** — return no agents
- **CONDITIONAL** — apply the returned conditions as filters against each agent in the list, returning only agents that satisfy the conditions

#### Scenario: Unrestricted user sees all agents

- **WHEN** a user with `augment.agent.list` ALLOW calls GET /agents
- **THEN** all agents across all lifecycle stages SHALL be returned

#### Scenario: Denied user sees no agents

- **WHEN** a user with `augment.agent.list` DENY calls GET /agents
- **THEN** no agents SHALL be returned

#### Scenario: Conditional user sees filtered agents

- **WHEN** a user with `augment.agent.list` CONDITIONAL (e.g., `IS_OWNER`) calls GET /agents
- **THEN** only agents satisfying the condition filter (e.g., `createdBy` matches the user) SHALL be returned

#### Scenario: Conditional with multiple rules

- **WHEN** a user has a CONDITIONAL policy combining `IS_OWNER` and `HAS_LIFECYCLE_STAGE(published)` for `augment.agent.list`
- **THEN** only agents that satisfy both conditions SHALL be returned

### Requirement: Agent registration authorization

The PUT register route SHALL use `augment.agent.register`, replacing the `requireAdminAccess` middleware. When `augment.permissions.legacyAdminFallback` is enabled, DENY falls back to checking `augment.admin`.

#### Scenario: User with register permission

- **WHEN** a user with `augment.agent.register` ALLOW calls PUT register
- **THEN** the registration SHALL proceed

#### Scenario: User with only admin permission (fallback enabled)

- **WHEN** `augment.permissions.legacyAdminFallback` is enabled, and a user without `augment.agent.register` but with `augment.admin` ALLOW calls PUT register
- **THEN** the registration SHALL proceed via fallback

### Requirement: Agent promote authorization (draft to pending)

The PUT promote route for draft-to-pending transitions SHALL use `augment.agent.promote` with `IS_OWNER` and `HAS_LIFECYCLE_STAGE(draft)` conditions, replacing the inline `createdBy` and stage checks.

#### Scenario: Owner promotes own draft agent

- **WHEN** the agent's `createdBy` matches the requesting user and the agent is in `draft` stage
- **THEN** the promote SHALL proceed

#### Scenario: Non-owner cannot promote

- **WHEN** the agent's `createdBy` does not match the requesting user and the user does not have the fine-grained permission (or `augment.admin` with fallback enabled)
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

The PUT demote route SHALL use `augment.agent.demote`, replacing `requireAdminAccess`. When `augment.permissions.legacyAdminFallback` is enabled, DENY falls back to checking `augment.admin`.

#### Scenario: User with demote permission

- **WHEN** a user with `augment.agent.demote` ALLOW calls PUT demote
- **THEN** the demote SHALL proceed

### Requirement: Agent publish and unpublish authorization

The PUT publish, PUT unpublish, and PUT bulk-publish routes SHALL use `augment.agent.publish`, replacing `requireAdminAccess`. When `augment.permissions.legacyAdminFallback` is enabled, DENY falls back to checking `augment.admin`.

#### Scenario: User with publish permission

- **WHEN** a user with `augment.agent.publish` ALLOW calls PUT publish
- **THEN** the publish SHALL proceed

#### Scenario: Bulk publish checks per item

- **WHEN** a user calls PUT bulk-publish
- **THEN** `augment.agent.publish` SHALL be checked for each agent in the batch

### Requirement: Agent request-unpublish authorization

The PUT request-unpublish route SHALL use `augment.agent.unpublish` with `IS_OWNER` condition, replacing the inline `isRequestOwner OR isAdmin` check. When `augment.permissions.legacyAdminFallback` is enabled, DENY falls back to checking `augment.admin`.

#### Scenario: Owner can request unpublish

- **WHEN** the agent's `createdBy` matches the requesting user
- **THEN** the request-unpublish SHALL proceed

#### Scenario: Admin can request unpublish for any agent (fallback enabled)

- **WHEN** `augment.permissions.legacyAdminFallback` is enabled and the user has `augment.admin` regardless of ownership
- **THEN** the request-unpublish SHALL proceed via fallback

### Requirement: Agent withdraw authorization

The PUT withdraw route SHALL use `augment.agent.withdraw` with `IS_OWNER` condition, replacing the inline `isOwner OR isAdmin` check. When `augment.permissions.legacyAdminFallback` is enabled, DENY falls back to checking `augment.admin`.

#### Scenario: Owner can withdraw

- **WHEN** the agent's `createdBy` matches the requesting user
- **THEN** the withdraw SHALL proceed

### Requirement: Agent configure authorization

The PUT config route SHALL use `augment.agent.configure`, replacing `requireAdminAccess`. When `augment.permissions.legacyAdminFallback` is enabled, DENY falls back to checking `augment.admin`.

#### Scenario: User with configure permission

- **WHEN** a user with `augment.agent.configure` ALLOW calls PUT config
- **THEN** the configuration update SHALL proceed

### Requirement: Agent delete authorization

The DELETE route SHALL use `augment.agent.delete` with `IS_OWNER` and `HAS_LIFECYCLE_STAGE(draft)` conditions for non-admin users, replacing the inline draft-only and ownership checks.

#### Scenario: Owner deletes own draft agent

- **WHEN** the agent's `createdBy` matches the requesting user and the agent is in `draft` stage
- **THEN** the delete SHALL proceed

#### Scenario: Non-owner cannot delete

- **WHEN** the agent's `createdBy` does not match the requesting user and the user does not have the fine-grained permission (or `augment.admin` with fallback enabled)
- **THEN** the delete SHALL be denied

#### Scenario: Admin can delete any agent (fallback enabled)

- **WHEN** `augment.permissions.legacyAdminFallback` is enabled and a user with `augment.admin` calls DELETE regardless of ownership or stage
- **THEN** the delete SHALL proceed via fallback

### Requirement: Tool lifecycle authorization

The tool lifecycle routes SHALL use the corresponding `augment.tool.*` permissions with the same patterns as agent routes. When `augment.permissions.legacyAdminFallback` is enabled, DENY falls back to checking `augment.admin`.

| Route                           | Permission               | Conditions                       |
| ------------------------------- | ------------------------ | -------------------------------- |
| PUT promote (draft-to-pending)  | `augment.tool.promote`   | IS_OWNER                         |
| PUT promote (other transitions) | `augment.tool.approve`   | Opt-in fallback to augment.admin |
| PUT demote                      | `augment.tool.demote`    | Opt-in fallback to augment.admin |
| PUT publish                     | `augment.tool.publish`   | Opt-in fallback to augment.admin |
| PUT unpublish                   | `augment.tool.unpublish` | Opt-in fallback to augment.admin |

#### Scenario: Tool owner promotes draft tool

- **WHEN** the tool's `createdBy` matches the requesting user and the tool is in `draft` stage
- **THEN** the promote SHALL proceed via `augment.tool.promote` with `IS_OWNER`

#### Scenario: Tool admin operations fall back (fallback enabled)

- **WHEN** `augment.permissions.legacyAdminFallback` is enabled, and a user with `augment.admin` but without specific tool permissions calls a tool lifecycle route
- **THEN** the operation SHALL proceed via the `augment.admin` fallback

### Requirement: Kagenti infrastructure route authorization

The Kagenti infrastructure routes (DELETE, migrate, build, parse-env, fetch-env) SHALL use `augment.kagenti.admin` (basic permission), replacing `requireAdminAccess`. When `augment.permissions.legacyAdminFallback` is enabled, DENY falls back to checking `augment.admin`.

#### Scenario: User with kagenti admin permission

- **WHEN** a user with `augment.kagenti.admin` ALLOW calls a Kagenti infrastructure route
- **THEN** the operation SHALL proceed

#### Scenario: Fallback to general admin (fallback enabled)

- **WHEN** `augment.permissions.legacyAdminFallback` is enabled, and a user without `augment.kagenti.admin` but with `augment.admin` ALLOW calls a Kagenti infrastructure route
- **THEN** the operation SHALL proceed via fallback

### Requirement: Vector store route authorization

The vector store admin routes SHALL use `augment.vectorstore.manage` (basic permission), replacing `requireAdminAccess`. When `augment.permissions.legacyAdminFallback` is enabled, DENY falls back to checking `augment.admin`.

#### Scenario: User with vectorstore permission

- **WHEN** a user with `augment.vectorstore.manage` ALLOW calls a vector store route (create, connect, disconnect, delete)
- **THEN** the operation SHALL proceed

#### Scenario: Fallback to general admin for vector stores (fallback enabled)

- **WHEN** `augment.permissions.legacyAdminFallback` is enabled, and a user without `augment.vectorstore.manage` but with `augment.admin` ALLOW calls a vector store route
- **THEN** the operation SHALL proceed via fallback

### Requirement: Document route authorization

The document admin routes SHALL use `augment.document.manage` (basic permission), replacing `requireAdminAccess`. When `augment.permissions.legacyAdminFallback` is enabled, DENY falls back to checking `augment.admin`.

#### Scenario: User with document permission

- **WHEN** a user with `augment.document.manage` ALLOW calls a document route (upload, delete)
- **THEN** the operation SHALL proceed

### Requirement: MCP route authorization

The MCP connection test and tool management routes SHALL use `augment.mcp.manage` (basic permission), replacing `requireAdminAccess` for admin routes and adding authorization to currently ungated tool creation. When `augment.permissions.legacyAdminFallback` is enabled, DENY falls back to checking `augment.admin`.

#### Scenario: User with MCP permission

- **WHEN** a user with `augment.mcp.manage` ALLOW calls an MCP route (test connection, create tool, delete tool, build tool)
- **THEN** the operation SHALL proceed

#### Scenario: Tool creation now gated

- **WHEN** a user without `augment.mcp.manage` and without `augment.admin` calls POST to create a tool
- **THEN** the operation SHALL be denied (closing the current gap where tool creation is ungated)

### Requirement: Prompt route authorization

The system prompt generation and configuration routes SHALL use `augment.prompt.manage` (basic permission), replacing `requireAdminAccess`. When `augment.permissions.legacyAdminFallback` is enabled, DENY falls back to checking `augment.admin`.

#### Scenario: User with prompt permission

- **WHEN** a user with `augment.prompt.manage` ALLOW calls a prompt route (generate system prompt)
- **THEN** the operation SHALL proceed

### Requirement: Model route authorization

The model listing, testing, and configuration routes SHALL use `augment.model.manage` (basic permission), replacing `requireAdminAccess`. When `augment.permissions.legacyAdminFallback` is enabled, DENY falls back to checking `augment.admin`.

#### Scenario: User with model permission

- **WHEN** a user with `augment.model.manage` ALLOW calls a model route (list, test, configure)
- **THEN** the operation SHALL proceed

### Requirement: Permission registration via PermissionsRegistryService

The `augment-backend` plugin SHALL register resource types, permissions, and rules via `PermissionsRegistryService` (the new Backstage API that replaces the deprecated `createPermissionIntegrationRouter`):

1. Register both resource types via `permissionsRegistry.addResourceType` with their associated rules
2. Register all 21 new permissions via `permissionsRegistry.addPermissions`

#### Scenario: Permission integration active

- **WHEN** the augment backend plugin starts
- **THEN** both resource types and all permissions SHALL be registered with the Backstage permission framework via `PermissionsRegistryService`

### Requirement: Legacy fallback configuration

The system SHALL support a `augment.permissions.legacyAdminFallback` config flag (default: `false`). When enabled, all `authorizeLifecycleAction` and `authorizeBasicWithFallback` calls SHALL fall back to checking `augment.admin` on DENY. When disabled, only fine-grained permissions are evaluated.

#### Scenario: Fallback enabled with existing policies

- **WHEN** `augment.permissions.legacyAdminFallback` is enabled and a deployment has only `augment.access` and `augment.admin` policies
- **THEN** all authorization decisions SHALL produce the same results as the current inline guard implementation

#### Scenario: Fallback disabled (default)

- **WHEN** `augment.permissions.legacyAdminFallback` is not set or is `false`
- **THEN** only fine-grained permissions SHALL be evaluated — `augment.admin` SHALL NOT be checked as a fallback for lifecycle or infrastructure operations
