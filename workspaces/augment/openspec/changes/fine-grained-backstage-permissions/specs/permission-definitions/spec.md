# Spec: permission-definitions

Fine-grained permission constants, resource types, and permission rule definitions for augment agent and tool governance.

### Scope

This spec defines two tiers of fine-grained permissions:

1. **Resource-based permissions** for agents and tools — these have the most nuanced authorization requirements (ownership scoping, self-approval prevention, lifecycle stage gating, filtered visibility) and support conditional rules (`IS_OWNER`, `IS_NOT_CREATOR`, `HAS_LIFECYCLE_STAGE`).
2. **Basic permissions** for infrastructure resources (vector stores, documents, MCP connections, prompts, models) — these are currently admin-only operations without ownership or lifecycle logic. Defining permissions for them now enables deployers to grant targeted access (e.g., "this team can manage vector stores but not MCP connections") instead of the all-or-nothing `augment.admin`. These can be upgraded to resource-based permissions later if ownership tracking is added.

## ADDED Requirements

### Requirement: Agent resource type

The system SHALL define a resource type constant `RESOURCE_TYPE_AUGMENT_AGENT` with value `augment-agent` in `augment-common`.

#### Scenario: Agent resource type exported

- **WHEN** a consumer imports from `augment-common`
- **THEN** the `RESOURCE_TYPE_AUGMENT_AGENT` constant SHALL be available with value `augment-agent`

### Requirement: Tool resource type

The system SHALL define a resource type constant `RESOURCE_TYPE_AUGMENT_TOOL` with value `augment-tool` in `augment-common`.

#### Scenario: Tool resource type exported

- **WHEN** a consumer imports from `augment-common`
- **THEN** the `RESOURCE_TYPE_AUGMENT_TOOL` constant SHALL be available with value `augment-tool`

### Requirement: Agent permissions

The system SHALL define the following agent permissions using `createPermission` with resource type `augment-agent`:

| Permission ID             | Action                         |
| ------------------------- | ------------------------------ |
| `augment.agent.list`      | read (basic, no resource type) |
| `augment.agent.register`  | create                         |
| `augment.agent.promote`   | update                         |
| `augment.agent.approve`   | update                         |
| `augment.agent.demote`    | update                         |
| `augment.agent.publish`   | update                         |
| `augment.agent.unpublish` | update                         |
| `augment.agent.withdraw`  | update                         |
| `augment.agent.delete`    | delete                         |
| `augment.agent.configure` | update                         |

The `augment.agent.list` permission SHALL be a basic permission (no resource type) for performance reasons.

#### Scenario: All agent permissions defined

- **WHEN** the `augment-common` package is loaded
- **THEN** all 10 agent permissions SHALL be defined with correct action types and resource types

#### Scenario: Agent list is basic permission

- **WHEN** `augment.agent.list` is evaluated
- **THEN** it SHALL be a basic permission without a resource type, returning ALLOW or DENY without conditional evaluation

### Requirement: Tool permissions

The system SHALL define the following tool permissions using `createPermission` with resource type `augment-tool`:

| Permission ID            | Action |
| ------------------------ | ------ |
| `augment.tool.promote`   | update |
| `augment.tool.approve`   | update |
| `augment.tool.demote`    | update |
| `augment.tool.publish`   | update |
| `augment.tool.unpublish` | update |

#### Scenario: All tool permissions defined

- **WHEN** the `augment-common` package is loaded
- **THEN** all 5 tool permissions SHALL be defined with action `update` and resource type `augment-tool`

### Requirement: Kagenti infrastructure permission

The system SHALL define `augment.kagenti.admin` as a basic permission with action `update` for gating Kagenti infrastructure routes.

#### Scenario: Kagenti admin permission defined

- **WHEN** the `augment-common` package is loaded
- **THEN** `augment.kagenti.admin` SHALL be a basic permission with action `update`

### Requirement: Infrastructure resource permissions

The system SHALL define the following basic permissions (no resource type) for infrastructure operations that are currently gated by `augment.admin`:

| Permission ID                | Action | Gates                                                       |
| ---------------------------- | ------ | ----------------------------------------------------------- |
| `augment.vectorstore.manage` | update | Vector store CRUD (create, connect, disconnect, delete)     |
| `augment.document.manage`    | update | Document upload and deletion within vector stores           |
| `augment.mcp.manage`         | update | MCP connection testing, tool creation, deletion, and builds |
| `augment.prompt.manage`      | update | System prompt generation and configuration                  |
| `augment.model.manage`       | update | Model listing, testing, and selection configuration         |

These are basic permissions without conditional rules. Each gates a category of admin operations, enabling deployers to grant targeted access without granting full `augment.admin`.

#### Scenario: All infrastructure permissions defined

- **WHEN** the `augment-common` package is loaded
- **THEN** all 5 infrastructure permissions SHALL be defined as basic permissions with action `update`

#### Scenario: Infrastructure permissions independent of augment.admin

- **WHEN** a user has `augment.vectorstore.manage` but not `augment.admin`
- **THEN** the user SHALL be able to manage vector stores but not other admin operations

### Requirement: Existing permissions preserved

The existing `augmentAccessPermission` (`augment.access`) and `augmentAdminPermission` (`augment.admin`) SHALL remain unchanged. All 21 new permissions SHALL be added to the `augmentPermissions` array alongside the existing ones. `augment.admin` continues to gate routes not yet covered by fine-grained permissions (evaluations, workflows, dev spaces) and serves as an opt-in fallback for fine-grained operations when `permissions.legacyAdminFallback` is enabled.

#### Scenario: Backward-compatible exports

- **WHEN** a consumer imports `augmentAccessPermission` or `augmentAdminPermission` from `augment-common`
- **THEN** the permissions SHALL have identical definitions and behavior as before

### Requirement: IS_OWNER permission rule

The system SHALL define an `IS_OWNER` permission rule that evaluates to ALLOW when `resource.createdBy` matches the requesting user's entity ref. The rule SHALL take no configuration parameters — the user ref is injected at evaluation time.

#### Scenario: Owner match

- **WHEN** `IS_OWNER` is evaluated for a resource where `createdBy` equals the requesting user's entity ref
- **THEN** the rule SHALL evaluate to ALLOW

#### Scenario: Non-owner

- **WHEN** `IS_OWNER` is evaluated for a resource where `createdBy` does not equal the requesting user's entity ref
- **THEN** the rule SHALL evaluate to DENY

### Requirement: IS_NOT_CREATOR permission rule

The system SHALL define an `IS_NOT_CREATOR` permission rule that evaluates to ALLOW when `resource.createdBy` does NOT match the requesting user's entity ref. This enables self-approval prevention via RBAC policy.

#### Scenario: Different user can approve

- **WHEN** `IS_NOT_CREATOR` is evaluated for a resource where `createdBy` does not equal the requesting user's entity ref
- **THEN** the rule SHALL evaluate to ALLOW

#### Scenario: Creator cannot self-approve

- **WHEN** `IS_NOT_CREATOR` is evaluated for a resource where `createdBy` equals the requesting user's entity ref
- **THEN** the rule SHALL evaluate to DENY

### Requirement: HAS_LIFECYCLE_STAGE permission rule

The system SHALL define a `HAS_LIFECYCLE_STAGE` permission rule that evaluates to ALLOW when the resource's lifecycle stage is included in the configured `stages` array parameter.

#### Scenario: Stage matches

- **WHEN** `HAS_LIFECYCLE_STAGE` is evaluated with `stages: ["draft"]` for a resource in `draft` stage
- **THEN** the rule SHALL evaluate to ALLOW

#### Scenario: Stage does not match

- **WHEN** `HAS_LIFECYCLE_STAGE` is evaluated with `stages: ["draft"]` for a resource in `published` stage
- **THEN** the rule SHALL evaluate to DENY

### Requirement: Permission rules follow extensions-backend pattern

The permission rules SHALL use `createPermissionRule` and `createPermissionResourceRef` from `@backstage/plugin-permission-node`, following the same pattern as `extensions-backend/src/permissions/rules.ts`.

#### Scenario: Rule API compatibility

- **WHEN** the permission integration router is created with the augment rules
- **THEN** the rules SHALL be compatible with `createPermissionIntegrationRouter` from `@backstage/plugin-permission-node`
