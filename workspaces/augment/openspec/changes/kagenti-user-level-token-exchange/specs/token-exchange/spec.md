# Spec: token-exchange

RFC 8693 OAuth2 token exchange for per-user Kagenti authorization.

## ADDED Requirements

### Requirement: Token exchange configuration schema

The system SHALL support an optional `tokenExchange` configuration block nested under `augment.kagenti.auth` with the following fields:

- `enabled` (boolean, default: `false`) — whether to attempt per-user token exchange
- `audience` (string, default: value of `auth.clientId`) — the `audience` parameter in the RFC 8693 exchange request. Must be a valid Keycloak client ID that is configured to permit token exchange from the requesting client (`auth.clientId`). Supported values:
  - The Kagenti API client ID (e.g., `kagenti-api`) — the typical production value, targeting the Keycloak client that represents the Kagenti service
  - The RHDH/Backstage client ID (the value of `auth.clientId`) — the default when no explicit audience is set
  - Any other Keycloak client ID that has token exchange permissions granted for the requesting client
- `userTokenHeader` (string, default: `x-user-oidc-token`) — the HTTP request header from which to read the user's OIDC access token when frontend API holder discovery is not available (fallback path)
- `fallbackToServiceAccount` (boolean, default: `true`) — when `true`, exchange failures fall back to the service-account token silently with a warning log. When `false` (strict mode), exchange failures result in an error response (401 or 502) instead of falling back.

The system SHALL reuse the parent `auth.tokenEndpoint`, `auth.clientId`, and `auth.clientSecret` for the exchange request. No new top-level config keys SHALL be introduced.

#### Scenario: Token exchange disabled or not configured

- **WHEN** `tokenExchange.enabled` is `false` or no `tokenExchange` block is present in config
- **THEN** the system SHALL treat token exchange as disabled and use only the service-account token for all Kagenti requests

#### Scenario: Token exchange with explicit config

- **WHEN** `tokenExchange.enabled` is `true` and `audience` is set to `kagenti-api`
- **THEN** the system SHALL use `kagenti-api` as the audience parameter in exchange requests

#### Scenario: Token exchange audience defaults to clientId

- **WHEN** `tokenExchange.enabled` is `true` and `audience` is not specified
- **THEN** the system SHALL use the value of `auth.clientId` as the audience parameter

### Requirement: RFC 8693 token exchange execution

The `TokenExchangeManager` SHALL perform OAuth2 Token Exchange per RFC 8693 by sending a POST to the configured `auth.tokenEndpoint` with:

- `grant_type`: `urn:ietf:params:oauth:grant-type:token-exchange`
- `subject_token`: the user's OIDC access token
- `subject_token_type`: `urn:ietf:params:oauth:token-type:access_token`
- `audience`: the configured audience value
- `client_id` and `client_secret`: from the parent auth config

The exchanged token SHALL preserve the user's `sub` claim and add an `act` (actor) claim identifying the service.

#### Scenario: Successful token exchange

- **WHEN** a valid user OIDC token is provided and Keycloak supports token exchange
- **THEN** the system SHALL return a Kagenti-scoped access token with the user's `sub` claim preserved

#### Scenario: Exchange request format

- **WHEN** a token exchange is initiated
- **THEN** the POST body SHALL include `grant_type`, `subject_token`, `subject_token_type`, `audience`, `client_id`, and `client_secret` as form-urlencoded parameters

### Requirement: Per-user token caching

The `TokenExchangeManager` SHALL cache exchanged tokens keyed by user identity. Cached tokens SHALL be reused for subsequent requests from the same user until they expire or are invalidated. When a cached token expires, the system SHALL perform a new token exchange rather than using a refresh token.

> **Deferred:** RFC 8693 responses may include a `refresh_token` that could be used to silently renew exchanged tokens without a full re-exchange. This is deferred as a future enhancement due to the added complexity of per-user refresh token tracking, refresh failure handling, and the fact that Keycloak's token exchange does not always return a refresh token depending on client configuration.

#### Scenario: Cache hit for same user

- **WHEN** a user's token has been successfully exchanged and cached and a new request arrives from the same user
- **THEN** the system SHALL return the cached exchanged token without making a new exchange request

#### Scenario: Cache miss for different user

- **WHEN** a request arrives from a user who has no cached exchanged token
- **THEN** the system SHALL perform a new token exchange for that user

### Requirement: Concurrent request deduplication

The `TokenExchangeManager` SHALL deduplicate concurrent exchange requests for the same user. If multiple requests for the same user arrive while an exchange is in-flight, all SHALL receive the result of the single in-flight exchange.

#### Scenario: Concurrent requests for same user

- **WHEN** three requests from the same user arrive while a token exchange is in progress
- **THEN** only one exchange request SHALL be made to Keycloak and all three requests SHALL receive the same exchanged token

### Requirement: Streaming-aware token lifetime

The `TokenExchangeManager` SHALL support streaming-aware token lifetime management. Streaming requests SHALL hold a reference that prevents the token from being evicted while the stream is active.

#### Scenario: Token not evicted during active stream

- **WHEN** a streaming request is using an exchanged token and the token's TTL expires
- **THEN** the system SHALL NOT evict the token until the stream completes

### Requirement: Configurable fallback to service-account token

The system SHALL support configurable fallback behavior via the `fallbackToServiceAccount` config option.

**When `fallbackToServiceAccount` is `true` (default):** The system SHALL fall back to the existing `KeycloakTokenManager` service-account token whenever per-user token exchange cannot complete. Fallback SHALL occur with a warning log — requests SHALL NOT fail due to exchange issues.

**When `fallbackToServiceAccount` is `false` (strict mode):** The system SHALL return an error response when per-user token exchange cannot complete. This mode is intended for environments with strict security postures where silently downgrading to a shared service-account identity is not acceptable.

#### Scenario: No user OIDC token — permissive mode

- **WHEN** `tokenExchange.enabled` is `true` and `fallbackToServiceAccount` is `true` and no OIDC token was provided by the frontend and the configured header is not present on the request
- **THEN** the system SHALL use the service-account token and log a debug message

#### Scenario: No user OIDC token — strict mode

- **WHEN** `tokenExchange.enabled` is `true` and `fallbackToServiceAccount` is `false` and no OIDC token was provided by the frontend and the configured header is not present on the request
- **THEN** the system SHALL return a 401 error indicating that per-user authentication is required

#### Scenario: Exchange call fails with network error — permissive mode

- **WHEN** `fallbackToServiceAccount` is `true` and the exchange POST to Keycloak fails due to network error or timeout
- **THEN** the system SHALL log a warning and use the service-account token

#### Scenario: Exchange call fails with network error — strict mode

- **WHEN** `fallbackToServiceAccount` is `false` and the exchange POST to Keycloak fails due to network error or timeout
- **THEN** the system SHALL return a 502 error with details about the exchange failure

#### Scenario: IdP returns unsupported_grant_type — permissive mode

> **Note:** Modern Keycloak versions enable `token-exchange-standard:v2` by default, making this scenario unlikely in typical deployments. It remains as a defensive fallback for older Keycloak versions, realm/client-level policies that restrict token exchange permissions, or non-Keycloak OIDC providers that do not support RFC 8693.

- **WHEN** `fallbackToServiceAccount` is `true` and the IdP returns 400 with `error: unsupported_grant_type`
- **THEN** the system SHALL log a warning and use the service-account token

#### Scenario: IdP returns unsupported_grant_type — strict mode

- **WHEN** `fallbackToServiceAccount` is `false` and the IdP returns 400 with `error: unsupported_grant_type`
- **THEN** the system SHALL return a 502 error indicating the IdP does not support token exchange

#### Scenario: Exchanged token rejected with 401

- **WHEN** Kagenti returns 401 for a request using an exchanged token
- **THEN** the system SHALL clear both the per-user exchanged token cache AND the service-account token cache, then retry with a fresh token. If the retry also fails and `fallbackToServiceAccount` is `false`, the system SHALL return a 401 error.

### Requirement: No impact on ResponsesApiProvider

The token exchange feature SHALL NOT affect `ResponsesApiProvider` or Llama Stack provider code paths. The widened `setUserContext` signature (`bearerToken?` optional second param) SHALL be backward-compatible. Providers that do not implement `setUserContext` SHALL be skipped by the `if (provider.setUserContext)` guard.

#### Scenario: ResponsesApiProvider unaffected

- **WHEN** a request is routed to `ResponsesApiProvider`
- **THEN** no token exchange logic SHALL execute and the provider SHALL use its static API key unchanged
