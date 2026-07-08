# Error Classification

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

Connector failures classified into actionable categories with diagnostic guidance. Classification logic shared across all connectors.

## ADDED Requirements

### Requirement: Auth/Authorization Failure Classification

Authentication and authorization errors identified and classified.

#### Scenario: Auth failure classified with diagnostic guidance

- **WHEN** a connector sync fails with authentication error (e.g., "401 Unauthorized", "Invalid API token", "OAuth token expired")
- **THEN** the error is classified as `error_type: "auth"`
- **AND** `diagnosticGuidance` is `"Check service account credentials in connector config. Verify API token is valid and has required permissions."`
- **AND** error classification is performed via `ErrorClassifier.classify(error)` utility function

#### Scenario: OAuth token expiry detected

- **WHEN** a connector sync fails with OAuth-specific error (e.g., "Access token expired", "Refresh token invalid")
- **THEN** the error is classified as `error_type: "auth"`
- **AND** `diagnosticGuidance` is `"OAuth token expired. Re-authenticate the connector in admin panel or refresh the access token."`

#### Scenario: Insufficient permissions detected

- **WHEN** a connector sync fails with permission error (e.g., "403 Forbidden", "Insufficient scopes")
- **THEN** the error is classified as `error_type: "auth"`
- **AND** `diagnosticGuidance` is `"Service account lacks required permissions. Verify API token has read access to required resources (repositories, projects, issues)."`

### Requirement: Network/DNS/Connectivity Failure Classification

Network-related errors identified and classified.

#### Scenario: Network failure classified with diagnostic guidance

- **WHEN** a connector sync fails with network error (e.g., "ECONNREFUSED", "ETIMEDOUT", "Network unreachable")
- **THEN** the error is classified as `error_type: "network"`
- **AND** `diagnosticGuidance` is `"Network connectivity issue. Verify DNS resolution, firewall rules, and external service availability. In air-gapped clusters, disable connectors for unreachable external services."`

#### Scenario: DNS resolution failure detected

- **WHEN** a connector sync fails with DNS error (e.g., "ENOTFOUND", "DNS lookup failed")
- **THEN** the error is classified as `error_type: "network"`
- **AND** `diagnosticGuidance` is `"DNS resolution failed. Verify DNS configuration and external service hostname. In disconnected clusters, this is expected for external services—consider disabling the connector."`

#### Scenario: TLS/SSL certificate error detected

- **WHEN** a connector sync fails with TLS error (e.g., "UNABLE_TO_VERIFY_LEAF_SIGNATURE", "self signed certificate")
- **THEN** the error is classified as `error_type: "network"`
- **AND** `diagnosticGuidance` is `"TLS/SSL certificate verification failed. Verify certificate chain or configure connector to trust custom CA certificates."`

### Requirement: Schema/Parsing Mismatch Classification

Data schema and parsing errors identified and classified.

#### Scenario: Schema mismatch classified with diagnostic guidance

- **WHEN** a connector sync fails with schema error (e.g., "Unexpected field 'x' in response", "Missing required field 'y'")
- **THEN** the error is classified as `error_type: "schema"`
- **AND** `diagnosticGuidance` is `"API response schema mismatch. This may indicate an upstream API version change. Check connector logs for expected vs actual schema and consider updating the connector."`

#### Scenario: JSON parsing error detected

- **WHEN** a connector sync fails with parsing error (e.g., "Unexpected token < in JSON", "SyntaxError: JSON.parse")
- **THEN** the error is classified as `error_type: "schema"`
- **AND** `diagnosticGuidance` is `"Failed to parse API response. Upstream service may be returning HTML error page or malformed JSON. Check connector logs for raw response body."`

#### Scenario: GraphQL query error detected

- **WHEN** a connector sync fails with GraphQL error (e.g., "Field 'x' doesn't exist on type 'Y'", "Cannot query field")
- **THEN** the error is classified as `error_type: "schema"`
- **AND** `diagnosticGuidance` is `"GraphQL query schema mismatch. Upstream GraphQL schema may have changed. Review connector GraphQL queries against current API schema."`

### Requirement: Rate Limiting Classification

Rate limit errors identified and classified.

#### Scenario: Rate limit classified with diagnostic guidance

- **WHEN** a connector sync fails with rate limit error (e.g., "429 Too Many Requests", "Rate limit exceeded", "X-RateLimit-Remaining: 0")
- **THEN** the error is classified as `error_type: "rate-limit"`
- **AND** `diagnosticGuidance` is `"API rate limit exceeded. Connector will retry on next scheduled sync. Consider increasing sync interval or requesting higher rate limits from service provider."`

#### Scenario: GitHub-specific rate limit detected

- **WHEN** a GitHub connector sync fails with rate limit headers (e.g., `X-RateLimit-Remaining: 0`)
- **THEN** the error is classified as `error_type: "rate-limit"`
- **AND** `diagnosticGuidance` includes retry timestamp from `X-RateLimit-Reset` header (e.g., `"Rate limit will reset at 2:30 PM UTC. Connector will retry automatically."`)

#### Scenario: Secondary rate limit detected

- **WHEN** a connector sync fails with secondary rate limit (e.g., GitHub "You have exceeded a secondary rate limit")
- **THEN** the error is classified as `error_type: "rate-limit"`
- **AND** `diagnosticGuidance` is `"Secondary rate limit triggered (too many requests in short period). Connector will back off and retry. Consider reducing sync frequency."`

### Requirement: Shared Classification Logic Across Connectors

Classification logic is reusable across GitHub, GitLab, Jira connectors.

#### Scenario: ErrorClassifier utility function

- **WHEN** a connector provider calls `ErrorClassifier.classify(error)`
- **THEN** the function returns classification object with `errorType`, `errorMessage`, `diagnosticGuidance` fields
- **AND** classification logic is connector-agnostic (detects error patterns from HTTP status codes, error messages, error codes)

#### Scenario: Connector-specific error detection

- **WHEN** a connector has provider-specific error patterns (e.g., GitHub secondary rate limit, Jira Cloud-specific auth errors)
- **THEN** the `ErrorClassifier` supports optional connector-specific matchers via `ErrorClassifier.classify(error, { connectorType: 'github' })`
- **AND** base classification runs first, connector-specific matchers override if matched

#### Scenario: Error classification logging

- **WHEN** an error is classified
- **THEN** the classification result is logged at `debug` level with raw error for troubleshooting
- **AND** log includes: `connectorId`, `errorType`, `errorMessage`, `rawError` (stack trace), `diagnosticGuidance`

### Requirement: Unknown Error Fallback Classification

Errors that don't match known patterns fall back to generic classification.

#### Scenario: Unknown error fallback

- **WHEN** a connector sync fails and the error doesn't match any classification patterns
- **THEN** the error is classified as `error_type: "unknown"`
- **AND** `diagnosticGuidance` is `"Unknown error occurred. Check connector logs for detailed error trace and stack trace."`
- **AND** `errorMessage` contains the raw error string for admin inspection

#### Scenario: Multi-error classification

- **WHEN** a connector sync fails with multiple errors (e.g., network timeout after auth failure)
- **THEN** the error is classified based on the first classifiable error in the chain
- **AND** if no errors match known patterns, falls back to `error_type: "unknown"`

### Requirement: Error Classification in Health Cards

Classified errors rendered in admin UI with color-coded badges.

#### Scenario: Error type badge color coding

- **WHEN** a health card renders error summary for a failing/degraded connector
- **THEN** the error type badge color is:
  - Red for `auth` and `schema` (requires immediate admin action)
  - Orange for `network` and `rate-limit` (may resolve automatically)
  - Grey for `unknown` (requires log inspection)
- **AND** badge uses PatternFly `Label` component with appropriate `color` prop

#### Scenario: Diagnostic guidance displayed in health card

- **WHEN** a health card renders error summary
- **THEN** the card body shows `diagnosticGuidance` text below error type badge
- **AND** guidance text is wrapped in PatternFly `Text` component with `variant="small"` for readability
