# Design: Per-User OAuth2 Token Exchange for Kagenti Provider

## Context

The augment plugin's Kagenti provider authenticates to Kagenti using a single shared service-account token via Client Credentials Grant (`KeycloakTokenManager`). All backend requests to Kagenti carry the same identity regardless of which Backstage user initiated the request. The user's identity is passed only as an informational `X-Backstage-User` header.

Kagenti supports RFC 8693 OAuth2 Token Exchange, which can swap a user's OIDC access token for a Kagenti-scoped token preserving the user's `sub` claim while adding an `act` (actor) claim for the service. This enables per-user authorization decisions at the Kagenti layer.

**Key constraint:** Backstage replaces the user's Keycloak OIDC token with its own JWT before it reaches backend plugins. `req.headers.authorization` contains a Backstage-minted token, not the user's Keycloak token. The user's original OIDC token must arrive via a separate mechanism.

**Frontend constraint:** Backstage's `createApiFactory` requires all `deps` to be resolvable — there is no optional dependency concept. Adding `oidcAuthApiRef` as a hard dependency would crash deployments that don't use OIDC auth. `useApi()` throws synchronously during render if the API isn't registered. However, `useApiHolder()` provides dynamic discovery at runtime — the orchestrator plugin already uses this pattern to find custom auth providers without static dependencies (see `useOrchestratorAuth.ts`).

## Goals / Non-Goals

**Goals:**

- Enable per-user authorization at the Kagenti layer via RFC 8693 token exchange
- Acquire the user's OIDC token via frontend OIDC discovery (primary) or configurable request header (fallback)
- Configurable fallback behavior: graceful fallback to service-account token by default, with an option to fail hard for strict security environments
- Make per-user token exchange opt-in and disabled by default
- Zero impact on `ResponsesApiProvider` or Llama Stack code paths

**Non-Goals:**

- Changes to the `KeycloakTokenManager` service-account flow
- Per-user authorization for non-Kagenti providers
- Custom Keycloak realm or client configuration tooling
- Token exchange for the `X-Backstage-User` header (informational only)

## Decisions

### Decision 1: Frontend OIDC discovery (primary) with header-based fallback

The primary token acquisition path uses `useApiHolder()` to dynamically discover the OIDC auth provider at runtime — the same pattern the orchestrator plugin uses in `useOrchestratorAuth.ts`. When the user first interacts with Kagenti, the frontend discovers the OIDC provider via the API holder, calls `getAccessToken()` (the `OAuthApi` interface — correct for RFC 8693 where `subject_token_type` is `access_token`), triggers a login prompt if needed, and sends the OIDC token to the backend for RFC 8693 exchange. This avoids the `createApiFactory` hard dependency problem (which throws synchronously if the API isn't registered) while giving users an explicit "connect to Kagenti" experience.

**UX trigger:** OIDC provider discovery is attempted on component mount (e.g., when `ChatContainer` loads). Token acquisition is deferred to the first Kagenti API request — the hook memoizes the provider reference but does not call `getAccessToken()` until a chat interaction is initiated. If the user has an active OIDC session, token acquisition is silent; if not, the OIDC provider's login prompt is triggered. If the user dismisses the login prompt, the hook returns `undefined` and the system falls through to the header-based path (or service-account fallback).

**`getAccessToken()` vs `getIdToken()`:** The orchestrator plugin supports both `OAuthApi.getAccessToken()` and `OpenIdConnectApi.getIdToken()` depending on the auth type. For RFC 8693 token exchange, the correct method is `getAccessToken()` because the exchange request specifies `subject_token_type: urn:ietf:params:oauth:token-type:access_token`. The `getIdToken()` method returns an ID token (JWT with `sub`, `aud`, `iss` claims), which is a different token type (`id_token`) and is not what the exchange endpoint expects as the subject token. The access token is the credential the user would present to an API — which is exactly what we're exchanging for a Kagenti-scoped version.

**Graceful degradation:** The orchestrator's `findCustomProvider` throws when the provider is not found. Our implementation wraps the discovery in a try/catch — failure to find the OIDC provider is not an error condition, it just means the frontend path is unavailable and the system should fall through silently to the header-based path.

**Why frontend discovery is required out of the gate:** The most common RHDH deployment pattern uses Backstage's built-in Keycloak auth — users log in via the RHDH UI, and Backstage replaces the user's Keycloak OIDC token with its own JWT before requests reach backend plugins. These deployments typically do not have an auth proxy injecting the original OIDC token into a header. Without frontend OIDC discovery, per-user token exchange would not work for this common case, making the feature effectively unusable for most deployments.

When the OIDC provider is not discoverable (non-Keycloak deployments, headless environments), the system falls back to reading the user's OIDC token from a configurable request header (default: `x-user-oidc-token`). The header can be populated by:

1. An auth proxy (oauth2-proxy, Keycloak Gatekeeper) — some RHDH deployments already have one
2. Custom middleware extracting the OIDC token from the session
3. A customer's own auth infrastructure — any mechanism that can place a valid OIDC-compatible access token into the configured HTTP header

**Custom auth mechanisms:** The header-based fallback is deliberately auth-provider-agnostic. The system does not assume Keycloak or any specific IdP — it only requires that (a) a valid OIDC access token arrives in the configured header, and (b) the configured `auth.tokenEndpoint` supports RFC 8693 token exchange for that token.

**Why `useApiHolder()` and not `useApi()`:** `useApi()` throws synchronously if the API isn't registered, and `createApiFactory` has no optional dependency concept. `useApiHolder()` returns `undefined` for unregistered APIs, allowing graceful detection. The orchestrator uses this for custom providers (`findCustomProvider` in `useOrchestratorAuth.ts`), including accessing `internal.auth.oidc` via the API holder's internal map.

**Alternative considered:** Header-only (no frontend). Rejected because most RHDH deployments use Backstage's built-in auth without an auth proxy, so the header would never be populated — making the feature unusable in the common case.

**Alternative considered:** `createApiFactory` with `oidcAuthApiRef` as a hard dependency. Rejected because it would crash non-OIDC deployments.

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

**Frontend config visibility:** The `tokenExchange.enabled` field must be visible to the frontend so the OIDC discovery hook knows whether to attempt provider discovery. Backstage config visibility is controlled via `config.d.ts` — the `enabled` field will be marked with `@visibility frontend` so it can be read by the frontend via `configApi.getOptionalBoolean('augment.kagenti.auth.tokenExchange.enabled')`. Other fields (`audience`, `userTokenHeader`, `clientSecret`) remain backend-only. The `userTokenHeader` value is not needed by the frontend because the frontend always uses the same header name — it is the backend that decides which header to read from, and the frontend simply sets the header that the backend expects.

### Decision 6: Frontend-to-backend token transport

The frontend sends the acquired OIDC token to the backend using the same `userTokenHeader` header (default: `x-user-oidc-token`) that the backend already reads from. This is set in `AugmentApi.ts`'s request preparation (the `_buildInit` method that already adds custom headers like `X-Backstage-Request: augment`). The backend does not need to distinguish whether the header was populated by the frontend or an auth proxy — it reads the same header in both cases.

This design means the transport mechanism requires no backend changes beyond what is already specified for the header-based path. The frontend simply populates the header that the backend already knows how to read.

**Frontend token lifecycle:** The hook caches the OIDC token reference (the provider's `getAccessToken()` return) for the duration of the React component tree's mount. Token refresh is delegated to the OIDC provider's implementation — Backstage auth providers handle refresh transparently via their internal session management. When the component unmounts and remounts (e.g., navigating away and back), discovery runs again. There is no explicit expiry tracking in the hook — the provider is the authority on token validity.

**Dynamic plugin packaging:** The augment plugin runs as a dynamic plugin in RHDH. The new hook (`useKagentiOidcToken.ts`) and modifications to `AugmentApi.ts` are internal to the existing frontend plugin package. No new exports, entry points, or dynamic plugin wiring changes are needed — the hook is consumed internally by the chat components, and the `AugmentApi` class is already the plugin's API client. The dynamic plugin's `package.json` export map is unaffected.

## Prerequisites

For per-user token exchange to function, the deployment must have:

1. **An OIDC auth provider accessible via the Backstage API holder** (primary path) — in RHDH Keycloak deployments, this is typically `internal.auth.oidc`. The frontend discovers this at runtime via `useApiHolder()`. **OR** a mechanism to inject the user's OIDC access token into the configured HTTP header (fallback path, default: `x-user-oidc-token`) — typical options include an auth proxy (oauth2-proxy, Keycloak Gatekeeper), custom middleware, or a customer's own auth infrastructure. Without either, the system falls back to the service-account token (or fails if `fallbackToServiceAccount: false`).
2. **An IdP token endpoint that supports RFC 8693 token exchange** (configured via `auth.tokenEndpoint`). For Keycloak, `token-exchange-standard:v2` is enabled by default in modern versions. The requesting client (`auth.clientId`) must have permission to exchange tokens for the target audience.
3. **The existing `auth.clientId`, `auth.clientSecret`, and `auth.tokenEndpoint`** must already be configured for the Kagenti provider's service-account flow.

## Risks / Trade-offs

- **OIDC provider not discoverable and no header token** → Frontend discovery returns `undefined` and no header token present → falls back to service-account (or fails in strict mode). Non-OIDC deployments without a header injection mechanism get no per-user auth.
- **Keycloak doesn't support token exchange** → Returns 400 `unsupported_grant_type`. Caught, warned, falls back. Requires Keycloak admin to enable token exchange on the realm.
- **OIDC token expired** → Exchange fails, caught, falls back (or fails in strict mode). Short-lived tokens may cause frequent fallbacks. When the token is acquired via frontend discovery, the OIDC provider handles refresh transparently via its internal session management (subsequent `getAccessToken()` calls return a refreshed token). When acquired via header, the backend cannot refresh the user's token — keeping it alive is the responsibility of the injecting layer (auth proxy or customer infrastructure).
- **Memory** → Per-user cache bounded by concurrent users (~2KB per entry × 1000 users = ~2MB). Acceptable for backend plugin.
- **`useApiHolder()` internal API access** → The frontend OIDC discovery uses the orchestrator's `findCustomProvider` pattern, which accesses `apiHolder.apis` (a private `Map`) via `@ts-ignore`. This is not a public Backstage API and could break if Backstage changes the internal representation. Mitigated by the fact that the orchestrator already ships this pattern in production RHDH, and the header-based fallback provides a working alternative if the internal access breaks.
- **Security surface** → The configurable header must be trusted. If an attacker can inject the header, they can impersonate users. Mitigated by typical auth proxy architectures stripping/overwriting upstream headers.
- **Frontend login prompt UX** → When the OIDC provider is discovered but the user hasn't authenticated, `getAccessToken()` triggers the provider's login flow (typically a redirect or popup). If the user dismisses it, the hook returns `undefined` and the system falls through to header/service-account. There is no retry or re-prompt in the current design — the user would need to reload the page or navigate back to trigger discovery again. This is intentional to avoid nagging.
- **`getAccessToken()` vs `getIdToken()` correctness** → The orchestrator supports both `OAuthApi` and `OpenIdConnectApi` interfaces. We use `getAccessToken()` (access token) because RFC 8693 specifies `subject_token_type: access_token`. Using `getIdToken()` (ID token) would send the wrong token type and could cause the exchange to fail or produce unexpected results depending on IdP configuration.
