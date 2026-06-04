# Tasks: Agent Creation & Discovery

## 1. Entity Provider Packages — Independently Deployable Backend Services (P2)

### 1a. kagenti-entity-provider package

- [ ] 1a.1 Create `kagenti-entity-provider` package at `rhdh-plugins/workspaces/boost/plugins/kagenti-entity-provider`
- [ ] 1a.2 Register as Backstage backend service per backend system architecture
- [ ] 1a.3 Implement `KagentiAgentEntityProvider` polling Kagenti API for agents (kind: Component, spec.type: ai-agent)
- [ ] 1a.4 Implement `KagentiToolEntityProvider` reading tool configs from Kagenti (kind: Resource, spec.type: ai-tool)
- [ ] 1a.5 Package as independently loadable RHDH dynamic plugin (usable without boost)
- [ ] 1a.6 Verify standalone deployment: entity provider loads and emits catalog entities without boost-backend installed

### 1b. llamastack-entity-provider package

- [ ] 1b.1 Create `llamastack-entity-provider` package at `rhdh-plugins/workspaces/boost/plugins/llamastack-entity-provider`
- [ ] 1b.2 Register as Backstage backend service per backend system architecture
- [ ] 1b.3 Implement `LlamaStackModelEntityProvider` polling `/v1/models` (kind: Resource, spec.type: ai-model)
- [ ] 1b.4 Implement `LlamaStackAgentEntityProvider` reading configured agents from YAML/admin config (kind: Component, spec.type: ai-agent)
- [ ] 1b.5 Package as independently loadable RHDH dynamic plugin (usable without boost)
- [ ] 1b.6 Verify standalone deployment: entity provider loads and emits catalog entities without boost-backend installed

### 1c. Composition into boost provider modules

- [ ] 1c.1 `boost-backend-module-kagenti` composes `kagenti-entity-provider` internally
- [ ] 1c.2 `boost-backend-module-llamastack` composes `llamastack-entity-provider` internally
- [ ] 1c.3 Verify composed deployment: provider module install gives AI capabilities + catalog entities

### 1d. Core plugin entity providers (cross-cutting)

- [ ] 1d.1 Implement `McpEntityProvider` reading MCP server configs from admin DB — prefer `kind: API, spec.type: mcp-server` with `spec.remotes` (upstream `McpServerApiEntity` from `@backstage/plugin-catalog-backend-module-ai-model`); fall back to `kind: Resource, spec.type: mcp-server` if model module is not installed
- [ ] 1d.2 Implement `VectorStoreEntityProvider` reading vector store configs (kind: Resource, spec.type: vector-store)
- [ ] 1d.3 Register both via `catalogProcessingExtensionPoint` in core plugin

### 1e. Shared entity concerns

- [ ] 1e.1 Map agent `createdBy` → catalog entity `spec.owner` for RBAC integration
- [ ] 1e.2 Map 4-stage lifecycle (Draft/Pending/Published/Archived) → catalog lifecycle state (experimental/experimental/production/deprecated) in entity annotations
- [ ] 1e.3 Create `CatalogProcessor` validators for ai-agent, ai-model, mcp-server, vector-store, ai-tool types
- [ ] 1e.4 Implement configurable upstream refresh intervals per entity provider via `app-config.yaml` (defaults: 60s models, 5m agents/MCP/tools, 10m vector stores); Backstage catalog polling is managed by the catalog infrastructure independently

## 2. Catalog Integration (P2)

- [ ] 2.1 Implement `useAgentGalleryData` reading from catalog API
- [ ] 2.2 Implement model list endpoints reading from catalog
- [ ] 2.3 Implement tool list endpoints reading from catalog
- [ ] 2.4 Verify all domain object queries go through catalog — no standalone in-memory caches

## 3. Toolscope Package (P2)

- [ ] 3.1 Create `@boost/toolscope` package (29 files, zero Backstage dependencies)
- [ ] 3.2 Define `CacheAdapter` interface for embedding and session caches
- [ ] 3.3 Create default in-memory `CacheAdapter` for standalone use
- [ ] 3.4 Create Backstage `CacheAdapter` wrapping `coreServices.cache`
- [ ] 3.5 Import `@boost/toolscope` from `boost-backend`

## 4. Lifecycle Model (P1)

- [ ] 4.1 Implement 4-stage lifecycle (Draft → Pending → Published → Archived) as the only model — no legacy mappings
- [ ] 4.2 Document cascading delete behavior: source detection (kagenti/orchestration/workflow) → multi-store cleanup

## 5. Skills Marketplace Integration (P1)

- [ ] 5.1 Implement proxy routes to external skills catalog backend (`GET /skills`, `/skills/runtimes`, `/skills/domains`)
- [ ] 5.2 Implement skills browse UI with runtime and domain filters (consuming proxied data)
- [ ] 5.3 Implement K8s manifest generation with OCI init containers for local skill deployment
- [ ] 5.4 Add deployment progress polling and status display
- [ ] 5.5 Add skill badge to gallery for DocsClaw framework agents
- [ ] 5.6 Route chat to skill agents via `chatEndpoint` field

## 6. Verify

- [ ] 6.1 Verify catalog entities appear for agents, models, MCP servers, vector stores, and tools
- [ ] 6.2 Verify catalog-based agent gallery displays correctly
- [ ] 6.3 Verify agent `spec.owner` matches `createdBy` for RBAC
- [ ] 6.4 Verify lifecycle stage mapping: Draft→experimental, Pending→experimental, Published→production, Archived→deprecated
- [ ] 6.5 Verify toolscope package works standalone (without Backstage)
- [ ] 6.6 Verify toolscope package works with Backstage cacheService adapter
- [ ] 6.7 Verify skills deployment creates correct K8s manifests
- [ ] 6.8 Verify catalog module works as RHDH dynamic plugin
