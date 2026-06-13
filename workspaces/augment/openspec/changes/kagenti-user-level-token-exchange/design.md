# Design: Per-User OAuth2 Token Exchange for Kagenti Provider

## Context

The augment plugin's Kagenti provider authenticates to Kagenti using a single shared service-account token via Client Credentials Grant (`KeycloakTokenManager`). All backend requests to Kagenti carry the same identity regardless of which Backstage user initiated the request. The user's identity is passed only as an informational `X-Backstage-User` header.

Kagenti supports RFC 8693 OAuth2 Token Exchange, which can swap a user's OIDC access token for a Kagenti-scoped token preserving the user's `sub` claim while adding an `act` (actor) claim for the service. This enables per-user authorization decisions at the Kagenti layer.

**Key constraint:** Backstage replaces the user's Keycloak OIDC token with its own JWT before it reaches backend plugins. `req.headers.authorization` contains a Backstage-minted token, not the user's Keycloak token. The user's original OIDC token must arrive via a separate mechanism.

**Frontend constraint:** Backstage's `createApiFactory` requires all `deps` to be resolvable — there is no optional dependency concept. Adding `oidcAuthApiRef` as a hard dependency would crash deployments that don't use OIDC auth. `useApi()` throws synchronously during render if the API isn't registered. However, `useApiHolder()` provides dynamic discovery at runtime — the orchestrator plugin already uses this pattern to find custom auth providers without static dependencies (see `useOrchestratorAuth.ts`).

## Goals / Non-Goals

**Goals:**

- Enable per-user authorization at the Kagenti layer via RFC 8693 token exchange
- Acquire the user's OIDC token via frontend discovery (primary) or configurable header (fallback)
- Graceful fallback to service-account token at every failure point
- Make per-user token exchange opt-in and disabled by default
- Zero impact on `ResponsesApiProvider` or Llama Stack code paths

**Non-Goals:**

- Changes to the `KeycloakTokenManager` service-account flow
- Per-user authorization for non-Kagenti providers
- Custom Keycloak realm or client configuration tooling
- Token exchange for the `X-Backstage-User` header (informational only)

## Decisions

### Decision 1: Frontend OIDC discovery with header-based fallback

The primary token acquisition path uses `useApiHolder()` to dynamically discover the OIDC auth provider at runtime — the same pattern the orchestrator plugin uses in `useOrchestratorAuth.ts`. When the user first interacts with Kagenti, the frontend discovers the OIDC provider via the API holder, triggers a login prompt if needed, and sends the OIDC token to the backend for RFC 8693 exchange. This avoids the `createApiFactory` hard dependency problem while giving users an explicit "connect to Kagenti" experience.

When the OIDC provider is not discoverable (non-Keycloak deployments, headless environments), the system falls back to reading the user's OIDC token from a configurable request header. The header can be populated by:

1. An auth proxy (oauth2-proxy, Keycloak Gatekeeper) — many RHDH deployments already have one
2. Custom middleware extracting the OIDC token from the session
3. A customer's own auth infrastructure — any mechanism that can place a valid OIDC-compatible access token into the configured HTTP header

**Custom auth mechanisms:** The header-based fallback is deliberately auth-provider-agnostic. The system does not assume Keycloak or any specific IdP — it only requires that (a) a valid OIDC access token arrives in the configured header, and (b) the configured `auth.tokenEndpoint` supports RFC 8693 token exchange for that token.

**Why `useApiHolder()` and not `useApi()`:** `useApi()` throws synchronously if the API isn't registered, and `createApiFactory` has no optional dependency concept. `useApiHolder()` returns `undefined` for unregistered APIs, allowing graceful detection. The orchestrator uses this for custom providers (`findCustomProvider` in `useOrchestratorAuth.ts`), including accessing `internal.auth.oidc` via the API holder's internal map.

**Alternative considered:** `createApiFactory` with `oidcAuthApiRef` as a hard dependency. Rejected because it would crash non-OIDC deployments.

**Alternative considered:** Header-only (no frontend). Rejected because it requires auth proxy configuration for the common Keycloak case, adds deployment complexity, and misses the opportunity to give users an explicit login-to-Kagenti action.

**Alternative considered:** Backstage middleware extracting from session. Rejected because it couples to Backstage auth internals and requires session storage access.

### Decision 2: New `TokenExchangeManager` modeled on `KeycloakTokenManager`

Create a dedicated manager class rather than extending `KeycloakTokenManager`. The exchange manager handles per-user token caching (keyed by user), concurrent request deduplication, streaming-aware token lifetime, and exchange-specific error handling.

**Alternative considered:** Extending `KeycloakTokenManager` with user-keyed methods. Rejected because the two have different lifecycles (system-wide vs. per-user), different cache semantics, and mixing them would complicate the clean fallback logic.

### Decision 3: Graceful fallback at every stage

The implementation never blocks functionality. At every point where exchange is attempted, failure falls back to the existing service-account token. However, to avoid masking misconfigurations, fallback cases are logged at different severity levels depending on whether they indicate a problem:

- Config disabled or header absent → service-account token directly (debug-level log — this is expected in deployments that don't use token exchange or for unauthenticated requests)
- Exchange call fails (network, IdP error) → try/catch, **warn**-level log with error details, service-account fallback
- Exchanged token rejected (401) → **warn**-level log, clear both caches, retry with fresh token
- IdP doesn't support exchange (400 `unsupported_grant_type`) → **warn**-level log, service-account fallback

Warning-level logs for unexpected failures ensure that admins who enable token exchange can diagnose issues via standard log monitoring. The system does not fail hard because blocking user requests due to an exchange misconfiguration is worse than falling back to the pre-existing service-account behavior — the user still gets a response, and the admin gets a warning to investigate.

**Alternative considered:** Failing hard when exchange is enabled but fails. Rejected because this would turn a misconfiguration into an outage — the service-account token path is known to work and is the pre-existing behavior. The warning logs provide the diagnostic signal without the blast radius.

### Decision 4: Widen `setUserContext` with optional second parameter

The `AugmentProvider` interface method `setUserContext?(userRef: string)` is widened to `setUserContext?(userRef: string, bearerToken?: string)`. This is backward-compatible: `ResponsesApiProvider` does not implement `setUserContext` at all (it's optional on the interface), and the `if (provider.setUserContext)` guards in route code skip it entirely.

### Decision 5: Config structure nested under `augment.kagenti.auth`

Token exchange config is nested under the existing auth block as an optional `tokenExchange` sub-key:

```yaml
augment:
  kagenti:
    auth:
      tokenExchange:
        enabled: true # default: false
        audience: kagenti-api # default: auth.clientId
        userTokenHeader: X-Forwarded-Access-Token # default: x-user-oidc-token (fallback only)
```

This reuses the existing `tokenEndpoint`, `clientId`, and `clientSecret` from the parent auth block. No new top-level config keys. The `userTokenHeader` is only used when frontend OIDC discovery is not available — in Keycloak deployments where discovery succeeds, the frontend acquires the token directly and the header config is unused.

## Prerequisites

For per-user token exchange to function, the deployment must have:

1. **An OIDC auth provider accessible via the Backstage API holder** (primary path) — in RHDH Keycloak deployments, this is typically `internal.auth.oidc`. The frontend discovers this at runtime via `useApiHolder()`. **OR** a mechanism to inject the user's OIDC access token into the configured HTTP header (fallback path, default: `x-user-oidc-token`) — typical options include an auth proxy (oauth2-proxy, Keycloak Gatekeeper), custom middleware, or a customer's own auth infrastructure. Without either, the system falls back to the service-account token.
2. **An IdP token endpoint that supports RFC 8693 token exchange** (configured via `auth.tokenEndpoint`). For Keycloak, `token-exchange-standard:v2` is enabled by default in modern versions. The requesting client (`auth.clientId`) must have permission to exchange tokens for the target audience.
3. **The existing `auth.clientId`, `auth.clientSecret`, and `auth.tokenEndpoint`** must already be configured for the Kagenti provider's service-account flow.

## Risks / Trade-offs

- **OIDC provider not discoverable** → Frontend discovery returns `undefined` and no header token present → falls back to service-account silently. Non-OIDC deployments without a header injection mechanism get no per-user auth.
- **Keycloak doesn't support token exchange** → Returns 400 `unsupported_grant_type`. Caught, warned, falls back. Requires Keycloak admin to enable token exchange on the realm.
- **OIDC token expired** → Exchange fails, caught, falls back. Short-lived tokens may cause frequent fallbacks. When the token is acquired via frontend discovery, the OIDC provider may handle refresh transparently via its `getIdToken()` implementation. When acquired via header, the backend cannot refresh the user's token — keeping it alive is the responsibility of the injecting layer (auth proxy or customer infrastructure).
- **Memory** → Per-user cache bounded by concurrent users (~2KB per entry × 1000 users = ~2MB). Acceptable for backend plugin.
- **`useApiHolder()` internal API access** → The orchestrator's `findCustomProvider` accesses `apiHolder.apis` (a private `Map`) via `@ts-ignore` to discover statically-registered auth providers like `internal.auth.oidc`. This is not a public Backstage API and could break if Backstage changes the internal representation. Mitigated by the fact that the orchestrator already ships this pattern in production RHDH, and the header-based fallback provides a working alternative if the internal access breaks.
- **Security surface** → The configurable header must be trusted. If an attacker can inject the header, they can impersonate users. Mitigated by typical auth proxy architectures stripping/overwriting upstream headers.
