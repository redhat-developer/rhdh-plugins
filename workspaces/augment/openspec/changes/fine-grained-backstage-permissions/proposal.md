# Proposal: Fine-Grained Backstage Permissions for Augment Lifecycle Governance

## Why

The augment plugin has 12+ authorization decisions implemented as custom route-level guards (`checkIsAdmin`, `createdBy` comparisons, lifecycle stage checks, self-approval prevention) that bypass Backstage's permission framework. Only 2 coarse permissions exist today (`augment.access`, `augment.admin`), making it impossible for RBAC policies to distinguish who can chat vs. manage agents vs. approve lifecycle transitions. This prevents deployers from implementing separation of duties, ownership-scoped operations, or stage-gated workflows through standard Backstage RBAC configuration.

## What Changes

- 16 new fine-grained permissions across agent, tool, and Kagenti infrastructure domains — each mapping to a specific authorization decision currently handled by inline code
- 2 new resource types (`augment-agent`, `augment-tool`) enabling conditional permission rules scoped to individual resources
- 3 permission rules (`IS_OWNER`, `IS_NOT_CREATOR`, `HAS_LIFECYCLE_STAGE`) for ownership, self-approval prevention, and stage-gated operations
- New authorization abstraction (`authorizeLifecycleAction`) implementing a two-tier check: fine-grained permission first, fallback to `augment.admin` for backward compatibility
- Refactoring of all 12+ inline authorization decisions in route handlers to use the permission framework
- Permission integration router registered with both resource types and all rules

## Capabilities

### New Capabilities

- `permission-definitions`: Fine-grained permission constants, resource types, and permission rule definitions for the augment plugin's agent and tool governance domains
- `authorization-middleware`: Two-tier authorization abstraction that checks fine-grained permissions first with conditional rule evaluation, falling back to `augment.admin` for backward compatibility
- `route-authorization`: Replacement of all inline route-level authorization guards with permission framework calls across agent, tool, and Kagenti infrastructure routes

### Modified Capabilities

## Impact

- `plugins/augment-common/src/permissions.ts` — 16 new permissions, 2 resource types
- `plugins/augment-common/src/index.ts` — new exports
- `plugins/augment-backend/src/permissions/rules.ts` — **new file**, 3 permission rules
- `plugins/augment-backend/src/permissions/permissionUtils.ts` — **new file**, conditional evaluation utilities
- `plugins/augment-backend/src/permissions/index.ts` — **new file**, barrel export
- `plugins/augment-backend/src/middleware/security.ts` — `authorizeLifecycleAction`, `authorizeBasicWithFallback`
- `plugins/augment-backend/src/routes/types.ts` — new authorization functions on `RouteContext`
- `plugins/augment-backend/src/routes/agentRoutes.ts` — 11 inline auth decisions replaced
- `plugins/augment-backend/src/routes/toolLifecycleRoutes.ts` — 4 inline auth decisions replaced
- `plugins/augment-backend/src/routes/kagentiAgentRoutes.ts` — `requireAdminAccess` replaced on infra routes
- `plugins/augment-backend/src/plugin.ts` — permission registration
- `plugins/augment-backend/src/router.ts` — permission integration router mount
- These permissions are independent of AgenticProvider authorization (Kagenti RFC 8693, OpenAI RBAC) — they govern Backstage-layer governance, not provider-layer access
