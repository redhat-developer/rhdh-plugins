# Design: Platform Operations & Deployment

## Context

Boost implements the runtime configuration engine (DB-backed overlay, 25+ keys) with proper architecture from the start. Zod schema-driven validation and Backstage `cacheService` are used from day one — no hand-written validators, no raw `Map<>` caches.

## Goals

- All operational caches use Backstage `cacheService` from day one
- Configuration validation uses Zod schemas as single source of truth from day one
- Every config field documented with scope: `yaml-only`, `db-overridable`, or `db-only`
- No duplicate cache wrappers or hand-written validators

## Non-Goals

- Removing the DB-backed dynamic config system (it's a product feature)
- Provider-specific caches (covered in platform-architecture change)
- Catalog entity providers (covered in agent-creation-discovery change)

## Decisions

### Decision 1: Zod schemas as single source of truth

Zod schemas define all admin-configurable fields. The TypeScript `config.d.ts` interface is generated from the Zod schemas (not the other way around). This ensures DB-stored values are validated by the same rules as YAML values — a single validation path for all config sources.

### Decision 2: Cache inventory via cacheService

All operational caches use `cacheService` from the start. The cache inventory covers the same operational needs identified in the Augment analysis (17 cache use cases):

1. `RuntimeConfigResolver` — highest traffic, 30s TTL, immediate invalidation on write
2. `ConversationRegistry` — 24h TTL, multi-instance benefit
3. `DocumentSyncService` — content hash tracking, multi-instance consistency
4. Provider session maps — session-appropriate TTL
5. `ClientManager` — identity-keyed, singleton pattern
6. Config resolution — single cache layer (delegates to RuntimeConfigResolver, no duplicate wrapper)
7. Conversation-agent maps — session-scoped
8. Rate limiter state — per-window
9. HITL approval pending state — request-scoped

Provider-specific caches (embedding, tool scope) live in their respective modules and also use `cacheService` (covered in platform-architecture change).

### Decision 3: Config field metadata annotation

Each field in the admin config system is annotated with a `configScope` property:

- `yaml-only`: only settable in `app-config.yaml` (e.g., database connection, security mode)
- `db-overridable`: settable in YAML with admin panel override (e.g., model name, system prompt)
- `db-only`: only settable via admin panel (e.g., prompt groups, branding)

This metadata drives both the admin UI (which fields to show) and validation (which writes to accept).

## Risks

- **Redis dependency in production:** `cacheService` defaults to in-memory but uses Redis when configured. Deployments without Redis lose multi-instance cache sharing. Mitigated: in-memory mode is functionally identical for single-instance deployments.
- **Schema evolution:** New config fields added over time must have Zod schemas defined alongside them. Mitigated by making Zod schema the required entry point for any new config field — no config key can be added without a schema definition.
