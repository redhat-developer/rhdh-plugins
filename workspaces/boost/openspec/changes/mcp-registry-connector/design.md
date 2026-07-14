# Design: MCP Registry Connector — Productization & Air-Gapped Support

## Context

The upstream MCP Registry entity provider (RHDHPLAN-393) provides a Backstage catalog provider that polls the public MCP Registry (`registry.modelcontextprotocol.io`) and emits Backstage entities for discovered MCP servers. It assumes internet connectivity and uses the public registry endpoint by default.

Enterprise deployments of Red Hat Developer Hub often run in air-gapped environments or behind corporate proxies with strict egress controls. These deployments require:

- Ability to mirror the MCP Registry internally
- Zero outbound traffic to public endpoints when a mirror is configured
- Support for custom TLS certificate authorities
- Credential management for private/authenticated registries
- Integration with RHDH's AI Asset catalog via standardized annotations

This productization effort wraps the upstream connector with RHDH-specific hardening and air-gapped support, packaged as a standalone RHDH dynamic plugin.

> **RHDHPLAN-1510 Consolidation (2026-07-08):** Epic RHIDP-15315 (OCI Skill Registry Connector) was closed — scope absorbed by RHIDP-15294 (RHDHPLAN-1507). This MCP Registry connector continues under RHIDP-15313. Dependency chain: RHIDP-15316 cross-connector stories (15265 endpoint/creds, 15329 CA bundles) must land before this connector's TLS/auth hardening (RHIDP-15318) can proceed.
>
> **Stakeholder Alignment (2026-07-13):**
>
> - **RHDHPLAN-393 complementary:** This productization wrapper layers on top of RHDHPLAN-393's upstream MCP Registry connector. No ingestion duplication — RHDHPLAN-393 provides core MCP server discovery, this connector adds air-gapped support, credential management, and AI Asset annotation enrichment.
> - **RHDHPLAN-404 dependency:** The upstream RHDHPLAN-393 connector emits API entities with `spec.type: mcp-server` (a recent Backstage addition). This productization wrapper is kind-agnostic — it enriches annotations regardless of entity kind.
> - **MCP resource mapping deferred:** Mapping MCP resources (tools, prompts) as catalog entities is deferred for RHDH 2.1 (Christophe's consent; upstream due diligence pending). This connector focuses on MCP server entity discovery only.

## Goals

- **Air-gapped support** — customers can deploy MCP Registry connector in zero-internet environments using mirrored registries
- **Enterprise TLS** — support custom CA bundles for private registries with non-public certificate authorities
- **Credential management** — Kubernetes Secret-based authentication for private/authenticated registries
- **AI Asset integration** — entities carry RHDH AI Asset annotations for catalog integration and SDK validation
- **Zero regressions** — all upstream connector functionality remains intact
- **Packageability** — connector ships as standalone RHDH dynamic plugin

## Non-Goals

- Modifying the upstream MCP Registry entity provider's core logic (RHDHPLAN-393)
- Building a mirror registry server (customers bring their own)
- Implementing MCP server validation or health checks (covered in separate epic)
- Changing the MCP Registry API contract
- Supporting multiple mirror endpoints per connector instance
- Implementing registry authentication beyond K8s Secret-based credentials

## Decisions

### Decision 1: Productization Wrapper vs. Fork

**Decision:** Wrap the upstream connector as a Backstage backend module, intercepting entity emission to add annotations and configuration hooks for mirror endpoint/TLS/auth.

**Rationale:**

- Preserves upgrade path to future upstream changes
- Avoids code duplication
- Maintains clean separation between upstream connector logic and RHDH-specific productization
- Allows RHDH to ship the wrapper while contributing generic improvements upstream

**Alternative considered:** Fork the upstream connector and embed productization logic directly.

**Rejected because:** Breaks upgrade path, creates maintenance burden, loses upstream improvements.

**Implementation pattern:**

```typescript
// plugins/boost-backend-module-mcp-registry/src/module.ts
export const mcpRegistryModule = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'mcp-registry-rhdh',
  register(env) {
    env.registerInit({
      deps: {
        catalog: catalogProcessingExtensionPoint,
        config: coreServices.rootConfig,
        logger: coreServices.logger,
        cacheService: coreServices.cache,
      },
      async init({ catalog, config, logger, cacheService }) {
        // Wrap upstream MCP Registry provider
        const upstreamProvider = createMcpRegistryProvider(config, logger);

        // Intercept entity emission
        const wrappedProvider = new RhdhMcpRegistryProviderWrapper(
          upstreamProvider,
          config,
          logger,
          cacheService,
        );

        catalog.addEntityProvider(wrappedProvider);
      },
    });
  },
});
```

The wrapper intercepts `getProviderName()` and `connect()` to inject mirror endpoint configuration, TLS settings, and annotation enrichment.

### Decision 2: Mirror Endpoint Configuration via app-config

**Decision:** Use `catalog.providers.mcpRegistry.endpoint` in app-config to override the public registry endpoint. When unset, fall back to `registry.modelcontextprotocol.io`.

**Rationale:**

- Follows Backstage app-config conventions
- Allows per-environment overrides (dev, staging, production)
- Explicit opt-in to mirror endpoint usage
- Simple URL validation at startup

**Alternative considered:** Environment variable-based override (`MCP_REGISTRY_ENDPOINT`).

**Rejected because:** Less flexible than app-config, harder to scope to specific connector instances in multi-tenant deployments.

**Configuration schema:**

```yaml
catalog:
  providers:
    mcpRegistry:
      # Optional mirror endpoint (falls back to registry.modelcontextprotocol.io)
      endpoint: https://registry.internal.example.com

      # Optional TLS configuration
      tls:
        ca: /etc/ssl/certs/custom-ca-bundle.crt # Path to CA bundle

      # Optional authentication
      auth:
        secretRef: mcp-registry-credentials # K8s Secret containing credentials
```

**Validation rules:**

- `endpoint` must be a valid HTTPS URL
- `tls.ca` must be a readable file path
- `auth.secretRef` must reference an existing Kubernetes Secret (validated at runtime)

**Zero-internet guarantee:**

- When `endpoint` is set, the connector NEVER falls back to the public endpoint
- Integration test validates no outbound traffic to `registry.modelcontextprotocol.io` when mirror is configured
- Network layer monitoring confirms DNS resolution and HTTP requests target only the configured mirror endpoint

### Decision 3: CA Bundle Loading via Shared Utility (RHIDP-15316)

**Decision:** Use the shared `loadCaBundle()` utility from RHIDP-15316's cross-connector infrastructure to load custom CA bundles.

**Rationale:**

- Avoids duplicating CA bundle loading logic across connectors
- Benefits from shared error handling, validation, and monitoring
- Simplifies testing (shared test suite)
- Consistent behavior across all AI platform connectors

**Alternative considered:** Inline CA bundle loading in the MCP Registry connector.

**Rejected because:** Code duplication, inconsistent error handling, harder to maintain.

**Integration pattern:**

```typescript
import { loadCaBundle } from '@boost/connector-utils';

const caBundle = loadCaBundle(config, 'mcpRegistry');

// Pass CA bundle to HTTP client
const httpsAgent = new https.Agent({
  ca: caBundlePEM,
  rejectUnauthorized: true, // Always enforce TLS verification
});
```

**Error handling:**

- Invalid CA bundle path: log warning, fall back to system CA bundle
- Unreadable CA bundle file: log warning, fall back to system CA bundle
- Malformed CA bundle PEM: log warning, fall back to system CA bundle

**Dependency:**

- `@boost/connector-utils` package exports `loadCaBundle()` utility
- Shared utility handles file reading, PEM validation, and error logging

### Decision 4: Annotation Enrichment Pipeline After Entity Emission

**Decision:** Enrich entities with AI Asset annotations after the upstream connector emits them, before `applyMutation` sends them to the catalog.

**Rationale:**

- Preserves upstream connector logic
- Centralized annotation enrichment in the wrapper layer
- Easy to test (unit tests can verify annotation presence)
- Decoupled from upstream connector changes

**Alternative considered:** Modify upstream connector to emit annotations directly.

**Rejected because:** Breaks upgrade path, couples RHDH-specific logic to upstream connector.

**Annotation scheme (from RHDHPLAN-1507's `ai-catalog-entity-model`):**

```yaml
metadata:
  annotations:
    # AI Asset category (always "mcp-server" for MCP Registry entities)
    rhdh.io/ai-asset-category: mcp-server

    # Version metadata (extracted from MCP server manifest if available)
    rhdh.io/ai-asset-version: '1.0.0' # or "unknown" if not available

    # Source identifier (always "mcp-registry" for this connector)
    rhdh.io/ai-asset-source: mcp-registry
```

**Enrichment logic:**

```typescript
function enrichWithAiAssetAnnotations(entity: Entity): Entity {
  return {
    ...entity,
    metadata: {
      ...entity.metadata,
      annotations: {
        ...entity.metadata.annotations,
        'rhdh.io/ai-asset-category': 'mcp-server',
        'rhdh.io/ai-asset-version': extractVersion(entity) || 'unknown',
        'rhdh.io/ai-asset-source': 'mcp-registry',
      },
    },
  };
}
```

**SDK validation integration:**

- Enriched entities pass through RHDHPLAN-1507's SDK validation layer before catalog ingestion
- Invalid annotations trigger validation warnings but don't block ingestion
- Validation metrics track annotation completeness and correctness

## Risks

### Risk 1: Upstream Connector API Changes

**Likelihood:** Medium  
**Impact:** High  
**Mitigation:**

- Monitor upstream RHDHPLAN-393 for breaking changes
- Maintain wrapper abstraction layer to isolate upstream API changes
- Automated tests against multiple upstream connector versions
- Document required upstream connector version in package.json peer dependencies

### Risk 2: Mirror Registry Availability

**Likelihood:** Low  
**Impact:** High  
**Mitigation:**

- No fallback to public registry when mirror is configured (fail-closed)
- Health check endpoint for mirror registry availability monitoring
- Clear error messages when mirror is unreachable
- Documentation includes mirror registry setup and monitoring guidance

### Risk 3: CA Bundle Invalidation

**Likelihood:** Low  
**Impact:** Medium  
**Mitigation:**

- Graceful degradation: invalid CA bundle logs warning, falls back to system CA bundle
- Runtime CA bundle validation on connector startup
- Prometheus metrics for CA bundle validation failures
- Clear error messages with remediation steps

### Risk 4: Credential Secret Rotation

**Likelihood:** Medium  
**Impact:** Medium  
**Mitigation:**

- Cache credential Secret values with TTL (default 5 minutes)
- Automatic retry on credential failure
- Prometheus metrics for auth failures
- Documentation includes Secret rotation procedures

### Risk 5: Annotation Schema Divergence

**Likelihood:** Low  
**Impact:** Low  
**Mitigation:**

- Shared annotation schema defined in RHDHPLAN-1507's `ai-catalog-entity-model`
- SDK validation enforces annotation schema compliance
- Automated tests verify annotation presence and correctness
- Version annotation schema in `@boost/plugin-boost-common` package
