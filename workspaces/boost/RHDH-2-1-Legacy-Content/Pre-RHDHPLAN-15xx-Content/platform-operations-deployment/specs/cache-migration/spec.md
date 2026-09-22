# Operational Caching via Backstage cacheService

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

All operational caches use Backstage `cacheService` from day one — no raw `Map<>` caches. This provides Redis-backed caching in production, consistent TTL semantics, and multi-instance safety. The cache inventory below covers all operational caching needs identified from the Augment reference prototype analysis.

NOTE: Provider-specific caches are covered in the platform-architecture change. Catalog entity caches are covered in the agent-creation-discovery change. This spec covers the core operational caches.

**Cache inventory (boost operational caches):**

| Cache Use Case                     | Module/Location         | cacheService Configuration                                          |
| ---------------------------------- | ----------------------- | ------------------------------------------------------------------- |
| RuntimeConfigResolver              | core `boost-backend`    | `cache.withOptions({ defaultTtl: '30s' })` + immediate invalidation |
| ConversationRegistry               | core `boost-backend`    | `cache.withOptions({ defaultTtl: '24h' })`                          |
| DocumentSyncService content hashes | core `boost-backend`    | cache with no expiry (content hash tracking)                        |
| Provider session maps              | each provider module    | `cache.withOptions()` with session TTL                              |
| ClientManager                      | `llamastack` module     | identity-keyed cache                                                |
| Config resolution                  | core `boost-backend`    | Delegates to RuntimeConfigResolver (single layer, no wrapper)       |
| Conversation-agent maps            | core `boost-backend`    | session-scoped cache                                                |
| Rate limiter state                 | core `boost-backend`    | per-window cache                                                    |
| HITL approval pending state        | `responses-api` toolkit | request-scoped cache                                                |

## ADDED Requirements

### Requirement: RuntimeConfigResolver Caching

The highest-traffic cache MUST use Backstage cacheService.

#### Scenario: Config cache uses cacheService

- **WHEN** `RuntimeConfigResolver` caches the merged effective config
- **THEN** it uses `coreServices.cache` with `cache.set('effective-config', value, { ttl: '30s' })`
- **AND** immediate invalidation on write is provided via `cache.delete('effective-config')`
- **AND** in production with Redis, this cache is shared across multiple backend instances

### Requirement: Conversation and Session Caching

Session correlation and conversation maps MUST use cacheService.

#### Scenario: ConversationRegistry uses cacheService

- **WHEN** `ConversationRegistry` maps response IDs to conversation IDs
- **THEN** it uses `coreServices.cache` with a 24h TTL
- **AND** max-size eviction is handled by the cache backend

#### Scenario: Provider session maps use cacheService

- **WHEN** a provider correlates sessions
- **THEN** it uses `coreServices.cache` with an appropriate session TTL
- **AND** multi-instance safety is achieved via Redis backing

### Requirement: Document Sync Hash Caching

Content hashes for change detection MUST use cacheService.

#### Scenario: DocumentSyncService uses cacheService

- **WHEN** `DocumentSyncService` tracks content hashes for change detection
- **THEN** it uses `coreServices.cache` with no expiry (or very long TTL)
- **AND** hashes are shared across instances for consistent sync behavior

### Requirement: Client and Config Service Caching

Singleton client instances and config services MUST use cacheService.

#### Scenario: ClientManager uses cacheService

- **WHEN** `ClientManager` caches HTTP client instances
- **THEN** it uses `coreServices.cache` for client instance caching
- **AND** identity-based keying is preserved

#### Scenario: Config resolution uses a single cache layer

- **WHEN** config resolution is needed
- **THEN** it delegates to `RuntimeConfigResolver` cache directly
- **AND** there is no duplicate wrapper cache — a single cache layer serves all config resolution
