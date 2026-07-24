# Proposal: Per-User OAuth2 Token Exchange for Kagenti Provider

## Why

The augment plugin authenticates to Kagenti using a single shared service-account token (Client Credentials Grant), so all users appear to Kagenti as the same service identity. The user's Backstage identity is passed only as an informational `X-Backstage-User` header — not an authorization credential. Kagenti supports RFC 8693 OAuth2 Token Exchange, which can exchange a user's OIDC access token for a Kagenti-scoped token that preserves the user's `sub` claim and adds an `act` (actor) claim identifying the service, enabling per-user authorization at the Kagenti layer.

## What Changes

- New `TokenExchangeManager` class implementing RFC 8693 token exchange with per-user caching, concurrent request deduplication, streaming-aware lifetime management, and fallback-safe error handling
- Extended `KagentiConfigLoader` to parse optional `tokenExchange` config block (`enabled`, `audience`, `userTokenHeader`, `fallbackToServiceAccount`)
- Extended `requestCore.ts` (`doRequest`, `streamRequest`, `requestWithRetry`) to attempt per-user token exchange first, falling back to the shared service-account token on any failure
- Widened `KagentiApiClient` context and `AugmentProvider` interface to carry the user's bearer token alongside user ref
- Route-level extraction of the user's OIDC token from a configurable request header (default: `x-user-oidc-token`)
- Graceful fallback at every stage: disabled config, absent header, exchange failure, and 401 retry all fall back to the existing `KeycloakTokenManager` service-account token

## Capabilities

### New Capabilities

- `token-exchange`: RFC 8693 OAuth2 token exchange for per-user Kagenti authorization — config schema, token lifecycle management, per-user caching, concurrent deduplication, and fallback behavior
- `user-token-routing`: Acquisition and forwarding of user OIDC tokens — via frontend API holder discovery (primary, using `getAccessToken()`) or configurable request headers (fallback) — to the Kagenti provider for RFC 8693 exchange

### Modified Capabilities

## Impact

- `plugins/augment-backend/config.d.ts` — new `tokenExchange` config block
- `plugins/augment-backend/src/providers/kagenti/config/KagentiConfigLoader.ts` — parse new config
- `plugins/augment-backend/src/providers/kagenti/client/TokenExchangeManager.ts` — **new file**
- `plugins/augment-backend/src/providers/kagenti/client/requestCore.ts` — exchange-first token flow
- `plugins/augment-backend/src/providers/kagenti/client/KagentiApiClient.ts` — widened context
- `plugins/augment-backend/src/providers/kagenti/KagentiProvider.ts` — instantiates exchange manager
- `plugins/augment-backend/src/providers/providerInterface.ts` — widened `setUserContext` signature
- `plugins/augment-backend/src/routes/types.ts` — `userTokenHeader` on `RouteContext`
- `plugins/augment-backend/src/router.ts` — dynamic header getter from provider config
- `plugins/augment-backend/src/routes/chatRoutes.ts` — OIDC token extraction in chat handlers
- `plugins/augment-backend/src/routes/kagentiRoutes.ts` — OIDC token extraction in Kagenti middleware
- `plugins/augment/src/hooks/useKagentiOidcToken.ts` — **new file**: React hook using `useApiHolder()` and the `findCustomProvider` pattern (from orchestrator's `useOrchestratorAuth.ts`) to discover OIDC auth provider at runtime, call `getAccessToken()` (OAuthApi interface — correct for RFC 8693 `subject_token_type: access_token`), and return the token for use in API requests. Handles graceful degradation (try/catch around discovery, returns `undefined` if not found). Discovers on mount, acquires token lazily on first Kagenti interaction.
- `plugins/augment/src/api/AugmentApi.ts` — modified `_buildInit` method to include OIDC token as the configured `userTokenHeader` header on outgoing requests when available (same header the backend reads from, regardless of source)
- `plugins/augment-backend/config.d.ts` — `tokenExchange.enabled` marked `@visibility frontend` so frontend can check via `configApi`
- No changes to `ResponsesApiProvider`, `providers/llamastack/`, or `KeycloakTokenManager`
- No changes to dynamic plugin exports or entry points — the hook and API client changes are internal to the existing frontend plugin package
