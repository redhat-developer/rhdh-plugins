# Boost Backend Implementation — Staged GitHub Issues

These issues implement the boost backend in dependency order. Each issue is scoped for a single fullsend `/fs-code` run. Frontend/UI work is excluded and will be covered in a separate set of issues.

---

## boost-common and boost-node — Shared types, service ref, and permission definitions (issue 1 of 15)

https://github.com/redhat-developer/rhdh-plugins/issues/3297

https://github.com/redhat-developer/rhdh-plugins/issues/3297

**Labels:** `ready-to-code`

Scaffold the `boost-common` package (`backstage.role: common-library`) with the shared interfaces and permission definitions, and the `boost-node` package (`backstage.role: node-library`) with the service ref and extension point. Following the Backstage convention (e.g. `plugin-catalog-common` + `plugin-catalog-node`), `createServiceRef` must NOT live in a `common-library` package — it would pull `@backstage/backend-plugin-api` into browser bundles.

### Tasks

From `openspec/changes/pluggable-ai-platform-architecture/tasks.md` section 1:

- 1.1 Define `AgenticProvider`, `ProviderDescriptor`, `ProviderCapabilities` interfaces in `boost-common`
- 1.2 Define `NormalizedStreamEvent` union type in `boost-common`
- 1.3 Define `ConversationSummary`, `ConversationDetails`, `InputItem` conversation types in `boost-common`
- 1.4 Create `boost-node` package with `boostAiProviderServiceRef` via `createServiceRef` — serviceRef lives in `boost-node`, NOT `boost-common`
- 1.6 Verify no provider-specific types in common package
- 1.7 Verify `boost-common` has no dependency on `@backstage/backend-plugin-api`

From `openspec/changes/security-safety-governance/tasks.md` section 1:

- 1.1 Define 16 permissions in `boost-common/src/permissions.ts`
- 1.2 Define resource types `boost-agent` and `boost-tool`
- 1.3 Define conditional rules: `IS_OWNER`, `IS_NOT_CREATOR`, `HAS_LIFECYCLE_STAGE`
- 1.4 Define 5 functional permissions

### Specifications

- `openspec/changes/pluggable-ai-platform-architecture/design.md` — Decision 1 (serviceRef in boost-node, types in boost-common), Decision 5 (type boundaries)
- `openspec/changes/pluggable-ai-platform-architecture/specs/provider-abstraction/spec.md`
- `openspec/changes/security-safety-governance/specs/fine-grained-permissions/spec.md`
- `specifications/boost-context.md` — Design Principles (read before implementing)

---

## boost-backend — Core plugin scaffold, ProviderManager, and security middleware (issue 2 of 15)

https://github.com/redhat-developer/rhdh-plugins/issues/3298

https://github.com/redhat-developer/rhdh-plugins/issues/3298

**Labels:** `ready-to-code`
**Depends on:** Issue 1

Scaffold the `boost-backend` package with the core plugin registration, `ProviderManager`, `boostProviderExtensionPoint`, security mode enforcement, and the `authorizeLifecycleAction` middleware.

### Tasks

From `openspec/changes/pluggable-ai-platform-architecture/tasks.md`:

- 1.5 Register default service factory in `boost-backend/plugin.ts` resolving to `ProviderManager.getActiveProvider()`

From `openspec/changes/security-safety-governance/tasks.md` sections 2 and 9:

- 2.1 Create `authorizeLifecycleAction(permission, resourceLoader)` middleware
- 2.2 Implement fine-grained permission check → DENY → 403 pattern
- 2.3 Create resource loader functions for agents and tools
- 1.5 Register all permissions via `permissionsRegistry.addPermissions()`
- 9.1 Use `development-only-no-auth` as the dev security mode name
- 9.2 No legacy aliases — `none` is rejected with error
- 9.3 Add production environment detection with startup warning

### Specifications

- `openspec/changes/pluggable-ai-platform-architecture/design.md` — Decision 1 (serviceRef in boost-node, factory in boost-backend)
- `openspec/changes/pluggable-ai-platform-architecture/specs/provider-hot-swap/spec.md`
- `openspec/changes/security-safety-governance/design.md` — Decision 1 (middleware), Decision 3 (layered self-approval)
- `openspec/changes/security-safety-governance/specs/access-control/spec.md`

---

## boost-backend — Runtime configuration engine with Zod validation (issue 3 of 15)

https://github.com/redhat-developer/rhdh-plugins/issues/3299

https://github.com/redhat-developer/rhdh-plugins/issues/3299

**Labels:** `ready-to-code`
**Depends on:** Issue 2

Implement the runtime configuration engine: `RuntimeConfigResolver` with cacheService, `AdminConfigService` with DB overrides, and Zod schema-driven validation as single source of truth.

### Tasks

From `openspec/changes/platform-operations-deployment/tasks.md` sections 1 and 2:

- 1.1 All backend services depend on `coreServices.cache`
- 1.2 `RuntimeConfigResolver` with 30s TTL and immediate invalidation
- 1.7 Config resolution: single cache layer
- 2.1 Define Zod schemas for all admin-configurable fields
- 2.2 Generate `config.d.ts` types from Zod schemas
- 2.3 Validate all config writes via Zod `.parse()`
- 2.4 Annotate each field with `configScope`
- 2.5 Add Zod schemas for new config fields
- 2.7 Implement credential encryption for sensitive DB-stored values
- 2.8 Implement schema version tracking

### Specifications

- `openspec/changes/platform-operations-deployment/design.md` — Decisions 1-3
- `openspec/changes/platform-operations-deployment/specs/runtime-config/spec.md`
- `openspec/changes/platform-operations-deployment/specs/cache-migration/spec.md` — RuntimeConfigResolver scenario

---

## boost-backend — Agent lifecycle routes with permission integration (issue 4 of 15)

https://github.com/redhat-developer/rhdh-plugins/issues/3300

https://github.com/redhat-developer/rhdh-plugins/issues/3300

**Labels:** `ready-to-code`
**Depends on:** Issue 2

Implement agent CRUD routes with 4-stage lifecycle (Draft → Pending → Published → Archived) and fine-grained permission integration via `authorizeLifecycleAction`.

### Tasks

From `openspec/changes/security-safety-governance/tasks.md` section 3:

- 3.1-3.7 Implement all agent routes with fine-grained permissions

From `openspec/changes/agent-creation-discovery/tasks.md` section 4:

- 4.1 Implement 4-stage lifecycle as the only model
- 4.2 Document cascading delete behavior

### Specifications

- `openspec/changes/security-safety-governance/specs/fine-grained-permissions/spec.md` — Agent permission scenarios
- `openspec/changes/agent-creation-discovery/design.md` — Decision 5 (lifecycle with ownership)
- `openspec/changes/agent-creation-discovery/specs/agent-creation-paths/spec.md`

---

## boost-backend — Kagenti tool lifecycle routes, MCP server registration, and infrastructure admin (issue 5 of 15)

https://github.com/redhat-developer/rhdh-plugins/issues/3301

https://github.com/redhat-developer/rhdh-plugins/issues/3301

**Labels:** `ready-to-code`
**Depends on:** Issue 2

Implement Kagenti tool lifecycle routes (`boost.tool.*` permissions), MCP server registration routes, and Kagenti infrastructure admin routes (`boost.kagenti.admin`).

**Note:** The `boost-tool` resource type and lifecycle permissions apply to Kagenti tools (K8s workloads) only. MCP servers are registered endpoints without lifecycle governance. MCP tools are runtime-discovered children of MCP servers — they are not independently managed.

### Tasks

From `openspec/changes/security-safety-governance/tasks.md` sections 4 and 5:

- 4.1-4.4 Implement Kagenti tool lifecycle routes with `boost.tool.*` permissions
- 5.1 Implement Kagenti admin routes with `boost.kagenti.admin`

MCP server registration (admin panel CRUD, connection test, auth chain config) — see spec below

### Specifications

- `openspec/changes/security-safety-governance/specs/fine-grained-permissions/spec.md` — Kagenti tool permission scenarios, infrastructure permissions
- `openspec/changes/agent-creation-discovery/specs/mcp-tools/spec.md` — MCP server registration and auth chain (separate from Kagenti tool lifecycle)

---

## boost-backend — Streaming chat and normalized event pipeline (issue 6 of 15)

https://github.com/redhat-developer/rhdh-plugins/issues/3302

https://github.com/redhat-developer/rhdh-plugins/issues/3302

**Labels:** `ready-to-code`
**Depends on:** Issue 2

Implement the SSE streaming endpoint, normalized stream event processing, and the chat route that connects providers to the frontend via `NormalizedStreamEvent`.

### Tasks

From `openspec/changes/platform-operations-deployment/tasks.md`:

- 1.8 Conversation-agent maps: session-scoped cacheService
- 1.9 Rate limiter state: per-window cacheService

### Specifications

- `openspec/changes/pluggable-ai-platform-architecture/specs/normalized-streaming/spec.md`
- `openspec/changes/ai-chat-interaction-experience/specs/streaming-chat/spec.md`
- `openspec/changes/pluggable-ai-platform-architecture/design.md` — Decision 3 (cacheService for all caches)

---

## boost-backend — Conversation history and persistence (issue 7 of 15)

https://github.com/redhat-developer/rhdh-plugins/issues/3303

https://github.com/redhat-developer/rhdh-plugins/issues/3303

**Labels:** `ready-to-code`
**Depends on:** Issue 6

Implement conversation persistence (DB tables `boost_sessions`, `boost_messages`, `boost_feedback`), search, resume, feedback, and export endpoints.

### Tasks

From `openspec/changes/platform-operations-deployment/tasks.md`:

- 1.3 `ConversationRegistry`: 24h TTL via cacheService

### Specifications

- `openspec/changes/ai-chat-interaction-experience/specs/conversation-history/spec.md`
- `openspec/changes/platform-operations-deployment/specs/cache-migration/spec.md` — ConversationRegistry scenario

---

## boost-backend — HITL approval flow and SonataFlow integration (issue 8 of 15)

https://github.com/redhat-developer/rhdh-plugins/issues/3304

https://github.com/redhat-developer/rhdh-plugins/issues/3304

**Labels:** `ready-to-code`
**Depends on:** Issue 6

Implement the human-in-the-loop approval service for tool calls, including built-in approval and SonataFlow-managed external workflow with `X-Boost-Workflow-Callback` header.

### Tasks

From `openspec/changes/platform-operations-deployment/tasks.md`:

- 1.10 HITL approval state: request-scoped cacheService

### Specifications

- `openspec/changes/ai-chat-interaction-experience/specs/hitl-approval/spec.md`
- `openspec/changes/security-safety-governance/specs/access-control/spec.md` — SonataFlow trust boundary scenarios

---

## boost-backend — RAG knowledge pipeline backend (issue 9 of 15)

https://github.com/redhat-developer/rhdh-plugins/issues/3305

https://github.com/redhat-developer/rhdh-plugins/issues/3305

**Labels:** `ready-to-code`
**Depends on:** Issue 3

Implement the RAG knowledge pipeline backend: document ingestion, vector store integration, content hash tracking, and RAG query endpoints.

### Tasks

From `openspec/changes/platform-operations-deployment/tasks.md`:

- 1.4 `DocumentSyncService` content hashes: cacheService with long TTL

### Specifications

- `openspec/changes/ai-chat-interaction-experience/specs/rag-knowledge/spec.md`
- `openspec/changes/platform-operations-deployment/specs/rag-pipelines/spec.md`
- `openspec/changes/platform-operations-deployment/specs/cache-migration/spec.md` — DocumentSyncService scenario

---

## boost-backend-module-llamastack — Llama Stack provider module (issue 10 of 15)

https://github.com/redhat-developer/rhdh-plugins/issues/3306

https://github.com/redhat-developer/rhdh-plugins/issues/3306

**Labels:** `ready-to-code`
**Depends on:** Issue 2

Create the Llama Stack provider module as an independent `createBackendModule` with `ResponsesApiProvider`, OpenAI Agent SDK orchestration, and all provider caches using `cacheService`.

### Tasks

From `openspec/changes/pluggable-ai-platform-architecture/tasks.md` sections 2 and 3:

- 2.1 Create `boost-backend-module-llamastack` package
- 2.2 Implement `ResponsesApiProvider` and `ResponsesApiProviderFactory`
- 3.2 Implement model list cache via `cache.withOptions({ defaultTtl: '60s' })`
- 3.5 Implement MCP auth token cache via cacheService
- 3.8 Implement client manager cache as identity-keyed cacheService
- 3b.2 Define Llama Stack-specific types in module only

From `openspec/changes/platform-operations-deployment/tasks.md`:

- 1.5 Provider session maps: cacheService with session-appropriate TTL
- 1.6 `ClientManager`: identity-keyed cacheService

### Specifications

- `openspec/changes/pluggable-ai-platform-architecture/specs/provider-packaging/spec.md` — Llama Stack module scenarios
- `openspec/changes/pluggable-ai-platform-architecture/specs/multi-agent-orchestration/spec.md`
- `openspec/changes/pluggable-ai-platform-architecture/design.md` — Decision 2 (modules not plugins), Decision 3 (cacheService)

---

## boost-backend-module-kagenti — Kagenti provider module (issue 11 of 15)

https://github.com/redhat-developer/rhdh-plugins/issues/3307

https://github.com/redhat-developer/rhdh-plugins/issues/3307

**Labels:** `ready-to-code`
**Depends on:** Issue 2

Create the Kagenti provider module as an independent `createBackendModule` with `KagentiProvider`, A2A protocol integration, and all provider caches using `cacheService`.

### Tasks

From `openspec/changes/pluggable-ai-platform-architecture/tasks.md` sections 2 and 3:

- 2.3 Create `boost-backend-module-kagenti` package
- 2.4 Implement `KagentiProvider` and `KagentiProviderFactory`
- 2.5 Ensure no cross-provider imports
- 3.3 Implement agent card cache via `cache.withOptions({ defaultTtl: '5m' })`
- 3.4 Implement Keycloak token cache
- 3.7 Implement session maps via cacheService
- 3b.1 Define Kagenti-specific types in module only

### Specifications

- `openspec/changes/pluggable-ai-platform-architecture/specs/provider-packaging/spec.md` — Kagenti module scenarios
- `openspec/changes/pluggable-ai-platform-architecture/design.md` — Decision 2 (modules not plugins), Decision 3 (cacheService)

---

## boost-entity-providers — Catalog entities for AI domain objects (issue 12 of 15)

https://github.com/redhat-developer/rhdh-plugins/issues/3308

https://github.com/redhat-developer/rhdh-plugins/issues/3308

**Labels:** `ready-to-code`
**Depends on:** Issues 10, 11

Create independently deployable entity provider packages (`kagenti-entity-provider`, `llamastack-entity-provider`) and core plugin entity providers (`McpEntityProvider`, `VectorStoreEntityProvider`) that emit AI domain objects as Backstage catalog entities.

**Important: Two-layer polling model.** Backstage's catalog infrastructure polls entity providers on its own schedule. Independently, each entity provider manages its own upstream refresh interval — how often it fetches from the external API (Kagenti, Llama Stack). When Backstage polls, the provider returns cached upstream data. The upstream refresh interval must be configurable via `app-config.yaml`, not hardcoded.

### Tasks

From `openspec/changes/agent-creation-discovery/tasks.md` sections 1 and 2:

- 1a.1-1a.6 kagenti-entity-provider package
- 1b.1-1b.6 llamastack-entity-provider package
- 1c.1-1c.3 Composition into provider modules
- 1d.1-1d.3 Core plugin entity providers (MCP servers using upstream `kind: API, spec.type: mcp-server` from `@backstage/plugin-catalog-backend-module-ai-model` with `Resource` fallback; vector stores)
- 1e.1-1e.4 Shared entity concerns (ownership mapping, lifecycle mapping, validators, configurable upstream refresh intervals)
- 2.1-2.4 Catalog integration (backend endpoints reading from catalog)

### Specifications

- `openspec/changes/agent-creation-discovery/specs/catalog-entities/spec.md`
- `openspec/changes/agent-creation-discovery/design.md` — Decisions 1-3 (kinds, deployment modes, catalog as source of truth)

---

## boost-backend — Keycloak service-account authentication for Kagenti (issue 13 of 15)

https://github.com/redhat-developer/rhdh-plugins/issues/3309

https://github.com/redhat-developer/rhdh-plugins/issues/3309

**Labels:** `ready-to-code`
**Depends on:** Issue 11

Implement `KeycloakAuthClient` for service-account Kagenti authentication via OAuth2 Client Credentials Grant, with token caching, configurable expiry buffer, and max-1-retry on 401.

### Tasks

From `openspec/changes/security-safety-governance/tasks.md` section 7:

- ~~7.1 Create `KeycloakAuthClient` implementing OAuth2 Client Credentials Grant~~ ✅ PR #3648
- ~~7.2 Add token caching with configurable expiry buffer (`tokenExpiryBufferSeconds`, default: 60)~~ ✅ PR #3648
- 7.3 Add max-1-retry on 401 (refresh token and retry once)
- ~~7.4 Add config schema: `boost.kagenti.auth.{tokenEndpoint, clientId, clientSecret, tokenExpiryBufferSeconds}`~~ ✅ PR #3648
- ~~7.5a Integrate into entity providers — inject bearer token~~ ✅ PR #3648
- 7.5b Integrate into `KagentiApiClient` — inject bearer token
- 7.6 Propagate user identity via `X-Backstage-User` header

**Note:** `KeycloakAuthClient` was implemented in `boost-node/src/KeycloakAuthClient.ts` for entity provider use. The remaining tasks (7.3, 7.5b, 7.6) target the `KagentiApiClient` in `boost-backend-module-kagenti` for user-facing provider module use.

### Specifications

- `openspec/changes/security-safety-governance/specs/access-control/spec.md` — Service-account auth scenarios
- `openspec/changes/security-safety-governance/design.md` — Decision 4 (KeycloakAuthClient with max-1-retry)

---

## boost-toolscope — Standalone toolscope and Responses API toolkit packages (issue 14 of 15)

https://github.com/redhat-developer/rhdh-plugins/issues/3310

https://github.com/redhat-developer/rhdh-plugins/issues/3310

**Labels:** `ready-to-code`
**Depends on:** Issue 10

Extract toolscope as `@boost/toolscope` (zero Backstage dependencies, injectable `CacheAdapter`) and create `@boost/responses-api-toolkit` for shared Responses API utilities.

### Tasks

From `openspec/changes/agent-creation-discovery/tasks.md` section 3:

- 3.1 Create `@boost/toolscope` package (29 files)
- 3.2 Define `CacheAdapter` interface
- 3.3 Create default in-memory `CacheAdapter`
- 3.4 Create Backstage `CacheAdapter` wrapping `coreServices.cache`
- 3.5 Import `@boost/toolscope` from `boost-backend`

From `openspec/changes/pluggable-ai-platform-architecture/tasks.md` section 5:

- 5.1 Create `@boost/toolscope` with injectable cache interface
- 5.2 Create `@boost/responses-api-toolkit`

### Specifications

- `openspec/changes/pluggable-ai-platform-architecture/specs/provider-packaging/spec.md` — Toolscope extraction scenario
- `openspec/changes/agent-creation-discovery/design.md` — Decision 4 (standalone npm package)

---

## boost-packaging — Dynamic plugin packaging and deployment configuration (issue 15 of 15)

https://github.com/redhat-developer/rhdh-plugins/issues/3311

https://github.com/redhat-developer/rhdh-plugins/issues/3311

**Labels:** `ready-to-code`
**Depends on:** Issues 10, 11, 12

Configure all boost packages for RHDH dynamic plugin export (OCI), create deployment examples, implement security hardening (CSRF, credential encryption), and add skills marketplace proxy routes.

### Tasks

From `openspec/changes/pluggable-ai-platform-architecture/tasks.md` section 6:

- 6.1 Configure `boost-backend-module-llamastack` for RHDH dynamic plugin export (OCI)
- 6.2 Configure `boost-backend-module-kagenti` for RHDH dynamic plugin export (OCI)
- 6.3 Create `dynamic-plugins.yaml` examples for modular deployment

From `openspec/changes/security-safety-governance/tasks.md` section 8:

- 8.2 Encrypt sensitive values in admin config DB

From `openspec/changes/agent-creation-discovery/tasks.md` section 5:

- 5.1 Implement proxy routes to external skills catalog backend
- 5.3 Implement K8s manifest generation with OCI init containers
- 5.4 Add deployment progress polling
- 5.6 Route chat to skill agents via `chatEndpoint` field

From `openspec/changes/platform-operations-deployment/tasks.md` section 3:

- 3.1 Document all 25+ configurable keys with scope
- 3.2 Add schema documentation to Zod definitions

### Specifications

- `openspec/changes/platform-operations-deployment/specs/deployment/spec.md`
- `openspec/changes/platform-operations-deployment/specs/white-label/spec.md`
- `openspec/changes/agent-creation-discovery/design.md` — Decision 6 (skills marketplace consumer)

---

## boost-skills-routes — Skills marketplace route improvements and runtime config (issue 16 after 15)

https://github.com/redhat-developer/rhdh-plugins/issues/3597

**Labels:** `ready-to-code`
**Depends on:** Issue 15 (#3311)

Refactor the skills marketplace routes introduced in issue 15 to read runtimes from local app-config, resolve `runtimeId` server-side in the deploy endpoint, extract manifest generation into a testable module, and add comprehensive proxy and unit test coverage.

### Tasks

From `openspec/changes/pluggable-ai-platform-architecture/tasks.md` section 8:

- 8a.3 Add proxy tests for `GET /skills` and `GET /skills/domains` (mock fetch, verify URL construction, query param forwarding, feature gate, permission checks, non-JSON handling)
- 8b.1 Add `boost.skillsMarketplace.runtimes[]` Zod schema to `schemas.ts` (`yaml-only` scope) with fields: `id`, `name`, `description`, `image`, `language`, `footprint`, `features[]`, `status`
- 8b.2 Refactor `GET /skills/runtimes` to read from local app-config instead of proxying to external catalog
- 8b.3 Add tests for `GET /skills/runtimes` (reads config, returns runtime list, feature gate)
- 8c.1 Change `POST /skills/deploy` request body to accept `runtimeId` instead of `ociImage`; resolve container image from `boost.skillsMarketplace.runtimes[]` config
- 8c.2 Extract manifest generation into `src/skills/manifestBuilder.ts`
- 8c.3 Update deploy tests for `runtimeId` resolution and `manifestBuilder` unit tests

### Specifications

- `openspec/changes/pluggable-ai-platform-architecture/tasks.md` — Section 8 (Skills Marketplace Integration)
- `openspec/changes/agent-creation-discovery/design.md` — Decision 6 (skills marketplace consumer)

---

## kagenti-entity-provider — Migrate KeycloakAuthClient to Backstage cacheService (issue 17 after 15)

https://github.com/redhat-developer/rhdh-plugins/issues/3654

**Labels:** `ready-to-code`
**Depends on:** Issue 13 (#3309)

Refactor `KeycloakAuthClient` in `kagenti-entity-provider` to use Backstage `cacheService` for token caching instead of private instance fields, and add HTTPS validation for `tokenEndpoint`. Aligns with design principle 1 and the PRD cache migration table.

### Tasks

- 17.1 Add `coreServices.cache` to the `kagenti-entity-provider` module deps
- 17.2 Refactor `KeycloakAuthClient` constructor to accept a `CacheService` instance
- 17.3 Replace private `cachedToken`/`tokenExpiresAt` fields with `cacheService.get()`/`cacheService.set()` using TTL derived from token expiry minus buffer
- 17.4 Update `module.ts` to pass `cache` (with namespace) to `KeycloakAuthClient`
- 17.5 Update tests to mock `cacheService` instead of relying on in-memory state
- 17.6 Consider extracting `KeycloakAuthClient` to a shared location (e.g., `boost-node`) so `boost-backend-module-kagenti` can reuse it for task 7.5b
- 17.7 Add HTTPS validation for `tokenEndpoint` in `KeycloakAuthClient` constructor — reject HTTP URLs unless security mode is `development-only-no-auth`

### Specifications

- `specifications/boost-context.md` — Design Principle 1 (Backstage cacheService from Day One)
- `specifications/prd/pluggable-ai-platform-architecture.md` — Cache migration table
- `openspec/changes/security-safety-governance/specs/access-control/spec.md` — Service-account auth scenarios
- `openspec/changes/platform-operations-deployment/specs/cache-migration/spec.md`
