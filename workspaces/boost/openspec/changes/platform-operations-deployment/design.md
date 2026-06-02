# Design: Platform Operations & Deployment

## Context

Boost implements the runtime configuration engine (DB-backed overlay, 25+ keys) with proper architecture from the start, informed by augment's experience. Augment built this as a product feature but accumulated debt: 671 lines of hand-written validators, no documentation of config field scopes, raw `Map<>` caches instead of Backstage `cacheService`, and a 1,500+ line config schema growing without resolution. Boost uses Zod schema-driven validation and `cacheService` from day one.

## Goals

- All operational caches use Backstage `cacheService` from day one
- Configuration validation uses Zod schemas as single source of truth from day one
- Every config field documented with scope: `yaml-only`, `db-overridable`, or `db-only`
- No duplicate cache wrappers or hand-written validators

## Non-Goals

- Removing the DB-backed dynamic config system (it's a product feature)
- Migrating provider-specific caches (covered in platform-architecture change)
- Migrating catalog entity candidates (covered in agent-creation-discovery change)

## Decisions

### Decision 1: Zod schemas derived from config.d.ts

Replace `configValidation.ts` with Zod schemas that are the single source of truth. The TypeScript `config.d.ts` interface is generated from the Zod schemas (not the other way around). This ensures DB-stored values are validated by the same rules as YAML values.

### Decision 2: Cache migration order follows traffic and risk

1. `RuntimeConfigResolver` (cache #1) — highest traffic, 30s TTL, cleanest migration
2. `ConversationRegistry` (cache #8) — add TTL (24h), multi-instance benefit
3. `DocumentSyncService` (cache #9) — multi-instance sync consistency
4. `KagentiProvider` session maps (cache #10) — multi-instance safety
5. `ClientManager` (cache #11) — low risk, singleton pattern
6. `ConfigResolutionService` (cache #14) — eliminate entirely (delegate to #1)
7. `conversationAgents` (cache #15) — new, session-scoped
8. `rateLimiter store` (cache #16) — new, per-window
9. `BackendApprovalStore.pending` (cache #17) — new, request-scoped HITL approvals

Caches #12 and #13 (toolscope) are migrated via the injectable `CacheAdapter` in the toolscope extraction (covered in agent-creation-discovery change).

**Note:** Config schema has grown to 1,500+ lines (was 1,393 at original audit). Hand-written validators are 671 lines. Each new feature (agent approval, skills marketplace, token exchange, DevSpaces credentials) adds config keys without Zod migration, increasing eventual cleanup cost.

### Decision 3: Config field metadata annotation

Each field in the admin config system is annotated with a `configScope` property:

- `yaml-only`: only settable in `app-config.yaml` (e.g., database connection, security mode)
- `db-overridable`: settable in YAML with admin panel override (e.g., model name, system prompt)
- `db-only`: only settable via admin panel (e.g., prompt groups, branding)

This metadata drives both the admin UI (which fields to show) and validation (which writes to accept).

## Risks

- **Redis dependency in production:** `cacheService` defaults to in-memory but uses Redis when configured. Deployments without Redis lose multi-instance cache sharing. Mitigated: in-memory mode is functionally identical to current behavior.
- **Schema migration for existing DB values:** Switching to schema-driven validation may reject currently-stored values. Mitigated by running a one-time migration that validates and reports (but doesn't block) existing values.
