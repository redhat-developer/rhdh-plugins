# Proposal: Platform Operations & Deployment

## Why

An AI platform requiring code changes or restarts for configuration changes is unusable in production. Administrators need to deploy cleanly, manage agents and orchestration, configure RAG pipelines, tune 25+ runtime parameters, and white-label the experience — all without touching source code.

The current runtime configuration engine uses a DB-backed dynamic overlay that is unique across all RHDH plugins and bypasses Backstage's config validation pipeline. The 14 home-grown caches used for operational state (config resolution, session management, content hashes) should migrate to Backstage's `cacheService` for multi-instance safety and Redis backing in production.

## What Changes

### Current Capabilities (retroactive documentation)

- RHDH dynamic plugin (OCI) and Backstage static plugin (npm) deployment
- Agent and orchestration management via admin panel
- RAG knowledge pipeline: document ingestion, vector stores, RAG playground
- Runtime configuration engine: YAML baseline + DB overrides, 25+ keys, 30s cache TTL
- White-label branding: name, logo, colors, welcome screen, featured agents
- Admin onboarding experience

### Architectural Improvements (from tech debt analysis)

- Migrate `RuntimeConfigResolver` cache (cache #1) to Backstage `cacheService`
- Migrate `ConversationRegistry` (cache #8), `DocumentSyncService` content hashes (cache #9), and session maps (cache #10) to `cacheService`
- Migrate `ClientManager` (cache #11), `EmbeddingCache` (cache #12), `SessionCache` (cache #13), `ConfigResolutionService` (cache #14) to `cacheService`
- Replace hand-written config validators (`configValidation.ts`, 668 lines) with schema-driven validation
- Add config-driven feature flags for frontend
- Document YAML-only vs. DB-overridable config fields

## Impact

- `plugins/augment-backend/src/services/RuntimeConfigResolver.ts` — cacheService migration
- `plugins/augment-backend/src/services/configValidation.ts` — replace with schema-driven validation
- `plugins/augment-backend/src/providers/` — remaining cache migrations
- `plugins/augment/src/config.d.ts` — feature flags schema addition
