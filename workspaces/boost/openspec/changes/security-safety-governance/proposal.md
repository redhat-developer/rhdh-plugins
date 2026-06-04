# Proposal: Security, Safety & Governance

## Why

Enterprise AI platforms must treat security, safety, and governance as foundational capabilities. Augment implements a three-tier security mode system, RBAC, content safety shields, SSRF protection, and zero data retention. However, the permission model is too coarse (2 permissions vs. peer plugins' 7+), the security modes are non-standard, and there are no resource-based permissions for owned resources.

## What Changes

### Current Capabilities (retroactive documentation)

- Three security modes: `none`, `plugin-only`, `full`
- RBAC via Keycloak OIDC + Backstage permissions (`augment.access`, `augment.admin`)
- Frontend `SecurityGate` with meaningful access-denied page
- Content safety shields (input/output) with fail-open/fail-closed
- SSRF protection via `SsrfGuard` on all backend HTTP paths
- Zero Data Retention mode with encrypted reasoning tokens
- MCP 4-level auth chain
- Kagenti SPIRE integration for infrastructure mTLS
- Provider offline detection and error boundaries

### Architectural Improvements (from tech debt analysis)

- Expand from 2 to 7-9 fine-grained permissions (matching Lightspeed granularity)
- Add resource-based permissions for owned resources (sessions, documents, agents)
- Rename `none` security mode to `development-only-no-auth` with production warning
- Replace `adminUsers` fallback with standard Backstage RBAC-only pattern

## Impact

- `plugins/augment-common/src/permissions.ts` — expanded permission definitions
- `plugins/augment-backend/src/middleware/security.ts` — fine-grained enforcement
- `plugins/augment/src/components/SecurityGate.tsx` — granular permission checks
- `plugins/augment-backend/src/routes/` — per-route permission requirements
