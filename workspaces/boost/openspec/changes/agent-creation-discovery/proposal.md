# Proposal: Agent Creation & Discovery

## Why

An agentic AI platform is only as valuable as its agents. Augment supports four creation paths (no-code, template, DevSpaces, import), a gallery for discovery, and MCP tool connectivity. These form the supply side of the agent ecosystem.

The current implementation manages agents, MCP servers, and models entirely within plugin-internal caches and databases. These domain objects are natural candidates for Backstage catalog entities, which would provide discoverability, ownership, lifecycle management, and catalog-level RBAC — capabilities the current approach cannot offer.

## What Changes

### Current Capabilities (retroactive documentation)

- Browse and select agents via gallery (Kagenti) or router delegation (Llama Stack)
- Four agent creation paths: no-code builder, Software Template, DevSpaces, import
- MCP tool server registration with 4-level auth chain
- Agent lifecycle: draft → registered → deployed (published=true)
- Unified `ChatAgent` model merging agents from all providers

### Architectural Improvements (from tech debt analysis)

- Create catalog `EntityProvider` for AI agents (maps to upstream `AIContext` initiative)
- Create catalog `EntityProvider` for MCP servers (maps to upstream `API Discriminated Union v1alpha2`)
- Create catalog `EntityProvider` for AI models (currently duplicated in caches #3 and #4)
- Create catalog `EntityProvider` for vector stores
- Extract `toolscope/` as standalone package (zero Backstage dependencies)

## Impact

- New: `plugin-augment-backend-module-catalog-agents` (EntityProvider for agents)
- New: `plugin-augment-backend-module-catalog-mcp` (EntityProvider for MCP servers)
- `plugins/augment-backend/src/providers/` — remove agent card and model caches in favor of catalog
- `plugins/augment-backend/src/services/toolscope/` — extract as standalone package
