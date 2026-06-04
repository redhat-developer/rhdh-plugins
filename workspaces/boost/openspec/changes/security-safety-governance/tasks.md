# Tasks: Security, Safety & Governance

## 1. Permission Definitions (P0, additive)

- [ ] 1.1 Define 16 permissions in `augment-common/src/permissions.ts`: 10 agent, 5 tool, 1 kagenti-infra
- [ ] 1.2 Define resource types `augment-agent` and `augment-tool` using `createResourcePermission`
- [ ] 1.3 Define conditional rules: `IS_OWNER`, `IS_NOT_CREATOR`, `HAS_LIFECYCLE_STAGE`
- [ ] 1.4 Define 5 functional permissions: `chat.read`, `chat.create`, `documents.manage`, `mcp.manage`, `config.manage`
- [ ] 1.5 Register all permissions via `permissionsRegistry.addPermissions()` in backend `plugin.ts`

## 2. Authorization Middleware (P0, new files)

- [ ] 2.1 Create `authorizeLifecycleAction(permission, resourceLoader)` middleware in `middleware/security.ts`
- [ ] 2.2 Implement fine-grained permission check via `permissions.authorize()` → DENY → 403 pattern
- [ ] 2.3 Create resource loader functions for agents and tools (load from store, extract `createdBy` and `lifecycleStage`)

## 3. Route Refactoring — Agent Routes (P1)

- [ ] 3.1 Replace `GET /agents` visibility filtering with `augment.agent.list` + ownership condition
- [ ] 3.2 Replace `PUT /agents/:id/register` admin guard with `augment.agent.register`
- [ ] 3.3 Replace `PUT /agents/:id/promote` ownership+stage guards with `augment.agent.promote` (IS_OWNER + HAS_LIFECYCLE_STAGE)
- [ ] 3.4 Replace `PUT /agents/:id/promote` (pending→published) approval guard with `augment.agent.approve` (IS_NOT_CREATOR)
- [ ] 3.5 Replace `PUT /agents/:id/request-unpublish` with `augment.agent.unpublish` (IS_OWNER)
- [ ] 3.6 Replace `PUT /agents/:id/withdraw` with `augment.agent.withdraw` (IS_OWNER)
- [ ] 3.7 Replace `DELETE /agents/:id` stage+ownership guards with `augment.agent.delete` (IS_OWNER + HAS_LIFECYCLE_STAGE)

## 4. Route Refactoring — Tool Routes (P1)

- [ ] 4.1 Replace `PUT /tools/:id/promote` ownership guard with `augment.tool.promote` (IS_OWNER)
- [ ] 4.2 Replace `PUT /tools/:id/demote` admin guard with `augment.tool.demote`
- [ ] 4.3 Replace `PUT /tools/:id/publish` admin guard with `augment.tool.publish`
- [ ] 4.4 Replace `PUT /tools/:id/unpublish` admin guard with `augment.tool.unpublish`

## 5. Route Refactoring — Kagenti Infra Routes (P1)

- [ ] 5.1 Replace Kagenti admin route guards with `augment.kagenti.admin`

## 6. Frontend Permission Gating (P1)

- [ ] 6.1 Wrap admin panel sections with `<RequirePermission>` using fine-grained permissions
- [ ] 6.2 Batch permission checks via `usePermissions` (plural) for performance
- [ ] 6.3 Gate knowledge base panel with `augment.documents.manage`
- [ ] 6.4 Gate MCP panel with `augment.mcp.manage`
- [ ] 6.5 Gate config panel with `augment.config.manage`

## 7. Token Exchange (P1, new file + config)

- [ ] 7.1 Create `TokenExchangeManager` implementing RFC 8693 exchange
- [ ] 7.2 Add per-user token caching with TTL from token expiry
- [ ] 7.3 Add concurrent exchange deduplication
- [ ] 7.4 Add graceful fallback to service-account token on all failures
- [ ] 7.5 Add config schema: `augment.kagenti.auth.tokenExchange.{enabled, audience, userTokenHeader}`
- [ ] 7.6 Integrate into `KagentiApiClient.requestCore()` — inject per-user token when available
- [ ] 7.7 Extract user OIDC token from configurable request header in route handlers

## 8. CSRF and Credential Security (P2)

- [ ] 8.1 Add `X-Backstage-Request` header to all frontend mutating fetch operations
- [ ] 8.2 Encrypt DevSpaces tokens in admin config DB (not plaintext)

## 9. Security Mode Rename (P3)

- [ ] 9.1 Rename `none` to `development-only-no-auth` in config schema
- [ ] 9.2 Use `development-only-no-auth` as the only mode name (no legacy aliases)
- [ ] 9.3 Add production environment detection heuristic with startup warning

## 10. Verify

- [ ] 10.1 Verify fine-grained permission check → admin fallback → 403 pattern works
- [ ] 10.2 Verify IS_OWNER blocks non-owner promote/delete/withdraw
- [ ] 10.3 Verify IS_NOT_CREATOR blocks self-approval
- [ ] 10.4 Verify `augment.admin` works as coarse-grained alternative to fine-grained permissions
- [ ] 10.5 Verify token exchange fallback: disabled config → service-account token
- [ ] 10.6 Verify token exchange fallback: Keycloak error → service-account token
- [ ] 10.7 Verify token exchange fallback: missing header → service-account token
- [ ] 10.8 Verify `none` alias works with deprecation warning
