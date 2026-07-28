# Proposal: RHOAI MCP Catalog Connector

## Why

Red Hat OpenShift AI (RHOAI) is Red Hat's enterprise AI platform for model development, deployment, and serving. RHOAI 3.4 introduces a developer-preview MCP (Model Context Protocol) catalog that lists MCP servers available within the platform. Customers building AI applications need catalog visibility into these MCP servers — but they exist outside the RHDH catalog today. Without this connector, teams lack discoverability and metadata tracking for RHOAI-managed MCP servers.

Boost must surface RHOAI's MCP catalog as first-class API entities in the RHDH catalog, enabling teams to discover and connect to MCP servers.

> **RHDHPLAN-1510 Consolidation (2026-07-08):** Epic RHIDP-15315 (OCI Skill Registry Connector) was closed — its scope has been absorbed by RHIDP-15294 (OCI Skill Registry) under RHDHPLAN-1507. RHDHPLAN-1510 continues with 3 surviving epics: RHIDP-15313 (MCP Registry connector), RHIDP-15314 (this RHOAI connector), and RHIDP-15316 (Cross-Connector Shared Infrastructure). All TLS, CA bundle, and credential utilities referenced here depend on RHIDP-15316 stories (RHIDP-15265, 15329) being implemented first.
>
> **Stakeholder Alignment (2026-07-13):**
>
> - **RHDHPLAN-393 complementary:** The RHOAI MCP catalog source and the MCP Registry connector (RHIDP-15313) serve different MCP server discovery paths — no ingestion duplication. RHDHPLAN-393 provides upstream MCP Registry; RHIDP-15313 adds productization. This connector ingests RHOAI-managed MCP servers separately.
> - **RHDHPLAN-404 dependency:** Provides extended API entity schema that this connector leverages for MCP server entities (`kind: API, spec.type: mcp-server`). Model Registry integration (Kubeflow API) is handled under RHDHPLAN-404, not this connector.
> - **MCP resource mapping deferred:** Mapping MCP resources (tools, prompts) as catalog entities is deferred for RHDH 2.1 (Christophe's consent; upstream due diligence pending). This connector emits MCP server entities only; MCP resource discovery is out of scope for now.
> - **Llamastack/OGX:** New RHDHPLAN-1510 scope — Boost adds Llamastack/OGX as additional model information source alongside RHOAI. Separate connector work.

## What Boost Builds

### MCP Catalog Source

- EntityProvider connecting to RHOAI 3.4 MCP catalog API (developer preview)
- Emits API entities with `spec.type: mcp-server`
- Gracefully degrades when MCP catalog API is absent (404/connection error → log warning, disable MCP source for cycle)
- Handles API absence on RHOAI < 3.4 without failure

### Deployment Configuration

- Cross-cluster endpoint configuration with K8s Secret credentials and custom CA bundles
- Uses shared CA utility from RHIDP-15316 (cross-connector infrastructure)

## Impact

- `plugins/boost-backend-module-rhoai/` — new backend module with MCP catalog EntityProvider
- `plugins/boost-backend-module-rhoai/src/providers/mcpCatalog/` — MCP catalog API client and entity mapping
- `plugins/boost-backend-module-rhoai/src/utils/` — CA bundle loading (shared utility integration)
- Documentation referencing RHDH AI Asset annotations from RHDHPLAN-1507's entity model

**Cross-references:**

- `workspaces/boost/openspec/changes/ai-catalog-entity-model/` — annotation scheme and SDK validation (RHDHPLAN-1507)
- `workspaces/boost/openspec/changes/connector-shared-infrastructure/` — shared CA bundle utility (RHIDP-15316)
- RHDHPLAN-404 — Model Registry integration (Kubeflow API) handled separately
