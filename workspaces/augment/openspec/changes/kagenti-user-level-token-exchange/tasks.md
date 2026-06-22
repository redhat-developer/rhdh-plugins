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

## 6. Frontend OIDC Discovery and Token Transport

- [ ] 6.1 Mark `tokenExchange.enabled` with `@visibility frontend` in `plugins/augment-backend/config.d.ts` so the frontend can read it via `configApi`
- [ ] 6.2 Create `plugins/augment/src/hooks/useKagentiOidcToken.ts` — React hook using `useApiHolder()` for OIDC provider discovery. Attempt `useApp().getPlugins()` API enumeration first, then fall back to API holder internal map (`apiHolder.apis` for `internal.auth.oidc`, matching the orchestrator's `findCustomProvider` pattern in `useOrchestratorAuth.ts`). Wrap discovery in try/catch (orchestrator's `findCustomProvider` throws on not-found; we return `undefined`). Check `configApi.getOptionalBoolean('augment.kagenti.auth.tokenExchange.enabled')` — skip discovery if not enabled. Discover provider on component mount, defer `getAccessToken()` call to first Kagenti interaction.
- [ ] 6.3 Implement OIDC token acquisition in `useKagentiOidcToken.ts` — call `getAccessToken()` (`OAuthApi` interface, NOT `getIdToken()`) on the discovered provider. `getAccessToken()` is correct because RFC 8693 specifies `subject_token_type: access_token`. If the user hasn't authenticated with the OIDC provider, `getAccessToken()` triggers the provider's login flow. If the user dismisses the prompt, return `undefined` (no retry, no re-prompt). Cache the provider reference for the component mount duration; delegate token refresh to the provider's internal session management.
- [ ] 6.4 Wire OIDC token into API requests in `plugins/augment/src/api/AugmentApi.ts` — modify the `_buildInit` method to include the OIDC token as the `userTokenHeader` header (default: `x-user-oidc-token`) alongside existing headers like `X-Backstage-Request: augment`. The backend reads from this same header regardless of whether the frontend or an auth proxy populated it. When no token is available, do not set the header.
- [ ] 6.5 Handle graceful degradation — when OIDC provider is not discoverable, do not prompt or error; fall through silently so the backend uses the header-based fallback path or service-account token. No new exports, entry points, or dynamic plugin wiring changes needed — the hook is internal to the existing frontend plugin package.

## 7. Verification

- [ ] 7.1 Verify `npx tsc --noEmit` passes clean with all changes (backend and frontend)
- [ ] 7.2 Write unit tests for `TokenExchangeManager` — exchange execution, caching, concurrent dedup, fallback on error, strict mode error propagation, streaming lifetime, clearUserCache/clearAllCache
- [ ] 7.3 Write unit tests for frontend OIDC discovery — provider found, provider not found (graceful degradation), token acquisition, login prompt trigger
- [ ] 7.4 Verify backward compatibility — behavior identical with `tokenExchange` absent from config
- [ ] 7.5 Verify `ResponsesApiProvider` and Llama Stack paths are completely unaffected
