# Proposal: Pluggable AI Platform Architecture

## Why

Augment must be the experience layer above any AI platform, not a client of one. Enterprise customers run different AI backends — and they change their minds. The architecture must support pluggable providers, runtime hot-swap, normalized streaming, and multi-agent orchestration without vendor lock-in.

The current implementation achieves the product goals but has critical architectural gaps that limit reusability and composability: no Backstage `serviceRef` for cross-plugin AI provider consumption, providers embedded inside one monolithic backend plugin rather than packaged as separate Backstage modules, and shared types scattered across provider-specific directories.

## What Changes

### Current Capabilities (retroactive documentation)

- Provider abstraction via `AgenticProvider` interface with required (`chat`, `chatStream`) and optional capabilities
- `ProviderDescriptor` declares ID, name, and capability matrix
- Backstage extension point (`augmentProviderExtensionPoint`) for provider registration
- Runtime hot-swap via `ProviderManager.switchProvider()` with rollback on failure
- Normalized streaming protocol (`NormalizedStreamEvent`) for frontend uniformity
- Two built-in providers: `ResponsesApiProvider` (Llama Stack) and `KagentiProvider` (Kagenti A2A)
- Frontend capability-based feature gating adapting UI per provider

### Architectural Improvements (from tech debt analysis)

- Create `augmentAiProviderServiceRef` so other plugins can consume the active AI provider
- Move `AgenticProvider` interface and conversation types to `augment-common`
- Package `ResponsesApiProvider` and `KagentiProvider` as separate Backstage backend modules
- Replace provider ID checks (`providerId === 'kagenti'`) with capability-based checks
- Extract `responses-api/` toolkit and `toolscope/` as standalone packages

## Impact

- `plugins/augment-common/` — new types and serviceRef
- `plugins/augment-backend/src/providers/` — provider extraction
- `plugins/augment-backend/src/plugin.ts` — serviceRef registration
- New packages: `plugin-augment-backend-module-llamastack`, `plugin-augment-backend-module-kagenti`
- `plugins/augment/src/` — replace provider ID checks with capability checks
