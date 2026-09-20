# Design: Security, Safety & Governance

## Context

Boost builds the security and governance layer with Backstage fine-grained permissions as the sole authorization mechanism from day one. The Augment reference prototype's governance system grew into a parallel authorization layer where authorization decisions bypassed `permissions.authorize()`. Boost avoids this entirely.

Boost also implements OAuth2 Client Credentials Grant via `KeycloakAuthClient` for service-account authentication to Kagenti, with user identity propagated via `X-Backstage-User` header for audit trails.

## Goals

- Implement 16 fine-grained Backstage permissions as the sole authorization mechanism
- Add conditional permission rules for ownership (IS_OWNER), separation of duties (IS_NOT_CREATOR), and lifecycle stage gating (HAS_LIFECYCLE_STAGE)
- Implement OAuth2 Client Credentials Grant for Kagenti service-account auth
- Use `development-only-no-auth` as the only dev security mode name (no legacy aliases)
- Add CSRF protection and credential encryption
- Export all permissions from `boost-common`

## Non-Goals

- Removing the 3-mode security system (it's a deliberate product feature)
- Changing safety shield behavior or the SSRF guard
- Modifying the MCP auth chain logic
- Removing the SonataFlow approval workflow integration

## Decisions

### Decision 1: 16 permissions with resource-based conditions and admin fallback

Agent and tool lifecycle actions use resource-based permissions with conditional rules. The `authorizeLifecycleAction` middleware is the single authorization entry point for all lifecycle routes. On fine-grained DENY, the system falls back to checking `boost.admin` — enabling deployments that prefer coarse-grained control to work without configuring all 16 permissions.

### Decision 2: Three conditional permission rules

- `IS_OWNER`: `resource.createdBy === currentUser` — gates promote, withdraw, delete, unpublish
- `IS_NOT_CREATOR`: `resource.createdBy !== currentUser` — enforces self-approval prevention
- `HAS_LIFECYCLE_STAGE`: `resource.lifecycleStage in allowedStages` — enforces valid transitions

These rules are evaluated against loaded resources via `createConditionalDecision` and integrated with `PermissionPolicy`.

### Decision 3: Self-approval prevention stays layered

The `IS_NOT_CREATOR` permission rule is the primary enforcement mechanism. A route-level guard remains as defense-in-depth (belt and suspenders). Both layers are active in `security.mode === 'full'`.

### Decision 4: Service-account auth with KeycloakAuthClient

`KeycloakAuthClient` acquires tokens via OAuth2 Client Credentials Grant, caches them with a configurable expiry buffer (`tokenExpiryBufferSeconds`, default: 60), and automatically refreshes before expiry. On 401 responses, the token is refreshed and the request retried once (max-1-retry). For user-initiated requests via `KagentiApiClient`, user identity is propagated via `X-Backstage-User` header for audit trails; entity provider background polling omits this header (no user context). This is deliberately simple: service-account auth provides consistent authentication without per-user token management complexity.

### Decision 5: Separation of authorization concerns

Three non-overlapping authorization layers:

- **Backstage** governs: UI visibility, agent lifecycle governance, ownership, approval workflows, admin operations
- **Kagenti** governs: agent specs, tools, runtime operations — via service-account token with user identity in `X-Backstage-User` header
- **Kubernetes** governs: pod/deployment operations, namespace scoping, SPIRE mTLS

## Risks

- **RBAC policy complexity:** 16 permissions with conditions is more complex than 2. Mitigated by sensible defaults — `boost.access` as top-level gate and `boost.admin` available for coarse control.
- **Keycloak availability:** Keycloak becoming unavailable blocks Kagenti API calls. Mitigated by token caching with configurable expiry buffer, reducing the number of token requests.
- **SonataFlow trust boundary:** Callbacks bypass self-approval prevention via header. Callback identity verification should be implemented to close this gap.
