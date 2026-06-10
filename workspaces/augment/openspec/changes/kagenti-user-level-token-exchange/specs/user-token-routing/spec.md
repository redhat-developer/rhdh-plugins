# Spec: user-token-routing

Acquisition and forwarding of user OIDC tokens — via frontend API holder discovery (primary) or configurable request headers (fallback).

## ADDED Requirements

### Requirement: Frontend OIDC token acquisition via API holder discovery

The frontend SHALL discover the OIDC auth provider at runtime using `useApiHolder()` and the orchestrator's `findCustomProvider` pattern. When Kagenti token exchange is enabled and the user initiates a Kagenti interaction:

1. Attempt to discover the OIDC auth provider via `useApp().getPlugins()` API enumeration
2. If not found, attempt to discover via the API holder's internal map (matching the orchestrator's `apiHolder.apis` pattern for `internal.auth.oidc`)
3. If found, call `getIdToken()` to obtain the user's OIDC token (which triggers a login prompt if the user hasn't authenticated with the OIDC provider yet)
4. Send the OIDC token to the backend via the request for RFC 8693 exchange
5. If the OIDC provider is not discoverable, fall through to the header-based path

#### Scenario: OIDC provider discovered and user authenticates

- **WHEN** the OIDC auth provider is discoverable via the API holder and the user has not yet authenticated
- **THEN** the frontend SHALL trigger the OIDC login flow and, on success, send the obtained token to the backend

#### Scenario: OIDC provider discovered and user already authenticated

- **WHEN** the OIDC auth provider is discoverable and the user has an active OIDC session
- **THEN** the frontend SHALL obtain the token via `getIdToken()` without prompting and send it to the backend

#### Scenario: OIDC provider not discoverable

- **WHEN** the OIDC auth provider is not found via plugin API enumeration or the API holder's internal map
- **THEN** the frontend SHALL not attempt OIDC login and the system SHALL fall back to reading the token from the configured request header

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
- **THEN** the route handler SHALL call `provider.setUserContext(userRef, undefined)` and the provider SHALL fall back to the service-account token

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
