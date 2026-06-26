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

### Requirement: Service-Account Kagenti Authentication via Keycloak

Kagenti requests MUST be authenticated using a dedicated service-account via OAuth2 Client Credentials Grant. User identity MUST be propagated via headers for audit purposes.

#### Scenario: Service-account token acquisition

- **WHEN** `boost.kagenti.auth.tokenEndpoint` is configured
- **AND** `boost.kagenti.auth.clientId` and `boost.kagenti.auth.clientSecret` are provided
- **THEN** `KeycloakTokenManager` obtains a service-account token via OAuth2 Client Credentials Grant
- **AND** the token is cached with a configurable expiry buffer (default: 60 seconds)
- **AND** concurrent token requests share a single in-flight Keycloak call
- **AND** the `Authorization: Bearer <token>` header is added to all Kagenti API calls

#### Scenario: Streaming token lifecycle

- **WHEN** a streaming (SSE) request is initiated
- **THEN** `getTokenForStreaming(minLifetimeMs)` ensures the token has sufficient remaining validity
- **AND** if the token would expire during the stream, a fresh token is obtained before the request starts

#### Scenario: Token refresh on authentication failure

- **WHEN** a Kagenti API call returns HTTP 401
- **THEN** the cached token is immediately invalidated
- **AND** a fresh token is obtained from Keycloak
- **AND** the original request is retried with the new token
- **AND** the retry is attempted at most once — if the retried request also returns 401, the error is propagated to the caller

#### Scenario: User identity propagation

- **WHEN** a Kagenti API call is made on behalf of a user
- **THEN** the `X-Backstage-User` header carries the Backstage user entity ref (e.g., `user:default/jsmith`)
- **AND** this header is informational only — authentication is via the service-account token

#### Scenario: Service-account auth configuration

- **WHEN** Kagenti authentication is configured
- **THEN** the following config is used:
  | Key | Default | Description |
  |---|---|---|
  | `boost.kagenti.auth.tokenEndpoint` | — | Keycloak token endpoint URL |
  | `boost.kagenti.auth.clientId` | — | OAuth2 client ID for service-account |
  | `boost.kagenti.auth.clientSecret` | — | OAuth2 client secret |
  | `boost.kagenti.auth.tokenExpiryBufferSeconds` | `60` | Seconds before expiry to refresh token |

#### Scenario: LlamaStack provider unaffected

- **WHEN** Kagenti service-account auth is configured
- **THEN** `ResponsesApiProvider` is not modified — it uses a separate authentication path
- **AND** Keycloak service-account auth is Kagenti-specific

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
