# Proposal: Agent Creation & Discovery

## Why

An agentic AI platform is only as valuable as its agents. Boost supports four creation paths (no-code, template, DevSpaces, import), a gallery for discovery, and MCP tool connectivity. These form the supply side of the agent ecosystem.

Boost models agents, MCP servers, models, and other AI domain objects as Backstage catalog entities from the start, providing discoverability, ownership, lifecycle management, and catalog-level RBAC that plugin-internal caches cannot offer.

## What Boost Builds

### Agent Gallery & Discovery

- Browse and select agents via gallery (Kagenti) or router delegation (Llama Stack)
- Unified `ChatAgent` model merging agents from all providers

### Agent Creation Paths

- Four creation paths: no-code builder, Software Template, DevSpaces, import
- All paths produce agents visible in the gallery and available in chat

### MCP Tool Connectivity

- MCP tool server registration with 4-level auth chain
- Per-agent tool scoping via configuration

### Catalog Entity Providers

- `EntityProvider` for AI agents (maps to upstream `AIContext` initiative; uses `kind: Component, spec.type: ai-agent` until upstream kinds land)
- `EntityProvider` for AI models (`kind: Resource, spec.type: ai-model`)
- `EntityProvider` for MCP servers (maps to upstream `API Discriminated Union v1alpha2`; uses `kind: Resource, spec.type: mcp-server`)
- `EntityProvider` for vector stores (`kind: Resource, spec.type: vector-store`)
- `EntityProvider` for AI tools (`kind: Resource, spec.type: ai-tool`)

Entity providers are independently deployable as RHDH dynamic plugins — teams using Llama Stack or Kagenti can get catalog discoverability without installing the full boost plugin.

### 4-Stage Agent Lifecycle

- Draft → Pending → Published → Archived from day one
- `createdBy` ownership drives visibility filtering, action gating, and self-approval prevention
- Cascading delete detects agent source and cleans up across corresponding stores

### Toolscope as Standalone Package

- `@boost/toolscope` with zero Backstage dependencies (29 files)
- Injectable `CacheAdapter` interface — default in-memory adapter for standalone use, Backstage adapter wrapping `coreServices.cache`

### Skills Marketplace Integration

- Consumer of external skills marketplace (provided by a separate workspace)
- Proxy browse/filter requests to external catalog
- K8s manifest generation with OCI init containers for skill deployment

## Impact

- `plugins/boost-backend/` — entity providers for MCP servers and vector stores (cross-cutting)
- `plugins/boost-backend-module-kagenti/` — composes `kagenti-entity-provider` internally
- `plugins/boost-backend-module-llamastack/` — composes `llamastack-entity-provider` internally
- New: `plugins/kagenti-entity-provider/` — independently deployable catalog entities
- New: `plugins/llamastack-entity-provider/` — independently deployable catalog entities
- New: `packages/toolscope/` — standalone toolscope package
