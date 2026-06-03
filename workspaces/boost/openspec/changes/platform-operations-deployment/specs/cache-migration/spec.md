# Operational Caching via Backstage cacheService

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

All operational caches use Backstage `cacheService` from day one — no raw `Map<>` caches. This provides Redis-backed caching in production, consistent TTL semantics, and multi-instance safety. The cache inventory below is derived from augment's 17-cache analysis to ensure boost covers all the same operational caching needs with proper architecture.

NOTE: Provider-specific caches (#2-#7) are covered in the platform-architecture change. Catalog entity candidate caches are covered in the agent-creation-discovery change. This spec covers the remaining operational caches (#1, #8-#14) plus 3 new caches identified in the May 26 analysis (#15-#17).

**Full cache inventory (17 caches, 2 migrated, 15 remaining):**

| #   | Cache                              | Location                       | Status          | Owner            |
| --- | ---------------------------------- | ------------------------------ | --------------- | ---------------- |
| 1   | RuntimeConfigResolver              | services/                      | **This spec**   | Platform ops     |
| 2   | KagentiAgentCardCache              | providers/kagenti/             | **Migrated ✓**  | Platform arch    |
| 3   | KagentiProvider.\_modelsCache      | providers/kagenti/             | **Migrated ✓**  | Platform arch    |
| 4   | ResponsesApiProvider.\_modelsCache | providers/llamastack/          | Platform arch   | Platform arch    |
| 5   | McpAuthService tokens              | providers/llamastack/auth/     | Platform arch   | Platform arch    |
| 6   | KeycloakTokenManager               | providers/kagenti/client/      | Platform arch   | Platform arch    |
| 7   | BackendToolExecutor                | providers/responses-api/tools/ | Platform arch   | Platform arch    |
| 8   | ConversationRegistry               | providers/responses-api/       | **This spec**   | Platform ops     |
| 9   | DocumentSyncService                | providers/responses-api/       | **This spec**   | Platform ops     |
| 10  | KagentiProvider session maps       | providers/kagenti/             | **This spec**   | Platform ops     |
| 11  | ClientManager                      | providers/llamastack/          | **This spec**   | Platform ops     |
| 12  | EmbeddingCache (toolscope)         | services/toolscope/            | Agent discovery | Via CacheAdapter |
| 13  | SessionCache (toolscope)           | services/toolscope/            | Agent discovery | Via CacheAdapter |
| 14  | ConfigResolutionService            | providers/llamastack/config/   | **This spec**   | Platform ops     |
| 15  | conversationAgents                 | OpenAIAgentsOrchestrator.ts    | **This spec**   | Platform ops     |
| 16  | rateLimiter store                  | middleware/rateLimiter.ts      | **This spec**   | Platform ops     |
| 17  | BackendApprovalStore.pending       | responses-api/tools/           | **This spec**   | Platform ops     |

## ADDED Requirements

### Requirement: RuntimeConfigResolver Caching

The highest-traffic cache uses Backstage cacheService.

#### Scenario: Config cache uses cacheService

- **WHEN** `RuntimeConfigResolver` caches the merged effective config
- **THEN** it uses `coreServices.cache` with `cache.set('effective-config', value, { ttl: '30s' })`
- **AND** immediate invalidation on write is preserved via `cache.delete('effective-config')`
- **AND** in production with Redis, this cache is shared across multiple backend instances

### Requirement: Conversation and Session Caching

Session correlation and conversation maps use cacheService.

#### Scenario: ConversationRegistry uses cacheService

- **WHEN** `ConversationRegistry` maps response IDs to conversation IDs (currently cache #8, no TTL, max 10,000)
- **THEN** it uses `coreServices.cache` with a reasonable TTL (e.g., 24h for conversation mapping)
- **AND** max-size eviction is handled by the cache backend (no manual tracking)

#### Scenario: Kagenti session maps use cacheService

- **WHEN** `KagentiProvider` correlates sessions (currently cache #10, no TTL, max 10,000)
- **THEN** it uses `coreServices.cache` with a reasonable TTL
- **AND** multi-instance safety is achieved via Redis backing

### Requirement: Document Sync Hash Caching

Content hashes for change detection use cacheService.

#### Scenario: DocumentSyncService uses cacheService

- **WHEN** `DocumentSyncService` tracks content hashes for change detection (currently cache #9, no TTL, max 10,000)
- **THEN** it uses `coreServices.cache` with no expiry (or very long TTL)
- **AND** hashes are shared across instances for consistent sync behavior

### Requirement: Client and Config Service Caching

Singleton client instances and config wrappers use cacheService.

#### Scenario: ClientManager uses cacheService

- **WHEN** `ClientManager` caches HTTP client instances (currently cache #11, identity-based, max 1)
- **THEN** it uses `coreServices.cache` for client instance caching
- **AND** identity-based keying is preserved

#### Scenario: ConfigResolutionService delegates to RuntimeConfigResolver cache

- **WHEN** `ConfigResolutionService` wraps RuntimeConfigResolver (currently cache #14)
- **THEN** it delegates entirely to the migrated RuntimeConfigResolver cache
- **AND** the duplicate wrapper cache is eliminated
