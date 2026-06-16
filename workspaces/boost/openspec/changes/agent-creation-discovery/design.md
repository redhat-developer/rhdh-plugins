# Design: Agent Creation & Discovery

## Context

Boost models AI domain objects (agents, tools, models, MCP servers, vector stores) as Backstage catalog entities from the start. The Augment reference prototype managed these entirely in plugin-internal caches; boost uses catalog entity providers from day one, with existing Backstage kinds (`Component`, `Resource`) and a path to upstream `AIContext` and `API v1alpha2` kinds when available.

Boost implements the 4-stage agent lifecycle (Draft → Pending → Published → Archived) from the start — no legacy stage mappings needed.

Boost integrates with an external skills marketplace (provided by a separate workspace) as a consumer, proxying browse/filter requests and handling local deployment of selected skills-based agents.

## Goals

- AI domain objects as Backstage catalog entities from day one (using existing kinds with upstream kind path)
- No in-memory caches for domain objects — catalog is the source of truth
- Entity providers packaged as independent RHDH dynamic plugin modules
- Toolscope as a standalone package with injectable cache adapter
- 4-stage lifecycle model with ownership semantics from the start
- Integration with external skills marketplace for agent discovery and deployment

## Non-Goals

- Modifying the MCP auth chain logic (only the tool schema cache)
- Building custom catalog entity pages (defer to catalog defaults)
- Lifecycle governance approval workflows (covered in Security & Governance change)

## Decisions

### Decision 1: Use upstream kinds where available, existing kinds as fallback

Use `kind: Component, spec.type: ai-agent` for agents. For MCP servers, prefer `kind: API, spec.type: mcp-server` using the upstream `McpServerApiEntity` from `@backstage/plugin-catalog-backend-module-ai-model` ([backstage#34016](https://github.com/backstage/backstage/pull/34016), merged) — fall back to `kind: Resource, spec.type: mcp-server` if the model module is not installed. Use `kind: Resource` for models (`ai-model`), vector stores (`vector-store`), and Kagenti tools (`ai-tool`). When upstream `AIContext` lands, adopt it for agents. Custom `CatalogProcessor` validators support both current and future kinds during transitions.

### Decision 2: Entity providers as independently deployable backend services

Entity providers are separate packages registered as Backstage backend services, each independently deployable as an RHDH dynamic plugin:

- `kagenti-entity-provider` — `KagentiAgentEntityProvider`, `KagentiToolEntityProvider`
- `llamastack-entity-provider` — `LlamaStackModelEntityProvider`, `LlamaStackAgentEntityProvider`
- Core plugin: `McpEntityProvider`, `VectorStoreEntityProvider` — cross-cutting

**Two-layer polling model:** Backstage's catalog infrastructure polls entity providers on its own schedule. Independently, each entity provider manages its own upstream refresh interval — how often it fetches from the external API (Kagenti, Llama Stack). When Backstage polls the entity provider, the provider returns its most recently cached upstream data rather than blocking on a live API call every time. The upstream refresh interval is configurable via `app-config.yaml` (defaults: 60s for models, 5m for agents/tools/MCP servers, 10m for vector stores).

**Standalone mode:** Install entity providers without boost to get catalog discoverability for teams already using Llama Stack or Kagenti.

**Composed mode:** Boost provider modules compose these same packages internally — one install gives you AI capabilities + catalog entities.

Packages live at `rhdh-plugins/workspaces/boost/plugins/llamastack-entity-provider` and `kagenti-entity-provider`.

### Decision 3: Catalog as source of truth from the start

Boost uses catalog entities as the primary source of truth for AI domain objects. There is no dual-write phase — entity providers emit entities directly and frontend/backend consumers query the catalog API.

### Decision 4: toolscope extraction as standalone npm package

The toolscope subsystem (29 files) has zero Backstage dependencies. Packaged as `@boost/toolscope` with injectable `CacheAdapter` interface — default in-memory adapter for standalone use, Backstage adapter wrapping `coreServices.cache`.

### Decision 5: 4-stage lifecycle with ownership

Agents follow the 4-stage lifecycle from the start: Draft → Pending → Published → Archived. No legacy stage mappings or normalization layers — boost has no prior model to be compatible with. The `createdBy` field is set at registration and drives visibility filtering, action gating, and self-approval prevention. Cascading delete detects agent source and cleans up across corresponding stores.

### Decision 6: Skills marketplace integration (consumer only)

Boost integrates with an external skills marketplace provided by a separate workspace. Boost proxies browse/filter requests to the external catalog and owns only the deployment side: K8s manifest generation with OCI init containers, namespace scoping, and deployment progress tracking. Deployed skills carry `framework: 'docsclaw'` and `chatEndpoint` for direct routing. Deployed skills appear in the gallery with a skill badge. Skills catalog entities will eventually be emitted by the catalog module alongside other agent entities.

## Risks

- **Catalog polling latency vs. cache TTL:** Catalog entities update on provider schedules, not on-demand. Mitigated by keeping short poll intervals for models (60s) and offering manual refresh.
- **Upstream kind availability:** `AIContext` may not be ready. Mitigated by starting with existing kinds and designing for smooth adoption.
- **Upstream augment data import:** If boost ever needs to import agent data from augment, a one-time script would map augment's stage values to boost's 4-stage model. This is not a runtime concern.
