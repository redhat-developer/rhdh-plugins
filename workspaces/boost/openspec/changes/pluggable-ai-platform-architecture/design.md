# Design: Pluggable AI Platform Architecture

## Context

Boost implements the provider abstraction as modular RHDH dynamic plugins from the start. The Augment reference prototype had a clean provider abstraction design (`AgenticProvider` interface, extension point registration, hot-swap lifecycle) but locked everything inside one monolithic plugin. Boost avoids this by building modular, capability-gated, and `cacheService`-backed from day one.

## Goals

- Cross-plugin AI provider consumption via Backstage `serviceRef` from day one
- Each provider as an independent RHDH dynamic plugin from day one
- All caches use Backstage `cacheService` from day one
- No cross-provider coupling — providers are isolated modules
- Capability-based feature gating in frontend — no provider ID string checks

## Non-Goals

- Changing the `AgenticProvider` interface contract
- Modifying chat interaction behavior or message rendering
- Rewriting the ADK orchestration library
- Creating catalog entities for models/agents (covered in agent-creation-discovery change)
- Kagenti service-account auth (covered in security-safety-governance change — OAuth2 Client Credentials Grant adopted)

## Decisions

### Decision 1: serviceRef lives in boost-node, types live in boost-common

The `boostAiProviderServiceRef` is exported from `boost-node` (`backstage.role: node-library`), not `boost-common`. The `AgenticProvider` interface types remain in `boost-common` (`backstage.role: common-library`).

This follows the Backstage convention established by the catalog plugin family:

| Package                 | Role             | Contains                                    |
| ----------------------- | ---------------- | ------------------------------------------- |
| `plugin-catalog-common` | `common-library` | Types, permissions — no backend API imports |
| `plugin-catalog-node`   | `node-library`   | `catalogServiceRef`, extension points       |

A `common-library` package must be safe for browser bundling. `createServiceRef` is a runtime value from `@backstage/backend-plugin-api` — importing it into a `common-library` package forces the bundler to pull in the entire backend API, which fails in browser environments. Backstage's CLI enforces this role boundary.

```typescript
// plugins/boost-node/src/services.ts
import { createServiceRef } from '@backstage/backend-plugin-api';
import type { AgenticProvider } from '@boost/plugin-boost-common';

export const boostAiProviderServiceRef = createServiceRef<AgenticProvider>({
  id: 'boost.ai-provider',
  scope: 'plugin',
});
```

The dependency graph:

```
boost-common (common-library)  ←──  boost-node (node-library)  ←──  boost-backend
     │                                        ↑
     │                                   boost-backend-module-llamastack
     │                                   boost-backend-module-kagenti
     ↓
boost-frontend (imports types only)
```

`boost-common` exports: `AgenticProvider`, `ProviderDescriptor`, `ProviderCapabilities`, `NormalizedStreamEvent`, conversation types, permission definitions.

`boost-node` exports: `boostAiProviderServiceRef`, `boostProviderExtensionPoint`, and re-exports types from `boost-common` for backend convenience.

The core `boost-backend` plugin registers the default factory via `createServiceFactory` that resolves to the `ProviderManager`'s active provider.

### Decision 2: Providers as backend modules, not separate plugins

Each provider is a `createBackendModule` (not `createBackendPlugin`), because providers extend the boost plugin — they don't stand alone. Module IDs: `llamastack`, `kagenti`.

This follows the Backstage pattern established by `plugin-catalog-backend-module-*` and `plugin-kubernetes-backend-module-*`.

### Decision 3: All caches use Backstage cacheService

All provider caches use `cacheService` from day one — no raw `Map<>` caches. Provider modules depend on `coreServices.cache` and use `cache.withOptions()` for namespace isolation. The full cache inventory (informed by the 17 cache use cases identified in the Augment analysis):

| Cache Use Case              | Module/Location         | cacheService Configuration                                          |
| --------------------------- | ----------------------- | ------------------------------------------------------------------- |
| RuntimeConfigResolver       | core `boost-backend`    | `cache.withOptions({ defaultTtl: '30s' })` + immediate invalidation |
| Agent card data             | `kagenti` module        | `cache.withOptions({ defaultTtl: '5m' })`                           |
| Model lists (per provider)  | each provider module    | `cache.withOptions({ defaultTtl: '60s' })`                          |
| MCP auth tokens             | `llamastack` module     | `cache.set(key, token, { ttl: expiresIn })`                         |
| Keycloak tokens             | `kagenti` module        | `cache.set(key, token, { ttl: expiresIn })`                         |
| Tool schema cache           | `responses-api` toolkit | `cache.withOptions({ defaultTtl: '5m' })`                           |
| Conversation registry       | core `boost-backend`    | `cache.withOptions({ defaultTtl: '24h' })`                          |
| Document sync hashes        | core `boost-backend`    | cache with no expiry (content hash tracking)                        |
| Provider session maps       | each provider module    | `cache.withOptions()` with session TTL                              |
| Client manager              | `llamastack` module     | identity-keyed cache                                                |
| Embedding cache (toolscope) | `@boost/toolscope`      | Via injectable `CacheAdapter`                                       |
| Session cache (toolscope)   | `@boost/toolscope`      | Via injectable `CacheAdapter`                                       |
| Config resolution           | core `boost-backend`    | Delegates to RuntimeConfigResolver cache (single layer)             |
| Conversation-agent maps     | core `boost-backend`    | session-scoped cache                                                |
| Rate limiter state          | core `boost-backend`    | per-window cache                                                    |
| HITL approval pending state | `responses-api` toolkit | request-scoped cache                                                |

Backstage's cache layer handles max-size eviction and Redis backing in production.

### Decision 4: Capability checks via ProviderCapabilities

Frontend uses capability queries instead of provider identity checks:

```typescript
// Capability-based (what boost implements)
const hasAgentCatalog = capabilities?.agentCatalog === true;
const hasNamespaceScoping = capabilities?.namespaceScoping === true;
```

### Decision 5: Provider-specific types stay in their modules

Provider-specific types (e.g., Kagenti-specific interfaces) live in their respective provider modules. Only shared interfaces (`AgenticProvider`, `ProviderDescriptor`, `ProviderCapabilities`, conversation types, `NormalizedStreamEvent`) live in `boost-common`. The `boostAiProviderServiceRef` and `boostProviderExtensionPoint` live in `boost-node`.

## Risks

- **Cache key collisions:** Mitigated by using `cache.withOptions()` which namespace-scopes keys per plugin/module.
- **Provider module interdependency:** Provider modules must not import from each other. Shared utilities live in `boost-common` or `boost-node`, and standalone packages. Boost enforces this from the start.
