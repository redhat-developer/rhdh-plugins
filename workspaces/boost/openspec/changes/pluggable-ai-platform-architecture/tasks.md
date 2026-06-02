# Tasks: Pluggable AI Platform Architecture

## 1. Types and Service Ref (P0)

- [ ] 1.1 Move `AgenticProvider`, `ProviderDescriptor`, `ProviderCapabilities` interfaces to `augment-common`
- [ ] 1.2 Move `NormalizedStreamEvent` union type to `augment-common`
- [ ] 1.3 Move `ConversationSummary`, `ConversationDetails`, `InputItem` from `providers/llamastack/conversationTypes.ts` to `augment-common`
- [ ] 1.4 Create `augmentAiProviderServiceRef` in `augment-common` via `createServiceRef`
- [ ] 1.5 Register default service factory in `augment-backend/plugin.ts` resolving to `ProviderManager.getActiveProvider()`
- [ ] 1.6 Verify no provider-specific types leak into common package

## 2. Provider Module Extraction (P0)

- [ ] 2.1 Create `plugin-augment-backend-module-llamastack` package with `createBackendModule({ pluginId: 'augment', moduleId: 'llamastack' })`
- [ ] 2.2 Move `ResponsesApiProvider`, `ResponsesApiProviderFactory`, and Llama Stack client code to the module
- [ ] 2.3 Create `plugin-augment-backend-module-kagenti` package with `createBackendModule({ pluginId: 'augment', moduleId: 'kagenti' })`
- [ ] 2.4 Move `KagentiProvider`, `KagentiProviderFactory`, and Kagenti client code to the module
- [ ] 2.5 Eliminate cross-provider import: remove `KagentiProvider.ts` import of `responses-api/chat/promptGeneration`
- [ ] 2.6 Verify each provider module starts and registers independently via extension point

## 3. Cache Migration — Provider Caches (P1)

- [ ] 3.1 Add `coreServices.cache` dependency to provider modules
- [x] 3.2 KagentiProvider.\_modelsCache — already migrated to cacheService ✓
- [x] 3.3 KagentiAgentCardCache — already migrated to cacheService ✓
- [ ] 3.4 Replace `ResponsesApiProvider._modelsCache` (raw object) with `cache.withOptions({ defaultTtl: '60s' })` — eliminates model cache asymmetry
- [ ] 3.5 Replace `KeycloakTokenManager` (Map<>) with `cache.set(key, token, { ttl: expiresIn })`
- [ ] 3.6 Replace `McpAuthService` token caches (Map<>, dynamic TTL) with cacheService
- [ ] 3.7 Replace `BackendToolExecutor` schema cache (Map<>, unbounded) with `cache.withOptions({ defaultTtl: '5m' })`
- [ ] 3.8 Replace `ConversationRegistry` (Map<>, no TTL, 10k max) with `cache.withOptions({ defaultTtl: '24h' })`
- [ ] 3.9 Replace `KagentiProvider` session maps (Map<>, no TTL) with cacheService
- [ ] 3.10 Replace `ClientManager` (Map<>) with identity-keyed cacheService
- [ ] 3.11 Replace `DocumentSyncService` hash tracking (Map<>, no TTL) with cacheService (no expiry)

## 3b. Cache Migration — Core Caches (P0)

- [ ] 3b.1 Replace `RuntimeConfigResolver` cache (raw Map, 30s TTL) with `coreServices.cache` + immediate invalidation via `cache.delete()`
- [ ] 3b.2 Verify `ConfigResolutionService` delegates correctly to migrated RuntimeConfigResolver

## 3c. Kagenti Type Extraction (P1)

- [ ] 3c.1 Move 559 lines of Kagenti-only types (60+ interfaces) from `augment-common` to the Kagenti provider module
- [ ] 3c.2 Keep only `AgenticProvider`, `ProviderDescriptor`, `ProviderCapabilities`, conversation types, and `NormalizedStreamEvent` in `augment-common`
- [ ] 3c.3 Verify common package contains only shared interfaces — no provider-specific types

## 4. Frontend Capability Checks (P1)

- [ ] 4.1 Replace `providerId === 'kagenti'` in `AdminLayout.tsx` with `ProviderCapabilities` query
- [ ] 4.2 Replace provider ID checks in `ChatView.tsx` with capability checks
- [ ] 4.3 Replace provider ID checks in `ChatHeader.tsx` with capability checks
- [ ] 4.4 Extend `ProviderCapabilities` interface with missing capability flags (agentCatalog, namespaceScoping, devSpaces, buildPipelines)

## 5. Standalone Package Extraction (P2)

- [ ] 5.1 Extract `services/toolscope/` as `@augment/toolscope` with injectable cache interface
- [ ] 5.2 Extract shared `providers/responses-api/` utilities as `@augment/responses-api-toolkit`

## 6. Dynamic Plugin Packaging (P2)

- [ ] 6.1 Configure `plugin-augment-backend-module-llamastack` for RHDH dynamic plugin export (OCI)
- [ ] 6.2 Configure `plugin-augment-backend-module-kagenti` for RHDH dynamic plugin export (OCI)
- [ ] 6.3 Create `dynamic-plugins.yaml` examples for modular deployment

## 7. Verify

- [ ] 7.1 Verify serviceRef consumption works from an external test plugin
- [ ] 7.2 Verify hot-swap works with modular provider packages
- [ ] 7.3 Verify cache behavior in both in-memory and Redis-backed modes
- [ ] 7.4 Verify no provider ID string checks remain in frontend
