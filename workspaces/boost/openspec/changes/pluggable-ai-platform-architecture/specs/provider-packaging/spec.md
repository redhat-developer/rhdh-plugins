# Provider Packaging as Backstage Modules

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

Each AI platform provider must be packaged as an independent Backstage backend module, following RHDH dynamic plugin conventions. This enables deployers to install only the providers they need and allows providers to evolve independently.

## ADDED Requirements

### Requirement: ResponsesApiProvider as Backstage Backend Module

The Llama Stack provider is packaged as an independent Backstage backend module that registers via the extension point.

#### Scenario: Module registration

- **WHEN** the `plugin-boost-backend-module-llamastack` package is installed
- **THEN** it creates a `createBackendModule` with `pluginId: 'boost'` and `moduleId: 'llamastack'`
- **AND** it registers `ResponsesApiProviderFactory` via `boostProviderExtensionPoint` (AI capabilities — composable, accessed by the core backend)
- **AND** it composes `llamastack-entity-provider` internally, registering its entity providers via `catalogProcessingExtensionPoint`
- **AND** `llamastack-entity-provider` is also independently deployable as its own RHDH dynamic plugin (without boost)
- **AND** it depends on `coreServices.config` for Llama Stack connection settings
- **AND** it depends on `coreServices.logger` and `coreServices.cache` for operational services

#### Scenario: Dynamic plugin packaging

- **WHEN** the module is exported for RHDH dynamic plugin deployment
- **THEN** it is packaged as an OCI image via `@red-hat-developer-hub/cli plugin export`
- **AND** it is configured in `dynamic-plugins.yaml` as:
  ```yaml
  - package: oci://registry/boost-backend-module-llamastack:tag!boost-backend-module-llamastack-dynamic
    disabled: false
  ```
- **AND** it can be installed or removed independently of the core boost backend

#### Scenario: Module uses Backstage cacheService

- **WHEN** the Llama Stack module needs to cache model lists or auth tokens
- **THEN** it depends on `coreServices.cache` and uses `cache.set(key, value, { ttl: '60s' })`
- **AND** it does NOT create raw `Map<>` caches with manual TTL tracking
- **AND** cached data is Redis-backed in production for multi-instance safety

### Requirement: KagentiProvider as Backstage Backend Module

The Kagenti provider is packaged as an independent Backstage backend module.

#### Scenario: Module registration

- **WHEN** the `plugin-boost-backend-module-kagenti` package is installed
- **THEN** it creates a `createBackendModule` with `pluginId: 'boost'` and `moduleId: 'kagenti'`
- **AND** it registers `KagentiProviderFactory` via `boostProviderExtensionPoint` (AI capabilities — composable, accessed by the core backend)
- **AND** it composes `kagenti-entity-provider` internally, registering its entity providers via `catalogProcessingExtensionPoint`
- **AND** `kagenti-entity-provider` is also independently deployable as its own RHDH dynamic plugin (without boost)
- **AND** it depends on `coreServices.config` for Kagenti/Keycloak connection settings
- **AND** it depends on `coreServices.cache` for agent card caching and token management

#### Scenario: Agent card cache uses Backstage cacheService

- **WHEN** the Kagenti module caches agent cards (currently `KagentiAgentCardCache` with 5m TTL, max 500 entries)
- **THEN** it uses `coreServices.cache` with `cache.withOptions({ defaultTtl: { minutes: 5 } })`
- **AND** cache invalidation occurs on agent create/update/delete operations
- **AND** the unbounded growth risk of the current `Map<>` implementation is eliminated

#### Scenario: Keycloak token cache uses Backstage cacheService

- **WHEN** the Kagenti module caches Keycloak access tokens (currently `KeycloakTokenManager`)
- **THEN** it uses `coreServices.cache` with TTL derived from token expiry
- **AND** the token cache is Redis-backed in production for multi-instance safety

### Requirement: Standalone Toolkit Packages

Provider-internal subsystems with zero Backstage coupling are extracted as standalone packages.

#### Scenario: toolscope extracted as standalone package

- **WHEN** the `services/toolscope/` subsystem (29 files, zero Backstage dependencies) is needed
- **THEN** it is available as `@boost/toolscope`
- **AND** the embedding cache (currently unbounded `Map<>`) is replaced with an injectable cache interface
- **AND** the session cache (currently raw `Map<>` with 1h TTL, max 1000) uses the injected cache

#### Scenario: responses-api toolkit partially extracted

- **WHEN** shared Responses API utilities (prompt generation, tool execution patterns) are needed by multiple providers
- **THEN** they are available in a shared `providers/responses-api/` package
- **AND** provider-specific code does NOT import across provider boundaries (e.g., Kagenti importing from `responses-api/chat/promptGeneration` is eliminated)
