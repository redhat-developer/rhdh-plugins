# Design: Cross-Connector Shared Infrastructure

## Context

Boost builds three AI catalog connectors (MCP Registry, RHOAI, OCI Skill Registry) as Backstage entity providers. Each connector fetches AI entities from an external platform and surfaces them in the Backstage catalog. Air-gapped deployments require custom CA bundles for HTTPS verification. Connector failures must not crash the catalog backend or corrupt other entities.

## Goals

- Shared utility package used by all connector backend modules
- Per-connector CA bundle resolution with graceful failure handling
- Fault isolation: one connector crash never affects other connectors or non-AI entities
- Enable/disable pattern consistent across all three connectors
- Structured error logging with actionable context for debugging air-gapped connectivity

## Non-Goals

- Implementing the connectors themselves (covered in separate changes: MCP Registry, RHOAI, OCI Skill)
- Defining entity schemas for AI entities (covered in `ai-catalog-entity-model` change)
- Managing connector-specific authentication (e.g., OCI pull secrets, Kubeflow tokens, MCP auth)
- Modifying Backstage's core entity provider lifecycle

## Decisions

### Decision 1: Shared utility package — not a Backstage plugin

The shared infrastructure lives in a standalone utility package (`@boost/connector-utils`) published as a Node.js library. It is NOT a Backstage plugin or backend module — just a utility package importable by all connector backend modules.

**Why:** The three connectors are independent backend modules. Each module depends on the shared utilities but operates independently. A shared plugin would create unnecessary coupling and module-to-module dependencies. A utility package provides clear boundaries: connectors import functions, not Backstage extension points.

**Package structure:**

```
plugins/boost-connector-utils/
├── package.json               # @boost/connector-utils
├── src/
│   ├── index.ts              # Exports: loadCaBundle, createProviderWrapper, isConnectorEnabled
│   ├── ca-bundle.ts          # CA bundle loading logic
│   ├── fault-isolation.ts    # Provider wrapper with error handling
│   └── config.ts             # Enable/disable guard
└── README.md
```

**Import example:**

```typescript
// In boost-backend-module-mcp-registry
import {
  loadCaBundle,
  createProviderWrapper,
  isConnectorEnabled,
} from '@boost/connector-utils';
```

### Decision 2: CA bundle loading strategy

CA bundles are loaded from mounted file paths or K8s Secret references. The config schema supports both patterns:

```yaml
catalog:
  providers:
    mcpRegistry:
      tls:
        # Option 1: Direct file path (K8s Secret mounted as volume)
        caFile: /etc/ssl/certs/custom-ca-bundle.pem

        # Option 2: K8s Secret reference (resolved via $env: pattern)
        caSecret:
          $env: MCP_REGISTRY_CA_BUNDLE # Environment variable containing PEM content
```

**Function signature:**

```typescript
function loadCaBundle(config: Config, connectorId: string): Buffer | undefined;
```

**Behavior:**

- Reads `catalog.providers.<connectorId>.tls.caFile` or `catalog.providers.<connectorId>.tls.caSecret`
- Returns `Buffer` containing PEM-encoded CA certificate(s) for `https.Agent` consumption
- Handles missing CA file: log warning at INFO level, return `undefined` (don't crash provider)
- Handles invalid CA certificate: log error with certificate details (expiry, issuer), return `undefined`
- Supports CA certificate chains (multiple PEM blocks concatenated)

**Why graceful failure:** Air-gapped environments may have partial CA configuration during initial setup. The connector should start (with degraded HTTPS verification) rather than crash. Structured logging provides actionable debugging context.

**Integration with HTTP client:**

```typescript
const caBundle = loadCaBundle(config, 'mcpRegistry');
const agent = caBundle ? new https.Agent({ ca: caBundle }) : undefined;

const client = axios.create({ httpsAgent: agent });
```

### Decision 3: Fault isolation scope — NODE PROCESS isolation, not entity data isolation

Backstage already provides entity data isolation per provider via entity buckets. This change adds NODE PROCESS-level isolation to prevent one provider's unhandled rejection from crashing the entire catalog backend Node.js process.

**Backstage's built-in entity bucket isolation:**

- Each entity provider owns a unique bucket of entities (identified by provider ID)
- One provider's entity mutations never affect another provider's entities
- Catalog backend tracks entity ownership and schedules per-provider refresh tasks

**Boost's additional process-level isolation:**

- Wrap each provider's `connect()` and scheduled refresh callback in try/catch to catch unhandled promise rejections
- Log structured error with connector context
- Allow catalog backend to continue operating even if one connector crashes

**Implementation:**

```typescript
// In boost-connector-utils/src/fault-isolation.ts
export function createProviderWrapper(
  provider: EntityProvider,
  logger: LoggerService,
): EntityProvider {
  return {
    getProviderName: () => provider.getProviderName(),
    async connect(connection: EntityProviderConnection): Promise<void> {
      try {
        await provider.connect(connection);
      } catch (error) {
        logger.error('Connector connect() failed', {
          connectorId: provider.getProviderName(),
          errorType: error.constructor.name,
          errorMessage: error.message,
          stack: error.stack,
        });
        // Don't rethrow — allow other providers to continue
      }
    },
  };
}

// Wrap the scheduled task callback for refresh cycles
export function createSafeRefresh(
  refreshFn: () => Promise<void>,
  connectorId: string,
  logger: LoggerService,
): () => Promise<void> {
  return async () => {
    try {
      await refreshFn();
    } catch (error) {
      logger.error('Connector refresh failed', {
        connectorId,
        errorType: error.constructor.name,
        errorMessage: error.message,
        stack: error.stack,
      });
    }
  };
}
```

**Why this is defensive, not replacing Backstage's isolation:** Backstage's entity bucket isolation handles the happy path. Process-level isolation defends against unexpected crashes (network timeouts, malformed API responses, unhandled exceptions in third-party HTTP clients). Wrapping both `connect()` and the refresh callback covers the two failure points in the Backstage entity provider lifecycle.

### Decision 4: Enable/disable pattern

Each connector checks `catalog.providers.<connectorId>.enabled` at backend module initialization. Disabled connectors are never registered — they produce zero resource usage.

**Config schema:**

```yaml
catalog:
  providers:
    mcpRegistry:
      enabled: true # Default: true if omitted
      endpoint: https://mcp-registry.example.com

    rhoai:
      enabled: false # Disabled — never registered
```

**Registration guard:**

```typescript
// In backend module's init()
export default createBackendModule({
  pluginId: 'catalog',
  moduleId: 'mcp-registry',
  register(env) {
    env.registerInit({
      deps: { catalog: catalogServiceRef, config: coreServices.rootConfig },
      async init({ catalog, config }) {
        if (!isConnectorEnabled(config, 'mcpRegistry')) {
          env.logger.info('MCP Registry connector is disabled');
          return; // Exit early — never call catalog.addEntityProvider()
        }

        const provider = new McpRegistryEntityProvider(config, env.logger);
        catalog.addEntityProvider(provider);
      },
    });
  },
});
```

**Why check at registration time:** Disabled connectors should produce zero CPU/memory overhead. Checking at module init time prevents task scheduler creation, HTTP client initialization, and cache allocation.

### Decision 5: Structured error logging

Each connector logs failures with consistent fields for actionable debugging. Uses Backstage's `LoggerService` for structured JSON output.

**Error context interface:**

```typescript
interface ConnectorErrorContext {
  connectorId: string; // Provider identifier (e.g., 'mcpRegistry')
  endpoint: string; // External API endpoint that failed
  errorType: string; // Error constructor name (e.g., 'FetchError', 'TimeoutError')
  errorMessage: string; // Human-readable error message
  retryable: boolean; // Whether this error is transient (retry recommended)
  nextRetryAt?: string; // ISO timestamp of next scheduled retry
}
```

**Logging pattern:**

```typescript
logger.error('Failed to fetch MCP tools from registry', {
  connectorId: 'mcpRegistry',
  endpoint: 'https://mcp-registry.example.com/api/v1/tools',
  errorType: error.constructor.name,
  errorMessage: error.message,
  retryable: isRetryableError(error),
  nextRetryAt: nextRetryTime.toISOString(),
});
```

**Why structured logging matters:** Air-gapped environments have constrained connectivity. Structured error logs enable operators to diagnose TLS handshake failures, CA certificate mismatches, and network routing issues without attaching a debugger.

## Risks

- **CA bundle path misconfiguration:** Mitigated by graceful failure (log warning, return undefined) and detailed error messages with file path context.
- **Connector-specific auth leaking into shared utilities:** Mitigated by keeping auth logic in each connector module. Shared utilities only handle CA bundles, not API tokens or pull secrets.
- **Process-level isolation masking real bugs:** Mitigated by structured error logging with stack traces. Operators can diagnose root causes from logs without losing crash information.
