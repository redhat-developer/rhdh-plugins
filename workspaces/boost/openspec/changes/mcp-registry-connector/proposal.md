# Proposal: MCP Registry Connector — Productization & Air-Gapped Support

## Why

RHDHPLAN-393 delivers the upstream MCP Registry entity provider, enabling discovery and ingestion of Model Context Protocol servers from the public MCP Registry (`registry.modelcontextprotocol.io`). This works for internet-connected deployments where the public registry is accessible.

Enterprise customers deploying Red Hat Developer Hub in air-gapped or restricted network environments cannot reach the public MCP Registry endpoint. They require:

1. **Mirror endpoint support** — ability to point the connector at a customer-mirrored registry instead of the public endpoint
2. **Zero-internet guarantee** — when a mirror is configured, the connector must make zero outbound requests to the public registry
3. **Custom TLS/CA bundles** — support for private registries with custom certificate authorities
4. **Credential management** — support for authenticated/private registries using Kubernetes Secret-based credentials
5. **AI Asset annotation enrichment** — entities emitted by the MCP Registry connector must carry RHDH AI Asset annotations (`rhdh.io/ai-asset-category`, `rhdh.io/ai-asset-version`, `rhdh.io/ai-asset-source`) for integration with RHDH's AI Asset catalog and SDK validation (RHDHPLAN-1507)

This change layers productization on top of the upstream connector, adding air-gapped support while preserving the base functionality.

## What Boost Builds

### Mirror Endpoint Configuration

- **Configurable registry endpoint** via `catalog.providers.mcpRegistry.endpoint` in app-config
- **Fallback to public registry** when no mirror endpoint is configured
- **Zero-internet validation** — integration test ensuring no outbound traffic to the public endpoint when mirror is configured
- **Endpoint validation** — reject invalid URLs at startup

### TLS and Credential Hardening

- **Custom CA bundle loading** via shared utility from RHIDP-15316's cross-connector infrastructure
- **Kubernetes Secret-based credentials** for private/authenticated registries
- **Per-connector TLS configuration** — CA bundle and credentials scoped to the MCP Registry connector instance
- **Graceful degradation** — invalid CA bundles log warnings but don't crash the connector

### AI Asset Annotation Enrichment

- **Annotation population during entity emission** — entities carry `rhdh.io/ai-asset-category: mcp-server`, `rhdh.io/ai-asset-version`, `rhdh.io/ai-asset-source: mcp-registry` annotations
- **Enrichment pipeline** — annotations added after upstream connector emits entities, before `applyMutation`
- **SDK validation integration** — enriched entities pass through RHDHPLAN-1507's SDK validation layer
- **Missing annotation handling** — entities without version metadata get annotation placeholders

### Packaging and Documentation

- **RHDH dynamic plugin packaging** — connector packaged as standalone dynamic plugin
- **Configuration examples** — air-gapped deployment templates with mirror endpoint, CA bundles, Secret-based auth
- **Migration guide** — upgrading from upstream connector to productized version

## Impact

**New packages:**

- `plugins/boost-backend-module-mcp-registry/` — productized MCP Registry connector (wraps upstream RHDHPLAN-393 connector)

**Modified packages:**

- None — this is a new productization wrapper, not a modification of the upstream connector

**Cross-references:**

- `workspaces/boost/openspec/changes/ai-catalog-entity-model/` — annotation scheme and SDK validation (RHDHPLAN-1507)
- `workspaces/boost/openspec/changes/cross-connector-shared-infrastructure/` — shared CA bundle utility (RHIDP-15316)
- Upstream RHDHPLAN-393 — base MCP Registry entity provider

**Configuration schema:**

```yaml
catalog:
  providers:
    mcpRegistry:
      endpoint: https://registry.internal.example.com # Mirror endpoint (optional)
      tls:
        ca: /etc/ssl/certs/custom-ca-bundle.crt # Custom CA bundle path (optional)
      auth:
        secretRef: mcp-registry-credentials # K8s Secret name (optional)
```

**Affected Jira stories:**

- RHIDP-15317: MCP Registry mirror endpoint and zero-internet validation
- RHIDP-15318: MCP Registry custom CA bundle and K8s Secret auth
- RHIDP-15319: MCP Registry AI Asset annotation enrichment
