# Design: RHOAI Entity-Provider Connector

## Context

RHOAI (Red Hat OpenShift AI) exposes model metadata via Kubeflow's Model Registry API and MCP server metadata via a developer-preview catalog API (RHOAI 3.4+). Customers need catalog visibility into these assets without manual entity YAML authoring. This connector implements two separate EntityProvider instances — one for Model Registry, one for MCP catalog — with independent failure domains and entity buckets.

The Model Registry provider is P0 (customers are actively requesting model discoverability). The MCP catalog provider is P1 (RHOAI 3.4 is developer preview; not all customers have upgraded).

## Goals

- Two separate EntityProvider instances for independent failure isolation
- Kubeflow API client for RegisteredModel/ModelVersion ingestion
- MCP catalog API client with graceful degradation on 404/absence
- Version normalization from Kubeflow ModelVersion to `rhdh.io/ai-asset-version` annotation
- Per-source enable/disable toggles
- Cross-cluster endpoint configuration with K8s Secret credentials and custom CA bundles

## Non-Goals

- Synchronizing Model Registry writes back to RHOAI (read-only connector)
- MCP server health monitoring (covered in separate observability change)
- AI model lineage tracking (covered in separate lineage change)
- Model performance metrics (covered in separate metrics integration)
- Creating new annotation schemes beyond `rhdh.io/ai-asset-version` (reuses entity model from RHDHPLAN-1507)

## Decisions

### Decision 1: Two Separate EntityProvider Instances

Each source (Model Registry, MCP catalog) gets its own EntityProvider instance, not a single provider with conditional fetching.

**Option A (chosen):** Two providers — `RhoaiModelRegistryProvider` and `RhoaiMcpCatalogProvider` — each registered independently via `catalogModule.addEntityProvider()`.

**Option B (rejected):** Single `RhoaiProvider` with internal conditional fetching based on config toggles.

**Why A:** Independent failure domains. If the MCP catalog API is unavailable or misconfigured, Model Registry entities continue syncing. Each source gets its own isolated entity bucket (`rhoai-model-registry`, `rhoai-mcp-catalog`), making debugging and metrics clearer. Backstage's EntityProvider lifecycle (connect/refresh) is cleaner when each provider owns one concern.

**How to apply:** Create two separate provider classes in `src/providers/{modelRegistry,mcpCatalog}/`. Each has its own config schema under `catalog.providers.rhoai.{modelRegistry,mcpCatalog}`. Each registers with a unique provider name for entity bucket isolation.

### Decision 2: Kubeflow API Client — Direct REST vs. Generated SDK

The Model Registry source needs a Kubeflow API client for `RegisteredModel` and `ModelVersion` endpoints.

**Option A (chosen):** Direct REST client with typed response interfaces.

**Option B (rejected):** Generated SDK from Kubeflow OpenAPI spec.

**Why A:** The Kubeflow Model Registry API is stable but the SDK generation adds build complexity and version coupling risk. A direct REST client with typed response interfaces (`RegisteredModel`, `ModelVersion`) is simpler to maintain and easier to debug. The API surface is small (2 endpoints: list models, list versions). Prior art from `model-catalog-bridge` shows direct REST is sufficient.

**How to apply:** Implement `KubeflowApiClient` in `src/providers/modelRegistry/client.ts` with typed response interfaces. Use `fetch` (or `node-fetch` if needed) with manual JSON parsing and Zod validation for responses.

### Decision 3: Entity Type Mapping

Kubeflow Model Registry and RHOAI MCP catalog must map to RHDH entity types.

**RegisteredModel → Resource entity with `spec.type: ai-model`**  
**ModelVersion → Component entity with `spec.type: model-server`**  
**MCP catalog entry → Resource entity with `spec.type: mcp-server`**

**Why:** Follows the entity type strategy from RHDHPLAN-1507's `agent-creation-discovery` change (UC-11, UC-12). RegisteredModel is a logical grouping of versions (like a model family) — Resource captures this. ModelVersion is a deployable artifact (container image + config) — Component captures this. MCP servers are external services — Resource captures this.

**How to apply:** Entity mapper functions in `src/providers/modelRegistry/mapper.ts` and `src/providers/mcpCatalog/mapper.ts`. RegisteredModel entities get `metadata.annotations['rhdh.io/ai-model-family']`. ModelVersion entities get `metadata.annotations['rhdh.io/ai-asset-version']` with normalized version. MCP catalog entries get `metadata.annotations['rhdh.io/mcp-protocol-version']`.

### Decision 4: Graceful Degradation for MCP Catalog API

The MCP catalog API is developer preview in RHOAI 3.4. Older RHOAI versions (< 3.4) will not have this API. The connector must not fail startup on API absence.

**How to apply:** MCP catalog provider's `connect()` method tries the API endpoint. On 404 or connection error, log a warning (`MCP catalog API not available, disabling MCP source for this cycle`), set internal flag `mcpApiAvailable = false`, and return empty entity array from `read()`. On subsequent refreshes, skip API calls if flag is false. Do NOT throw an error that halts the entire catalog backend.

**Why:** RHOAI deployment versions vary across customers. The Model Registry provider must continue working even if MCP catalog is unavailable. The two-provider design (Decision 1) ensures this isolation.

### Decision 5: Cross-Cluster Endpoint Configuration

RHOAI clusters may be separate from the RHDH cluster. The connector must support cross-cluster API endpoints with K8s Secret credentials and custom CA bundles.

**How to apply:** Config schema under `catalog.providers.rhoai.{modelRegistry,mcpCatalog}` includes:

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
      mcpCatalog:
        enabled: false
        endpoint: https://mcp-catalog.rhoai-cluster.example.com
        auth:
          secretRef:
            name: rhoai-mcp-catalog-secret
            namespace: rhdh
        tls:
          caBundle: /etc/rhdh/ca-bundles/rhoai-ca.pem
```

Each provider uses the shared CA bundle utility from RHIDP-15316. K8s Secret credentials follow the same pattern as the Kagenti provider from RHDHPLAN-1507. Disabled sources skip EntityProvider registration entirely.

**Why:** Many customers run RHOAI in a dedicated AI cluster separate from their RHDH instance. Custom CA bundles are required for internal/self-signed certificates.

## Risks

- **MCP catalog API instability:** Developer preview APIs may change. **Mitigation:** Version the API client interface and log API version mismatches as warnings, not errors.
- **Kubeflow API pagination:** Large model registries (1000+ models) may require pagination. **Mitigation:** Implement cursor-based pagination in `KubeflowApiClient` from day one (Kubeflow API supports `pageSize` and `nextPageToken`).
- **Secret rotation:** K8s Secret credentials may rotate. **Mitigation:** Refresh secrets on each `refresh()` cycle, not just at startup. Leverage RHIDP-15316's shared secret manager.
