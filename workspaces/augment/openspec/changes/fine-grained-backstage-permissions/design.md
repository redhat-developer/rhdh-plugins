# Design: Fine-Grained Backstage Permissions for Augment Lifecycle Governance

## Context

The augment plugin currently enforces 12+ authorization decisions via custom inline guards in route handlers — `checkIsAdmin`, `createdBy` comparisons, lifecycle stage checks, and self-approval prevention. These bypass Backstage's permission framework entirely. Only two coarse permissions exist (`augment.access` for read, `augment.admin` for admin operations), making fine-grained RBAC impossible.

Backstage provides a permission framework (`@backstage/plugin-permission-node`) supporting basic permissions, resource-based permissions with conditional rules, and policy evaluation via the permission backend. The `extensions-backend` plugin in this workspace already follows this pattern and serves as a reference implementation.

These permissions are independent of AgenticProvider authorization. Kagenti's per-user RBAC (via RFC 8693 token exchange) and OpenAI's organization RBAC govern access to external AI services. The permissions defined here govern access within the augment plugin's own governance system — lifecycle state transitions, ownership-scoped operations, self-approval prevention, and visibility filtering. The two layers operate on different verbs, different resources, and different data stores.

## Goals / Non-Goals

**Goals:**

- Replace all 12+ inline authorization decisions with Backstage permission framework calls
- Enable deployers to configure fine-grained RBAC policies for agent and tool lifecycle operations
- Maintain full backward compatibility — existing `augment.access` + `augment.admin` policies continue to work unchanged
- Support conditional permission rules for ownership checks, self-approval prevention, and lifecycle stage gating
- Keep self-approval prevention as defense-in-depth (permission rule supplements hard-coded check)

**Non-Goals:**

- Modifying `augment.access` or `augment.admin` behavior or semantics
- Adding permissions for AgenticProvider-level operations (Kagenti API calls, OpenAI API calls)
- Frontend permission checks (backend-only enforcement)
- Custom permission policy plugins (works with standard Backstage RBAC)
- Removing the hard-coded self-approval prevention check (kept as defense-in-depth alongside the `IS_NOT_CREATOR` rule)

## Decisions

### Decision 1: Separate resource types for agents and tools

Define `augment-agent` and `augment-tool` as distinct resource types rather than a single `augment-resource` type. Agents and tools have different route handlers, different lifecycle transitions, and deployers may want independent RBAC scoping.

**Alternative considered:** Single `augment-resource` type with a discriminator field. Rejected because it conflates two domain objects that are independently routed and independently targetable by policy.

### Decision 2: Two-tier authorization with backward-compatible fallback

`authorizeLifecycleAction` checks the fine-grained permission first. If DENY (the default when no policy exists), it falls back to checking `augment.admin`. This means deployments that haven't configured fine-grained policies get identical behavior to today.

**Alternative considered:** Requiring all deployments to update their RBAC policies. Rejected because it would break every existing augment deployment on upgrade.

**Alternative considered:** OR-combining fine-grained and admin in a single policy evaluation. Rejected because Backstage's permission framework evaluates permissions individually — the fallback must be explicit in code.

### Decision 3: Self-approval prevention as defense-in-depth

The `IS_NOT_CREATOR` permission rule enables RBAC-level self-approval prevention, but the existing hard-coded check (`createdBy !== userRef`) is retained. The hard-coded check is the primary guard; the permission rule allows deployers to customize or relax the policy via RBAC if desired.

**Alternative considered:** Removing the hard-coded check entirely and relying solely on the permission rule. Rejected because a misconfigured RBAC policy could silently disable self-approval prevention — defense-in-depth is safer for a governance control.

### Decision 4: Visibility filtering via basic permission

`augment.agent.list` is a basic (non-resource) permission that controls visibility: ALLOW shows all agents, DENY filters to published + user's own agents. This avoids evaluating resource-based conditions against every agent in the list.

**Alternative considered:** Resource-based permission evaluated per-agent in list responses. Rejected due to performance — evaluating conditional rules against potentially hundreds of agents per list request is expensive and unnecessary when the distinction is binary (admin vs. filtered view).

### Decision 5: Permission rules modeled on extensions-backend pattern

Permission rules (`IS_OWNER`, `IS_NOT_CREATOR`, `HAS_LIFECYCLE_STAGE`) follow the exact pattern from `extensions-backend/src/permissions/rules.ts` — same `createPermissionRule` API, same `createPermissionResourceRef` for resource loading, same conditional evaluation utilities. This keeps the codebase consistent and reduces review friction.

## Risks / Trade-offs

- **Policy migration complexity** → Deployers who want fine-grained control must write new RBAC policies. Mitigated by the fallback mechanism — no action required to maintain current behavior.
- **Conditional evaluation overhead** → Resource-based permissions require loading the resource to evaluate conditions. Mitigated by keeping list operations as basic permissions and only using resource-based permissions for mutation routes where the resource is already loaded.
- **Rule mismatch on upgrade** → If a deployer configures a fine-grained policy with a `HAS_LIFECYCLE_STAGE` condition referencing a stage name that changes, the rule silently denies. Mitigated by documenting stage names as part of the permission contract.
- **Defense-in-depth dual check** → The self-approval hard-coded check and `IS_NOT_CREATOR` rule are redundant by design. If one is relaxed without updating the other, behavior may be confusing. Mitigated by documenting this clearly.
