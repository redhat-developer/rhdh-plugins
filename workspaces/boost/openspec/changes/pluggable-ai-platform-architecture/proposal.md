# Proposal: Pluggable AI Platform Architecture

## Why

Boost must be the experience layer above any AI platform, not a client of one. Enterprise customers run different AI backends — and they change their minds. The architecture must support pluggable providers, runtime hot-swap, normalized streaming, and multi-agent orchestration without vendor lock-in.

Boost builds this as modular RHDH dynamic plugins from the start: each provider is an independent Backstage backend module, the active provider is consumable cross-plugin via a Backstage `serviceRef`, and all caches use `cacheService`. Provider-specific types stay in their modules — only shared interfaces live in the common package.

## What Boost Builds

### Provider Abstraction

- `AgenticProvider` interface with required (`chat`, `chatStream`) and optional capabilities
- `ProviderDescriptor` declares ID, name, and capability matrix
- Backstage extension point (`boostProviderExtensionPoint`) for provider registration
- `boostAiProviderServiceRef` in `boost-common` for cross-plugin AI provider consumption

### Runtime Hot-Swap

- `ProviderManager.switchProvider()` with rollback on failure
- Live provider switching without downtime or data loss

### Normalized Streaming

- `NormalizedStreamEvent` union type covering all stream event categories
- Single event contract between all providers and the frontend

### Provider Modules

Two built-in provider modules, each as an independent `createBackendModule`:

- `boost-backend-module-llamastack` — Llama Stack / Responses API provider
- `boost-backend-module-kagenti` — Kagenti A2A provider

### Capability-Based Feature Gating

- `ProviderCapabilities` interface drives frontend rendering — no provider ID string checks
- UI adapts per-provider based on declared capabilities (agent catalog, namespace scoping, DevSpaces, build pipelines)

### Key Design Principles

- **Providers as modules, not monoliths** — each provider is independently installable and removable
- **Capability checks over identity checks** — `capabilities.agentCatalog` instead of `providerId === 'kagenti'`
- **`cacheService` everywhere** — all provider caches use Backstage `cacheService` with namespace isolation via `cache.withOptions()`
- **Clean type boundaries** — provider-specific types stay in their modules; only shared interfaces in `boost-common`

## Impact

- `plugins/boost-common/` — `AgenticProvider`, `NormalizedStreamEvent`, `boostAiProviderServiceRef`
- `plugins/boost-backend/src/plugin.ts` — serviceRef registration, ProviderManager
- `plugins/boost-backend-module-llamastack/` — Llama Stack provider module
- `plugins/boost-backend-module-kagenti/` — Kagenti provider module
- `plugins/boost-frontend/src/` — capability-based rendering throughout
