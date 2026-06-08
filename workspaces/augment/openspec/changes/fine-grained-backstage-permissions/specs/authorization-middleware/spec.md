# Spec: authorization-middleware

Two-tier authorization abstraction with fine-grained permission check and backward-compatible fallback to `augment.admin`.

## ADDED Requirements

### Requirement: authorizeLifecycleAction function

The system SHALL provide an `authorizeLifecycleAction(req, permission, resource?)` function that implements two-tier authorization:

1. Evaluate the fine-grained permission (with conditional rules if resource-based)
2. If ALLOW, grant access
3. If DENY, fall back to checking `augment.admin`
4. If `augment.admin` is ALLOW, grant access
5. Otherwise, deny access

#### Scenario: Fine-grained permission allows

- **WHEN** `authorizeLifecycleAction` is called and the fine-grained permission evaluates to ALLOW
- **THEN** access SHALL be granted without checking `augment.admin`

#### Scenario: Fine-grained denies but admin allows

- **WHEN** `authorizeLifecycleAction` is called, the fine-grained permission evaluates to DENY, and `augment.admin` evaluates to ALLOW
- **THEN** access SHALL be granted via the fallback

#### Scenario: Both deny

- **WHEN** `authorizeLifecycleAction` is called and both the fine-grained permission and `augment.admin` evaluate to DENY
- **THEN** access SHALL be denied

### Requirement: Conditional permission evaluation

When `authorizeLifecycleAction` receives a CONDITIONAL result from the permission framework, it SHALL evaluate the conditions against the provided resource using `matchesAgentConditions` or `matchesToolConditions` based on the resource type.

#### Scenario: Conditional result with matching resource

- **WHEN** the permission framework returns CONDITIONAL with an `IS_OWNER` condition, and the resource's `createdBy` matches the requesting user
- **THEN** `authorizeLifecycleAction` SHALL evaluate the condition to ALLOW

#### Scenario: Conditional result with non-matching resource

- **WHEN** the permission framework returns CONDITIONAL with an `IS_OWNER` condition, and the resource's `createdBy` does not match the requesting user
- **THEN** `authorizeLifecycleAction` SHALL evaluate the condition to DENY and fall back to `augment.admin`

### Requirement: authorizeBasicWithFallback function

The system SHALL provide an `authorizeBasicWithFallback(req, permission)` function for basic (non-resource) permissions that checks the given permission first, then falls back to `augment.admin` on DENY.

#### Scenario: Basic permission allows

- **WHEN** `authorizeBasicWithFallback` is called and the basic permission evaluates to ALLOW
- **THEN** access SHALL be granted

#### Scenario: Basic permission denies with admin fallback

- **WHEN** `authorizeBasicWithFallback` is called, the basic permission evaluates to DENY, and `augment.admin` evaluates to ALLOW
- **THEN** access SHALL be granted

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
