# Fine-Grained Permissions

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

Implement 16 fine-grained Backstage permissions across 2 resource types with conditional rules, using `permissions.authorize()` as the sole authorization mechanism. All authorization decisions go through Backstage RBAC from day one — no custom route-level governance layer.

## ADDED Requirements

### Requirement: Agent Lifecycle Permissions (Resource-Based)

RBAC policies MUST govern agent lifecycle transitions with ownership and separation-of-duties rules.

#### Scenario: Agent permission definitions

- **WHEN** the boost plugin registers permissions via `permissionsRegistry.addPermissions()`
- **THEN** the following agent permissions are registered:
  | Permission | Resource Type | Conditional Rules | Gates |
  |---|---|---|---|
  | `boost.agent.list` | `boost-agent` | `IS_OWNER`, `HAS_LIFECYCLE_STAGE` | View agent list (visibility filtering) |
  | `boost.agent.register` | — | — | Register an agent for governance |
  | `boost.agent.promote` | `boost-agent` | `IS_OWNER`, `HAS_LIFECYCLE_STAGE` | Submit draft for review (draft→pending) |
  | `boost.agent.approve` | `boost-agent` | `IS_NOT_CREATOR`, `HAS_LIFECYCLE_STAGE` | Approve pending (pending→published) |
  | `boost.agent.demote` | `boost-agent` | — | Reject, request-unpublish, approve-unpublish |
  | `boost.agent.publish` | `boost-agent` | — | Publish an approved agent |
  | `boost.agent.unpublish` | `boost-agent` | `IS_OWNER` | Request unpublishing |
  | `boost.agent.withdraw` | `boost-agent` | `IS_OWNER` | Withdraw pending submission |
  | `boost.agent.delete` | `boost-agent` | `IS_OWNER`, `HAS_LIFECYCLE_STAGE` | Delete agent |
  | `boost.agent.configure` | — | — | Edit agent configuration |

#### Scenario: Conditional list filtering (3-tier evaluation)

- **WHEN** `boost.agent.list` is evaluated via `permissions.authorize()`
- **THEN** the permission returns one of three results:
  - **ALLOW** — return all agents (no filtering)
  - **DENY** — return no agents (empty list)
  - **CONDITIONAL** — attach conditions to the request for the handler to apply as filters
- **AND** deployers can configure visibility rules via RBAC policies (e.g., `IS_OWNER` to show only the user's own agents, `HAS_LIFECYCLE_STAGE` to show only published agents)
- **AND** this aligns with the augment workspace's `augment.agent.list` design (PR #3331), enabling a shared 3-tier evaluation model across both workspaces

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

RBAC policies MUST govern Kagenti tool lifecycle transitions. The `boost-tool` resource type represents Kagenti tools (K8s workloads with lifecycle governance) — not MCP servers or MCP tools. MCP servers are registered endpoints without lifecycle permissions; MCP tools are runtime-discovered children of MCP servers with no independent lifecycle.

#### Scenario: Tool permission definitions

- **WHEN** the boost plugin registers permissions
- **THEN** the following tool permissions are registered:
  | Permission | Resource Type | Conditional Rules | Gates |
  |---|---|---|---|
  | `boost.tool.promote` | `boost-tool` | `IS_OWNER` | Promote tool lifecycle |
  | `boost.tool.approve` | `boost-tool` | `IS_NOT_CREATOR` | Approve tool promotion |
  | `boost.tool.demote` | `boost-tool` | — | Demote tool lifecycle stage |
  | `boost.tool.publish` | `boost-tool` | — | Publish a tool |
  | `boost.tool.unpublish` | `boost-tool` | — | Unpublish a tool |

### Requirement: Infrastructure Permissions

Infrastructure operations MUST be gated by dedicated Backstage permissions.

#### Scenario: Kagenti admin permission

- **WHEN** a user accesses Kagenti infrastructure operations
- **THEN** `boost.kagenti.admin` permission is checked
- **AND** this covers namespace management, build pipelines, sandbox, and platform links

### Requirement: Conditional Permission Rules

Three conditional rules MUST evaluate loaded resources during permission checks.

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

Existing 2-permission deployments MUST continue to work without policy changes.

#### Scenario: Fine-grained permissions as primary authorization

- **WHEN** a lifecycle or admin action is invoked
- **THEN** the specific fine-grained permission is checked via `permissions.authorize()`
- **AND** `boost.access` serves as a top-level gate (if denied, all sub-permissions are denied)
- **AND** `boost.admin` is available for deployments that prefer coarse-grained admin control

### Requirement: Route-Level Authorization Middleware

A shared middleware MUST replace scattered route-level guards.

#### Scenario: authorizeLifecycleAction middleware

- **WHEN** a lifecycle route is invoked (promote, approve, demote, delete, etc.)
- **THEN** `authorizeLifecycleAction(permission, resourceLoader)` middleware:
  1. Loads the resource (agent or tool)
  2. Calls `permissions.authorize()` with the fine-grained permission and resource
  3. On DENY, falls back to `boost.admin`
  4. On both DENY, returns 403
- **AND** this replaces the per-route `checkIsAdmin` + `getUserRef` + ownership patterns

### Requirement: Permission Registration Best Practices

Permission constants MUST follow Backstage registration best practices.

#### Scenario: Permissions exported from common package

- **WHEN** permission constants are needed by frontend or backend
- **THEN** they are exported from `@red-hat-developer-hub/backstage-plugin-boost-common`
- **AND** basic permissions use `createPermission` from `@backstage/plugin-permission-common`
- **AND** resource permissions use `createResourcePermission` with resource types `boost-agent` and `boost-tool`

### Requirement: Functional Area Permissions (non-lifecycle)

Non-lifecycle functional areas MUST have dedicated permissions for access control.

#### Scenario: Functional permission definitions

- **WHEN** the boost plugin registers permissions
- **THEN** the following functional permissions are also registered:
  | Permission | Action | Gates |
  |---|---|---|
  | `boost.chat.read` | read | View chat interface, read messages |
  | `boost.chat.create` | create | Send messages, start sessions |
  | `boost.documents.manage` | update | Upload documents, sync RAG sources |
  | `boost.mcp.manage` | update | Configure MCP servers |
  | `boost.config.manage` | update | Modify admin configuration |
- **AND** these supplement the lifecycle permissions for comprehensive coverage

### Requirement: Augment Design Alignment

Boost and Augment MUST share the same permission evaluation model for agent list endpoints.

#### Scenario: Shared 3-tier evaluation model

- **WHEN** either `boost.agent.list` or `augment.agent.list` is evaluated
- **THEN** both use the resource-based permission pattern with 3-tier evaluation (ALLOW/DENY/CONDITIONAL)
- **AND** both define their list permission with a resource type (`boost-agent` / `augment-agent`)
- **AND** both support `IS_OWNER` and `HAS_LIFECYCLE_STAGE` conditional rules for visibility filtering
- **AND** the `authorizeLifecycleAction` middleware handles CONDITIONAL results by attaching conditions to the request for the route handler to apply as filters
