# CA Bundle Resolution

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

Custom CA bundle resolution for entity-provider connectors. Shared utility loads CA bundles from K8s Secret/ConfigMap mounts or direct file paths, configurable per connector. Creates `https.Agent` with custom CA for HTTPS verification in air-gapped deployments.

## EXISTING Requirements

### Requirement: Per-Connector CA Bundle Configuration

Each connector can configure a custom CA bundle for HTTPS verification via config.

#### Scenario: CA loaded from file path

- **WHEN** a connector is configured with `catalog.providers.<connectorId>.tls.caFile: /etc/ssl/certs/custom-ca.pem`
- **THEN** `loadCaBundle(config, connectorId)` reads the PEM file from the specified path
- **AND** returns a `Buffer` containing the CA certificate(s)
- **AND** the connector uses this buffer to create an `https.Agent` with custom CA

#### Scenario: CA loaded from K8s Secret mount

- **WHEN** a connector is configured with `catalog.providers.<connectorId>.tls.caSecret.$env: CONNECTOR_CA_BUNDLE`
- **THEN** `loadCaBundle()` reads the PEM content from the environment variable `CONNECTOR_CA_BUNDLE`
- **AND** returns a `Buffer` containing the CA certificate(s)
- **AND** the environment variable is populated by K8s via Secret mount (operator responsibility)

#### Scenario: Per-connector config isolation

- **WHEN** MCP Registry connector has `tls.caFile: /etc/ssl/mcp-ca.pem`
- **AND** RHOAI connector has `tls.caFile: /etc/ssl/rhoai-ca.pem`
- **THEN** `loadCaBundle(config, 'mcpRegistry')` returns only the MCP Registry CA bundle
- **AND** `loadCaBundle(config, 'rhoai')` returns only the RHOAI CA bundle
- **AND** each connector's `https.Agent` uses its own CA, not the other connector's CA

### Requirement: Graceful Failure Handling

Missing or invalid CA files produce warnings, not crashes.

#### Scenario: Missing CA file warning

- **WHEN** a connector is configured with `tls.caFile: /etc/ssl/missing.pem`
- **AND** the file does not exist at that path
- **THEN** `loadCaBundle()` logs a warning at WARN level with the expected file path
- **AND** returns `undefined` (not an error thrown)
- **AND** the connector continues startup without custom CA (uses system CA bundle)

#### Scenario: Invalid CA certificate handling

- **WHEN** a connector is configured with a CA file containing invalid PEM data
- **THEN** `loadCaBundle()` logs an error with certificate parsing details
- **AND** returns `undefined`
- **AND** the connector continues startup without custom CA

### Requirement: https.Agent Creation

CA bundles are consumed by creating an `https.Agent` for HTTP client injection.

#### Scenario: Custom CA injected into HTTP client

- **WHEN** `loadCaBundle()` returns a `Buffer` containing a CA certificate
- **THEN** the connector creates an `https.Agent` with `{ ca: buffer }`
- **AND** injects this agent into the HTTP client (axios, node-fetch, etc.)
- **AND** HTTPS requests to the external platform verify server certificates against the custom CA

#### Scenario: Multiple CA certificates (chain)

- **WHEN** the CA file contains multiple PEM blocks (certificate chain)
- **THEN** `loadCaBundle()` returns all concatenated PEM blocks as a single `Buffer`
- **AND** `https.Agent` uses the entire chain for certificate verification

## ADDED Requirements

### Requirement: Specification Coverage

This capability area MUST have its existing behavior documented as baseline acceptance criteria.

#### Scenario: Baseline validation

- **WHEN** the existing implementation is validated against this specification
- **THEN** all scenarios described in the EXISTING Requirements section MUST pass
