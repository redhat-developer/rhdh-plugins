# Tasks: Pluggable AI Platform Architecture

## 1. Types, Service Ref, and Package Scaffolding (P0)

- [ ] 1.1 Define `AgenticProvider`, `ProviderDescriptor`, `ProviderCapabilities` interfaces in `boost-common`
- [ ] 1.2 Define `NormalizedStreamEvent` union type in `boost-common`
- [ ] 1.3 Define `ConversationSummary`, `ConversationDetails`, `InputItem` conversation types in `boost-common`
- [ ] 1.4 Create `boost-node` package (`backstage.role: node-library`) with `boostAiProviderServiceRef` via `createServiceRef` — serviceRef must NOT live in `boost-common` (see Decision 1)
- [ ] 1.5 Register default service factory in `boost-backend/plugin.ts` resolving to `ProviderManager.getActiveProvider()`
- [ ] 1.6 Verify no provider-specific types in common package — only shared interfaces
- [ ] 1.7 Verify `boost-common` has no dependency on `@backstage/backend-plugin-api`

## 2. Provider Module Packages (P0)

- [ ] 2.1 Create `boost-backend-module-llamastack` package with `createBackendModule({ pluginId: 'boost', moduleId: 'llamastack' })`
- [ ] 2.2 Implement `ResponsesApiProvider` and `ResponsesApiProviderFactory` in the Llama Stack module
- [ ] 2.3 Create `boost-backend-module-kagenti` package with `createBackendModule({ pluginId: 'boost', moduleId: 'kagenti' })`
- [ ] 2.4 Implement `KagentiProvider` and `KagentiProviderFactory` in the Kagenti module
- [ ] 2.5 Ensure no cross-provider imports between modules
- [ ] 2.6 Verify each provider module starts and registers independently via extension point

## 3. Provider Caches — cacheService from Day One (P1)

- [ ] 3.1 All provider modules depend on `coreServices.cache`
- [ ] 3.2 Implement model list cache in each provider via `cache.withOptions({ defaultTtl: '60s' })`
- [ ] 3.3 Implement agent card cache in Kagenti module via `cache.withOptions({ defaultTtl: '5m' })`
- [ ] 3.4 Implement Keycloak token cache in Kagenti module via `cache.set(key, token, { ttl: expiresIn })`
- [ ] 3.5 Implement MCP auth token cache in Llama Stack module via cacheService
- [ ] 3.6 Implement tool schema cache via `cache.withOptions({ defaultTtl: '5m' })`
- [ ] 3.7 Implement session maps in each provider via cacheService with session TTL
- [ ] 3.8 Implement client manager cache in Llama Stack module as identity-keyed cacheService

## 3b. Provider-Specific Types (P1)

- [ ] 3b.1 Define Kagenti-specific types (agent specs, tool configs, namespace models) in Kagenti module only
- [ ] 3b.2 Define Llama Stack-specific types in Llama Stack module only
- [ ] 3b.3 Verify common package contains only shared interfaces — no provider-specific types

## 4. Frontend Capability Checks (P1)

- [ ] 4.1 Implement `ProviderCapabilities`-based rendering in `AdminLayout.tsx`
- [ ] 4.2 Implement capability checks in `ChatView.tsx`
- [ ] 4.3 Implement capability checks in `ChatHeader.tsx`
- [ ] 4.4 Define `ProviderCapabilities` flags: agentCatalog, namespaceScoping, devSpaces, buildPipelines

## 5. Standalone Package Extraction (P2)

- [ ] 5.1 Create `@boost/toolscope` package with injectable cache interface (`CacheAdapter`)
- [ ] 5.2 Create `@boost/responses-api-toolkit` for shared Responses API utilities
- [ ] 5.3 Update llamastack module to import Responses API types and utilities from `@boost/responses-api-toolkit`, removing duplicate type definitions from module-local `types.ts`

## 6. Dynamic Plugin Packaging (P2)

- [ ] 6.1 Configure `boost-backend-module-llamastack` for RHDH dynamic plugin export (OCI)
- [ ] 6.2 Configure `boost-backend-module-kagenti` for RHDH dynamic plugin export (OCI)
- [ ] 6.3 Create `dynamic-plugins.yaml` examples for modular deployment

## 7. Verify

- [ ] 7.1 Verify serviceRef consumption works from an external test plugin
- [ ] 7.2 Verify hot-swap works with modular provider packages
- [ ] 7.3 Verify cache behavior in both in-memory and Redis-backed modes
- [ ] 7.4 Verify no provider ID string checks in frontend — all capability-based
