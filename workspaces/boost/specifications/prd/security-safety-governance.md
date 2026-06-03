# PRD: Security, Safety & Governance

**Product:** Boost — Agentic Developer Portal for Red Hat Developer Hub
**Status:** Requirements for new implementation (informed by Augment reference prototype)
**Date:** 2026-05-19
**Updated:** 2026-06-02 — reframed for boost; 4-stage lifecycle, 16 fine-grained permissions, RFC 8693 token exchange, SonataFlow approval integration, Backstage RBAC as sole authorization layer
**Priority:** P0 (access control, security posture, governance) / P1 (safety shields, SSRF, resilience)
**Provenance:** Requirements derived from Augment plugin analysis and three tech debt assessments (May 13, May 26, May 30 2026). See `specifications/boost-context.md` for project context.

---

## Why

Agentic AI platforms operating in enterprise environments — especially regulated financial institutions — must treat security, safety, and governance as foundational capabilities, not optional add-ons. An AI agent that can call tools, read internal documentation, and take actions on live infrastructure without proper access control, content safety, and audit trails is a liability, not a product.

This PRD defines the enterprise trust model: multi-level access control with fine-grained Backstage RBAC, agent lifecycle governance with approval workflows, per-user identity delegation to AI providers, content safety shields, network security protections, data retention policies, and resilience patterns that ensure the platform is safe to deploy in production.

## What This Product Does

Boost implements a three-tier security mode system, fine-grained role-based access control via Backstage RBAC (16 permissions across agent, tool, and infrastructure resource types), agent lifecycle governance (Draft → Pending → Published → Archived) with configurable approval workflows (built-in or SonataFlow-managed), per-user identity delegation to Kagenti via RFC 8693 token exchange, content safety shields on both inputs and outputs, SSRF protection on all backend HTTP paths, optional zero data retention mode, and resilience patterns. All authorization decisions use Backstage `permissions.authorize()` from day one — no parallel authorization systems in route handlers. The security posture is configurable per environment — from zero-auth development mode to full production lockdown with OAuth token propagation to both MCP servers and AI providers.

## Who It's For

### Administrator

Selects security mode, configures RBAC policies with fine-grained permissions, manages agent lifecycle governance (approving/rejecting agent promotions), sets up MCP auth chains, enables safety shields, configures data retention mode, and manages network security.

### Security Architect

Designs the security posture, evaluates the auth chain for tool connections, configures per-user token exchange for Kagenti, and configures SPIRE for infrastructure-level mTLS in Kagenti environments.

### Agent Creator

Creates agents and submits them for governance review. Subject to ownership-based permissions — can only promote, withdraw, or delete their own draft agents.

## Boundaries

### In Scope

- Three security modes: `development-only-no-auth`, `plugin-only`, `full`
- Fine-grained RBAC via Backstage permissions (16 permissions, 3 resource types, conditional rules)
- Agent lifecycle governance: 4-stage model (Draft → Pending → Published → Archived) with approval workflows
- SonataFlow integration for external approval orchestration
- Per-user Kagenti identity via RFC 8693 OAuth2 Token Exchange
- Frontend SecurityGate with meaningful access-denied page
- CSRF protection via `X-Backstage-Request` header
- Content safety shields (input and output) with fail-open/fail-closed
- SSRF protection on all backend HTTP calls
- Zero Data Retention (ZDR) mode
- MCP 4-level auth chain
- Kagenti SPIRE integration for infrastructure mTLS
- Provider offline detection and error boundaries
- Self-approval prevention (agent creator ≠ agent approver)
- Ownership-based visibility and action gating

### Out of Scope

- HITL tool approval (see AI Chat & Interaction PRD — UC-3)
- MCP tool registration (see Agent Creation & Discovery PRD — UC-13)
- Runtime configuration mechanics (see Platform Operations PRD)
- Agent creation paths (see Agent Creation & Discovery PRD)

### UX/UXD Integration

Security and governance UI surfaces (access-denied pages, approval queues, review queue, lifecycle stage indicators, safety shield configuration, permission-gated admin sections) must align with RHDH usability and visual design standards:

- **Mockups as source of truth:** Approval queue UI, review queue filtering, access-denied pages, safety shield configuration panels, and lifecycle governance controls are built from UX/UXD-provided mockups. No governance-facing UI ships without an approved design artifact.
- **PatternFly alignment:** All governance components use PatternFly design system patterns consistent with RHDH.
- **Design review gates:** Frontend PRs modifying governance or security-facing UI require UX/UXD sign-off before merge.

---

## Capabilities

### 1. Define Security Posture and Access Control (UC-20)

**Goal:** Configure who can access Augment, who has admin privileges, and how tool connections and AI providers are authenticated.

**Three security modes:**

| Mode                       | Frontend                          | Backend                                                                  | Provider Auth                                                                       | Use Case                                 |
| -------------------------- | --------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- | ---------------------------------------- |
| `development-only-no-auth` | No gate — all users pass as guest | No RBAC, everyone is admin                                               | Static token/TLS (if configured)                                                    | Development/demo only                    |
| `plugin-only`              | SecurityGate wraps AugmentPage    | user-cookie, augment.access, admin allow-list, real user principal       | Token/TLS to Llama Stack, Keycloak OAuth2 for Kagenti                               | Recommended for production               |
| `full`                     | SecurityGate wraps AugmentPage    | Fine-grained RBAC (16 permissions), real user principal, mcpOAuth config | Token/TLS + MCP OAuth chain, Keycloak OAuth2 + per-user token exchange + SPIRE mTLS | Full production with identity delegation |

**Note:** The legacy mode name `none` is deprecated; deployments should use `development-only-no-auth`. A prominent warning is logged if this mode is detected in a non-development environment.

**Fine-grained RBAC (16 permissions across 3 resource types):**

| Permission                | Resource Type   | Conditional Rules                       | Description                                         |
| ------------------------- | --------------- | --------------------------------------- | --------------------------------------------------- |
| `augment.agent.list`      | —               | —                                       | View agent list (visibility filtering by ownership) |
| `augment.agent.register`  | —               | —                                       | Register a new agent for governance                 |
| `augment.agent.promote`   | `augment-agent` | `IS_OWNER`, `HAS_LIFECYCLE_STAGE`       | Submit draft agent for review (draft→pending)       |
| `augment.agent.approve`   | `augment-agent` | `IS_NOT_CREATOR`, `HAS_LIFECYCLE_STAGE` | Approve pending agent (pending→published)           |
| `augment.agent.demote`    | `augment-agent` | —                                       | Reject, request-unpublish, approve-unpublish        |
| `augment.agent.publish`   | `augment-agent` | —                                       | Publish an approved agent                           |
| `augment.agent.unpublish` | `augment-agent` | `IS_OWNER`                              | Request unpublishing of a published agent           |
| `augment.agent.withdraw`  | `augment-agent` | `IS_OWNER`                              | Withdraw a pending submission                       |
| `augment.agent.delete`    | `augment-agent` | `IS_OWNER`, `HAS_LIFECYCLE_STAGE`       | Delete agent (draft stage only for non-admins)      |
| `augment.agent.configure` | —               | —                                       | Edit agent configuration                            |
| `augment.tool.promote`    | `augment-tool`  | `IS_OWNER`                              | Promote tool through lifecycle                      |
| `augment.tool.approve`    | `augment-tool`  | `IS_NOT_CREATOR`                        | Approve tool promotion                              |
| `augment.tool.demote`     | `augment-tool`  | —                                       | Demote tool lifecycle stage                         |
| `augment.tool.publish`    | `augment-tool`  | —                                       | Publish a tool                                      |
| `augment.tool.unpublish`  | `augment-tool`  | —                                       | Unpublish a tool                                    |
| `augment.kagenti.admin`   | —               | —                                       | Kagenti infrastructure operations                   |

**Conditional permission rules:**

- `IS_OWNER`: Checks `resource.createdBy === currentUser` — enables ownership-scoped actions
- `IS_NOT_CREATOR`: Checks `resource.createdBy !== currentUser` — enforces separation of duties (self-approval prevention)
- `HAS_LIFECYCLE_STAGE`: Checks `resource.lifecycleStage` against allowed stages — enforces valid lifecycle transitions

**RBAC configuration:**

- Fine-grained permissions are the primary authorization mechanism from day one
- `augment.access` serves as a top-level gate (if denied, all sub-permissions are denied)
- `augment.admin` is available for deployments that prefer coarse-grained admin control
- `augment.security.adminUsers` config is available for bootstrap/development only

**MCP auth chain (4 levels):**

1. Auth references (per-tool)
2. Per-server OAuth (client credentials)
3. ServiceAccount tokens
4. Global fallback

**Additional controls:**

- SSRF protection on all backend HTTP calls (ingestion and MCP paths)
- CSRF protection: `X-Backstage-Request` header required on all mutating fetch operations
- Zero Data Retention mode: inference responses not stored on server; continuity uses encrypted reasoning tokens
- Kagenti SPIRE: infrastructure-level mTLS with X.509 certificates per agent pod
- DevSpaces credentials: tokens must be stored encrypted in admin config DB (not plaintext)

**Frontend enforcement:**

- `SecurityGate` wraps `AugmentPage` with loading, config errors, and `RequirePermission`
- Fine-grained permission checks via `usePermissions` (batched) per admin panel section
- Unauthorized users see a meaningful access-denied page

**Epics/Stories:** Epic 8 (Features 8.1, 8.3, 8.4), Epic 3 (Story 3.5.1)

### 2. Agent Lifecycle Governance (UC-23, UC-24, UC-25)

**Goal:** Govern the lifecycle of agents from creation through publication with approval workflows, ownership enforcement, and separation of duties.

**4-stage lifecycle model:**

```
Draft → Pending → Published → Archived
  ↑        |          |
  |     withdraw    request-unpublish
  |        ↓          ↓
  |     Draft     Pending (unpublish)
  |                   ↓
  |              approve-unpublish → Archived
  |              reject-unpublish → Published
  └── (rejected → Draft)
```

**Governance registration:** Agents must be registered for governance (`POST /agents/:id/register-for-governance`) before lifecycle promotion. The `governanceRegistered` flag gates access to lifecycle actions.

**Lifecycle actions:**

| Action                      | From Stage          | To Stage            | Who Can Do It                                      |
| --------------------------- | ------------------- | ------------------- | -------------------------------------------------- |
| Register for governance     | —                   | Draft               | Any authenticated user                             |
| Submit for review (promote) | Draft               | Pending             | Owner only                                         |
| Approve                     | Pending             | Published           | Admin (not the creator — self-approval prevention) |
| Reject                      | Pending             | Draft               | Admin (not the creator)                            |
| Request unpublish           | Published           | Pending (unpublish) | Owner or admin                                     |
| Approve unpublish           | Pending (unpublish) | Archived            | Admin                                              |
| Reject unpublish            | Pending (unpublish) | Published           | Admin                                              |
| Withdraw                    | Pending             | Draft               | Owner only                                         |
| Delete                      | Draft               | (removed)           | Owner (draft only) or admin (any stage)            |

**Self-approval prevention:** When an agent is promoted from Pending → Published, the approver must not be the same user who created the agent. This is enforced as both a Backstage permission rule (`IS_NOT_CREATOR`) and a defense-in-depth route guard.

**Ownership-based visibility:** Non-admin users see only: published agents, their own draft/pending agents, and agents with no `createdBy` (legacy/unowned). Admins see all agents.

**SonataFlow approval workflow integration:**

- Dual-mode: built-in lifecycle transitions OR SonataFlow-managed approval workflows
- When SonataFlow is enabled, `promote` triggers a CloudEvents POST to start an external approval workflow
- SonataFlow callbacks via `X-Augment-Workflow-Callback: true` header execute the approved/rejected transition
- Callback loop prevention guards prevent re-triggering workflows on callback-driven transitions
- Fail-closed: if workflow fails to start, agent reverts to Draft with 502 error
- SonataFlow callbacks create a separate trust boundary — callback identity should be verified

**Cascading delete:** `DELETE /agents/:id` detects the agent's source (kagenti, orchestration, workflow) and cascades cleanup across corresponding backend stores.

### 3. Per-User Identity Delegation — Kagenti Token Exchange (UC-20 extension)

**Goal:** Propagate the authenticated user's identity to Kagenti so that agent operations are authorized per-user, not via a shared service-account.

**Current state:** Augment authenticates to Kagenti using a shared service-account token (Keycloak `client_credentials` grant). All requests appear as the same service identity regardless of which user initiated them. The `X-Backstage-User` header is informational only.

**Target state:** RFC 8693 OAuth2 Token Exchange. The user's OIDC token (injected by an auth proxy such as oauth2-proxy or Keycloak Gatekeeper) is exchanged for a Kagenti-scoped token, enabling per-user authorization at the provider level.

**Architecture:**

- Backend-only implementation: OIDC token read from a configurable request header (default: `X-Forwarded-Access-Token`)
- `TokenExchangeManager` service: implements RFC 8693 exchange against Keycloak, with per-user token caching, concurrent request deduplication, and streaming-compatible token lifecycle
- Graceful fallback on all failures: token exchange failure, missing header, disabled config, or Keycloak error → silently falls back to shared service-account token (no request blocking)
- Configuration: `augment.kagenti.auth.tokenExchange.enabled` (default: false), `audience`, `userTokenHeader`
- `ResponsesApiProvider` (Llama Stack) is unaffected: `setUserContext` method is optional and not implemented

**Separation of authorization concerns:**

- **Backstage governs:** UI visibility, agent lifecycle governance (draft/pending/published), ownership, approval workflows, admin operations
- **Kagenti governs:** agent specs, tools, runtime operations — authorized via per-user exchanged token when enabled
- **Kubernetes governs:** pod/deployment operations, namespace scoping, SPIRE mTLS

### 4. Safety Shields and Guardrails (UC-19)

**Goal:** Enable content safety filtering on agent inputs and outputs to prevent harmful, injected, or destructive content.

**How it works:**

1. Admin enables input shields (applied to user messages before sending to model):
   - Prompt injection detection
   - Harmful content filtering
2. Admin enables output shields (applied to agent responses before displaying):
   - Harmful content filtering
   - Destructive command detection
3. Per-shield behavior configuration: fail-open (log and continue) or fail-closed (block the message)
4. Custom safety patterns if needed

**Shield violation handling:**

- Violation is logged for review
- Fail-closed: user sees a safety message instead of blocked content
- Fail-open: content passes through but violation is logged

**Backend implementation:** `SafetyService` delegates to the AI platform's Safety API (Llama Stack).

**Admin UI:** `SafetyShieldsSection` and `SafetyPatternsSection` in `SafetyEvalPanel`.

**Epics/Stories:** Epic 8 (Feature 8.2)

### 5. Resilience Patterns (Epic 8, Feature 8.5)

**Goal:** Graceful degradation when things go wrong.

**Provider offline:**

- `ProviderOfflineBanner` displayed when `useStatus` detects provider is down
- Chat resumes when provider recovers

**Error handling:**

- `AugmentErrorBoundary` prevents page crashes
- `ErrorCard` displayed inline on per-message errors
- Snackbar toasts via `useToast` for transient notifications

**Epics/Stories:** Epic 8 (Feature 8.5)

---

## Architecture Context

**Security model layers (7 enforcement layers across 3 modes):**

```
Frontend Layer
├── SecurityGate.tsx         — wraps AugmentPage, checks RequirePermission
├── usePermissions (batched) — fine-grained per admin panel section
└── CSRF                     — X-Backstage-Request header on all mutating fetches

Backend Middleware (5 layers)
├── Backstage HTTP           — user-cookie / unauthenticated
├── requirePluginAccess      — augment.access / skipped
├── authorizeLifecycleAction — fine-grained permission check via permissions.authorize()
├── User identity            — real user principal (OIDC) / user-default/guest
└── MCP OAuth                — mcpOAuth config / N/A / N/A

Agent Lifecycle Governance
├── Ownership enforcement    — createdBy field, IS_OWNER permission rule
├── Self-approval prevention — IS_NOT_CREATOR rule + defense-in-depth route guard
├── Lifecycle stage gating   — HAS_LIFECYCLE_STAGE rule
└── SonataFlow integration   — CloudEvents trigger, callback trust boundary

Provider Authentication
├── Llama Stack              — static token/TLS → Token/TLS → Token/TLS + MCP OAuth chain
└── Kagenti                  — no auth → client_credentials → per-user token exchange (RFC 8693) + SPIRE mTLS

Cross-Cutting Protections (all modes)
├── SsrfGuard               — blocks SSRF on all HTTP paths
├── Zero Data Retention      — encrypted reasoning tokens for continuity
└── Content Safety Shields   — fail-open/fail-closed per shield
```

**Key implementation files:**

- `middleware/security.ts`: security mode enforcement, `requirePluginAccess`, `authorizeLifecycleAction`
- `permissions.ts`: 16 fine-grained permissions, 2 resource types, 3 conditional rules
- `TokenExchangeManager`: RFC 8693 per-user token exchange for Kagenti
- `AgentApprovalWorkflowService`: SonataFlow integration
- `services/SafetyService`: safety shield delegation
- `services/McpAuthService`: 4-level auth chain
- `services/SsrfGuard`: DNS re-check SSRF protection
- Frontend `SecurityGate.tsx`: permission gating

---

## Traceability

| Capability                        | Use Case            | Priority | Stories                          |
| --------------------------------- | ------------------- | -------- | -------------------------------- |
| Security Posture & Access Control | UC-20               | P0       | 8.1.1-8.1.3, 8.3.1, 8.4.1, 3.5.1 |
| Agent Lifecycle Governance        | UC-23, UC-24, UC-25 | P0       | (new)                            |
| Per-User Token Exchange           | UC-20 (extension)   | P1       | (new)                            |
| Fine-Grained Permissions          | UC-20 (extension)   | P0       | (new)                            |
| Safety Shields                    | UC-19               | P1       | 8.2.1-8.2.2                      |
| Resilience                        | (cross-cutting)     | P1       | 8.5.1-8.5.2                      |

---

## Customer Context

Derived from the Citi engagement. Architecture principle: "Enterprise-first trust model. Human-in-the-loop approval, RBAC, audit trails, safety shields, and zero data retention are foundational, not optional."

Citi's regulatory and compliance requirements for AI tooling include audit trails, access controls, data residency, and separation of duties. The security model is designed to meet these requirements while supporting progressive enforcement from development through production.

The fine-grained permission model and agent lifecycle governance address specific Citi requirements: no single individual should be able to both create and publish an agent to production users (separation of duties), and all governance decisions should be visible to Backstage RBAC policy configuration (no shadow authorization systems).

Success outcomes addressed:

- Enterprise security, safety, and compliance are built in (UC-19, UC-20)
- Sensitive operations stay under human control (UC-3, addressed in AI Chat PRD)
- Agent lifecycle governed with approval workflows and separation of duties (UC-23, UC-24, UC-25)
- Per-user identity delegated to AI providers for audit trail (UC-20 extension)
