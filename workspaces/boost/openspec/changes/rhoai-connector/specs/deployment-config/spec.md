# Deployment Configuration

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

The RHOAI connector supports per-source enable/disable toggles, cross-cluster endpoint configuration, K8s Secret credentials, and custom CA bundles.

## EXISTING Requirements

None. This is a new configuration schema.

## ADDED Requirements

### Requirement: Per-Source Enable/Disable Toggle

The Model Registry and MCP catalog sources must be independently toggleable via app-config.

#### Scenario: Model Registry enabled, MCP catalog disabled

- **WHEN** app-config includes:
  ```yaml
  catalog:
    providers:
      rhoai:
        modelRegistry:
          enabled: true
          endpoint: https://model-registry.rhoai.example.com
        mcpCatalog:
          enabled: false
  ```
- **THEN** the `RhoaiModelRegistryProvider` is registered via `catalogModule.addEntityProvider()`
- **AND** the `RhoaiMcpCatalogProvider` is NOT registered (no entity bucket created for it)
- **AND** the catalog backend logs: `RHOAI Model Registry provider enabled` and `RHOAI MCP catalog provider disabled (enabled: false)`

#### Scenario: Both sources disabled

- **WHEN** both `modelRegistry.enabled` and `mcpCatalog.enabled` are `false`
- **THEN** no RHOAI EntityProviders are registered
- **AND** the catalog backend logs: `RHOAI connector module loaded but all sources disabled`

#### Scenario: Disabled source skips Secret loading

- **WHEN** a source has `enabled: false`
- **THEN** the module does NOT attempt to load K8s Secrets for that source
- **AND** it does NOT validate endpoint connectivity for that source
- **AND** it does NOT create an entity bucket for that source

### Requirement: Cross-Cluster Endpoint Configuration

Each source must support cross-cluster API endpoints with dedicated configuration.

#### Scenario: Model Registry endpoint configuration

- **WHEN** app-config includes:
  ```yaml
  catalog:
    providers:
      rhoai:
        modelRegistry:
          enabled: true
          endpoint: https://model-registry.rhoai-cluster.example.com
          auth:
            secretRef:
              name: rhoai-model-registry-secret
              namespace: rhdh
          tls:
            caBundle: /etc/rhdh/ca-bundles/rhoai-ca.pem
  ```
- **THEN** the `RhoaiModelRegistryProvider` connects to the specified endpoint
- **AND** it loads credentials from the K8s Secret `rhoai/rhoai-model-registry-secret`
- **AND** it loads the CA bundle from `/etc/rhdh/ca-bundles/rhoai-ca.pem`
- **AND** it uses the CA bundle for TLS validation when connecting to the endpoint

#### Scenario: MCP catalog endpoint configuration

- **WHEN** app-config includes separate endpoint and credentials for MCP catalog:
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
            caBundle: /etc/rhdh/ca-bundles/rhoai-ca.pem
  ```
- **THEN** the `RhoaiMcpCatalogProvider` connects to the specified MCP catalog endpoint
- **AND** it uses independent credentials from `rhoai/rhoai-mcp-catalog-secret`
- **AND** it uses the same CA bundle (or a separate one if configured differently)

### Requirement: K8s Secret Credentials

Each source must load authentication credentials from K8s Secrets.

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
- **THEN** the provider logs an error: `K8s Secret {namespace}/{name} not found for RHOAI {source} provider`
- **AND** it returns empty entity array from `read()` without crashing the catalog backend
- **AND** on the next refresh cycle, it retries loading the Secret (Secret may have been created)

#### Scenario: K8s Secret is updated (credential rotation)

- **WHEN** the K8s Secret is updated with new credentials
- **THEN** the provider reloads the Secret on the next `refresh()` cycle
- **AND** it uses the new credentials for subsequent API calls
- **AND** it does NOT cache credentials across refresh cycles

### Requirement: Custom CA Bundle

Each source must support custom CA bundles for internal/self-signed certificates.

#### Scenario: Custom CA bundle is configured

- **WHEN** `tls.caBundle` points to a PEM file on disk
- **THEN** the provider loads the CA bundle using the shared CA utility from RHIDP-15316
- **AND** it configures the HTTPS client to trust the CA bundle for TLS validation
- **AND** on CA bundle load failure, it logs an error and falls back to system CA bundle

#### Scenario: Custom CA bundle is not configured

- **WHEN** `tls.caBundle` is omitted from the config
- **THEN** the provider uses the system's default CA bundle for TLS validation
- **AND** it does NOT log a warning about missing CA bundle (this is a valid configuration)

#### Scenario: Custom CA bundle file is missing

- **WHEN** `tls.caBundle` is set to a file path that does not exist
- **THEN** the provider logs an error: `CA bundle file not found: {path}`
- **AND** it falls back to the system CA bundle
- **AND** it continues connecting to the API endpoint (TLS validation may fail if a custom CA is required)

### Requirement: Config Validation

The module must validate the configuration schema at startup.

#### Scenario: Missing required endpoint

- **WHEN** `modelRegistry.enabled: true` but `modelRegistry.endpoint` is missing
- **THEN** the module logs an error: `RHOAI Model Registry enabled but endpoint not configured`
- **AND** the `RhoaiModelRegistryProvider` is NOT registered
- **AND** the catalog backend continues starting without the provider

#### Scenario: Invalid endpoint URL

- **WHEN** `endpoint` is set to an invalid URL (e.g., `not-a-url`)
- **THEN** the module logs an error: `Invalid endpoint URL for RHOAI {source}: {url}`
- **AND** the provider is NOT registered
- **AND** the catalog backend continues starting

#### Scenario: Valid configuration

- **WHEN** all required fields are present and valid
- **THEN** the module logs: `RHOAI {source} provider configured with endpoint: {endpoint}`
- **AND** the provider is registered and starts syncing entities
