# Design: Per-User OAuth2 Token Exchange for Kagenti Provider

## Context

The augment plugin's Kagenti provider authenticates to Kagenti using a single shared service-account token via Client Credentials Grant (`KeycloakTokenManager`). All backend requests to Kagenti carry the same identity regardless of which Backstage user initiated the request. The user's identity is passed only as an informational `X-Backstage-User` header.

Kagenti supports RFC 8693 OAuth2 Token Exchange, which can swap a user's OIDC access token for a Kagenti-scoped token preserving the user's `sub` claim while adding an `act` (actor) claim for the service. This enables per-user authorization decisions at the Kagenti layer.

**Key constraint:** Backstage replaces the user's Keycloak OIDC token with its own JWT before it reaches backend plugins. `req.headers.authorization` contains a Backstage-minted token, not the user's Keycloak token. The user's original OIDC token must arrive via a separate mechanism.

**Frontend constraint:** Backstage's `createApiFactory` requires all `deps` to be resolvable — there is no optional dependency concept. Adding `oidcAuthApiRef` as a hard dependency would crash deployments that don't use OIDC auth. `useApi()` throws synchronously during render if the API isn't registered.

## Goals / Non-Goals

**Goals:**

- Enable per-user authorization at the Kagenti layer via RFC 8693 token exchange
- Keep the change backend-only — no frontend plugin modifications
- Graceful fallback to service-account token at every failure point
- Make per-user token exchange opt-in and disabled by default
- Support configurable header source for user OIDC tokens
- Zero impact on `ResponsesApiProvider` or Llama Stack code paths

**Non-Goals:**

- Frontend OIDC token injection (deferred to future work or auth proxy)
- Changes to the `KeycloakTokenManager` service-account flow
- Per-user authorization for non-Kagenti providers
- Custom Keycloak realm or client configuration tooling
- Token exchange for the `X-Backstage-User` header (informational only)

## Decisions

### Decision 1: Backend-only with configurable header source

Accept the user's OIDC token from a configurable request header rather than coupling the frontend to OIDC auth. The token can be injected by:

1. An auth proxy (oauth2-proxy, Keycloak Gatekeeper) — many RHDH deployments already have one
2. A future frontend change when Backstage adds optional API deps
3. Custom middleware extracting the OIDC token from the session
4. A customer's own auth infrastructure — any mechanism that can place a valid OIDC-compatible access token into the configured HTTP header

**Custom auth mechanisms:** The configurable header approach is deliberately auth-provider-agnostic. The system does not assume Keycloak or any specific IdP — it only requires that (a) a valid OIDC access token arrives in the configured header, and (b) the configured `auth.tokenEndpoint` supports RFC 8693 token exchange for that token. Customers using custom auth can integrate by configuring their auth layer to inject the user's token into the header and pointing `auth.tokenEndpoint` at their IdP's token endpoint.

**Alternative considered:** Frontend injection via `oidcAuthApiRef`. Rejected because `createApiFactory` hard dependency would break non-OIDC deployments.

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
        userTokenHeader: X-Forwarded-Access-Token # default: x-user-oidc-token
```

This reuses the existing `tokenEndpoint`, `clientId`, and `clientSecret` from the parent auth block. No new top-level config keys.

## Prerequisites

For per-user token exchange to function, the deployment must have:

1. **A mechanism to inject the user's OIDC access token** into the configured HTTP header (default: `x-user-oidc-token`). Typical options include an auth proxy (oauth2-proxy, Keycloak Gatekeeper), custom middleware, or a customer's own auth infrastructure. Without this, the system falls back to the service-account token.
2. **An IdP token endpoint that supports RFC 8693 token exchange** (configured via `auth.tokenEndpoint`). For Keycloak, `token-exchange-standard:v2` is enabled by default in modern versions. The requesting client (`auth.clientId`) must have permission to exchange tokens for the target audience.
3. **The existing `auth.clientId`, `auth.clientSecret`, and `auth.tokenEndpoint`** must already be configured for the Kagenti provider's service-account flow.

## Risks / Trade-offs

- **Auth proxy not configured** → No OIDC token in header → falls back to service-account silently. Deployments without an auth proxy get no per-user auth until they add one or a frontend solution is built.
- **Keycloak doesn't support token exchange** → Returns 400 `unsupported_grant_type`. Caught, warned, falls back. Requires Keycloak admin to enable token exchange on the realm.
- **OIDC token expired** → Exchange fails, caught, falls back. Short-lived tokens may cause frequent fallbacks. The backend plugin cannot refresh the user's OIDC token because it only receives the access token via the HTTP header — it does not have the user's refresh token. Keeping the user's OIDC token alive is the responsibility of the layer that injects it (auth proxy, frontend, or customer auth infrastructure). For example, oauth2-proxy handles token refresh transparently and forwards a valid access token on each request.
- **Memory** → Per-user cache bounded by concurrent users (~2KB per entry × 1000 users = ~2MB). Acceptable for backend plugin.
- **Security surface** → The configurable header must be trusted. If an attacker can inject the header, they can impersonate users. Mitigated by typical auth proxy architectures stripping/overwriting upstream headers.
