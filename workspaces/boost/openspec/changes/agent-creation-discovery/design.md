# Design: Agent Creation & Discovery

## Context

Boost models AI domain objects (agents, tools, models, MCP servers, vector stores) as Backstage catalog entities from the start, informed by augment's experience. Augment managed these entirely in plugin-internal caches — four separate in-memory stores with duplicate caches, no discoverability, and no catalog-level RBAC. Boost uses catalog entity providers from day one, with existing Backstage kinds (`Component`, `Resource`) and a migration path to upstream `AIContext` and `API v1alpha2` kinds when available.

Boost implements the 4-stage agent lifecycle (Draft → Pending → Published → Archived) from the start — no legacy stage mappings needed.

Boost integrates with an external skills marketplace (provided by a separate workspace) as a consumer, proxying browse/filter requests and handling local deployment of selected skills-based agents.

## Goals

- AI domain objects as Backstage catalog entities from day one (using existing kinds with upstream migration path)
- No in-memory caches for domain objects — catalog is the source of truth
- Entity providers packaged as an independent RHDH dynamic plugin module
- Toolscope as a standalone package with injectable cache adapter
- 4-stage lifecycle model with ownership semantics from the start
- Integration with external skills marketplace for agent discovery and deployment

## Non-Goals

- Modifying the MCP auth chain logic (only the tool schema cache)
- Building custom catalog entity pages (defer to catalog defaults)
- Lifecycle governance approval workflows (covered in Security & Governance change)

## Decisions

### Decision 1: Use existing kinds with fallback to upstream

Use `kind: Component, spec.type: ai-agent` for agents and `kind: Resource, spec.type: ai-model|mcp-server|vector-store|ai-tool` for infrastructure resources. When upstream `AIContext` and `API v1alpha2` land, migrate to those kinds. Custom `CatalogProcessor` validators support both during transition. Tools are added as `kind: Resource, spec.type: ai-tool` to enable tool lifecycle permissions via catalog RBAC.

### Decision 2: Entity providers as independently deployable backend services

Entity providers are separate packages registered as Backstage backend services, each independently deployable as an RHDH dynamic plugin:

- `kagenti-entity-provider` — `KagentiAgentEntityProvider` (5m), `KagentiToolEntityProvider` (5m)
- `llamastack-entity-provider` — `LlamaStackModelEntityProvider` (60s), `LlamaStackAgentEntityProvider` (5m)
- Core plugin: `McpEntityProvider` (5m), `VectorStoreEntityProvider` (10m) — cross-cutting

**Standalone mode:** Install entity providers without boost to get catalog discoverability for teams already using Llama Stack or Kagenti.

**Composed mode:** Boost provider modules compose these same packages internally — one install gives you AI capabilities + catalog entities.

Packages live at `rhdh-plugins/workspaces/boost/plugins/llamastack-entity-provider` and `kagenti-entity-provider`.

### Decision 3: Gradual cache elimination

Phase 1: EntityProviders emit entities alongside existing caches (dual-write). Phase 2: Frontend/backend consumers switch to catalog API queries. Phase 3: Remove in-memory caches. This avoids a big-bang migration.

### Decision 4: toolscope extraction as standalone npm package

The `services/toolscope/` subsystem (29 files) has zero Backstage dependencies. Extracted as `@augment/toolscope` with injectable `CacheAdapter` interface — default in-memory adapter for standalone use, Backstage adapter wrapping `coreServices.cache`.

### Decision 5: 4-stage lifecycle with ownership

Agents follow the 4-stage lifecycle from the start: Draft → Pending → Published → Archived. No legacy stage mappings or normalization layers — boost has no prior model to be compatible with. The `createdBy` field is set at registration and drives visibility filtering, action gating, and self-approval prevention. Cascading delete detects agent source and cleans up across corresponding stores.

### Decision 6: Skills marketplace integration (consumer only)

Augment integrates with an external skills marketplace provided by a separate workspace. Augment proxies browse/filter requests to the external catalog and owns only the deployment side: K8s manifest generation with OCI init containers, namespace scoping, and deployment progress tracking. Deployed skills carry `framework: 'docsclaw'` and `chatEndpoint` for direct routing. Deployed skills appear in the gallery with a skill badge. Skills catalog entities will eventually be emitted by the catalog module alongside other agent entities.

## Risks

- **Catalog polling latency vs. cache TTL:** Catalog entities update on provider schedules, not on-demand. Mitigated by keeping short poll intervals for models (60s) and offering manual refresh.
- **Upstream kind availability:** `AIContext` may not be ready. Mitigated by starting with existing kinds and designing for migration.
- **Upstream augment data import:** If boost ever needs to import agent data from augment, a one-time migration script would map 5-stage values to 4-stage. This is not a runtime concern.
