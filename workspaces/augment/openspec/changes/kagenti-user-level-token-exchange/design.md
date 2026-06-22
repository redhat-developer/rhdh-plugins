# Design: Per-User OAuth2 Token Exchange for Kagenti Provider

## Context

The augment plugin's Kagenti provider authenticates to Kagenti using a single shared service-account token via Client Credentials Grant (`KeycloakTokenManager`). All backend requests to Kagenti carry the same identity regardless of which Backstage user initiated the request. The user's identity is passed only as an informational `X-Backstage-User` header.

Kagenti supports RFC 8693 OAuth2 Token Exchange, which can swap a user's OIDC access token for a Kagenti-scoped token preserving the user's `sub` claim while adding an `act` (actor) claim for the service. This enables per-user authorization decisions at the Kagenti layer.

**Key constraint:** Backstage replaces the user's Keycloak OIDC token with its own JWT before it reaches backend plugins. `req.headers.authorization` contains a Backstage-minted token, not the user's Keycloak token. The user's original OIDC token must arrive via a separate mechanism.

**Frontend constraint:** Backstage's `createApiFactory` requires all `deps` to be resolvable — there is no optional dependency concept. Adding `oidcAuthApiRef` as a hard dependency would crash deployments that don't use OIDC auth. `useApi()` throws synchronously during render if the API isn't registered. However, `useApiHolder()` provides dynamic discovery at runtime — the orchestrator plugin already uses this pattern to find custom auth providers without static dependencies (see `useOrchestratorAuth.ts`).

## Goals / Non-Goals

**Goals:**

- Enable per-user authorization at the Kagenti layer via RFC 8693 token exchange
- Acquire the user's OIDC token via configurable request header (frontend OIDC discovery via `useApiHolder()` is a planned follow-up)
- Configurable fallback behavior: graceful fallback to service-account token by default, with an option to fail hard for strict security environments
- Make per-user token exchange opt-in and disabled by default
- Zero impact on `ResponsesApiProvider` or Llama Stack code paths

**Non-Goals:**

- Changes to the `KeycloakTokenManager` service-account flow
- Per-user authorization for non-Kagenti providers
- Custom Keycloak realm or client configuration tooling
- Token exchange for the `X-Backstage-User` header (informational only)

## Decisions

### Decision 1: Header-based OIDC token acquisition (frontend discovery as follow-up)

**This change implements the header-based path only.** The user's OIDC token is read from a configurable request header (default: `x-user-oidc-token`). The header can be populated by:

1. An auth proxy (oauth2-proxy, Keycloak Gatekeeper) — many RHDH deployments already have one
2. Custom middleware extracting the OIDC token from the session
3. A customer's own auth infrastructure — any mechanism that can place a valid OIDC-compatible access token into the configured HTTP header

**Custom auth mechanisms:** The header-based path is deliberately auth-provider-agnostic. The system does not assume Keycloak or any specific IdP — it only requires that (a) a valid OIDC access token arrives in the configured header, and (b) the configured `auth.tokenEndpoint` supports RFC 8693 token exchange for that token.

**Planned follow-up — frontend OIDC discovery:** A subsequent change will add frontend OIDC discovery using `useApiHolder()` to dynamically discover the OIDC auth provider at runtime — the same pattern the orchestrator plugin uses in `useOrchestratorAuth.ts`. When the user first interacts with Kagenti, the frontend would discover the OIDC provider via the API holder, trigger a login prompt if needed, and send the OIDC token to the backend for RFC 8693 exchange. This avoids the `createApiFactory` hard dependency problem (which throws synchronously if the API isn't registered) while giving users an explicit "connect to Kagenti" experience. The header-based path implemented in this change will serve as the fallback when the OIDC provider is not discoverable (non-Keycloak deployments, headless environments).

**Alternative considered:** Backstage middleware extracting from session. Rejected because it couples to Backstage auth internals and requires session storage access.

### Decision 2: New `TokenExchangeManager` modeled on `KeycloakTokenManager`

Create a dedicated manager class rather than extending `KeycloakTokenManager`. The exchange manager handles per-user token caching (keyed by user), concurrent request deduplication, streaming-aware token lifetime, and exchange-specific error handling.

**Alternative considered:** Extending `KeycloakTokenManager` with user-keyed methods. Rejected because the two have different lifecycles (system-wide vs. per-user), different cache semantics, and mixing them would complicate the clean fallback logic.

### Decision 3: Configurable fallback behavior

The default behavior falls back to the existing service-account token whenever exchange cannot complete. A new `fallbackToServiceAccount` config option (default: `true`) controls this behavior:

**When `fallbackToServiceAccount: true` (default):**

- Config disabled or header absent → service-account token directly (debug-level log — this is expected in deployments that don't use token exchange or for unauthenticated requests)
- Exchange call fails (network, IdP error) → try/catch, **warn**-level log with error details, service-account fallback
- Exchanged token rejected (401) → **warn**-level log, clear both caches, retry with fresh token
- IdP doesn't support exchange (400 `unsupported_grant_type`) → **warn**-level log, service-account fallback

Warning-level logs for unexpected failures ensure that admins who enable token exchange can diagnose issues via standard log monitoring.

**When `fallbackToServiceAccount: false` (strict mode):**

- No user OIDC token available → request fails with 401 and an error message indicating that per-user auth is required
- Exchange call fails (network, IdP error) → request fails with 502 and error details
- IdP doesn't support exchange → request fails with 502 and error details
- Exchanged token rejected (401) → clear caches, retry once with fresh exchange, fail with 401 if retry also fails

Strict mode is intended for environments with strong security postures where silently downgrading to a shared service-account identity is not acceptable. Admins who enable strict mode accept that exchange failures will surface as user-facing errors rather than being silently absorbed.

**Why configurable and not always-fail:** Failing hard when exchange is enabled but fails would turn a misconfiguration into an outage for deployments that are transitioning to per-user auth or testing the feature. The default permissive behavior is safer for initial rollout, while strict mode gives security-conscious deployments the hard guarantee they need.

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
        userTokenHeader: X-Forwarded-Access-Token # default: x-user-oidc-token
        fallbackToServiceAccount: true # default: true — set to false for strict security environments
```

This reuses the existing `tokenEndpoint`, `clientId`, and `clientSecret` from the parent auth block. No new top-level config keys.

## Prerequisites

For per-user token exchange to function, the deployment must have:

1. **A mechanism to inject the user's OIDC access token into the configured HTTP header** (default: `x-user-oidc-token`) — typical options include an auth proxy (oauth2-proxy, Keycloak Gatekeeper), custom middleware, or a customer's own auth infrastructure. Without a header injection mechanism, the system falls back to the service-account token (or fails if `fallbackToServiceAccount: false`). A planned follow-up will add frontend OIDC discovery via `useApiHolder()` as an additional acquisition path.
2. **An IdP token endpoint that supports RFC 8693 token exchange** (configured via `auth.tokenEndpoint`). For Keycloak, `token-exchange-standard:v2` is enabled by default in modern versions. The requesting client (`auth.clientId`) must have permission to exchange tokens for the target audience.
3. **The existing `auth.clientId`, `auth.clientSecret`, and `auth.tokenEndpoint`** must already be configured for the Kagenti provider's service-account flow.

## Risks / Trade-offs

- **No OIDC token in header** → No header token present → falls back to service-account (or fails in strict mode). Non-OIDC deployments without a header injection mechanism get no per-user auth until frontend OIDC discovery is added.
- **Keycloak doesn't support token exchange** → Returns 400 `unsupported_grant_type`. Caught, warned, falls back. Requires Keycloak admin to enable token exchange on the realm.
- **OIDC token expired** → Exchange fails, caught, falls back (or fails in strict mode). Short-lived tokens may cause frequent fallbacks. The backend cannot refresh the user's token — keeping it alive is the responsibility of the injecting layer (auth proxy or customer infrastructure).
- **Memory** → Per-user cache bounded by concurrent users (~2KB per entry × 1000 users = ~2MB). Acceptable for backend plugin.
- **`useApiHolder()` internal API access (follow-up risk)** → The planned frontend OIDC discovery follow-up would use the orchestrator's `findCustomProvider` pattern, which accesses `apiHolder.apis` (a private `Map`) via `@ts-ignore`. This is not a public Backstage API and could break if Backstage changes the internal representation. Mitigated by the fact that the orchestrator already ships this pattern in production RHDH, and the header-based path implemented in this change provides a working alternative.
- **Security surface** → The configurable header must be trusted. If an attacker can inject the header, they can impersonate users. Mitigated by typical auth proxy architectures stripping/overwriting upstream headers.
