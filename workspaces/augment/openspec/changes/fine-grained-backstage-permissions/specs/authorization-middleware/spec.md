# Spec: authorization-middleware

Augment-specific authorization middleware that integrates Backstage's permission framework with the plugin's domain model (agents, tools, lifecycle stages, ownership). This is NOT a reimplementation of RBAC policy evaluation — the RBAC plugin handles that. This middleware provides:

1. **Opt-in legacy fallback logic** — when `permissions.legacyAdminFallback` is enabled, check fine-grained permission first, then fall back to `augment.admin` for backward compatibility during migration. When disabled (the default), only fine-grained permissions are evaluated. This is augment-specific business logic that the RBAC plugin cannot provide, since the fallback semantics (which coarse permission to check, when to check it) are domain decisions.
2. **Conditional evaluation against augment resource types** — `matchesAgentConditions` and `matchesToolConditions` evaluate Backstage CONDITIONAL results against augment's domain objects (agents/tools with `createdBy`, lifecycle stages). The RBAC plugin evaluates policies; these utilities evaluate the resulting conditions against augment-specific resource shapes.
3. **RouteContext integration** — exposing authorization functions on the route context so handlers can call them without importing permission utilities directly.

### Relationship to existing permissions

- **`augment.access`** remains unchanged — it is a plugin-level visibility gate (can the user access the augment plugin at all?) and is orthogonal to fine-grained lifecycle permissions.
- **`augment.admin`** continues to gate admin-only routes (evaluations, workflows, dev spaces) that are not yet covered by fine-grained permissions. For agent/tool lifecycle operations and infrastructure resources (vector stores, documents, MCP, prompts, models), it can serve as a backward-compatible fallback when `permissions.legacyAdminFallback` is enabled in the plugin config. By default, only fine-grained permissions are evaluated — deployments must configure the appropriate fine-grained RBAC policies.

## ADDED Requirements

### Requirement: authorizeLifecycleAction function

The system SHALL provide an `authorizeLifecycleAction(req, permission, resource?)` function that implements authorization with opt-in legacy fallback:

1. Evaluate the fine-grained permission (with conditional rules if resource-based)
2. If ALLOW, grant access
3. If DENY and `permissions.legacyAdminFallback` is enabled, fall back to checking `augment.admin`
4. If fallback is enabled and `augment.admin` is ALLOW, grant access
5. Otherwise, deny access

#### Scenario: Fine-grained permission allows

- **WHEN** `authorizeLifecycleAction` is called and the fine-grained permission evaluates to ALLOW
- **THEN** access SHALL be granted without checking `augment.admin`

#### Scenario: Fine-grained denies, fallback enabled, admin allows

- **WHEN** `authorizeLifecycleAction` is called, the fine-grained permission evaluates to DENY, `permissions.legacyAdminFallback` is enabled, and `augment.admin` evaluates to ALLOW
- **THEN** access SHALL be granted via the fallback

#### Scenario: Fine-grained denies, fallback disabled

- **WHEN** `authorizeLifecycleAction` is called, the fine-grained permission evaluates to DENY, and `permissions.legacyAdminFallback` is not enabled
- **THEN** access SHALL be denied without checking `augment.admin`

#### Scenario: Both deny with fallback enabled

- **WHEN** `authorizeLifecycleAction` is called, `permissions.legacyAdminFallback` is enabled, and both the fine-grained permission and `augment.admin` evaluate to DENY
- **THEN** access SHALL be denied

### Requirement: Conditional permission evaluation

When `authorizeLifecycleAction` receives a CONDITIONAL result from the permission framework, it SHALL evaluate the conditions against the provided resource using `matchesAgentConditions` or `matchesToolConditions` based on the resource type.

#### Scenario: Conditional result with matching resource

- **WHEN** the permission framework returns CONDITIONAL with an `IS_OWNER` condition, and the resource's `createdBy` matches the requesting user
- **THEN** `authorizeLifecycleAction` SHALL evaluate the condition to ALLOW

#### Scenario: Conditional result with non-matching resource

- **WHEN** the permission framework returns CONDITIONAL with an `IS_OWNER` condition, and the resource's `createdBy` does not match the requesting user
- **THEN** `authorizeLifecycleAction` SHALL evaluate the condition to DENY and, if `permissions.legacyAdminFallback` is enabled, fall back to `augment.admin`

### Requirement: authorizeBasicWithFallback function

The system SHALL provide an `authorizeBasicWithFallback(req, permission)` function for basic (non-resource) permissions that checks the given permission first. If DENY and `permissions.legacyAdminFallback` is enabled, it falls back to `augment.admin`.

#### Scenario: Basic permission allows

- **WHEN** `authorizeBasicWithFallback` is called and the basic permission evaluates to ALLOW
- **THEN** access SHALL be granted

#### Scenario: Basic permission denies, fallback enabled, admin allows

- **WHEN** `authorizeBasicWithFallback` is called, the basic permission evaluates to DENY, `permissions.legacyAdminFallback` is enabled, and `augment.admin` evaluates to ALLOW
- **THEN** access SHALL be granted via the fallback

#### Scenario: Basic permission denies, fallback disabled

- **WHEN** `authorizeBasicWithFallback` is called, the basic permission evaluates to DENY, and `permissions.legacyAdminFallback` is not enabled
- **THEN** access SHALL be denied without checking `augment.admin`

### Requirement: Authorization functions on RouteContext

The `authorizeLifecycleAction` and `authorizeBasicWithFallback` functions SHALL be available on `RouteContext` so route handlers can call them without importing permission utilities directly.

#### Scenario: Route handler uses RouteContext authorization

- **WHEN** a route handler needs to authorize a lifecycle action
- **THEN** it SHALL call `ctx.authorizeLifecycleAction(req, permission, resource)` from the `RouteContext`

### Requirement: Permission conditional evaluation utilities

The system SHALL provide `matchesAgentConditions(resource, conditions)` and `matchesToolConditions(resource, conditions)` utilities that evaluate Backstage permission conditional results against loaded agent or tool resources. These SHALL follow the pattern from `extensions-backend/src/utils/permissionUtils.ts`.

#### Scenario: Agent condition evaluation

- **WHEN** `matchesAgentConditions` is called with an agent resource and a set of conditions
- **THEN** it SHALL evaluate all conditions against the agent's properties and return a boolean result

### Requirement: Audit logging for authorization decisions

The `authorizeLifecycleAction` and `authorizeBasicWithFallback` functions SHALL emit a structured audit log entry for every authorization decision. Each entry SHALL include:

- `user` — the requesting user's entity ref
- `action` — the permission ID evaluated (e.g., `augment.agent.approve`)
- `resource` — the resource identifier (agent/tool ID), if applicable
- `outcome` — `allow` or `deny`
- `grantedVia` — `permission` (fine-grained permission allowed), `fallback` (`augment.admin` fallback allowed), or `denied` (both denied)

#### Scenario: Audit log on fine-grained allow

- **WHEN** `authorizeLifecycleAction` grants access via the fine-grained permission
- **THEN** an audit log entry SHALL be emitted with `grantedVia: permission`

#### Scenario: Audit log on fallback allow

- **WHEN** `authorizeLifecycleAction` grants access via the `augment.admin` fallback
- **THEN** an audit log entry SHALL be emitted with `grantedVia: fallback`

#### Scenario: Audit log on deny

- **WHEN** `authorizeLifecycleAction` denies access
- **THEN** an audit log entry SHALL be emitted with `grantedVia: denied`
