# Plan: Per-User OAuth2 Token Exchange (RFC 8693) for Kagenti Provider

_Created: May 30, 2026_
_Status: Implementation complete (pending review)_
_Branch: current working branch in rhdh-plugins_

## Context

The augment plugin authenticates to Kagenti using a single shared service-account token (Client Credentials Grant). All users appear to Kagenti as the same service identity. The user's Backstage identity is passed only as an informational `X-Backstage-User` header — not an authorization credential.

Kagenti supports RFC 8693 OAuth2 Token Exchange, which can exchange a user's OIDC access token for a Kagenti-scoped token that preserves the user's `sub` claim and adds an `act` (actor) claim identifying the service. This would enable per-user authorization at the Kagenti layer.

**Key constraint:** Backstage replaces the user's Keycloak OIDC token with its own JWT before it reaches backend plugins. `req.headers.authorization` contains a Backstage-minted token, not the user's Keycloak token. The user's OIDC token is only available on the frontend via `oidcAuthApiRef.getAccessToken()`.

**Frontend complication:** Backstage's `createApiFactory` requires all `deps` to be resolvable — there is no optional dependency concept. Adding `oidcAuthApiRef` as a hard dependency would crash deployments that don't use OIDC auth (GitHub auth, SAML, etc.). Similarly, `useApi()` throws synchronously during render if the API isn't registered — no clean try-catch pattern exists.

## Approach: Backend-Only with Configurable Header Source and Graceful Fallback

Rather than coupling the frontend to OIDC auth, this plan makes the backend accept the user's OIDC token from a **configurable request header**. The token can be injected by:

1. **An auth proxy** (oauth2-proxy, Keycloak Gatekeeper) — many RHDH deployments already have one; just configure it to forward the OIDC access token as a header.
2. **A future frontend change** — if/when Backstage adds optional API deps or the augment frontend adopts a provider-aware token injection pattern, the backend is already ready.
3. **Custom middleware** — a lightweight Express middleware or Backstage module that extracts the OIDC token from the session and injects the header.

This keeps the change **backend-only**, **provider-scoped** (only Kagenti uses it), and **backward-compatible** (disabled by default).

### Graceful Fallback to Service-Account Token

The implementation is designed so that per-user token exchange **never blocks functionality**. At every point where a per-user exchanged token is attempted, the code falls back to the existing shared service-account token (`KeycloakTokenManager`) if anything goes wrong:

- **Token exchange disabled or header absent**: If `tokenExchange.enabled` is false (default), or the configured OIDC token header is not present on the request, the service-account token is used directly — no exchange is attempted.
- **Token exchange fails** (Keycloak error, network timeout, misconfigured client): Each exchange call in `requestCore.ts` (`doRequest`, `streamRequest`) is wrapped in a try/catch. On failure, a warning is logged and the service-account token is used instead. The request proceeds normally.
- **Exchanged token rejected (401)**: On a 401 response, `requestWithRetry` clears both the per-user exchanged token cache AND the service-account token cache, then retries with a fresh token.
- **Keycloak doesn't support token exchange**: Returns 400 `unsupported_grant_type`. Caught, warned, falls back to service-account.

This means the worst case for a misconfigured deployment is a warning log and a fallback to the pre-existing behavior — never a broken request.

### ResponsesApiProvider Impact: None

`ResponsesApiProvider` does NOT implement `setUserContext` — the interface method is optional (`setUserContext?(...)`). The widened signature (`bearerToken?` added as second param) does not affect it:

- The `if (provider.setUserContext)` guards in route code skip it entirely
- The route-level header extraction is harmless — the header value is never used
- No code in `providers/llamastack/` is modified
- All OpenAI Responses API calls continue to use the static API key unchanged

## Config

```yaml
augment:
  kagenti:
    auth:
      tokenEndpoint: https://keycloak.example.com/realms/kagenti/protocol/openid-connect/token
      clientId: augment-backend
      clientSecret: ${KAGENTI_CLIENT_SECRET}
      tokenExchange: # NEW — all optional
        enabled: true # default: false
        audience: kagenti-api # default: auth.clientId
        userTokenHeader: X-Forwarded-Access-Token # default: x-user-oidc-token
```

## Files Changed (10 modified, 1 new)

### New File

| File                                                                           | Description                                                                                                                                             |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugins/augment-backend/src/providers/kagenti/client/TokenExchangeManager.ts` | RFC 8693 token exchange with per-user caching, concurrent dedup, streaming support, fallback-safe error handling. Modeled on `KeycloakTokenManager.ts`. |

### Config (2 files)

| File                                                                          | Change                                                                                                                                |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `plugins/augment-backend/config.d.ts`                                         | Added optional `tokenExchange` block inside `augment.kagenti.auth` with `enabled`, `audience`, `userTokenHeader`                      |
| `plugins/augment-backend/src/providers/kagenti/config/KagentiConfigLoader.ts` | Parses new config; extends `KagentiConfig.auth` type; defaults: enabled=false, audience=clientId, userTokenHeader='x-user-oidc-token' |

### Token Flow (2 files)

| File                                                                       | Change                                                                                                                                                                                        |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugins/augment-backend/src/providers/kagenti/client/requestCore.ts`      | Extended `RequestCoreContext` with `tokenExchangeManager?` and `getUserBearerToken`. `doRequest()`, `streamRequest()`, `requestWithRetry()` try exchange first, fall back to service-account. |
| `plugins/augment-backend/src/providers/kagenti/client/KagentiApiClient.ts` | Widened `KagentiRequestContext` with `bearerToken?`. Added `tokenExchangeManager?` to options. Wired into `RequestCoreContext`.                                                               |

### Provider + Interface (2 files)

| File                                                               | Change                                                                                                                                                                                                                                |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugins/augment-backend/src/providers/kagenti/KagentiProvider.ts` | Creates `TokenExchangeManager` in `initialize()` when config enables it. Passes to API client (both in `initialize()` and `ensureClientUrl()`). Widened `setUserContext(userRef, bearerToken?)`. Added `getUserTokenHeader()` getter. |
| `plugins/augment-backend/src/providers/providerInterface.ts`       | Widened `setUserContext?(userRef: string, bearerToken?: string): void` — optional second param, no impact on ResponsesApiProvider                                                                                                     |

### Routes (4 files)

| File                                                  | Change                                                                                        |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `plugins/augment-backend/src/routes/types.ts`         | Added `userTokenHeader?: string` to `RouteContext`                                            |
| `plugins/augment-backend/src/router.ts`               | Dynamic getter on `RouteContext` that reads header name from KagentiProvider config           |
| `plugins/augment-backend/src/routes/chatRoutes.ts`    | Both sync and streaming `setUserContext` call sites extract OIDC token from configured header |
| `plugins/augment-backend/src/routes/kagentiRoutes.ts` | `/kagenti` middleware extracts OIDC token from configured header                              |

### NOT Changed

- **Frontend plugin** — No changes. OIDC token arrives via infrastructure (auth proxy) or future frontend work.
- **`ResponsesApiProvider`** / `providers/llamastack/` — Zero code changes.
- **`KeycloakTokenManager`** — Untouched. Remains fallback for system operations.
- **`X-Backstage-User` header** — Still sent alongside exchanged token for audit logging.

## Verification

1. **TypeScript compilation**: `npx tsc --noEmit` passes clean (verified).
2. **Unit tests needed**: `TokenExchangeManager.test.ts` — exchange, caching, dedup, fallback on error, streaming lifetime, clearUserCache/clearAllCache.
3. **Backward compat**: With `tokenExchange` absent, behavior is identical to before.
4. **Integration test**: Requires Keycloak with token exchange enabled + auth proxy forwarding OIDC token in the configured header.

## Risks

- **Auth proxy not configured**: No OIDC token in header → falls back to service-account silently.
- **Keycloak doesn't support token exchange**: Returns 400, caught, warned, falls back.
- **OIDC token expired**: Exchange fails, caught, falls back.
- **Memory**: Per-user cache bounded by concurrent users (~2KB × 1000 users = ~2MB).

## Related Documents

- Kagenti API auth docs: https://github.com/kagenti/kagenti/blob/v0.6.0-rc.3/docs/api-authentication.md
- Kagenti identity guide: https://github.com/kagenti/kagenti/blob/main/docs/identity-guide.md
- OpenAI RBAC (orthogonal): https://developers.openai.com/api/docs/guides/rbac
