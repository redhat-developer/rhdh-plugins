# Spec: authorization-middleware

Augment-specific authorization middleware that integrates Backstage's permission framework with the plugin's domain model (agents, tools, lifecycle stages, ownership). This is NOT a reimplementation of RBAC policy evaluation — the RBAC plugin handles that. This middleware provides:

1. **Opt-in legacy fallback logic** — when `augment.permissions.legacyAdminFallback` is enabled, check fine-grained permission first, then fall back to `augment.admin` for backward compatibility during migration. When disabled (the default), only fine-grained permissions are evaluated. This is augment-specific business logic that the RBAC plugin cannot provide, since the fallback semantics (which coarse permission to check, when to check it) are domain decisions.
2. **Conditional evaluation against augment resource types** — `matchesAgentConditions` and `matchesToolConditions` evaluate Backstage CONDITIONAL results against augment's domain objects (agents/tools with `createdBy`, lifecycle stages). The RBAC plugin evaluates policies; these utilities evaluate the resulting conditions against augment-specific resource shapes.
3. **RouteContext integration** — exposing authorization functions on the route context so handlers can call them without importing permission utilities directly.

### Relationship to existing permissions

- **`augment.access`** remains unchanged — it is a plugin-level visibility gate (can the user access the augment plugin at all?) and is orthogonal to fine-grained lifecycle permissions.
- **`augment.admin`** continues to gate admin-only routes (evaluations, workflows, dev spaces) that are not yet covered by fine-grained permissions. For agent/tool lifecycle operations and infrastructure resources (vector stores, documents, MCP, prompts, models), it can serve as a backward-compatible fallback when `augment.permissions.legacyAdminFallback` is enabled in the plugin config. By default, only fine-grained permissions are evaluated — deployments must configure the appropriate fine-grained RBAC policies.

## ADDED Requirements

### Requirement: authorizeLifecycleAction function

The system SHALL provide an `authorizeLifecycleAction(req, permission, resource?)` function that implements authorization with opt-in legacy fallback:

1. Evaluate the fine-grained permission (with conditional rules if resource-based)
2. If ALLOW, grant access
3. If DENY and `augment.permissions.legacyAdminFallback` is enabled, fall back to checking `augment.admin`
4. If fallback is enabled and `augment.admin` is ALLOW, grant access
5. Otherwise, deny access

#### Scenario: Fine-grained permission allows

- **WHEN** `authorizeLifecycleAction` is called and the fine-grained permission evaluates to ALLOW
- **THEN** access SHALL be granted without checking `augment.admin`

#### Scenario: Fine-grained denies, fallback enabled, admin allows

- **WHEN** `authorizeLifecycleAction` is called, the fine-grained permission evaluates to DENY, `augment.permissions.legacyAdminFallback` is enabled, and `augment.admin` evaluates to ALLOW
- **THEN** access SHALL be granted via the fallback

#### Scenario: Fine-grained denies, fallback disabled

- **WHEN** `authorizeLifecycleAction` is called, the fine-grained permission evaluates to DENY, and `augment.permissions.legacyAdminFallback` is not enabled
- **THEN** access SHALL be denied without checking `augment.admin`

#### Scenario: Both deny with fallback enabled

- **WHEN** `authorizeLifecycleAction` is called, `augment.permissions.legacyAdminFallback` is enabled, and both the fine-grained permission and `augment.admin` evaluate to DENY
- **THEN** access SHALL be denied

### Requirement: Conditional permission evaluation

When `authorizeLifecycleAction` receives a CONDITIONAL result from `PermissionService.authorizeConditional`, it SHALL apply the returned conditions as a filter against the provided resource using `matchesAgentConditions` or `matchesToolConditions` based on the resource type. This follows the same pattern as the [catalog plugin's conditional authorization](https://github.com/backstage/backstage/blob/master/plugins/catalog-backend/src/service/AuthorizedEntitiesCatalog.ts#L207:L237) — conditions are filters, not boolean checks.

#### Scenario: Conditional result where resource satisfies conditions

- **WHEN** the permission framework returns CONDITIONAL with an `IS_OWNER` condition, and the resource's `createdBy` matches the requesting user
- **THEN** the resource SHALL satisfy the condition filter and the operation SHALL proceed

#### Scenario: Conditional result where resource does not satisfy conditions

- **WHEN** the permission framework returns CONDITIONAL with an `IS_OWNER` condition, and the resource's `createdBy` does not match the requesting user
- **THEN** the resource SHALL NOT satisfy the condition filter and, if `augment.permissions.legacyAdminFallback` is enabled, the system SHALL fall back to `augment.admin`; otherwise access SHALL be denied

### Requirement: authorizeBasicWithFallback function

The system SHALL provide an `authorizeBasicWithFallback(req, permission)` function for basic (non-resource) permissions that checks the given permission first. If DENY and `augment.permissions.legacyAdminFallback` is enabled, it falls back to `augment.admin`.

#### Scenario: Basic permission allows

- **WHEN** `authorizeBasicWithFallback` is called and the basic permission evaluates to ALLOW
- **THEN** access SHALL be granted

#### Scenario: Basic permission denies, fallback enabled, admin allows

- **WHEN** `authorizeBasicWithFallback` is called, the basic permission evaluates to DENY, `augment.permissions.legacyAdminFallback` is enabled, and `augment.admin` evaluates to ALLOW
- **THEN** access SHALL be granted via the fallback

#### Scenario: Basic permission denies, fallback disabled

- **WHEN** `authorizeBasicWithFallback` is called, the basic permission evaluates to DENY, and `augment.permissions.legacyAdminFallback` is not enabled
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
