# Spec: user-token-routing

Acquisition and forwarding of user OIDC tokens — via frontend API holder discovery (primary) or configurable request headers (fallback).

## ADDED Requirements

### Requirement: Frontend OIDC token acquisition via API holder discovery

The frontend SHALL discover the OIDC auth provider at runtime using `useApiHolder()` and the orchestrator's `findCustomProvider` pattern. Discovery is attempted on component mount; token acquisition is deferred to the first Kagenti API request. When Kagenti token exchange is enabled and the user initiates a Kagenti interaction:

1. Check `configApi.getOptionalBoolean('augment.kagenti.auth.tokenExchange.enabled')` — if `false` or absent, skip discovery entirely
2. Attempt to discover the OIDC auth provider via `useApp().getPlugins()` API enumeration
3. If not found, attempt to discover via the API holder's internal map (matching the orchestrator's `apiHolder.apis` pattern for `internal.auth.oidc`)
4. Wrap discovery in try/catch — the orchestrator's `findCustomProvider` throws when the provider is not found; our implementation treats this as a non-error (returns `undefined`)
5. If found, call `getAccessToken()` (`OAuthApi` interface) to obtain the user's OIDC access token. This is the correct token type for RFC 8693 exchange where `subject_token_type` is `urn:ietf:params:oauth:token-type:access_token`. (Note: `getIdToken()` from `OpenIdConnectApi` returns an ID token, which is a different token type and not what the exchange endpoint expects as the subject token.)
6. If `getAccessToken()` triggers a login prompt and the user dismisses it, the hook returns `undefined` and the system falls through to the header-based path
7. Send the OIDC token to the backend by setting the configured `userTokenHeader` header (default: `x-user-oidc-token`) on the API request — the same header the backend already reads from regardless of source
8. If the OIDC provider is not discoverable, fall through to the header-based path silently (no error, no prompt)

> **Why this is required out of the gate:** Most RHDH deployments use Backstage's built-in Keycloak auth, where the user logs in via the RHDH UI. Backstage replaces the user's Keycloak OIDC token with its own JWT before it reaches backend plugins, and these deployments typically do not have an auth proxy injecting the original OIDC token into a header. Without frontend discovery, per-user token exchange would not work for this common deployment pattern.

#### Scenario: OIDC provider discovered and user authenticates

- **WHEN** the OIDC auth provider is discoverable via the API holder and the user has not yet authenticated
- **THEN** the frontend SHALL trigger the OIDC login flow and, on success, send the obtained token to the backend

#### Scenario: OIDC provider discovered and user already authenticated

- **WHEN** the OIDC auth provider is discoverable and the user has an active OIDC session
- **THEN** the frontend SHALL obtain the token via `getAccessToken()` without prompting and send it to the backend via the `userTokenHeader` header

#### Scenario: User dismisses OIDC login prompt

- **WHEN** the OIDC auth provider is discoverable but the user has not yet authenticated and dismisses the login prompt
- **THEN** the hook SHALL return `undefined`, the frontend SHALL NOT retry or re-prompt, and the system SHALL fall through to the header-based path (or service-account fallback). The user would need to reload the page or navigate back to trigger discovery again.

#### Scenario: OIDC provider not discoverable

- **WHEN** the OIDC auth provider is not found via plugin API enumeration or the API holder's internal map (discovery wrapped in try/catch)
- **THEN** the frontend SHALL not attempt OIDC login, SHALL NOT log an error (this is expected in non-OIDC deployments), and the system SHALL fall back to reading the token from the configured request header

#### Scenario: Token exchange not enabled in config

- **WHEN** `configApi.getOptionalBoolean('augment.kagenti.auth.tokenExchange.enabled')` returns `false` or `undefined`
- **THEN** the frontend SHALL skip OIDC discovery entirely and not attempt any token acquisition

### Requirement: Frontend-to-backend token transport

The frontend SHALL send the acquired OIDC token to the backend by setting the `userTokenHeader` header (default: `x-user-oidc-token`) on every Kagenti API request via `AugmentApi.ts`'s request preparation (`_buildInit` method). The backend SHALL read from this same header regardless of whether the frontend or an auth proxy populated it — no backend transport changes are needed.

#### Scenario: Frontend sets OIDC token header

- **WHEN** the frontend has acquired an OIDC access token via API holder discovery
- **THEN** the `AugmentApi` class SHALL include the token as the value of the configured `userTokenHeader` header in the `_buildInit` method's `Headers` object, alongside existing headers like `X-Backstage-Request: augment`

#### Scenario: Frontend has no OIDC token

- **WHEN** the frontend did not acquire an OIDC token (discovery failed, user dismissed prompt, or token exchange not enabled)
- **THEN** the `AugmentApi` class SHALL NOT set the `userTokenHeader` header and the request proceeds without it

### Requirement: Frontend config visibility

The `tokenExchange.enabled` config field SHALL be marked with `@visibility frontend` in `config.d.ts` so that the frontend hook can check whether to attempt OIDC discovery. Other `tokenExchange` fields (`audience`, `userTokenHeader`, `fallbackToServiceAccount`, `clientSecret`) SHALL remain backend-only.

#### Scenario: Frontend reads enabled flag

- **WHEN** the frontend hook initializes
- **THEN** it SHALL check `configApi.getOptionalBoolean('augment.kagenti.auth.tokenExchange.enabled')` and skip all OIDC discovery if the value is `false` or absent

### Requirement: Frontend token lifecycle

The frontend hook SHALL cache the OIDC provider reference for the duration of the component tree's mount. Token refresh SHALL be delegated to the OIDC provider's implementation — Backstage auth providers handle refresh transparently via internal session management. When the component unmounts and remounts (e.g., navigating away and back), discovery runs again. There SHALL be no explicit expiry tracking in the hook.

#### Scenario: Token refresh handled by provider

- **WHEN** the cached OIDC access token expires while the component is mounted
- **THEN** the next call to `getAccessToken()` on the cached provider reference SHALL return a refreshed token (handled by the provider's internal session management, not by the hook)

#### Scenario: Component remount triggers rediscovery

- **WHEN** the user navigates away from the chat view and returns
- **THEN** the hook SHALL re-run OIDC provider discovery on mount (provider reference is not persisted across unmounts)

### Requirement: Configurable user token header on RouteContext (fallback path)

The `RouteContext` type SHALL include an optional `userTokenHeader` field containing the header name from which to extract the user's OIDC token (e.g., `x-user-oidc-token` or `X-Forwarded-Access-Token`) when the frontend OIDC discovery path is not available. The value SHALL be sourced dynamically from the `KagentiProvider` configuration.

#### Scenario: RouteContext includes header name

- **WHEN** a route handler accesses `RouteContext.userTokenHeader`
- **THEN** it SHALL return the header name configured in `augment.kagenti.auth.tokenExchange.userTokenHeader`

#### Scenario: RouteContext when token exchange not configured

- **WHEN** token exchange is not configured
- **THEN** `RouteContext.userTokenHeader` SHALL be `undefined`

### Requirement: Router dynamic header getter

The router SHALL create a dynamic getter on `RouteContext` that reads the header name from the `KagentiProvider` configuration. The getter SHALL resolve at request time so that provider initialization order does not matter.

#### Scenario: Dynamic getter resolves from provider

- **WHEN** a request arrives and `KagentiProvider` has been initialized with `tokenExchange.userTokenHeader: X-Forwarded-Access-Token`
- **THEN** the getter SHALL return `X-Forwarded-Access-Token`

### Requirement: OIDC token extraction in chat routes

The chat route handlers (both synchronous and streaming) SHALL extract the user's OIDC token — either from the frontend-provided token (sent as part of the request when acquired via API holder discovery) or from the configured header (fallback path) — and pass it as the second argument to `provider.setUserContext(userRef, bearerToken)`.

#### Scenario: Chat route with frontend-acquired OIDC token

- **WHEN** a chat request arrives with an OIDC token acquired via frontend API holder discovery
- **THEN** the route handler SHALL call `provider.setUserContext(userRef, tokenValue)`

#### Scenario: Chat route with header-based OIDC token

- **WHEN** a chat request arrives without a frontend-acquired token but with the configured OIDC header present
- **THEN** the route handler SHALL call `provider.setUserContext(userRef, tokenValue)` where `tokenValue` is the header value

#### Scenario: Chat route with no OIDC token from either source

- **WHEN** a chat request arrives without a frontend-acquired token and without the configured OIDC header
- **THEN** the route handler SHALL call `provider.setUserContext(userRef, undefined)` and the provider SHALL fall back to the service-account token (or fail if `fallbackToServiceAccount` is `false`)

### Requirement: OIDC token extraction in Kagenti routes

The `/kagenti` middleware SHALL extract the user's OIDC token from the configured header and pass it to the Kagenti provider.

#### Scenario: Kagenti middleware extracts OIDC token

- **WHEN** a request to a `/kagenti` endpoint arrives with the configured OIDC header present
- **THEN** the middleware SHALL extract the token value and forward it to the provider

### Requirement: Widened provider interface

The `AugmentProvider` interface method `setUserContext` SHALL accept an optional second parameter `bearerToken?: string`. This widening SHALL be backward-compatible — existing providers that do not accept the second parameter SHALL continue to function.

#### Scenario: Provider interface backward compatibility

- **WHEN** a provider implements `setUserContext(userRef: string)` without the second parameter
- **THEN** calling `setUserContext(userRef, bearerToken)` SHALL NOT cause a runtime error

### Requirement: X-Backstage-User header preserved

The existing `X-Backstage-User` header SHALL continue to be sent alongside any exchanged token. Token exchange does not replace the informational user identity header.

#### Scenario: Both headers present

- **WHEN** a request to Kagenti uses an exchanged per-user token
- **THEN** the `X-Backstage-User` header SHALL still be included in the outgoing request for audit logging
