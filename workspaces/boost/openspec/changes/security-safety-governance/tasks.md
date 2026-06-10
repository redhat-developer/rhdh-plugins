# Tasks: Security, Safety & Governance

## 1. Permission Definitions (P0)

- [ ] 1.1 Define 16 permissions in `boost-common/src/permissions.ts`: 10 agent, 5 tool, 1 kagenti-infra
- [ ] 1.2 Define resource types `boost-agent` and `boost-tool` using `createResourcePermission`
- [ ] 1.3 Define conditional rules: `IS_OWNER`, `IS_NOT_CREATOR`, `HAS_LIFECYCLE_STAGE`
- [ ] 1.4 Define 5 functional permissions: `chat.read`, `chat.create`, `documents.manage`, `mcp.manage`, `config.manage`
- [ ] 1.5 Register all permissions via `permissionsRegistry.addPermissions()` in backend `plugin.ts`

## 2. Authorization Middleware (P0)

- [ ] 2.1 Create `authorizeLifecycleAction(permission, resourceLoader)` middleware in `boost-backend/src/middleware/security.ts`
- [ ] 2.2 Implement fine-grained permission check via `permissions.authorize()` → DENY → 403 pattern
- [ ] 2.3 Create resource loader functions for agents and tools (load from store, extract `createdBy` and `lifecycleStage`)

## 3. Agent Routes — Permission Integration (P1)

- [ ] 3.1 Implement `GET /agents` with `boost.agent.list` + ownership condition for visibility filtering
- [ ] 3.2 Implement `PUT /agents/:id/register` with `boost.agent.register`
- [ ] 3.3 Implement `PUT /agents/:id/promote` with `boost.agent.promote` (IS_OWNER + HAS_LIFECYCLE_STAGE)
- [ ] 3.4 Implement `PUT /agents/:id/promote` (pending→published) with `boost.agent.approve` (IS_NOT_CREATOR)
- [ ] 3.5 Implement `PUT /agents/:id/request-unpublish` with `boost.agent.unpublish` (IS_OWNER)
- [ ] 3.6 Implement `PUT /agents/:id/withdraw` with `boost.agent.withdraw` (IS_OWNER)
- [ ] 3.7 Implement `DELETE /agents/:id` with `boost.agent.delete` (IS_OWNER + HAS_LIFECYCLE_STAGE)

## 4. Tool Routes — Permission Integration (P1)

- [ ] 4.1 Implement `PUT /tools/:id/promote` with `boost.tool.promote` (IS_OWNER)
- [ ] 4.2 Implement `PUT /tools/:id/demote` with `boost.tool.demote`
- [ ] 4.3 Implement `PUT /tools/:id/publish` with `boost.tool.publish`
- [ ] 4.4 Implement `PUT /tools/:id/unpublish` with `boost.tool.unpublish`

## 5. Kagenti Infra Routes — Permission Integration (P1)

- [ ] 5.1 Implement Kagenti admin routes with `boost.kagenti.admin`

## 6. Frontend Permission Gating (P1)

- [ ] 6.1 Wrap admin panel sections with `<RequirePermission>` using fine-grained permissions
- [ ] 6.2 Batch permission checks via `usePermissions` (plural) for performance
- [ ] 6.3 Gate knowledge base panel with `boost.documents.manage`
- [ ] 6.4 Gate MCP panel with `boost.mcp.manage`
- [ ] 6.5 Gate config panel with `boost.config.manage`

## 7. Token Exchange (P1)

- [ ] 7.1 Create `TokenExchangeManager` implementing RFC 8693 exchange
- [ ] 7.2 Add per-user token caching with TTL from token expiry
- [ ] 7.3 Add concurrent exchange deduplication
- [ ] 7.4 Add graceful fallback to service-account token on all failures
- [ ] 7.5 Add config schema: `boost.kagenti.auth.tokenExchange.{enabled, audience, userTokenHeader}`
- [ ] 7.6 Integrate into `KagentiApiClient.requestCore()` — inject per-user token when available
- [ ] 7.7 Extract user OIDC token from configurable request header in route handlers

## 8. CSRF and Credential Security (P2)

- [ ] 8.1 Add `X-Backstage-Request` header to all frontend mutating fetch operations
- [ ] 8.2 Encrypt sensitive values in admin config DB (not plaintext)

## 9. Security Mode Naming (P3)

- [ ] 9.1 Use `development-only-no-auth` as the dev security mode name from the start
- [ ] 9.2 No legacy aliases — `none` is not a valid mode name
- [ ] 9.3 Add production environment detection heuristic with startup warning

## 10. Verify

- [ ] 10.1 Verify fine-grained permission check → admin fallback → 403 pattern works
- [ ] 10.2 Verify IS_OWNER blocks non-owner promote/delete/withdraw
- [ ] 10.3 Verify IS_NOT_CREATOR blocks self-approval
- [ ] 10.4 Verify `boost.admin` works as coarse-grained alternative to fine-grained permissions
- [ ] 10.5 Verify token exchange fallback: disabled config → service-account token
- [ ] 10.6 Verify token exchange fallback: Keycloak error → service-account token
- [ ] 10.7 Verify token exchange fallback: missing header → service-account token
- [ ] 10.8 Verify `none` is rejected with a clear error pointing to `development-only-no-auth`
