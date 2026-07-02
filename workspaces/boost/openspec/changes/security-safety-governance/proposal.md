# Proposal: Security, Safety & Governance

## Why

Enterprise AI platforms must treat security, safety, and governance as foundational capabilities. Boost implements a three-tier security mode system, RBAC, content safety shields, SSRF protection, and zero data retention. The permission model uses 16 fine-grained Backstage permissions from day one, with resource-based permissions for owned resources and conditional rules for ownership and lifecycle gating.

## What Boost Builds

### Security Modes

- Three security modes: `development-only-no-auth`, `plugin-only`, `full`
- Production environment detection with startup warning

### Fine-Grained Permissions

- 16 Backstage permissions across 2 resource types (`boost-agent`, `boost-tool`) plus functional permissions
- Conditional rules: `IS_OWNER`, `IS_NOT_CREATOR`, `HAS_LIFECYCLE_STAGE`
- `authorizeLifecycleAction` middleware as the sole authorization path — no scattered per-route guards
- All authorization decisions use `permissions.authorize()` from day one

### Identity & Authentication

- RBAC via Keycloak OIDC + Backstage permissions (`boost.access`, `boost.admin` as top-level gates)
- OAuth2 Client Credentials Grant for Kagenti service-account authentication via `KeycloakAuthClient`
- Token caching with configurable expiry buffer and max-1-retry on 401
- MCP 4-level auth chain
- Kagenti SPIRE integration for infrastructure mTLS

### Safety & Protection

- Content safety shields (input/output) with fail-open/fail-closed modes
- SSRF protection via `SsrfGuard` on all backend HTTP paths
- Zero Data Retention mode with encrypted reasoning tokens
- CSRF protection via `X-Backstage-Request` header
- Credential encryption for sensitive DB-stored values

### Frontend Security

- `SecurityGate` component with meaningful access-denied page
- `<RequirePermission>` wrapping for fine-grained UI gating
- Batched permission checks via `usePermissions` for performance

## Impact

- `plugins/boost-common/src/permissions.ts` — 16 permission definitions with resource types
- `plugins/boost-backend/src/middleware/security.ts` — `authorizeLifecycleAction` middleware
- `plugins/boost-frontend/src/components/SecurityGate.tsx` — granular permission checks
- `plugins/boost-node/src/KeycloakAuthClient.ts` — `KeycloakAuthClient` (OAuth2 Client Credentials Grant)
