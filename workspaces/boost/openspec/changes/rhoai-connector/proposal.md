# Proposal: RHOAI Entity-Provider Connector

## Why

Red Hat OpenShift AI (RHOAI) is Red Hat's enterprise AI platform for model development, deployment, and serving. Customers building AI applications on RHOAI need catalog visibility into their registered models, deployed model servers, and MCP (Model Context Protocol) servers — but these exist outside the catalog today. Without this connector, teams lack discoverability, documentation, and metadata tracking for their AI assets.

Boost must surface RHOAI's Model Registry (Kubeflow API) and MCP catalog (developer-preview API) as first-class entities in the RHDH catalog, enabling teams to discover models, track versions, and connect to MCP servers.

## What Boost Builds

### Model Registry Source

- EntityProvider connecting to Kubeflow API (RegisteredModel/ModelVersion endpoints)
- Maps `RegisteredModel` → Resource entity with `spec.type: ai-model`
- Maps `ModelVersion` → Component entity with `spec.type: model-server`
- Uses `applyMutation` for full sync and incremental updates
- Prior art from `redhat-ai-dev/model-catalog-bridge` for entity mapping patterns

### Version Normalization

- Maps ModelVersion identifiers to `rhdh.io/ai-asset-version` annotation
- Normalizes version formats (`v1.0.0`, `1.0`, `latest`) from Kubeflow API
- Preserves ModelVersion metadata (description, author, timestamps)

### MCP Catalog Source

- EntityProvider connecting to RHOAI 3.4 MCP catalog API (developer preview)
- Emits Resource entities with `spec.type: mcp-server`
- Gracefully degrades when MCP catalog API is absent (404/connection error → log warning, disable MCP source for cycle)
- Handles API absence on RHOAI < 3.4 without failure

### Deployment Configuration

- Per-source enable/disable toggles via app-config: `catalog.providers.rhoai.modelRegistry.enabled` and `catalog.providers.rhoai.mcpCatalog.enabled`
- Cross-cluster endpoint configuration with K8s Secret credentials and custom CA bundles
- Uses shared CA utility from RHIDP-15316 (cross-connector infrastructure)
- Disabled sources skip registration entirely

## Impact

- `plugins/catalog-backend-module-rhoai/` — new backend module with two EntityProvider instances
- `plugins/catalog-backend-module-rhoai/src/providers/modelRegistry/` — Kubeflow API client and entity mapping
- `plugins/catalog-backend-module-rhoai/src/providers/mcpCatalog/` — MCP catalog API client and entity mapping
- `plugins/catalog-backend-module-rhoai/src/utils/` — shared version normalization, CA bundle loading
- Documentation referencing `rhdh.io/ai-asset-version` annotation from RHDHPLAN-1507's entity model
