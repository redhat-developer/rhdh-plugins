# Proposal: Cross-Connector Shared Infrastructure

## Why

Boost delivers three AI catalog connectors — MCP Registry, RHOAI, and OCI Skill Registry — each discovering and surfacing AI entities (models, agents, tools) from external platforms. These connectors share common infrastructure requirements: custom CA bundle resolution for air-gapped deployments, K8s Secret-based credential injection, and fault isolation to prevent one connector failure from blocking other connectors or degrading non-AI catalog entities.

Duplicating CA/TLS handling, error logging, and enable/disable config across each connector creates maintenance burden and inconsistency. A connector crash should not crash the catalog backend or corrupt other entities. Air-gapped environments demand custom CA certificate chains for HTTPS verification.

## What Boost Builds

### CA Bundle Resolution Utility

- `loadCaBundle(config: Config, connectorId: string): Buffer | undefined` function
- Per-connector config path: `catalog.providers.<connectorId>.tls.caFile` or `catalog.providers.<connectorId>.tls.caSecret`
- Reads CA bundles from K8s Secret/ConfigMap mounts or direct file paths
- Creates `https.Agent` with custom CA for HTTP client injection
- Handles missing/invalid CA gracefully: log warning, return undefined, don't crash provider
- Supports CA certificate chains (concatenated PEM)

### Fault Isolation Wrapper

- Per-provider entity bucket isolation (Backstage built-in)
- Node process-level isolation: try/catch wrapper around provider `run()` to catch unhandled rejections
- Structured error logging with connector context: connectorId, endpoint, errorType, errorMessage, retryable, nextRetryAt
- One connector failure never affects other connectors or non-AI entities

### Enable/Disable Pattern

- `catalog.providers.<connectorId>.enabled: true/false` config schema
- Registration guard: skip `catalog.addEntityProvider()` when disabled
- Disabled connector produces zero resource usage (no scheduled tasks created)
- Consistent pattern across all three connectors

### Structured Error Logging

- Per-connector error context fields: connectorId, endpoint, errorType, errorMessage, retryable, nextRetryAt
- Uses Backstage's LoggerService for consistent formatting
- Actionable error details for debugging air-gapped connectivity issues

## Impact

- `plugins/boost-connector-utils/` — shared utility package (`@boost/connector-utils`)
  - `loadCaBundle()` function
  - `createProviderWrapper()` fault isolation wrapper
  - `isConnectorEnabled()` registration guard
- `plugins/boost-backend-module-mcp-registry/` — consumes shared utilities
- `plugins/boost-backend-module-rhoai/` — consumes shared utilities
- `plugins/boost-backend-module-oci-skill/` — consumes shared utilities
- App-config schema extensions for CA, enable/disable, and error logging per connector

**Cross-references:**

- RHDHPLAN-1510 (Declarative AI Catalog via entity-provider connectors)
  - RHIDP-15313 (MCP Registry connector)
  - RHIDP-15314 (RHOAI connector)
- RHDHPLAN-1507 (Entity Model & Ingestion)
  - RHIDP-15294 (OCI Skill Registry — also consumes shared infrastructure)
  - `ai-catalog-entity-model` change (air-gapped-deployment patterns for CA/credential injection)
