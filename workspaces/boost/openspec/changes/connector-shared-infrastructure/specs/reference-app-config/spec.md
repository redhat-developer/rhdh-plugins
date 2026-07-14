# Reference App-Config YAML for AI Catalog Connectors

> **Status: Draft** — Pre-implementation specification.
>
> **Story:** RHIDP-15266 — Reference air-gapped connector configuration. The Helm chart and Operator CR examples live in their respective repos; this spec covers the reference `app-config.yaml` snippet that ships in the rhdh-plugins repository.

## Description

Each AI catalog connector (MCP Registry, RHOAI MCP Catalog, OCI Skill Registry) requires deployment-specific configuration: endpoint URLs, CA bundles, K8s Secret credentials, sync schedules, and enable/disable toggles. A reference `app-config.yaml` snippet must demonstrate all configurable fields with inline documentation, covering both internet-connected and air-gapped deployment variants.

This specification covers the reference app-config YAML that lives in the rhdh-plugins repository (e.g., `workspaces/boost/examples/`).

## EXISTING Requirements

None. This is a new reference configuration artifact.

## ADDED Requirements

### Requirement: MCP Registry Connector Configuration

The reference YAML must demonstrate MCP Registry connector configuration fields.

#### Scenario: MCP Registry with mirror endpoint and custom CA

- **WHEN** a deployer configures the MCP Registry connector for an air-gapped environment
- **THEN** the reference YAML includes:
  ```yaml
  catalog:
    providers:
      mcpRegistry:
        # Mirror endpoint overrides public registry.modelcontextprotocol.io
        endpoint: https://registry.internal.example.com
        tls:
          # Custom CA bundle for private registry TLS
          ca: /etc/ssl/certs/custom-ca-bundle.crt
        auth:
          # K8s Secret containing registry credentials (keys: username/password or token)
          secretRef: mcp-registry-credentials
  ```
- **AND** each field includes an inline comment explaining its purpose
- **AND** the `endpoint` field is documented as optional (falls back to public registry when omitted)

### Requirement: RHOAI MCP Catalog Connector Configuration

The reference YAML must demonstrate RHOAI connector configuration fields.

#### Scenario: RHOAI cross-cluster with MCP catalog toggle

- **WHEN** a deployer configures the RHOAI connector for a separate AI cluster
- **THEN** the reference YAML includes:
  ```yaml
  catalog:
    providers:
      rhoai:
        mcpCatalog:
          # Toggle MCP catalog source (requires RHOAI 3.4+)
          enabled: true
          # Cross-cluster RHOAI MCP catalog API endpoint
          endpoint: https://mcp-catalog.rhoai-cluster.example.com
          auth:
            secretRef:
              # K8s Secret with bearer token or basic auth credentials
              name: rhoai-mcp-catalog-secret
              namespace: rhdh
          tls:
            # Custom CA for internal/self-signed certificates
            caBundle: /etc/rhdh/ca-bundles/rhoai-ca.pem
  ```
- **AND** the `enabled` field is documented with its default value (`true`)
- **AND** the `auth.secretRef` format documents both `name` and `namespace` fields

### Requirement: OCI Skill Registry Connector Configuration

The reference YAML must demonstrate OCI Skill connector configuration fields.

#### Scenario: OCI connector with multiple registries

- **WHEN** a deployer configures the OCI Skill connector for multiple registries
- **THEN** the reference YAML includes:
  ```yaml
  catalog:
    providers:
      ociSkill:
        enabled: true
        registries:
          - # Public or internal OCI registry URL
            url: https://quay.io
            namespace: skills
            # K8s pull secret in Docker config.json format
            pullSecretPath: /var/run/secrets/quay-pull-secret/.dockerconfigjson
          - url: https://harbor.internal
            namespace: ai-assets
            pullSecretPath: /var/run/secrets/harbor-pull-secret/.dockerconfigjson
            # Custom CA for self-signed registry certificate
            caBundlePath: /etc/ssl/certs/harbor-ca.crt
        discovery:
          # Parallel manifest fetch concurrency (default: 20)
          concurrency: 20
  ```
- **AND** per-registry configuration demonstrates distinct credentials and CA bundles
- **AND** `discovery.concurrency` is documented as a performance tuning parameter

### Requirement: Air-Gapped Deployment Variant

The reference YAML must include a complete air-gapped deployment variant.

#### Scenario: All connectors in air-gapped environment

- **WHEN** a deployer needs to configure all connectors for an environment with no internet access
- **THEN** the reference YAML includes an air-gapped variant section showing:
  - MCP Registry pointed at internal mirror with custom CA
  - RHOAI pointed at internal RHOAI cluster with custom CA
  - OCI Skill pointed at internal Harbor/Quay mirror with pull secret and custom CA
  - All endpoints are internal hostnames with no fallback to public endpoints
- **AND** the variant is clearly labeled as an air-gapped example
- **AND** inline comments note that no public endpoint traffic will occur

### Requirement: Inline Documentation

Every configurable field must have a brief inline comment.

#### Scenario: Field-level documentation

- **WHEN** the reference YAML is read by a deployer
- **THEN** every field includes a YAML comment explaining:
  - What the field controls
  - Whether it is required or optional
  - Valid value formats (URL, file path, Secret name)
  - Default value if omitted
- **AND** the reference YAML is self-documenting without requiring external documentation

### Requirement: File Location

The reference YAML must be discoverable in the repository.

#### Scenario: Reference YAML placement

- **WHEN** a developer or deployer looks for connector configuration examples
- **THEN** the reference YAML is located at `workspaces/boost/examples/app-config.connectors.yaml` or an equivalent path under the boost workspace
- **AND** connector README files reference the example YAML location
