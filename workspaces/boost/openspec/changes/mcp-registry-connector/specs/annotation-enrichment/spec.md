# AI Asset Annotation Enrichment

> **Status: Draft** — Pre-implementation specification.
>
> **Cross-connector dependencies:** RHIDP-15319 is blocked by RHDHPLAN-1507's SDK (RHIDP-15258) which defines the AI Asset annotation scheme (`rhdh.io/ai-asset-category`, `rhdh.io/ai-asset-version`, `rhdh.io/ai-asset-source`) and SDK validation layer. The annotation constants and validation must be exported by the SDK before this enrichment pipeline can integrate.
>
> **Connector-specific extensions:** Individual connectors may define additional `rhdh.io/ai-asset-*` annotations beyond the core three. The OCI Skill connector defines `rhdh.io/ai-asset-digest` (OCI image digest for incremental sync). These extensions follow the same namespace but are not required by the SDK validation layer.

## Description

The MCP Registry connector must enrich emitted entities with RHDH AI Asset annotations to enable integration with RHDH's AI Asset catalog and SDK validation. Annotations identify entities as MCP servers, track version metadata, and record provenance.

This specification covers RHIDP-15319: MCP Registry AI Asset annotation enrichment.

## EXISTING Requirements

None — this is a new productization wrapper around the upstream MCP Registry entity provider (RHDHPLAN-393).

## ADDED Requirements

### Requirement: Annotation Population During Entity Emission

**WHEN** the upstream MCP Registry connector emits a Backstage entity for a discovered MCP server:

**THEN** the productization wrapper enriches the entity with AI Asset annotations before passing it to `applyMutation`.

**AND** the enriched entity carries the following annotations:

```yaml
metadata:
  annotations:
    rhdh.io/ai-asset-category: 'mcp-server'
    rhdh.io/ai-asset-version: '1.0.0' # Extracted from MCP server manifest or "unknown"
    rhdh.io/ai-asset-source: 'mcp-registry/<instance-id>'
```

**AND** the annotation enrichment happens synchronously within the entity emission pipeline.

**AND** the enriched entity is logged at DEBUG level for observability.

---

**WHEN** the upstream MCP Registry connector emits an entity that already contains AI Asset annotations:

**THEN** the productization wrapper does NOT overwrite existing annotations.

**AND** the wrapper logs a DEBUG-level message indicating annotations were preserved.

**AND** the wrapper proceeds with the entity unchanged.

---

**WHEN** the enrichment logic fails (unexpected entity structure, annotation serialization error):

**THEN** the wrapper logs a WARNING-level message indicating the enrichment failure.

**AND** the wrapper emits the entity without annotations (degraded mode).

**AND** the warning message includes the entity reference and error details.

**AND** Prometheus metrics track enrichment failure rate.

### Requirement: Version Metadata Extraction

**WHEN** the MCP server manifest includes version metadata:

```json
{
  "name": "filesystem-mcp-server",
  "version": "1.2.3",
  "description": "MCP server for filesystem operations"
}
```

**THEN** the wrapper extracts the version field, normalizes it via `normalizeAIAssetVersion()` (SDK-exported from RHDHPLAN-1507), and populates `rhdh.io/ai-asset-version: "1.2.3"`.

**AND** the wrapper validates the version string is non-empty.

---

**WHEN** the MCP server manifest does NOT include version metadata:

**THEN** the wrapper populates `rhdh.io/ai-asset-version: "unknown"`.

**AND** the wrapper logs a DEBUG-level message indicating missing version metadata.

**AND** the wrapper proceeds with the placeholder version annotation.

---

**WHEN** the MCP server manifest includes invalid version metadata (empty string, malformed semver):

**THEN** the wrapper logs a WARNING-level message indicating invalid version.

**AND** the wrapper populates `rhdh.io/ai-asset-version: "unknown"`.

**AND** the warning message includes the entity reference and invalid version value.

### Requirement: SDK Validation Integration

**WHEN** the enriched entity is passed to the catalog for ingestion:

**THEN** the entity passes through RHDHPLAN-1507's SDK validation layer.

**AND** the SDK validation layer verifies the presence of required AI Asset annotations.

**AND** the SDK validation layer verifies the annotation values conform to the schema (category, version, source).

**AND** validation failures are logged but do NOT block entity ingestion (warn-only mode).

---

**WHEN** the SDK validation layer detects missing or invalid annotations:

**THEN** Prometheus metrics track validation failure rate per annotation field.

**AND** the validation layer logs a WARNING-level message with remediation guidance.

**AND** the entity is ingested despite validation failures (degraded mode).

### Requirement: Annotation Category Constancy

**WHEN** the wrapper enriches an entity emitted by the MCP Registry connector:

**THEN** the wrapper always populates `rhdh.io/ai-asset-category: "mcp-server"`.

**AND** the wrapper does NOT infer or vary the category based on MCP server metadata.

**AND** all entities from the MCP Registry connector share the same category value.

---

**WHEN** the MCP server manifest includes category metadata (hypothetical future scenario):

**THEN** the wrapper ignores the manifest category and uses the fixed value `"mcp-server"`.

**AND** the wrapper logs a DEBUG-level message indicating manifest category was ignored.

### Requirement: Annotation Source Constancy

**WHEN** the wrapper enriches an entity emitted by the MCP Registry connector:

**THEN** the wrapper populates `rhdh.io/ai-asset-source` using the format `mcp-registry/<instance-id>`, where `<instance-id>` is the configuration key under `catalog.providers` (e.g., `mcpRegistry`).

**AND** the source prefix (`mcp-registry`) is constant — it identifies the connector type.

**AND** the instance suffix identifies which connector instance produced the entity.

---

**WHEN** multiple MCP Registry connector instances are configured:

```yaml
catalog:
  providers:
    mcpRegistryPrimary:
      endpoint: https://registry-primary.internal.example.com
    mcpRegistrySecondary:
      endpoint: https://registry-secondary.internal.example.com
```

**THEN** entities from `mcpRegistryPrimary` carry `rhdh.io/ai-asset-source: "mcp-registry/mcpRegistryPrimary"`.

**AND** entities from `mcpRegistrySecondary` carry `rhdh.io/ai-asset-source: "mcp-registry/mcpRegistrySecondary"`.

**AND** the source annotation differentiates connector instances, enabling provenance tracking when an entity exists in multiple registries.

### Requirement: Annotation Enrichment Performance

**WHEN** the wrapper enriches an entity:

**THEN** the enrichment logic completes in under 5ms (synchronous operation).

**AND** the enrichment logic does NOT make network requests (local metadata extraction only).

**AND** the enrichment logic does NOT query external services (SDK validation, cache lookups).

---

**WHEN** the wrapper enriches 1000 entities in a single connector poll cycle:

**THEN** the total enrichment overhead is under 5 seconds (5ms per entity).

**AND** the wrapper does NOT introduce catalog ingestion latency regressions.

**AND** Prometheus metrics track enrichment latency per entity (p50, p95, p99).

### Requirement: Prometheus Metrics for Annotation Enrichment

**WHEN** the wrapper enriches an entity:

**THEN** Prometheus metrics track enrichment success and failure rates.

**AND** metrics include labels for entity kind, entity reference, and enrichment result (success/failure).

---

**WHEN** the wrapper extracts version metadata from the MCP server manifest:

**THEN** Prometheus metrics track version extraction success and failure rates.

**AND** metrics include labels for version value (hashed for cardinality control) and extraction result.

---

**WHEN** the SDK validation layer validates enriched entities:

**THEN** Prometheus metrics track validation success and failure rates per annotation field.

**AND** metrics include labels for annotation field name, validation result, and failure reason.
