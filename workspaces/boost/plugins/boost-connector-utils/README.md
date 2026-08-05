# @red-hat-developer-hub/backstage-plugin-boost-connector-utils

Shared utilities for Boost AI catalog connector entity providers. Provides:

- **CA bundle resolution** — load custom CA certificates from file paths or `$env` references for air-gapped HTTPS
- **Fault isolation** — wrap entity providers to catch crashes without taking down the catalog backend
- **Enable/disable** — guard connector registration based on config
- **Startup validation** — reject empty credentials and invalid endpoint URLs at startup

## Installation

```bash
yarn add @red-hat-developer-hub/backstage-plugin-boost-connector-utils
```

## Usage

### CA Bundle Resolution

Each connector resolves its own Config subtree before calling `loadCaBundle()`:

```typescript
import {
  loadCaBundle,
  createHttpsAgent,
} from '@red-hat-developer-hub/backstage-plugin-boost-connector-utils';

// In your connector's init():
const connectorConfig = config.getConfig('ai-catalog.providers.mcpRegistry');
const caBundle = loadCaBundle(connectorConfig, logger);
const agent = createHttpsAgent(caBundle);

// Use the agent with your HTTP client
const client = axios.create({ httpsAgent: agent });
```

**Config format:**

```yaml
ai-catalog:
  providers:
    mcpRegistry:
      tls:
        # Option 1: Direct file path (K8s Secret mounted as volume)
        caFile: /etc/ssl/certs/custom-ca-bundle.pem

        # Option 2: K8s Secret reference (resolved via $env pattern)
        caSecret:
          $env: MCP_REGISTRY_CA_BUNDLE # Env var containing PEM content
```

**Behavior:**

- Missing file → logs WARN, returns `undefined` (connector continues with system CA)
- Invalid PEM → logs ERROR, returns `undefined`
- Certificate chains (multiple concatenated PEM blocks) → returned as-is
- No `tls` block → returns `undefined` (uses system CA)
- Expired certificates are **not** checked at load time — they surface at TLS handshake time and are caught by the fault isolation wrapper
- `createHttpsAgent(caBundle)` passes `ca` to `https.Agent`, which **replaces** the default Mozilla CA store — concatenate PEMs when both public and private trust are needed

> **Note:** For process-wide CA trust, set `NODE_EXTRA_CA_CERTS` in the container environment. This is outside the scope of per-connector config.

### Fault Isolation

Wrap providers to prevent unhandled rejections from crashing the Node.js process:

```typescript
import {
  createProviderWrapper,
  createSafeRefresh,
} from '@red-hat-developer-hub/backstage-plugin-boost-connector-utils';

// Wrap the provider before registering it
const rawProvider = new McpRegistryEntityProvider(config, logger);
const provider = createProviderWrapper(rawProvider, logger, {
  endpoint: 'https://registry.example.com',
});
catalog.addEntityProvider(provider);

// Wrap refresh callbacks for scheduled tasks
const safeRefresh = createSafeRefresh(
  () => provider.refresh(),
  'mcpRegistry',
  logger,
  { endpoint: 'https://registry.example.com' },
);
scheduler.scheduleTask({ fn: safeRefresh, frequency: { minutes: 10 } });
```

**Error classification:**

The `classifyConnectorError(error)` function classifies errors as retryable or non-retryable:

- **Retryable (transient):** `ECONNREFUSED`, `ECONNRESET`, `ETIMEDOUT`, `EPIPE`, `EAI_AGAIN`, HTTP 429/500/502/503/504
- **Non-retryable (fatal):** HTTP 400/401/403/404, `TypeError`, `SyntaxError`, `ZodError`, TLS certificate errors

Structured error context logged on failure:

```json
{
  "connectorId": "mcpRegistry",
  "endpoint": "https://registry.example.com",
  "errorType": "FetchError",
  "errorMessage": "request to https://registry.example.com failed",
  "retryable": true
}
```

### Enable/Disable Pattern

Guard connector registration in your backend module `init()`:

```typescript
import {
  isConnectorEnabled,
  validateConnectorStartupConfig,
} from '@red-hat-developer-hub/backstage-plugin-boost-connector-utils';

export default createBackendModule({
  pluginId: 'catalog',
  moduleId: 'mcp-registry',
  register(env) {
    env.registerInit({
      deps: {
        catalog: catalogProcessingExtensionPoint,
        config: coreServices.rootConfig,
        logger: coreServices.logger,
      },
      async init({ catalog, config, logger }) {
        const connectorConfig = config.getConfig(
          'ai-catalog.providers.mcpRegistry',
        );

        if (!isConnectorEnabled(connectorConfig)) {
          logger.info('MCP Registry connector is disabled');
          return;
        }

        // Validate credentials and endpoint before registering
        validateConnectorStartupConfig(connectorConfig, {
          credentialFields: ['auth.token'],
          endpointField: 'endpoint',
        });

        const provider = new McpRegistryEntityProvider(config, logger);
        catalog.addEntityProvider(createProviderWrapper(provider, logger));
      },
    });
  },
});
```

**Config:**

```yaml
ai-catalog:
  providers:
    mcpRegistry:
      enabled: true # Default: true if omitted
      endpoint: https://registry.example.com
```

### Startup Validation

`validateConnectorStartupConfig()` validates that:

1. Credential fields are non-empty (should use `{ $env: "ENV_VAR_NAME" }` backed by mounted K8s Secrets)
2. Endpoint URL is valid HTTPS

```typescript
// Throws descriptive error on first validation failure
validateConnectorStartupConfig(connectorConfig, {
  credentialFields: ['auth.clientId', 'auth.clientSecret'],
  endpointField: 'endpoint',
});
```

## API Reference

| Export                                          | Description                                  |
| ----------------------------------------------- | -------------------------------------------- |
| `loadCaBundle(config, logger)`                  | Load CA bundle from connector config subtree |
| `createHttpsAgent(caBundle?)`                   | Create `https.Agent` with custom CA          |
| `createProviderWrapper(provider, logger, ctx?)` | Wrap entity provider with fault isolation    |
| `createSafeRefresh(fn, id, logger, ctx?)`       | Wrap refresh callback with fault isolation   |
| `classifyConnectorError(error)`                 | Classify error as retryable/non-retryable    |
| `isConnectorEnabled(config)`                    | Check if connector is enabled via config     |
| `validateConnectorStartupConfig(config, opts)`  | Validate credentials and endpoint at startup |
| `ConnectorEntityProvider`                       | Minimal EntityProvider-compatible interface  |
| `ConnectorErrorContext`                         | Interface for structured error context       |
| `FaultIsolationContext`                         | Optional endpoint / nextRetryAt for wrappers |
| `ValidateConnectorStartupConfigOptions`         | Options for startup validation               |

## Reference Configuration

See [`workspaces/boost/examples/app-config.connectors.yaml`](../../examples/app-config.connectors.yaml) for a complete reference configuration with all three connectors and an air-gapped deployment variant.
