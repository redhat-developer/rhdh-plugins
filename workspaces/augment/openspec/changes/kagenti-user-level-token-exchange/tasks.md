# Tasks: Per-User OAuth2 Token Exchange for Kagenti Provider

## 1. Configuration Schema

- [ ] 1.1 Add optional `tokenExchange` block to `plugins/augment-backend/config.d.ts` under `augment.kagenti.auth` with `enabled` (boolean), `audience` (string), `userTokenHeader` (string), and `fallbackToServiceAccount` (boolean)
- [ ] 1.2 Extend `KagentiConfig.auth` type in `plugins/augment-backend/src/providers/kagenti/config/KagentiConfigLoader.ts` with parsed `tokenExchange` fields (defaults: enabled=false, audience=clientId, userTokenHeader='x-user-oidc-token', fallbackToServiceAccount=true)

## 2. Token Exchange Manager

- [ ] 2.1 Create `plugins/augment-backend/src/providers/kagenti/client/TokenExchangeManager.ts` implementing RFC 8693 exchange with per-user caching keyed by user identity
- [ ] 2.2 Implement concurrent request deduplication — in-flight exchange for same user shared across waiting callers
- [ ] 2.3 Implement streaming-aware token lifetime — hold reference preventing eviction during active streams
- [ ] 2.4 Implement configurable error handling — when `fallbackToServiceAccount` is `true`, catch exchange failures and return null to signal fallback with warning log. When `false` (strict mode), throw with appropriate error (401 for missing token, 502 for exchange failure) so the request fails instead of falling back.

## 3. Request Core Integration

- [ ] 3.1 Extend `RequestCoreContext` in `plugins/augment-backend/src/providers/kagenti/client/requestCore.ts` with optional `tokenExchangeManager` and `getUserBearerToken` fields
- [ ] 3.2 Update `doRequest()` to attempt per-user token exchange first, falling back to service-account token on null/error
- [ ] 3.3 Update `streamRequest()` with same exchange-first-then-fallback flow
- [ ] 3.4 Update `requestWithRetry()` to clear both per-user and service-account caches on 401, then retry with fresh token

## 4. API Client and Provider Wiring

- [ ] 4.1 Widen `KagentiRequestContext` in `plugins/augment-backend/src/providers/kagenti/client/KagentiApiClient.ts` with optional `bearerToken` field and wire `tokenExchangeManager` into `RequestCoreContext`
- [ ] 4.2 Widen `setUserContext` in `plugins/augment-backend/src/providers/providerInterface.ts` to `setUserContext?(userRef: string, bearerToken?: string): void`
- [ ] 4.3 Update `KagentiProvider.initialize()` to create `TokenExchangeManager` when config enables token exchange, and pass it to the API client
- [ ] 4.4 Update `KagentiProvider.ensureClientUrl()` to also wire the `TokenExchangeManager` into the API client
- [ ] 4.5 Implement `KagentiProvider.getUserTokenHeader()` getter returning the configured header name

## 5. Route-Level Token Extraction

- [ ] 5.1 Add optional `userTokenHeader` to `RouteContext` in `plugins/augment-backend/src/routes/types.ts`
- [ ] 5.2 Create dynamic getter on `RouteContext` in `plugins/augment-backend/src/router.ts` that reads header name from `KagentiProvider` config
- [ ] 5.3 Update `plugins/augment-backend/src/routes/chatRoutes.ts` — both sync and streaming handlers extract OIDC token from configured header and pass to `setUserContext(userRef, bearerToken)`
- [ ] 5.4 Update `plugins/augment-backend/src/routes/kagentiRoutes.ts` — `/kagenti` middleware extracts OIDC token from configured header

## 6. Frontend OIDC Discovery

- [ ] 6.1 Create frontend utility for OIDC provider discovery using `useApiHolder()` — attempt `useApp().getPlugins()` API enumeration first, then fall back to API holder internal map (`apiHolder.apis` for `internal.auth.oidc`, matching the orchestrator's `findCustomProvider` pattern)
- [ ] 6.2 Implement OIDC token acquisition — call `getIdToken()` on the discovered provider (triggers login prompt if user hasn't authenticated with the OIDC provider yet), cache the result for the session
- [ ] 6.3 Wire OIDC token into Kagenti API requests — when the frontend has acquired an OIDC token, include it in requests to the backend so it can be used for RFC 8693 exchange
- [ ] 6.4 Handle graceful degradation — when OIDC provider is not discoverable, do not prompt or error; fall through silently so the backend uses the header-based fallback path

## 7. Verification

- [ ] 7.1 Verify `npx tsc --noEmit` passes clean with all changes (backend and frontend)
- [ ] 7.2 Write unit tests for `TokenExchangeManager` — exchange execution, caching, concurrent dedup, fallback on error, strict mode error propagation, streaming lifetime, clearUserCache/clearAllCache
- [ ] 7.3 Write unit tests for frontend OIDC discovery — provider found, provider not found (graceful degradation), token acquisition, login prompt trigger
- [ ] 7.4 Verify backward compatibility — behavior identical with `tokenExchange` absent from config
- [ ] 7.5 Verify `ResponsesApiProvider` and Llama Stack paths are completely unaffected
