# Fine-Grained Permissions

Expand from 2 coarse permissions to 16 fine-grained permissions across 3 resource types with conditional rules, replacing custom route-level governance with proper Backstage RBAC. This eliminates the parallel authorization system (2,132 lines of custom governance code vs. 73 lines of Backstage permissions) by migrating all 12+ authorization decisions into `permissions.authorize()`.

## ADDED Requirements

### Requirement: Agent Lifecycle Permissions (Resource-Based)

RBAC policies govern agent lifecycle transitions with ownership and separation-of-duties rules.

#### Scenario: Agent permission definitions

- **WHEN** the boost plugin registers permissions via `permissionsRegistry.addPermissions()`
- **THEN** the following agent permissions are registered:
  | Permission | Resource Type | Conditional Rules | Gates |
  |---|---|---|---|
  | `augment.agent.list` | — | — | View agent list (visibility filtering) |
  | `augment.agent.register` | — | — | Register an agent for governance |
  | `augment.agent.promote` | `augment-agent` | `IS_OWNER`, `HAS_LIFECYCLE_STAGE` | Submit draft for review (draft→pending) |
  | `augment.agent.approve` | `augment-agent` | `IS_NOT_CREATOR`, `HAS_LIFECYCLE_STAGE` | Approve pending (pending→published) |
  | `augment.agent.demote` | `augment-agent` | — | Reject, request-unpublish, approve-unpublish |
  | `augment.agent.publish` | `augment-agent` | — | Publish an approved agent |
  | `augment.agent.unpublish` | `augment-agent` | `IS_OWNER` | Request unpublishing |
  | `augment.agent.withdraw` | `augment-agent` | `IS_OWNER` | Withdraw pending submission |
  | `augment.agent.delete` | `augment-agent` | `IS_OWNER`, `HAS_LIFECYCLE_STAGE` | Delete agent |
  | `augment.agent.configure` | — | — | Edit agent configuration |

#### Scenario: Self-approval prevention via IS_NOT_CREATOR rule

- **WHEN** a user attempts to approve an agent (pending→published)
- **THEN** the `IS_NOT_CREATOR` conditional rule checks `resource.createdBy !== currentUser`
- **AND** if the user is the agent's creator, the permission is DENIED
- **AND** a defense-in-depth route guard additionally enforces this in `security.mode === 'full'`

#### Scenario: Ownership-scoped promotion

- **WHEN** a non-admin user attempts to promote their own draft agent
- **THEN** `IS_OWNER` checks `resource.createdBy === currentUser`
- **AND** `HAS_LIFECYCLE_STAGE` checks `resource.lifecycleStage === 'draft'`
- **AND** both rules must pass for the promotion to proceed

### Requirement: Tool Lifecycle Permissions (Resource-Based)

RBAC policies govern tool lifecycle transitions.

#### Scenario: Tool permission definitions

- **WHEN** the boost plugin registers permissions
- **THEN** the following tool permissions are registered:
  | Permission | Resource Type | Conditional Rules | Gates |
  |---|---|---|---|
  | `augment.tool.promote` | `augment-tool` | `IS_OWNER` | Promote tool lifecycle |
  | `augment.tool.approve` | `augment-tool` | `IS_NOT_CREATOR` | Approve tool promotion |
  | `augment.tool.demote` | `augment-tool` | — | Demote tool lifecycle stage |
  | `augment.tool.publish` | `augment-tool` | — | Publish a tool |
  | `augment.tool.unpublish` | `augment-tool` | — | Unpublish a tool |

### Requirement: Infrastructure Permissions

#### Scenario: Kagenti admin permission

- **WHEN** a user accesses Kagenti infrastructure operations
- **THEN** `augment.kagenti.admin` permission is checked
- **AND** this covers namespace management, build pipelines, sandbox, and platform links

### Requirement: Conditional Permission Rules

Three conditional rules evaluate loaded resources during permission checks.

#### Scenario: IS_OWNER rule

- **WHEN** a permission check includes the `IS_OWNER` condition
- **THEN** the system loads the agent/tool resource and checks `resource.createdBy === userRef`
- **AND** `userRef` is resolved from `httpAuth.credentials` (real OIDC identity)

#### Scenario: IS_NOT_CREATOR rule

- **WHEN** a permission check includes the `IS_NOT_CREATOR` condition
- **THEN** the system checks `resource.createdBy !== userRef`
- **AND** this enforces separation of duties (no self-approval)

#### Scenario: HAS_LIFECYCLE_STAGE rule

- **WHEN** a permission check includes the `HAS_LIFECYCLE_STAGE` condition
- **THEN** the system checks `resource.lifecycleStage` against the allowed stages for the action
- **AND** invalid lifecycle transitions are blocked at the permission layer

### Requirement: Backward Compatibility with Fallback

Existing 2-permission deployments continue to work without policy changes.

#### Scenario: Fine-grained permissions as primary authorization

- **WHEN** a lifecycle or admin action is invoked
- **THEN** the specific fine-grained permission is checked via `permissions.authorize()`
- **AND** `augment.access` serves as a top-level gate (if denied, all sub-permissions are denied)
- **AND** `augment.admin` is available for deployments that prefer coarse-grained admin control

### Requirement: Route-Level Authorization Middleware

A shared middleware replaces scattered route-level guards.

#### Scenario: authorizeLifecycleAction middleware

- **WHEN** a lifecycle route is invoked (promote, approve, demote, delete, etc.)
- **THEN** `authorizeLifecycleAction(permission, resourceLoader)` middleware:
  1. Loads the resource (agent or tool)
  2. Calls `permissions.authorize()` with the fine-grained permission and resource
  3. On DENY, falls back to `augment.admin`
  4. On both DENY, returns 403
- **AND** this replaces the per-route `checkIsAdmin` + `getUserRef` + ownership patterns

### Requirement: Permission Registration Best Practices

#### Scenario: Permissions exported from common package

- **WHEN** permission constants are needed by frontend or backend
- **THEN** they are exported from `@augment/plugin-augment-common`
- **AND** basic permissions use `createPermission` from `@backstage/plugin-permission-common`
- **AND** resource permissions use `createResourcePermission` with resource types `augment-agent` and `augment-tool`

### Requirement: Functional Area Permissions (non-lifecycle)

#### Scenario: Functional permission definitions

- **WHEN** the boost plugin registers permissions
- **THEN** the following functional permissions are also registered:
  | Permission | Action | Gates |
  |---|---|---|
  | `augment.chat.read` | read | View chat interface, read messages |
  | `augment.chat.create` | create | Send messages, start sessions |
  | `augment.documents.manage` | update | Upload documents, sync RAG sources |
  | `augment.mcp.manage` | update | Configure MCP servers |
  | `augment.config.manage` | update | Modify admin configuration |
- **AND** these supplement the lifecycle permissions for comprehensive coverage
