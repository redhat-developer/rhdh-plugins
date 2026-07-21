# Deployment Configuration

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.
>
> **Cross-connector dependencies:** RHIDP-15323 is blocked by RHIDP-15265 (endpoint/credential config schema) and RHIDP-15329 (shared CA bundle utility) from RHIDP-15316 (Cross-Connector Shared Infrastructure). The shared CA bundle utility and K8s Secret credential patterns must be implemented in RHIDP-15316 before this spec's cross-cluster TLS and auth requirements can be fulfilled.

The RHOAI MCP catalog connector supports cross-cluster endpoint configuration, K8s Secret credentials, and custom CA bundles.

## EXISTING Requirements

None. This is a new configuration schema.

## ADDED Requirements

### Requirement: Enable/Disable Toggle

The MCP catalog source must be toggleable via app-config.

#### Scenario: MCP catalog disabled

- **WHEN** app-config includes:
  ```yaml
  catalog:
    providers:
      rhoai:
        mcpCatalog:
          enabled: false
  ```
- **THEN** the `RhoaiMcpCatalogProvider` is NOT registered (no entity bucket created)
- **AND** the catalog backend logs: `RHOAI MCP catalog provider disabled (enabled: false)`
- **AND** the module does NOT attempt to load K8s Secrets or validate endpoint connectivity

#### Scenario: MCP catalog enabled

- **WHEN** app-config includes `mcpCatalog.enabled: true` with a valid endpoint
- **THEN** the `RhoaiMcpCatalogProvider` is registered via `catalogModule.addEntityProvider()`
- **AND** the catalog backend logs: `RHOAI MCP catalog provider enabled`

### Requirement: Cross-Cluster Endpoint Configuration

The MCP catalog source must support cross-cluster API endpoints with dedicated configuration.

#### Scenario: MCP catalog endpoint configuration

- **WHEN** app-config includes:
  ```yaml
  catalog:
    providers:
      rhoai:
        mcpCatalog:
          enabled: true
          endpoint: https://mcp-catalog.rhoai-cluster.example.com
          auth:
            secretRef:
              name: rhoai-mcp-catalog-secret
              namespace: rhdh
          tls:
            caFile: /etc/rhdh/ca-bundles/rhoai-ca.pem
  ```
- **THEN** the `RhoaiMcpCatalogProvider` connects to the specified MCP catalog endpoint
- **AND** it loads credentials from the K8s Secret `rhdh/rhoai-mcp-catalog-secret`
- **AND** it loads the CA bundle from `/etc/rhdh/ca-bundles/rhoai-ca.pem`
- **AND** it uses the CA bundle for TLS validation when connecting to the endpoint

### Requirement: K8s Secret Credentials

The MCP catalog source must load authentication credentials from K8s Secrets.

#### Scenario: K8s Secret contains bearer token

- **WHEN** the K8s Secret referenced in `auth.secretRef` contains a key `token`
- **THEN** the provider uses the token value as a bearer token in the `Authorization` header
- **AND** the header format is `Authorization: Bearer {token}`

#### Scenario: K8s Secret contains username and password

- **WHEN** the K8s Secret contains keys `username` and `password`
- **THEN** the provider uses HTTP Basic Auth
- **AND** the header format is `Authorization: Basic {base64(username:password)}`

#### Scenario: K8s Secret is missing

- **WHEN** the K8s Secret referenced in `auth.secretRef` does not exist
- **THEN** the provider logs an error: `K8s Secret {namespace}/{name} not found for RHOAI MCP catalog provider`
- **AND** it calls `applyMutation({ type: 'full', entities: [] })` without crashing the catalog backend
- **AND** on the next refresh cycle, it retries loading the Secret (Secret may have been created)

> **Rationale (graceful degradation vs. fail-fast):** The RHOAI connector degrades gracefully on missing Secret because the MCP catalog API is developer-preview (RHOAI 3.4+) and may not exist on older versions — retrying allows recovery after Secret creation or RHOAI upgrade. This differs from the MCP Registry connector (see `mcp-registry-connector/specs/auth-tls-hardening`), which fails to start on missing Secret because `auth.secretRef` is explicitly admin-configured and a missing Secret indicates a deployment error.

#### Scenario: K8s Secret is updated (credential rotation)

- **WHEN** the K8s Secret is updated with new credentials
- **THEN** the provider reloads the Secret on the next `refresh()` cycle
- **AND** it uses the new credentials for subsequent API calls
- **AND** it does NOT cache credentials across refresh cycles

### Requirement: Custom CA Bundle

The MCP catalog source must support custom CA bundles for internal/self-signed certificates.

#### Scenario: Custom CA bundle is configured

- **WHEN** `tls.caFile` points to a PEM file on disk
- **THEN** the provider loads the CA bundle using the shared CA utility from RHIDP-15316
- **AND** it configures the HTTPS client to trust the CA bundle for TLS validation
- **AND** on CA bundle load failure, it logs an error and falls back to system CA bundle

#### Scenario: Custom CA bundle is not configured

- **WHEN** `tls.caFile` is omitted from the config
- **THEN** the provider uses the system's default CA bundle for TLS validation
- **AND** it does NOT log a warning about missing CA bundle (this is a valid configuration)

#### Scenario: Custom CA bundle file is missing

- **WHEN** `tls.caFile` is set to a file path that does not exist
- **THEN** the provider logs an error: `CA bundle file not found: {path}`
- **AND** it falls back to the system CA bundle
- **AND** it continues connecting to the API endpoint (TLS validation may fail if a custom CA is required)

### Requirement: Config Validation

The module must validate the configuration schema at startup.

#### Scenario: Missing required endpoint

- **WHEN** `mcpCatalog.enabled: true` but `mcpCatalog.endpoint` is missing
- **THEN** the module logs an error: `RHOAI MCP catalog enabled but endpoint not configured`
- **AND** the `RhoaiMcpCatalogProvider` is NOT registered
- **AND** the catalog backend continues starting without the provider

#### Scenario: Invalid endpoint URL

- **WHEN** `endpoint` is set to an invalid URL (e.g., `not-a-url`)
- **THEN** the module logs an error: `Invalid endpoint URL for RHOAI MCP catalog: {url}`
- **AND** the provider is NOT registered
- **AND** the catalog backend continues starting

#### Scenario: Valid configuration

- **WHEN** all required fields are present and valid
- **THEN** the module logs: `RHOAI MCP catalog provider configured with endpoint: {endpoint}`
- **AND** the provider is registered and starts syncing entities
