# Design: RHOAI MCP Catalog Connector

## Context

RHOAI (Red Hat OpenShift AI) exposes MCP server metadata via a developer-preview catalog API (RHOAI 3.4+). Customers need catalog visibility into these MCP servers without manual entity YAML authoring. This connector implements an EntityProvider for the RHOAI MCP catalog with its own failure domain and entity bucket.

The MCP catalog API is developer preview in RHOAI 3.4; not all customers have upgraded.

> **RHDHPLAN-1510 Consolidation (2026-07-08):** Epic RHIDP-15315 (OCI Skill Registry Connector) was closed — scope absorbed by RHIDP-15294 (RHDHPLAN-1507). This RHOAI connector continues under RHIDP-15314. Dependency chain: RHIDP-15316 cross-connector stories (15265 endpoint/creds, 15329 CA bundles) must land before this connector's deployment configuration (RHIDP-15323) can proceed.
>
> **Stakeholder Alignment (2026-07-13):**
>
> - **RHDHPLAN-393 complementary:** The RHOAI MCP catalog source and the MCP Registry connector (RHIDP-15313) serve different MCP server discovery paths — no ingestion duplication. RHDHPLAN-393 provides upstream MCP Registry; RHIDP-15313 adds productization. This connector ingests RHOAI-managed MCP servers separately.
> - **RHDHPLAN-404 dependency:** Provides extended API entity schema that this connector leverages for MCP server entities (`kind: API, spec.type: mcp-server`). Model Registry integration (Kubeflow API) is handled under RHDHPLAN-404, not this connector.
> - **MCP resource mapping deferred:** Mapping MCP resources (tools, prompts) as catalog entities is deferred for RHDH 2.1 (Christophe's consent; upstream due diligence pending). This connector emits MCP server entities only; MCP resource discovery is out of scope for now.
> - **Llamastack/OGX:** New RHDHPLAN-1510 scope — Boost adds Llamastack/OGX as additional model information source alongside RHOAI. Separate connector work.

## Goals

- MCP catalog API client with graceful degradation on 404/absence
- Cross-cluster endpoint configuration with K8s Secret credentials and custom CA bundles
- Entity mapping: MCP catalog entries → API entities with `spec.type: mcp-server`
- Packageability as standalone RHDH dynamic plugin

## Non-Goals

- Model Registry integration via Kubeflow API (handled by RHDHPLAN-404)
- MCP server health monitoring (covered in separate observability change)
- Creating new annotation schemes beyond what RHDHPLAN-1507's entity model defines
- Mapping MCP resources (tools, prompts) as catalog entities (deferred for RHDH 2.1)
- Changing the RHOAI MCP catalog API contract

## Decisions

### Decision 1: Entity Type Mapping

MCP catalog entries must map to RHDH entity types.

**MCP catalog entry → API entity with `spec.type: mcp-server`**

**Why:** MCP servers expose a protocol interface for tool/resource access — API with `spec.type: mcp-server` captures this (a recent Backstage entity kind addition). Follows the entity type strategy from RHDHPLAN-1507's `agent-creation-discovery` change.

**How to apply:** Entity mapper function in `src/providers/mcpCatalog/mapper.ts`. MCP catalog entries get `metadata.annotations['rhdh.io/mcp-protocol-version']`.

### Decision 2: Graceful Degradation for MCP Catalog API

The MCP catalog API is developer preview in RHOAI 3.4. Older RHOAI versions (< 3.4) will not have this API. The connector must not fail startup on API absence.

**How to apply:** MCP catalog provider's `connect()` method tries the API endpoint. On 404 or connection error, log a warning (`MCP catalog API not available, disabling MCP source for this cycle`), set internal flag `mcpApiAvailable = false`, and return empty entity array from `read()`. On subsequent refreshes, skip API calls if flag is false. Do NOT throw an error that halts the entire catalog backend.

**Why:** RHOAI deployment versions vary across customers. The connector must handle API absence gracefully without crashing the catalog backend.

### Decision 3: Cross-Cluster Endpoint Configuration

RHOAI clusters may be separate from the RHDH cluster. The connector must support cross-cluster API endpoints with K8s Secret credentials and custom CA bundles.

**How to apply:** Config schema under `catalog.providers.rhoai.mcpCatalog` includes:

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

The provider uses the shared CA bundle utility from RHIDP-15316. K8s Secret credentials follow the same pattern as other RHDHPLAN-1510 connectors.

**Why:** Many customers run RHOAI in a dedicated AI cluster separate from their RHDH instance. Custom CA bundles are required for internal/self-signed certificates.

## Risks

### Risk 1: MCP Catalog API Instability

**Likelihood:** Medium  
**Impact:** High  
**Mitigation:**

- Version the API client interface and log API version mismatches as warnings, not errors
- Graceful degradation (Decision 2) prevents API instability from crashing the catalog backend
- Automated tests against multiple API response shapes

### Risk 2: Secret Rotation

**Likelihood:** Medium  
**Impact:** Medium  
**Mitigation:**

- Per-connector Secret refresh on each `refresh()` cycle using shared credential utilities from RHIDP-15316 (not a singleton secret manager — each connector loads its own Secret independently)
- Prometheus metrics for auth failures

### Risk 3: Annotation Schema Divergence

**Likelihood:** Low  
**Impact:** Low  
**Mitigation:**

- Shared annotation schema defined in RHDHPLAN-1507's `ai-catalog-entity-model`
- SDK validation enforces annotation schema compliance
- Automated tests verify annotation presence and correctness
