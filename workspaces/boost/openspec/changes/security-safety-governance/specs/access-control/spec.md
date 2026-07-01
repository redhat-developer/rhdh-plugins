# Access Control and Security Posture

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

Multi-level security configuration controlling who accesses Boost, who has admin privileges, and how tool connections are authenticated.

## EXISTING Requirements

### Requirement: Three Security Modes

The plugin supports progressive security enforcement from development through production.

#### Scenario: Security mode `development-only-no-auth` (development only)

- **WHEN** `boost.security.mode` is set to `development-only-no-auth`
- **THEN** the frontend shows no SecurityGate — all users pass as guest
- **AND** the backend skips RBAC and treats everyone as admin
- **AND** provider auth uses static token/TLS if configured
- **AND** if detected in a non-development environment, a prominent warning is logged at startup

#### Scenario: Rejected legacy mode name `none`

- **WHEN** `boost.security.mode` is set to `none`
- **THEN** boost fails to start with a clear error message
- **AND** the error directs the user to use `development-only-no-auth` instead

#### Scenario: Security mode `plugin-only` (recommended production)

- **WHEN** `boost.security.mode` is set to `plugin-only`
- **THEN** `SecurityGate` wraps `BoostPage` with `RequirePermission`
- **AND** the backend enforces `boost.access` via `requirePluginAccess` middleware
- **AND** admin access uses an explicit `adminUsers` allowlist
- **AND** real user principal is extracted from the request

#### Scenario: Security mode `full` (full production with token propagation)

- **WHEN** `boost.security.mode` is set to `full`
- **THEN** the backend enforces both `boost.access` and `boost.admin` via Backstage RBAC
- **AND** MCP OAuth chain is configured for token propagation to tool servers
- **AND** Kagenti uses Keycloak OAuth2 + SPIRE mTLS

### Requirement: Frontend Security Enforcement

Unauthorized users see meaningful access-denied pages, not broken UIs.

#### Scenario: SecurityGate blocks unauthorized access

- **WHEN** a user without `boost.access` permission navigates to Boost
- **THEN** `SecurityGate` renders a meaningful access-denied page
- **AND** the page explains what permission is needed and how to request access

### Requirement: MCP Auth Chain

Tool connections authenticate through a 4-level hierarchical resolution.

#### Scenario: Auth chain resolves credentials

- **WHEN** an MCP tool call requires authentication
- **THEN** `McpAuthService` resolves in order: auth references (per-tool) → per-server OAuth (client credentials) → ServiceAccount tokens → global fallback
- **AND** caching with deduplication prevents concurrent refresh storms

### Requirement: SSRF Protection

All backend HTTP paths are protected against SSRF attacks.

#### Scenario: SsrfGuard blocks internal network access

- **WHEN** a backend HTTP call targets an internal/private network address
- **THEN** `SsrfGuard` performs DNS re-check and blocks the request
- **AND** this applies to all HTTP paths: ingestion, MCP, and provider calls

### Requirement: Zero Data Retention Mode

Inference responses are not stored on the server when ZDR is enabled.

#### Scenario: ZDR mode active

- **WHEN** zero data retention is configured
- **THEN** inference responses are not persisted on the server
- **AND** conversation continuity uses encrypted reasoning tokens instead of stored messages

## ADDED Requirements

### Requirement: Service-Account Keycloak Authentication for Kagenti

Kagenti API calls MUST be authenticated via OAuth2 Client Credentials Grant using `KeycloakAuthClient` for service-account authentication. For user-initiated requests (chat, agent operations via `KagentiApiClient`), user identity is propagated via the `X-Backstage-User` header for audit purposes. Entity provider background polling has no user context and omits this header.

#### Scenario: Token acquisition

- **WHEN** `boost.kagenti.auth.tokenEndpoint`, `clientId`, and `clientSecret` are all configured
- **THEN** `KeycloakAuthClient` acquires a bearer token via OAuth2 Client Credentials Grant
- **AND** the token is cached until `expires_in - tokenExpiryBufferSeconds` seconds
- **AND** the bearer token is included in all Kagenti API requests as `Authorization: Bearer <token>`

#### Scenario: Streaming lifecycle with token refresh

- **WHEN** a cached token is about to expire (within `tokenExpiryBufferSeconds`)
- **THEN** a fresh token is acquired before the next API call
- **AND** in-flight requests continue with the previously cached token

#### Scenario: 401 retry with max-1-retry constraint

- **WHEN** a Kagenti API call returns HTTP 401
- **THEN** the cached token is invalidated and a fresh token is acquired
- **AND** a brief backoff (100 ms) is applied before the retry to avoid hammering the token endpoint under load
- **AND** the request is retried with the new token
- **AND** if the retried request also returns 401, the error is propagated to the caller

#### Scenario: User identity propagation (KagentiApiClient only)

- **WHEN** a user-initiated Kagenti API call is made via `KagentiApiClient` (chat, agent operations)
- **THEN** the `X-Backstage-User` header is set to the user's Backstage identity
- **AND** the service-account bearer token is used for authentication (not the user's token)
- **AND** entity provider background polling omits this header (no user context available)

#### Scenario: Service-account auth configuration

- **WHEN** Kagenti auth is configured
- **THEN** the following config keys are used:
  | Key | Default | Description |
  |---|---|---|
  | `boost.kagenti.auth.tokenEndpoint` | — | Keycloak token endpoint URL |
  | `boost.kagenti.auth.clientId` | — | OAuth2 client ID |
  | `boost.kagenti.auth.clientSecret` | — | OAuth2 client secret (visibility: secret) |
  | `boost.kagenti.auth.tokenExpiryBufferSeconds` | `60` | Seconds before expiry to refresh |

#### Scenario: Kagenti REST API endpoints

- **WHEN** fetching agents from Kagenti
- **THEN** the URL pattern is `GET /api/v1/agents?namespace={ns}` (not `/a2a/`)
- **AND** the response is unwrapped via `unwrapItems` to handle both `{ items: T[] }` and `T[]` shapes

- **WHEN** fetching tools from Kagenti
- **THEN** the URL pattern is `GET /api/v1/tools?namespace={ns}` (not `/a2a/`)
- **AND** the response is unwrapped via `unwrapItems` to handle both response shapes

#### Scenario: LlamaStack provider unaffected

- **WHEN** Kagenti auth is configured
- **THEN** `ResponsesApiProvider` is not modified — `setUserContext` is optional and not implemented
- **AND** Keycloak auth is Kagenti-specific

### Requirement: CSRF Protection

All frontend mutating requests MUST include CSRF protection headers.

#### Scenario: X-Backstage-Request header enforcement

- **WHEN** a mutating fetch operation is made from the frontend
- **THEN** the `X-Backstage-Request` header is included
- **AND** this applies to all fetch operations including workflow dashboard operations

### Requirement: Credential Storage

Sensitive credentials MUST be stored encrypted in the admin config database.

#### Scenario: DevSpaces token encryption

- **WHEN** a DevSpaces token is stored in admin configuration
- **THEN** the token is encrypted at rest in the `boost_admin_config` table
- **AND** plaintext storage of credentials is not permitted

## MODIFIED Requirements

### Requirement: Security Mode Naming

The development security mode MUST use an explicit name that communicates its purpose. The legacy name `none` MUST NOT be accepted.

#### Scenario: Only valid mode names accepted

- **WHEN** `boost.security.mode` is set to any value
- **THEN** only `development-only-no-auth`, `plugin-only`, and `full` are accepted
- **AND** any other value (including `none`) causes a startup error with guidance on valid options

### Requirement: Identity Resolution

User identity resolution MUST use real OIDC credentials in all security modes.

#### Scenario: getUserRef reads real credentials

- **WHEN** `getUserRef()` resolves the current user's identity
- **THEN** it reads real OIDC credentials from `httpAuth.credentials` even in `security.mode === 'development-only-no-auth'`
- **AND** falls back to `user:default/guest` only if OIDC credentials are not available
- **AND** this ensures ownership fields (`createdBy`) reflect real users even in development
