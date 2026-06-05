# Proposal: Platform Operations & Deployment

## Why

An AI platform requiring code changes or restarts for configuration changes is unusable in production. Administrators need to deploy cleanly, manage agents and orchestration, configure RAG pipelines, tune 25+ runtime parameters, and white-label the experience — all without touching source code.

Boost builds its operations layer on Backstage-native services from day one, avoiding the custom infrastructure patterns that created tech debt in the Augment reference prototype.

## What Boost Builds

### Deployment

Boost ships as a set of modular RHDH dynamic plugins (OCI) and Backstage static plugins (npm). Core plugin and provider modules are independently installable — deployers choose only what they need:

| Package                           | Purpose                                                           |
| --------------------------------- | ----------------------------------------------------------------- |
| `boost-frontend`                  | Chat UI, agent gallery, admin panels, composable extensions       |
| `boost-common`                    | Shared types, permissions, service refs                           |
| `boost-backend`                   | Core routes, services, middleware, cross-cutting entity providers |
| `boost-backend-module-llamastack` | Llama Stack agentic provider                                      |
| `boost-backend-module-kagenti`    | Kagenti agentic provider                                          |
| `llamastack-entity-provider`      | Llama Stack catalog entities (independently deployable)           |
| `kagenti-entity-provider`         | Kagenti catalog entities (independently deployable)               |

### Runtime Configuration Engine

Boost implements a DB-backed dynamic configuration overlay (YAML baseline + database overrides, 25+ keys) with these architectural choices:

- **Zod schema-driven validation** — Zod schemas are the single source of truth for config validation. The TypeScript `config.d.ts` interface is generated from Zod schemas, ensuring DB-stored values are validated by the same rules as YAML values. No hand-written validators.
- **Config field scoping** — every field is annotated with a `configScope`: `yaml-only` (e.g., database connection, security mode), `db-overridable` (e.g., model name, system prompt), or `db-only` (e.g., prompt groups, branding). This metadata drives admin UI rendering and write validation.
- **Config-driven feature flags** — deployers control feature visibility (agent creation, DevSpaces, workflow builder, sandbox, observability, admin panel) via `app-config.yaml`, read through Backstage's `featureFlagsApiRef`.

### Operational Caching via Backstage `cacheService`

All operational caches use Backstage `cacheService` from day one — no raw `Map<>` caches. This provides Redis-backed caching in production, consistent TTL semantics, and multi-instance safety. Boost's cache inventory covers the same operational needs identified in the Augment analysis (17 cache use cases):

- Config resolution (30s TTL)
- Conversation registry (24h TTL)
- Document sync content hashes
- Provider session maps
- Client manager singletons
- Conversation agent mappings (session-scoped)
- Rate limiter windows (per-window)
- HITL approval pending state (request-scoped)

Provider-specific caches (embedding, tool scope) live in their respective provider modules and also use `cacheService`.

### Agent & Orchestration Management

Admin panel for managing agents and orchestration rules — agent lifecycle (Draft → Pending → Published → Archived), orchestration chain configuration, and provider settings.

### RAG Knowledge Pipelines

Document ingestion, vector store configuration, and RAG playground — enabling agents to ground answers in organizational knowledge.

### White-Label Branding

Runtime branding customization: name, logo, colors, welcome screen, and featured agents — all configurable via admin panel without redeployment.

## Key Design Principles

These principles are informed by the Augment reference prototype's experience (see `specifications/boost-context.md`):

1. **Backstage-native services over custom infrastructure** — `cacheService`, `permissions`, `httpAuth`, `configApi` instead of bespoke equivalents
2. **Schema-driven validation over hand-written validators** — Zod as single source of truth eliminates the drift between config schemas and validation logic
3. **Modular plugin packaging from day one** — each provider is an independent `createBackendModule`, not a monolithic backend
4. **Config field documentation as code** — scope metadata lives with the schema, not in separate docs

## Impact

- `plugins/boost-backend/src/services/` — RuntimeConfigResolver, config validation, cache management
- `plugins/boost-backend/src/routes/` — admin panel API routes
- `plugins/boost-common/src/config.d.ts` — generated from Zod schemas
- `plugins/boost-frontend/src/admin/` — admin panel components, feature flag integration
