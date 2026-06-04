# Tasks: Platform Operations & Deployment

## 1. Operational Caches — cacheService from Day One (P1)

- [ ] 1.1 All backend services depend on `coreServices.cache` — no raw `Map<>` caches anywhere
- [ ] 1.2 `RuntimeConfigResolver`: `cache.set('effective-config', value, { ttl: '30s' })` with immediate invalidation via `cache.delete()`
- [ ] 1.3 `ConversationRegistry`: 24h TTL via cacheService
- [ ] 1.4 `DocumentSyncService` content hashes: cacheService with long TTL
- [ ] 1.5 Provider session maps: cacheService with session-appropriate TTL
- [ ] 1.6 `ClientManager`: identity-keyed cacheService
- [ ] 1.7 Config resolution: single cache layer (no duplicate wrapper)
- [ ] 1.8 Conversation-agent maps: session-scoped cacheService
- [ ] 1.9 Rate limiter state: per-window cacheService
- [ ] 1.10 HITL approval state: request-scoped cacheService

## 2. Schema-Driven Config Validation — Zod from Day One (P1)

- [ ] 2.1 Define Zod schemas for all admin-configurable fields as single source of truth
- [ ] 2.2 Generate `config.d.ts` types from Zod schemas
- [ ] 2.3 Validate all config writes (YAML and DB) via Zod `.parse()` — no hand-written validators
- [ ] 2.4 Annotate each field with `configScope`: `yaml-only`, `db-overridable`, or `db-only`
- [ ] 2.5 Add Zod schemas for new config fields: agentApproval, skillsMarketplace, tokenExchange, DevSpaces credentials
- [ ] 2.6 Update admin UI to only show DB-overridable and DB-only fields
- [ ] 2.7 Create one-time migration script that validates existing DB values against new schemas
- [ ] 2.8 Implement credential encryption for sensitive DB-stored values (DevSpaces tokens)
- [ ] 2.9 Implement schema version tracking: store schema version alongside DB values, re-validate on startup
- [ ] 2.10 Implement startup migration: validate existing DB values against current Zod schema, remove invalid overrides with logging

## 3. Config Field Documentation (P2)

- [ ] 3.1 Document all 25+ configurable keys with their scope (YAML-only vs DB-overridable)
- [ ] 3.2 Add schema documentation comments to Zod schema definitions

## 4. Verify

- [ ] 4.1 Verify RuntimeConfigResolver cache works with both in-memory and Redis backends
- [ ] 4.2 Verify config write → immediate invalidation → new value served in under 1 second
- [ ] 4.3 Verify Zod validation rejects the same invalid values that hand-written validators did
- [ ] 4.4 Verify existing DB values pass Zod validation (migration script)
- [ ] 4.5 Verify multi-instance cache sharing works with Redis in production config
