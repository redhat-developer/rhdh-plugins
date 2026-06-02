# Design: Pluggable AI Platform Architecture

## Context

Boost implements the provider abstraction as modular RHDH dynamic plugins from the start, informed by augment's experience. Augment had a clean provider abstraction design (`AgenticProvider` interface, extension point registration, hot-swap lifecycle) but locked everything inside one monolithic plugin with 17 raw `Map<>` caches, 18+ provider ID string checks, and 559 lines of Kagenti-specific types in the common package. Boost avoids all of these patterns by building modular, capability-gated, and cacheService-backed from day one.

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
- Per-user token exchange (covered in security-safety-governance change)

## Decisions

### Decision 1: serviceRef lives in augment-common

The `augmentAiProviderServiceRef` is exported from `@augment/plugin-augment-common` alongside the `AgenticProvider` interface types. This allows both backend consumers and frontend type consumers to reference the interface from a single package without depending on the full backend.

```typescript
// plugins/augment-common/src/services.ts
import { createServiceRef } from '@backstage/backend-plugin-api';
import type { AgenticProvider } from './types';

export const augmentAiProviderServiceRef = createServiceRef<AgenticProvider>({
  id: 'augment.ai-provider',
  scope: 'plugin',
});
```

The core `augment-backend` plugin registers the default factory via `createServiceFactory` that resolves to the `ProviderManager`'s active provider.

### Decision 2: Providers as backend modules, not separate plugins

Each provider is a `createBackendModule` (not `createBackendPlugin`), because providers extend the augment plugin — they don't stand alone. Module IDs: `llamastack`, `kagenti`.

This follows the Backstage pattern established by `plugin-catalog-backend-module-*` and `plugin-kubernetes-backend-module-*`.

### Decision 3: cacheService replaces ALL provider-internal Map<> caches

17 caches identified across the codebase; only 2 migrated to date. All providers must use `cacheService` consistently — no asymmetry between Kagenti (cacheService) and Llama Stack (raw Map). Provider modules depend on `coreServices.cache` and use `cache.withOptions()` for namespace isolation:

| Current Cache                      | Location                         | Current State            | Migration Target                                                    |
| ---------------------------------- | -------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| RuntimeConfigResolver              | `services/`                      | raw Map, 30s TTL         | `cache.withOptions({ defaultTtl: '30s' })` + immediate invalidation |
| KagentiAgentCardCache              | `providers/kagenti/`             | **migrated ✓**           | —                                                                   |
| KagentiProvider.\_modelsCache      | `providers/kagenti/`             | **migrated ✓**           | —                                                                   |
| ResponsesApiProvider.\_modelsCache | `providers/llamastack/`          | raw object               | `cache.withOptions({ defaultTtl: '60s' })` — eliminate asymmetry    |
| McpAuthService tokens              | `providers/llamastack/auth/`     | raw Map                  | `cache.set(key, token, { ttl: expiresIn })`                         |
| KeycloakTokenManager               | `providers/kagenti/client/`      | raw Map                  | `cache.set(key, token, { ttl: expiresIn })`                         |
| BackendToolExecutor                | `providers/responses-api/tools/` | raw Map, unbounded       | `cache.withOptions({ defaultTtl: '5m' })`                           |
| ConversationRegistry               | `providers/responses-api/`       | raw Map, no TTL, 10k max | `cache.withOptions({ defaultTtl: '24h' })`                          |
| DocumentSyncService                | `providers/responses-api/`       | raw Map, no TTL, 10k max | cache with no expiry (content hash tracking)                        |
| KagentiProvider session maps       | `providers/kagenti/`             | raw Map, no TTL, 10k max | `cache.withOptions()` with session TTL                              |
| ClientManager                      | `providers/llamastack/`          | raw Map                  | identity-keyed cache                                                |
| EmbeddingCache (toolscope)         | `services/toolscope/`            | raw Map, unbounded       | Via injectable `CacheAdapter`                                       |
| SessionCache (toolscope)           | `services/toolscope/`            | raw Map, 1h TTL, 1k max  | Via injectable `CacheAdapter`                                       |
| ConfigResolutionService            | `providers/llamastack/config/`   | wrapper                  | Delegates to migrated RuntimeConfigResolver                         |
| conversationAgents                 | `OpenAIAgentsOrchestrator.ts`    | new raw Map              | session-scoped cache                                                |
| rateLimiter store                  | `middleware/rateLimiter.ts`      | new raw Map              | per-window cache                                                    |
| BackendApprovalStore.pending       | `responses-api/tools/`           | new raw Map              | request-scoped cache                                                |

Backstage's cache layer handles max-size eviction and Redis backing in production.

### Decision 4: Capability checks via ProviderCapabilities

Frontend replaces all `providerId === 'kagenti'` checks with capability queries. The `ProviderCapabilities` interface already exists and is partially used. The migration:

```typescript
// Before (coupled to provider identity)
const isFullProvider = liveStatus?.providerId === 'kagenti';

// After (coupled to capabilities)
const hasAgentCatalog = capabilities?.agentCatalog === true;
const hasNamespaceScoping = capabilities?.namespaceScoping === true;
```

### Decision 5: Kagenti-specific types extracted from augment-common

Currently 559 lines (60+ interfaces) of Kagenti-only types are exported from `augment-common`, violating the type package boundary. These must be moved to the Kagenti provider module, with only the shared `AgenticProvider` interface and conversation types remaining in `augment-common`.

## Risks

- **Cache key collisions:** Mitigated by using `cache.withOptions()` which namespace-scopes keys per plugin/module.
- **Provider module interdependency:** Provider modules must not import from each other. Shared utilities live in `augment-common` or standalone packages. Boost enforces this from the start.
