# Tasks: Per-User OAuth2 Token Exchange for Kagenti Provider

> **Scope:** This change covers backend-only implementation (header-based OIDC token acquisition). Frontend OIDC discovery via `useApiHolder()` is a planned follow-up change.

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

## 6. Verification

- [ ] 6.1 Verify `npx tsc --noEmit` passes clean with all changes
- [ ] 6.2 Write unit tests for `TokenExchangeManager` — exchange execution, caching, concurrent dedup, fallback on error, strict mode error propagation, streaming lifetime, clearUserCache/clearAllCache
- [ ] 6.3 Verify backward compatibility — behavior identical with `tokenExchange` absent from config
- [ ] 6.4 Verify `ResponsesApiProvider` and Llama Stack paths are completely unaffected
