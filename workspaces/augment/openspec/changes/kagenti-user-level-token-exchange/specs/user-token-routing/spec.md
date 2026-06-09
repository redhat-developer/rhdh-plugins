# Spec: user-token-routing

Route-level extraction and forwarding of user OIDC tokens from configurable request headers.

## ADDED Requirements

### Requirement: Configurable user token header on RouteContext

The `RouteContext` type SHALL include an optional `userTokenHeader` field containing the header name from which to extract the user's OIDC token (e.g., `x-user-oidc-token` or `X-Forwarded-Access-Token`). The value SHALL be sourced dynamically from the `KagentiProvider` configuration.

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

The chat route handlers (both synchronous and streaming) SHALL extract the user's OIDC token from the configured header and pass it as the second argument to `provider.setUserContext(userRef, bearerToken)`.

#### Scenario: Chat route extracts OIDC token

- **WHEN** a chat request arrives with the configured OIDC header present
- **THEN** the route handler SHALL call `provider.setUserContext(userRef, tokenValue)` where `tokenValue` is the header value

#### Scenario: Chat route with no OIDC header

- **WHEN** a chat request arrives without the configured OIDC header
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
