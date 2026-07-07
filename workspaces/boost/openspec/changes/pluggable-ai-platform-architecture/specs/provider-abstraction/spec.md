# Provider Abstraction

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

Boost abstracts AI platform backends behind a pluggable provider interface, enabling any AI platform to be integrated without forking the plugin.

## EXISTING Requirements

### Requirement: AgenticProvider Interface

The `AgenticProvider` interface defines the contract between Boost and any AI platform backend. Chat and streaming are required capabilities; RAG, safety, evaluation, and conversation management are optional capability objects.

#### Scenario: Provider implements required capabilities

- **WHEN** a provider is registered with `boostProviderExtensionPoint`
- **THEN** it must implement `chat(messages, options?)` and `chatStream(messages, options?)` methods
- **AND** `options` is an optional `ChatOptions` object with `userRef?: string` for user identity audit
- **AND** it must provide a `ProviderDescriptor` declaring its ID, name, and supported capabilities

#### Scenario: Provider declares optional capabilities

- **WHEN** a provider supports RAG, safety, evaluation, or conversation management
- **THEN** it exposes those as optional capability objects on the `AgenticProvider` interface
- **AND** the frontend gates features based on the declared capability matrix

### Requirement: Extension Point Registration

Providers register via a Backstage extension point, requiring zero Boost source code modification.

#### Scenario: External provider module registers via extension point

- **WHEN** a Backstage backend module depends on `boostProviderExtensionPoint`
- **THEN** it calls `addProvider()` to register its `AgenticProviderFactory`
- **AND** the provider appears in the admin panel's provider switcher on next startup

#### Scenario: Placeholder provider registration

- **WHEN** a provider factory is registered with `implemented: false`
- **THEN** it appears in the admin panel as a future placeholder
- **AND** attempting to switch to it returns a descriptive error

## ADDED Requirements

### Requirement: AI Provider Service Ref for Cross-Plugin Consumption

Other Backstage plugins MUST be able to consume the active AI provider via Backstage's dependency injection, not just register providers.

#### Scenario: External plugin consumes active AI provider

- **WHEN** a Backstage plugin declares a dependency on `boostAiProviderServiceRef`
- **THEN** it receives the currently active `AgenticProvider` instance
- **AND** it can call `chat()`, `chatStream()`, and any declared optional capabilities
- **AND** if the active provider is hot-swapped, the consuming plugin receives the new provider on next request

#### Scenario: Service ref declared in boost-node

- **WHEN** the `boostAiProviderServiceRef` is created via `createServiceRef` from `@backstage/backend-plugin-api`
- **THEN** it is exported from the `boost-node` package (`backstage.role: node-library`), not `boost-common` or `boost-backend`
- **AND** its type parameter is the `AgenticProvider` interface (imported from `boost-common`)
- **AND** its ID follows the pattern `boost.ai-provider`
- **AND** `boost-common` (`backstage.role: common-library`) has no dependency on `@backstage/backend-plugin-api` — keeping it safe for browser bundling

### Requirement: Shared Types in Common Package

Provider interfaces and conversation types MUST live in the common package so both frontend and backend can consume them without circular dependencies.

#### Scenario: AgenticProvider types moved to common

- **WHEN** the `AgenticProvider` interface, `ProviderDescriptor`, `ProviderCapabilities`, and `NormalizedStreamEvent` types are needed
- **THEN** they are imported from `@boost/plugin-boost-common`
- **AND** provider-specific types (e.g., `LlamaStackConfig`, `KagentiConfig`) remain in their respective provider modules — not in the common package

#### Scenario: Conversation types consolidated

- **WHEN** conversation types (`ConversationSummary`, `ConversationDetails`, `InputItem`) are needed
- **THEN** they are imported from `@boost/plugin-boost-common`
- **AND** they are no longer defined inside `providers/llamastack/conversationTypes.ts`
