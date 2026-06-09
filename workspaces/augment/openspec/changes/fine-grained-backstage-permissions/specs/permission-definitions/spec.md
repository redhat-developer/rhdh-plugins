# Spec: permission-definitions

Fine-grained permission constants, resource types, and permission rule definitions for augment agent and tool governance.

### Scope: Why agents and tools first

This spec defines fine-grained permissions for **agent and tool lifecycle operations** because these are the authorization decisions with the most nuanced requirements — ownership scoping, self-approval prevention, lifecycle stage gating, and filtered visibility. These are currently enforced via inline checks (`checkIsAdmin`, `createdBy` comparisons) that bypass the Backstage permission framework entirely.

Other admin-only operations (config CRUD, document management, vector stores, models, evaluations, workflows, dev spaces) remain gated by the existing `augment.admin` permission. These are genuinely admin-only operations without ownership or conditional logic — the coarse gate is appropriate and adding fine-grained permissions for them today would increase surface area without clear demand. They are candidates for future fine-grained permissions if deployer requirements emerge (e.g., separating "can manage documents" from "can manage evaluations").

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

### Requirement: Existing permissions preserved

The existing `augmentAccessPermission` (`augment.access`) and `augmentAdminPermission` (`augment.admin`) SHALL remain unchanged. All 16 new permissions SHALL be added to the `augmentPermissions` array alongside the existing ones.

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
