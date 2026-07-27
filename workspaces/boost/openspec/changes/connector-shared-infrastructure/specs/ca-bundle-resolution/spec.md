# CA Bundle Resolution

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

Custom CA bundle resolution for entity-provider connectors. Shared utility loads CA bundles from K8s Secret/ConfigMap mounts or direct file paths, configurable per connector. Creates `https.Agent` with custom CA for HTTPS verification in air-gapped deployments.

## EXISTING Requirements

### Requirement: Per-Connector CA Bundle Configuration

Each connector can configure a custom CA bundle for HTTPS verification via config.

#### Scenario: CA loaded from file path

- **WHEN** a connector is configured with `catalog.providers.<connectorId>.tls.caFile: /etc/ssl/certs/custom-ca.pem` (must be an absolute path)
- **THEN** `loadCaBundle(connectorConfig)` reads the PEM file from the `tls.caFile` path within the provided Config subtree
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
- **THEN** `loadCaBundle(mcpRegistryConfig)` returns only the MCP Registry CA bundle (where `mcpRegistryConfig = config.getConfig('catalog.providers.mcpRegistry')`)
- **AND** `loadCaBundle(rhoaiMcpCatalogConfig)` returns only the RHOAI CA bundle (where `rhoaiMcpCatalogConfig = config.getConfig('catalog.providers.rhoai.mcpCatalog')`)
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

#### Scenario: No CA file configured (default behavior)

- **WHEN** a connector is configured without `tls.caFile` and without `tls.caSecret`
- **THEN** `loadCaBundle(connectorConfig)` returns `undefined`
- **AND** the connector uses the system CA bundle (Node.js default `tls.rootCertificates`)
- **AND** no warning is logged (this is the expected default for registries with publicly trusted certificates)

#### Scenario: Multiple CA certificates (chain)

- **WHEN** the CA file contains multiple PEM blocks (certificate chain)
- **THEN** `loadCaBundle()` returns all concatenated PEM blocks as a single `Buffer`
- **AND** `https.Agent` uses the entire chain for certificate verification

#### Scenario: Incomplete or improperly ordered certificate chain

- **WHEN** the CA file contains a certificate chain with missing intermediate certificates or incorrect ordering (leaf before root)
- **THEN** `loadCaBundle()` returns the file contents as-is (it does not validate chain completeness or order)
- **AND** if the `https.Agent` fails TLS verification due to an incomplete chain, the connection error is caught by the fault isolation wrapper
- **AND** the error log includes `errorType: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'` or `'UNABLE_TO_GET_ISSUER_CERT_LOCALLY'` with the file path for debugging

#### Scenario: Expired certificate in CA chain

- **WHEN** the CA file contains a valid PEM certificate that has expired
- **THEN** `loadCaBundle()` returns the file contents (PEM parsing succeeds — expiry is not checked at load time)
- **AND** the `https.Agent` rejects TLS connections at runtime with `errorType: 'CERT_HAS_EXPIRED'`
- **AND** the error is classified as non-retryable (see fault isolation spec) and logged with the file path and certificate expiry details

## ADDED Requirements

### Requirement: Specification Coverage

This capability area MUST have its existing behavior documented as baseline acceptance criteria.

#### Scenario: Baseline validation

- **WHEN** the existing implementation is validated against this specification
- **THEN** all scenarios described in the EXISTING Requirements section MUST pass
