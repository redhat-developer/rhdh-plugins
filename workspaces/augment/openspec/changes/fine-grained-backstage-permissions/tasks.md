# Tasks: Fine-Grained Backstage Permissions for Augment Lifecycle Governance

## 1. Permission Definitions (augment-common)

- [ ] 1.1 Add `RESOURCE_TYPE_AUGMENT_AGENT` (`augment-agent`) and `RESOURCE_TYPE_AUGMENT_TOOL` (`augment-tool`) constants to `plugins/augment-common/src/permissions.ts`
- [ ] 1.2 Define 10 agent permissions (`augment.agent.list`, `.register`, `.promote`, `.approve`, `.demote`, `.publish`, `.unpublish`, `.withdraw`, `.delete`, `.configure`) using `createPermission` with correct action types and resource types
- [ ] 1.3 Define 5 tool permissions (`augment.tool.promote`, `.approve`, `.demote`, `.publish`, `.unpublish`) using `createPermission` with resource type `augment-tool`
- [ ] 1.4 Define `augment.kagenti.admin` as a basic permission with action `update`
- [ ] 1.5 Add all 16 new permissions to the `augmentPermissions` array alongside existing `augmentAccessPermission` and `augmentAdminPermission`
- [ ] 1.6 Export new constants, types, and permissions from `plugins/augment-common/src/index.ts`

## 2. Permission Rules and Utilities (augment-backend, new files)

- [ ] 2.1 Create `plugins/augment-backend/src/permissions/rules.ts` with `createPermissionResourceRef` for agent and tool resource types
- [ ] 2.2 Implement `IS_OWNER` rule — evaluates `resource.createdBy === userRef`
- [ ] 2.3 Implement `IS_NOT_CREATOR` rule — evaluates `resource.createdBy !== userRef`
- [ ] 2.4 Implement `HAS_LIFECYCLE_STAGE` rule — evaluates `stages.includes(resource.lifecycleStage)` with `stages: string[]` parameter
- [ ] 2.5 Create `plugins/augment-backend/src/permissions/permissionUtils.ts` with `matchesAgentConditions(resource, conditions)` and `matchesToolConditions(resource, conditions)` following `extensions-backend/src/utils/permissionUtils.ts` pattern
- [ ] 2.6 Create `plugins/augment-backend/src/permissions/index.ts` barrel export

## 3. Authorization Middleware Abstraction

- [ ] 3.1 Add `authorizeLifecycleAction(req, permission, resource?)` to `plugins/augment-backend/src/middleware/security.ts` — fine-grained check first, conditional evaluation if CONDITIONAL, fallback to `augment.admin` on DENY
- [ ] 3.2 Add `authorizeBasicWithFallback(req, permission)` to `plugins/augment-backend/src/middleware/security.ts` — basic permission check with `augment.admin` fallback
- [ ] 3.3 Add `authorizeLifecycleAction` and `authorizeBasicWithFallback` to `RouteContext` in `plugins/augment-backend/src/routes/types.ts`

## 4. Agent Route Refactoring

- [ ] 4.1 Replace GET /agents visibility filtering with `augment.agent.list` resource-based permission check (3-tier: ALLOW=all, DENY=none, CONDITIONAL=filtered) in `plugins/augment-backend/src/routes/agentRoutes.ts`
- [ ] 4.2 Replace PUT register `requireAdminAccess` with `augment.agent.register` + fallback
- [ ] 4.3 Replace PUT promote (draft→pending) inline guards with `augment.agent.promote` + IS_OWNER + HAS_LIFECYCLE_STAGE(draft)
- [ ] 4.4 Replace PUT promote (pending→published) self-approval check with `augment.agent.approve` + IS_NOT_CREATOR (retain hard-coded check as defense-in-depth)
- [ ] 4.5 Replace PUT demote `requireAdminAccess` with `augment.agent.demote` + fallback
- [ ] 4.6 Replace PUT publish/unpublish/bulk-publish `requireAdminAccess` with `augment.agent.publish` + fallback
- [ ] 4.7 Replace PUT request-unpublish inline `isRequestOwner OR isAdmin` with `augment.agent.unpublish` + IS_OWNER + fallback
- [ ] 4.8 Replace PUT withdraw inline `isOwner OR isAdmin` with `augment.agent.withdraw` + IS_OWNER + fallback
- [ ] 4.9 Replace PUT config `requireAdminAccess` with `augment.agent.configure` + fallback
- [ ] 4.10 Replace DELETE inline draft-only + ownership checks with `augment.agent.delete` + IS_OWNER + HAS_LIFECYCLE_STAGE(draft) + fallback

## 5. Tool and Kagenti Route Refactoring

- [ ] 5.1 Replace PUT promote (draft→pending) inline guards with `augment.tool.promote` + IS_OWNER in `plugins/augment-backend/src/routes/toolLifecycleRoutes.ts`
- [ ] 5.2 Replace PUT promote (other transitions) inline `!isAdmin` with `augment.tool.approve` + fallback
- [ ] 5.3 Replace PUT demote/publish/unpublish `requireAdminAccess` with respective `augment.tool.*` permissions + fallback
- [ ] 5.4 Replace `requireAdminAccess` on Kagenti infra routes (DELETE, migrate, build, parse-env, fetch-env) with `augment.kagenti.admin` + fallback in `plugins/augment-backend/src/routes/kagentiAgentRoutes.ts`

## 6. Plugin Wiring

- [ ] 6.1 Register both resource types via `permissionsRegistry.addResourceType` and all 16 new permissions via `permissionsRegistry.addPermissions` in `plugins/augment-backend/src/plugin.ts`
- [ ] 6.2 Add `@backstage/plugin-permission-node` dependency to `plugins/augment-backend/package.json`
- [ ] 6.3 Register both resource types via `permissionsRegistry.addResourceType` with their associated rules in `plugins/augment-backend/src/plugin.ts` (using `PermissionsRegistryService`, not the deprecated `createPermissionIntegrationRouter`)
- [ ] 6.4 Thread `authorizeLifecycleAction` and `authorizeBasicWithFallback` into `RouteContext` in `plugins/augment-backend/src/router.ts`

## 7. Verification

- [ ] 7.1 Verify `npx tsc --noEmit` passes clean with all changes
- [ ] 7.2 Verify existing tests pass unchanged (backward compatibility)
- [ ] 7.3 Verify with no fine-grained RBAC policies: behavior identical to current system
- [ ] 7.4 Verify with fine-grained policies: each permission correctly gates its route
