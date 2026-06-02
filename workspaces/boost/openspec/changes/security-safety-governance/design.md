# Design: Security, Safety & Governance

## Context

Boost builds the security and governance layer from scratch, informed by augment's experience. Augment's governance system grew into a parallel authorization layer (2,132 lines of custom code vs. 73 lines of Backstage permissions — 29x ratio) where 12 authorization decisions bypassed `permissions.authorize()`. Boost avoids this entirely: all authorization decisions use Backstage fine-grained permissions from day one.

Augment also authenticated to Kagenti using a shared service-account token for all users, making per-user audit trails impossible. Boost implements RFC 8693 token exchange for per-user identity delegation from the start.

## Goals

- Implement 16 fine-grained Backstage permissions as the sole authorization mechanism
- Add conditional permission rules for ownership (IS_OWNER), separation of duties (IS_NOT_CREATOR), and lifecycle stage gating (HAS_LIFECYCLE_STAGE)
- Implement RFC 8693 token exchange for per-user Kagenti identity
- Rename `none` security mode with deprecation path
- Add CSRF protection and credential encryption
- Export all permissions from `augment-common`

## Non-Goals

- Removing the 3-mode security system (it's a deliberate product feature)
- Changing safety shield behavior or the SSRF guard
- Modifying the MCP auth chain logic
- Removing the SonataFlow approval workflow integration

## Decisions

### Decision 1: 16 permissions with resource-based conditions and admin fallback

Agent and tool lifecycle actions get resource-based permissions with conditional rules. The `authorizeLifecycleAction` middleware replaces scattered per-route guards. On fine-grained DENY, the system falls back to checking `augment.admin` — enabling gradual adoption without breaking existing 2-permission deployments.

### Decision 2: Three conditional permission rules

- `IS_OWNER`: `resource.createdBy === currentUser` — gates promote, withdraw, delete, unpublish
- `IS_NOT_CREATOR`: `resource.createdBy !== currentUser` — enforces self-approval prevention
- `HAS_LIFECYCLE_STAGE`: `resource.lifecycleStage in allowedStages` — enforces valid transitions

These rules are evaluated against loaded resources via `createConditionalDecision` and integrated with `PermissionPolicy`.

### Decision 3: Self-approval prevention stays layered

The `IS_NOT_CREATOR` permission rule is the primary enforcement mechanism. The existing route-level guard remains as defense-in-depth (belt and suspenders). Both layers are active in `security.mode === 'full'`.

### Decision 4: Per-user token exchange is backend-only with graceful fallback

`TokenExchangeManager` reads the user's OIDC token from a configurable request header (injected by auth proxy), exchanges it via RFC 8693, caches per-user, and deduplicates concurrent exchanges. All failures fall back silently to the shared service-account token — no request is ever blocked by token exchange issues. This is deliberately conservative: token exchange enhances audit trails and per-user authorization but must never degrade availability.

### Decision 5: Separation of authorization concerns

Three non-overlapping authorization layers:

- **Backstage** governs: UI visibility, agent lifecycle governance, ownership, approval workflows, admin operations
- **Kagenti** governs: agent specs, tools, runtime operations — via per-user exchanged token when enabled
- **Kubernetes** governs: pod/deployment operations, namespace scoping, SPIRE mTLS

## Risks

- **RBAC policy complexity:** 16 permissions with conditions is more complex than 2. Mitigated by sensible defaults — `augment.access` as top-level gate and `augment.admin` available for coarse control.
- **Token exchange reliability:** Keycloak availability becomes a dependency. Mitigated by graceful fallback to service-account token on any failure.
- **SonataFlow trust boundary:** Callbacks bypass self-approval prevention via header. Callback identity verification should be implemented to close this gap.
