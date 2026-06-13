# Plan: Fine-Grained Backstage Permissions for Augment Lifecycle Governance

_Created: May 31, 2026_
_Status: Implementation starting_
_Branch: current working branch in rhdh-plugins_

## Context

The augment plugin has 12+ authorization decisions implemented as custom route-level guards (`checkIsAdmin`, `createdBy` comparisons, lifecycle stage checks, self-approval prevention) that bypass Backstage's permission framework. Today only 2 coarse permissions exist (`augment.access`, `augment.admin`), making it impossible for RBAC policies to distinguish who can chat vs. manage agents vs. approve lifecycle transitions.

This change replaces those custom guards with proper Backstage fine-grained permissions, including resource-based permissions with conditional rules for ownership and lifecycle stage checks. Existing `augment.access` + `augment.admin` policies continue to work via a fallback mechanism.

## Key Design Decisions

### These permissions are independent of AgenticProvider authorization

Avoiding re-implementation of authorization checks that already exist at the AgenticProvider level (Kagenti, OpenAI) is a general good practice which we will strive to follow, Here is our rationale for how this proposal achieves that:

#### 1. OpenAI's RBAC Is Orthogonal

OpenAI's RBAC system controls who on the **OpenAI organization's team** can manage API keys, models, and billing. It does not control end-user access to applications built on the API. The augment plugin uses a single API key — OpenAI's RBAC governs who can _create_ that key, not who can _use the app built with it_.

#### 2. Kagenti's Per-User RBAC Operates on a Different Verb Set

Kagenti supports per-user authorization via OAuth2 Token Exchange (RFC 8693). A separate change on the `kagenti-oauth2-token-exchange` branch (see `kagenti-token-exchange-implementation-plan.md`) enables the augment plugin to exchange each user's OIDC token for a Kagenti-scoped token, so Kagenti can enforce its own per-user access control.

Even with that token exchange in place, the Backstage permissions defined here do not overlap with Kagenti's RBAC because **they govern entirely different verbs operating on different resources**:

| Layer                    | Verbs / Actions                                                                                                 | Resources                                                                         | Data Store                        |
| ------------------------ | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------- |
| **Backstage governance** | promote, approve, demote, withdraw, request-unpublish, register, configure, delete (governance record)          | `ChatAgentConfig`, `ChatToolConfig` — lifecycle state, ownership, approval status | Backstage `AdminConfigService` DB |
| **Kagenti API**          | listAgents, getAgent, createAgent, deleteAgent, chatSend, chatStream, invokeTool, triggerBuildRun, migrateAgent | Agent definitions, tool specs, MCP connections, Shipwright builds                 | Kagenti runtime (Kubernetes CRDs) |
| **Kubernetes RBAC**      | get, list, create, update, delete, watch                                                                        | Deployments, StatefulSets, Secrets, ConfigMaps                                    | Kubernetes API server             |

Where the same verb name appears across layers (e.g., "delete"), it operates on different targets:

- Backstage `augment.agent.delete`: removes the `ChatAgentConfig` governance record from the admin DB
- Kagenti `deleteAgent`: removes the agent definition from the Kagenti runtime (Kubernetes namespace)
- Kubernetes RBAC `delete`: removes the underlying pod/deployment from the cluster

Kagenti's 3 roles (`kagenti-viewer`, `kagenti-operator`, `kagenti-admin`) gate access to the **Kagenti runtime API** — listing agents in namespaces, creating agent specs, invoking tools, triggering builds. None of these roles have any concept of Backstage's governance lifecycle (draft/pending/published), ownership-scoped operations, or self-approval prevention.

#### 3. The 12+ Authorization Decisions Are Backstage-Layer Concerns

The fine-grained permissions defined in this plan control **what a logged-in Backstage user can do within the augment UI and governance system**:

- Who can see which agents (visibility filtering)
- Who can submit agents for review (creator ownership)
- Who can approve agents (separation of duties — creator ≠ approver)
- Who can promote, demote, publish, unpublish, archive agents and tools
- Who can delete agents (draft-only for non-admins, ownership-scoped)

**None of these decisions are enforced by Kagenti or OpenAI.** They are internal to Backstage — they exist before any request reaches an AgenticProvider. Even with full per-user Kagenti token exchange enabled, these decisions remain necessary because:

- Kagenti doesn't know about Backstage's agent lifecycle governance (draft/pending/published state machine)
- Kagenti doesn't enforce the self-approval separation of duties policy
- Kagenti doesn't control which Backstage users can see which agents in the UI
- The `ResponsesApiProvider` (OpenAI) doesn't implement `setUserContext` at all — zero user identity flows to OpenAI

**In summary:** Provider-level auth controls access _to external AI services_. Backstage RBAC controls access _within the plugin's own governance system_. They operate at different layers and are complementary, not redundant.

### Implementation design

- **Separate resource types**: `augment-agent` and `augment-tool` — different domain objects, different routes, independently targetable by RBAC
- **Admin routes get resource permissions too** — allows future per-agent scoping
- **Backward compat via fallback**: Fine-grained permission checked first; on DENY, falls back to `augment.admin`. Existing policies work unchanged.
- **Self-approval prevention stays as defense-in-depth** — the `IS_NOT_CREATOR` permission rule supplements the existing hard-coded check, doesn't replace it

## Permission Definitions (augment-common)

### Resource Types

```typescript
export const RESOURCE_TYPE_AUGMENT_AGENT = 'augment-agent';
export const RESOURCE_TYPE_AUGMENT_TOOL = 'augment-tool';
```

### New Permissions

| Permission                | Action | Resource Type | Replaces                                        |
| ------------------------- | ------ | ------------- | ----------------------------------------------- |
| `augment.agent.list`      | read   | (basic)       | Visibility filtering in GET /agents             |
| `augment.agent.register`  | create | augment-agent | requireAdminAccess on PUT register              |
| `augment.agent.promote`   | update | augment-agent | Inline ownership + draft-only checks on promote |
| `augment.agent.approve`   | update | augment-agent | Self-approval prevention on pending→published   |
| `augment.agent.demote`    | update | augment-agent | requireAdminAccess on demote                    |
| `augment.agent.publish`   | update | augment-agent | requireAdminAccess on publish/bulk-publish      |
| `augment.agent.unpublish` | update | augment-agent | Ownership-or-admin on request-unpublish         |
| `augment.agent.withdraw`  | update | augment-agent | Ownership-or-admin on withdraw                  |
| `augment.agent.delete`    | delete | augment-agent | Draft-only + ownership checks on delete         |
| `augment.agent.configure` | update | augment-agent | requireAdminAccess on config                    |
| `augment.tool.promote`    | update | augment-tool  | Inline ownership + draft-only on promote        |
| `augment.tool.approve`    | update | augment-tool  | Admin check on non-draft-to-pending             |
| `augment.tool.demote`     | update | augment-tool  | requireAdminAccess on demote                    |
| `augment.tool.publish`    | update | augment-tool  | requireAdminAccess on publish                   |
| `augment.tool.unpublish`  | update | augment-tool  | requireAdminAccess on unpublish                 |
| `augment.kagenti.admin`   | update | (basic)       | requireAdminAccess on kagenti infra routes      |

### Permission Rules (augment-backend)

| Rule                  | Purpose                     | Params                               | Apply Logic                                |
| --------------------- | --------------------------- | ------------------------------------ | ------------------------------------------ |
| `IS_OWNER`            | Creator ownership check     | (none — user injected at check time) | `resource.createdBy === userRef`           |
| `IS_NOT_CREATOR`      | Self-approval prevention    | (none)                               | `resource.createdBy !== userRef`           |
| `HAS_LIFECYCLE_STAGE` | Restrict to specific stages | `stages: string[]`                   | `stages.includes(resource.lifecycleStage)` |

## Files to Change

### Phase 1: Permission Definitions (augment-common, 2 files)

**`plugins/augment-common/src/permissions.ts`** — Add resource type constants, all 16 new permissions using `createPermission` with `resourceType`, convenience types, add to `augmentPermissions` array. Keep existing `augmentAccessPermission` and `augmentAdminPermission` unchanged.

**`plugins/augment-common/src/index.ts`** — Export new constants, types, and permissions.

### Phase 2: Permission Rules + Utils (augment-backend, 3 new files)

**`plugins/augment-backend/src/permissions/rules.ts`** (NEW) — `createPermissionResourceRef` for agent and tool. Three `createPermissionRule` implementations: `IS_OWNER`, `IS_NOT_CREATOR`, `HAS_LIFECYCLE_STAGE`. Follow pattern from `extensions-backend/src/permissions/rules.ts`.

**`plugins/augment-backend/src/permissions/permissionUtils.ts`** (NEW) — `matchesAgentConditions(resource, conditions)` and `matchesToolConditions(resource, conditions)` — evaluate conditional permission results against loaded resources. Follow pattern from `extensions-backend/src/utils/permissionUtils.ts`.

**`plugins/augment-backend/src/permissions/index.ts`** (NEW) — Barrel export.

### Phase 3: Authorization Abstraction (2 files)

**`plugins/augment-backend/src/middleware/security.ts`** — Add two new functions to the security middleware:

- `authorizeLifecycleAction(req, permission, resource?)` — handles the two-tier check: fine-grained permission → conditional evaluation → fallback to `augment.admin`
- `authorizeBasicWithFallback(req, permission)` — for basic (non-resource) permissions with `augment.admin` fallback

**`plugins/augment-backend/src/routes/types.ts`** — Add `authorizeLifecycleAction` and `authorizeBasicWithFallback` to `RouteContext`.

### Phase 4: Route Refactoring (3 files)

**`plugins/augment-backend/src/routes/agentRoutes.ts`** — Replace all 11 inline authorization decisions with `authorizeLifecycleAction` calls. Key mappings:

- GET /agents → `augment.agent.list` (basic, controls visibility filter)
- PUT register → `augment.agent.register`
- PUT promote (draft→pending) → `augment.agent.promote` with IS_OWNER condition
- PUT promote (pending→published) → `augment.agent.approve` with IS_NOT_CREATOR condition
- PUT demote/publish/unpublish/config → respective permissions with fallback
- PUT request-unpublish → `augment.agent.unpublish` with IS_OWNER condition
- PUT withdraw → `augment.agent.withdraw` with IS_OWNER condition
- DELETE → `augment.agent.delete` with IS_OWNER + HAS_LIFECYCLE_STAGE conditions

**`plugins/augment-backend/src/routes/toolLifecycleRoutes.ts`** — Same pattern for 4 tool lifecycle decisions.

**`plugins/augment-backend/src/routes/kagentiAgentRoutes.ts`** — Replace `requireAdminAccess` on infra routes with `augment.kagenti.admin` + fallback.

### Phase 5: Plugin Wiring (2 files)

**`plugins/augment-backend/src/plugin.ts`** — Register all new permissions via `permissionsRegistry.addPermissions`. Add `@backstage/plugin-permission-node` dependency.

**`plugins/augment-backend/src/router.ts`** — Create `permissionIntegrationRouter` via `createPermissionIntegrationRouter` with both resource types and all rules. Mount it on the router. Thread `authorizeLifecycleAction` and `authorizeBasicWithFallback` into `RouteContext`.

## Authorization Decision Mapping

### Agent Routes (agentRoutes.ts)

| #   | Route                           | Current Auth                      | New Permission                        | Conditions                                                   |
| --- | ------------------------------- | --------------------------------- | ------------------------------------- | ------------------------------------------------------------ |
| 1   | GET /agents                     | checkIsAdmin → visibility filter  | `augment.agent.list` (basic)          | ALLOW=show all, DENY=filter to published+own                 |
| 2   | PUT register                    | requireAdminAccess middleware     | `augment.agent.register`              | Fallback to augment.admin                                    |
| 3a  | PUT promote (draft→pending)     | inline: isAdmin + createdBy       | `augment.agent.promote`               | IS_OWNER, HAS_LIFECYCLE_STAGE(draft)                         |
| 3b  | PUT promote (phantom draft)     | inline: !isAdmin && !existing     | Keep as-is (data integrity, not auth) | N/A                                                          |
| 3c  | PUT promote (ownership)         | inline: createdBy !== userRef     | Covered by IS_OWNER on promote        | —                                                            |
| 3d  | PUT promote (pending→published) | inline: self-approval prevention  | `augment.agent.approve`               | IS_NOT_CREATOR (defense-in-depth: keep hard-coded check too) |
| 4   | PUT demote                      | requireAdminAccess middleware     | `augment.agent.demote`                | Fallback to augment.admin                                    |
| 5   | PUT publish                     | requireAdminAccess middleware     | `augment.agent.publish`               | Fallback to augment.admin                                    |
| 6   | PUT unpublish                   | requireAdminAccess middleware     | `augment.agent.publish`               | Fallback to augment.admin                                    |
| 7   | PUT bulk-publish                | requireAdminAccess middleware     | `augment.agent.publish` per item      | Fallback to augment.admin                                    |
| 8   | PUT request-unpublish           | inline: isRequestOwner OR isAdmin | `augment.agent.unpublish`             | IS_OWNER, fallback to augment.admin                          |
| 9   | PUT withdraw                    | inline: isOwner OR isAdmin        | `augment.agent.withdraw`              | IS_OWNER, fallback to augment.admin                          |
| 10  | PUT config                      | requireAdminAccess middleware     | `augment.agent.configure`             | Fallback to augment.admin                                    |
| 11a | DELETE (stage check)            | inline: !admin && stage !== draft | `augment.agent.delete`                | HAS_LIFECYCLE_STAGE(draft) for non-admin                     |
| 11b | DELETE (ownership)              | inline: createdBy !== userRef     | `augment.agent.delete`                | IS_OWNER for non-admin                                       |

### Tool Routes (toolLifecycleRoutes.ts)

| #   | Route                           | Current Auth                  | New Permission           | Conditions                |
| --- | ------------------------------- | ----------------------------- | ------------------------ | ------------------------- |
| 12a | PUT promote (draft→pending)     | inline: isAdmin + createdBy   | `augment.tool.promote`   | IS_OWNER                  |
| 12b | PUT promote (other transitions) | inline: !isAdmin check        | `augment.tool.approve`   | Fallback to augment.admin |
| 13  | PUT demote                      | requireAdminAccess middleware | `augment.tool.demote`    | Fallback to augment.admin |
| 14  | PUT publish                     | requireAdminAccess middleware | `augment.tool.publish`   | Fallback to augment.admin |
| 15  | PUT unpublish                   | requireAdminAccess middleware | `augment.tool.unpublish` | Fallback to augment.admin |

### Kagenti Infra Routes (kagentiAgentRoutes.ts)

| #     | Route                                        | Current Auth       | New Permission                             |
| ----- | -------------------------------------------- | ------------------ | ------------------------------------------ |
| 16-22 | DELETE, migrate, build, parse-env, fetch-env | requireAdminAccess | `augment.kagenti.admin` (basic) + fallback |

## Implementation Order

1. Permission definitions (augment-common) — additive, no behavior change
2. Permission rules + utils (new files) — standalone, testable
3. Security middleware (authorizeLifecycleAction) — the backward-compat abstraction
4. Route refactoring — one file at a time: agentRoutes → toolLifecycleRoutes → kagentiAgentRoutes
5. Plugin wiring (plugin.ts, router.ts) — connects everything
6. Type check (`npx tsc --noEmit`)

## Backward Compatibility

**Existing RBAC policy (unchanged, continues to work):**

```yaml
permission:
  rbac:
    policies:
      - p, role:default/augment-user, augment.access, read, allow
      - p, role:default/augment-admin, augment.admin, update, allow
```

**New fine-grained policy (opt-in):**

```yaml
permission:
  rbac:
    policies:
      - p, role:default/augment-user, augment.access, read, allow
      - p, role:default/agent-developer, augment.agent.promote, update, allow
      - p, role:default/agent-admin, augment.agent.approve, update, allow
      - p, role:default/agent-admin, augment.agent.demote, update, allow
      - p, role:default/agent-admin, augment.agent.publish, update, allow
      - p, role:default/agent-admin, augment.agent.delete, delete, allow
```

The fallback mechanism: `authorizeLifecycleAction` checks the fine-grained permission first. If DENY (which is the default when no policy exists for it), it falls back to `augment.admin`. This means deployments that haven't configured fine-grained policies get the same behavior as today.

## Verification

1. `npx tsc --noEmit` — all interfaces compile
2. Existing tests pass unchanged (backward compat)
3. With no fine-grained RBAC policies: behavior identical to current
4. With fine-grained policies: each permission correctly gates its route

## Related Documents

- `governance-techdebt-deepdive-may26.md` — Documents all 12 authorization decisions and the code volume analysis
- `augment-techdebt.md` — Section 4 covers the permission model alignment gap
- `augment-techdebt-may26.md` — Notes zero improvement in permissions area, governance system as parallel auth
- `kagenti-token-exchange-implementation-plan.md` — Companion change for per-user Kagenti auth (RFC 8693)
- Reference implementation: `extensions-backend/src/permissions/rules.ts` for resource permission pattern
