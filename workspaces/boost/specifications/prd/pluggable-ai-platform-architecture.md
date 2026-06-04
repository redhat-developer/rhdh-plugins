# PRD: Pluggable AI Platform Architecture

**Product:** Boost — Agentic Developer Portal for Red Hat Developer Hub
**Status:** Requirements for new implementation (informed by Augment reference prototype)
**Date:** 2026-05-19
**Updated:** 2026-06-02 — reframed for boost; providers as RHDH dynamic plugins from day one, cacheService throughout, capability-based gating, catalog entity integration
**Priority:** P0
**Provenance:** Requirements derived from Augment plugin analysis. See `specifications/boost-context.md` for project context.

---

## Why

Enterprise customers run different AI platforms — and they change their minds. A platform that hard-codes a single AI backend becomes a liability: vendor lock-in, inability to evaluate alternatives, and deployment friction when the AI strategy evolves. Augment must be the experience layer that sits above any AI platform, not a client of one specific platform.

This PRD defines the pluggable provider architecture that makes Augment provider-agnostic: the abstraction interface, the normalized streaming protocol, runtime hot-swap, multi-agent orchestration via Llama Stack, and the framework-neutral Kagenti integration.

## What This Product Does

Boost abstracts AI platform backends behind a provider interface. Each provider is packaged as an independent RHDH dynamic plugin from day one. Multiple providers (Llama Stack, Kagenti, future platforms) are registered via a Backstage extension point and can be hot-swapped at runtime without downtime. Each provider's native events are normalized into a common streaming protocol so the frontend works identically regardless of which backend is active. The UI adapts via capability-based feature gating — never provider identity checks. All operational caches use Backstage `cacheService` from the start.

## Who It's For

### Professional Developer (Provider Integrator)

Implements the `AgenticProvider` interface to add a new AI platform backend. Creates a Backstage backend module that registers the provider — no modification to Augment source code required.

### Administrator

Hot-swaps between configured providers at runtime. Monitors capability differences between providers.

## Boundaries

### In Scope

- Provider abstraction interface (`AgenticProvider`, `ProviderDescriptor`, `AgenticProviderFactory`)
- `augmentAiProviderServiceRef` for cross-plugin provider consumption
- Backstage extension point for provider registration
- Provider types and interfaces in `augment-common` (not locked inside plugin)
- Normalized streaming protocol (`NormalizedStreamEvent`)
- Runtime provider hot-swap with rollback on failure
- Capability-based frontend feature gating (replacing provider ID string checks)
- Provider-adaptive chat experience (UI adapts per provider)
- Each provider packaged as an independent RHDH dynamic plugin
- Backstage `cacheService` for all operational caches (replacing home-grown `Map<>` caches)
- Llama Stack multi-agent orchestration (config-driven agents, handoffs, agents-as-tools)
- Kagenti provider (A2A protocol, K8s agent operations)
- ADK orchestration library (`@augment-adk/augment-adk`)
- Future provider placeholders (Google ADK)

### Out of Scope

- Chat UI and message rendering (see AI Chat & Interaction PRD)
- Agent creation and gallery (see Agent Creation & Discovery PRD)
- Safety shields and access control (see Security & Governance PRD)
- Admin panels and runtime config (see Platform Operations PRD)

---

## Capabilities

### 1. Provider Abstraction (Epic 1, Feature 1.1)

**Goal:** Integrate any AI platform without forking the plugin.

**How it works:**

- `AgenticProvider` interface: `chat()` and `chatStream()` are required capabilities; RAG, safety, evaluation, and conversation are optional capability objects
- `ProviderDescriptor` declares the provider's ID, name, and supported capabilities
- `AgenticProviderFactory` instantiates the provider from config
- Registration via `augmentProviderExtensionPoint` in a Backstage backend module
- No Augment source modification required

**Built-in providers:**

- `ResponsesApiProvider` (Llama Stack): full-featured — chat, RAG, safety, evaluation, conversation
- `KagentiProvider` (Kagenti): K8s-native agent operations via A2A protocol

### 2. Normalized Streaming Protocol (Epic 1, Feature 1.2)

**Goal:** One event contract between all backend providers and the frontend.

**How it works:**

- `NormalizedStreamEvent` union type in the common package covers all `stream.*` events: text deltas, reasoning, tool calls, RAG results, handoffs, approvals, forms, auth, artifacts, citations, completion, errors
- Each provider implements a stream normalizer mapping native events to `NormalizedStreamEvent`
- **Llama Stack:** `normalizeLlamaStackEvent()`
- **Kagenti:** `KagentiStreamNormalizer` mapping A2A `TaskStatusUpdateEvent`/`TaskArtifactUpdateEvent`
- Frontend `StreamingMessage.reducer` processes normalized events identically regardless of source

### 3. Provider Hot-Swap (Epic 1, Feature 1.3)

**Goal:** Switch AI platform providers at runtime without downtime or data loss.

**How it works:**

1. Admin selects a different provider in the admin panel
2. `ProviderManager.switchProvider()`: start new provider → fully initialize → swap active pointer → shutdown old
3. On initialization failure: automatic rollback to previous provider with error notification
4. Frontend detects provider change and performs full reset: cancel active stream, reset conversation, clear messages, reset agent selection, clear input, trigger `onNewChat()`
5. UI adapts via capability-based feature gating: features unsupported by the new provider are hidden

**Frontend adaptation details:**

- Chat state reset on `providerId` change (Story 1.5.1)
- Mandatory agent selection for Kagenti, free-form for Llama Stack (Story 1.5.2)
- Welcome screen adapts: gallery strip for Kagenti, prompt groups for Llama Stack (Story 1.5.3)
- Agent info section adapts content per provider (Story 1.5.4)
- Conversation history scoped by `providerId` (Story 1.5.5)
- Chat header adapts: full for Kagenti, minimal for Llama Stack (Story 1.5.6)
- Admin shell adapts: KagentiSidebar (8 panels) vs CommandCenterHeader (3 panels) (Story 1.5.7)

### 4. Integrate a New AI Platform Provider (UC-14)

**Goal:** Add a new AI platform backend beyond Llama Stack and Kagenti.

**Developer workflow:**

1. Implement `AgenticProvider` interface (chat/chatStream required, optional capabilities)
2. Create `ProviderDescriptor` declaring ID, name, supported capabilities
3. Create `AgenticProviderFactory` that instantiates from config
4. Register via `augmentProviderExtensionPoint` in a Backstage backend module
5. Deploy module alongside Augment backend
6. New provider appears in admin panel's provider switcher — zero Augment source changes

**Stream normalization:** Implement a stream normalizer mapping native events to `NormalizedStreamEvent` types.

**Placeholder pattern:** Register provider with `implemented: false` as future placeholder (e.g., Google ADK).

**Epics/Stories:** Epic 1 (Features 1.1-1.4)

### 5. Switch AI Provider at Runtime (UC-16)

**Goal:** Hot-swap between AI platform providers at runtime without downtime.

**Admin workflow:**

1. Open admin panel → provider switcher
2. View available providers with capabilities highlighted, active provider marked
3. Select different provider
4. Backend starts new provider, initializes fully, swaps pointer, shuts down old
5. Frontend auto-adapts: chat state resets, agent selection clears, admin sidebar switches, welcome screen updates, history re-scopes

**Rollback:** If new provider fails to start, system rolls back automatically. Error notification shown.

**Epics/Stories:** Epic 1 (Feature 1.3, Feature 1.5)

### 6. Multi-Agent Orchestration — Llama Stack (Epic 2)

**Goal:** Config-driven multi-agent orchestration without writing code.

**How it works:**

- Agents defined in YAML or admin config: name, instructions, tools, model, temperature, handoffs
- Assembled into `POST /v1/responses` calls against the Llama Stack endpoint
- `ResponsesApiCoordinator` generates `transfer_to_{agent}` functions for handoff routing
- Router agent delegates to specialists mid-conversation; context maintained via shared conversation ID
- Agents-as-tools pattern: `call_{agent}` for manager-specialist delegation while keeping control
- Per-agent config: model, temperature, max tokens, tool choice, MCP server subsets, vector store IDs

**ADK library:** `@augment-adk/augment-adk` handles agent continuity, turn counting, handoff logic, tool execution.

**Epics/Stories:** Epic 2 (Features 2.1)

### 7. Kagenti — Framework-Neutral Agent Operations (Epic 3, Feature 3.1)

**Goal:** Agents built in any framework (LangGraph, CrewAI, AG2, custom) are accessible via RHDH.

**How it works:**

- `KagentiProvider` with `KagentiApiClient`: Keycloak OAuth2, retry, namespace-scoped calls
- Speaks A2A protocol over SSE
- `KagentiStreamNormalizer` maps A2A events to `NormalizedStreamEvent`
- Agents deployed as K8s workloads, discovered via A2A protocol
- Namespace-scoped multi-tenancy with backend-enforced allowlists

**Epics/Stories:** Epic 3 (Features 3.1, 3.6)

### 8. Providers as RHDH Dynamic Plugins

**Goal:** Each AI platform provider is packaged as an independent RHDH dynamic plugin that can be installed, removed, and upgraded independently.

**How it works:**

- Each provider is a `createBackendModule` (not a standalone plugin) that registers via `augmentProviderExtensionPoint`
- Provider modules have IDs: `llamastack` and `kagenti`
- Both are exported as OCI images for RHDH dynamic plugin loading
- Deployers install only the providers they need — no unused provider code loaded
- Provider modules depend on `augment-common` for shared types and `augmentAiProviderServiceRef`
- Boost ships modular from day one — no monolithic fallback needed

**RHDH deployment example:**

```yaml
# dynamic-plugins.override.yaml
- package: @augment/plugin-augment-backend-module-llamastack
  integrity: sha512-...
  disabled: false
- package: @augment/plugin-augment-backend-module-kagenti
  integrity: sha512-...
  disabled: false
```

### 9. Backstage cacheService Migration

**Goal:** Replace all home-grown `Map<>` caches with Backstage `cacheService` for Redis backing, consistent TTL semantics, multi-instance safety, and proper cache invalidation.

**Current state:** 17 caches identified across the codebase. Only 2 have been migrated to `cacheService` (KagentiAgentCardCache, Kagenti modelsCache). The remaining 15 use raw `Map<>` objects with inconsistent TTL, no size bounds, and no multi-instance coordination.

**Migration strategy:**

| Cache                              | Location                                                        | TTL                 | Priority | Notes                                                |
| ---------------------------------- | --------------------------------------------------------------- | ------------------- | -------- | ---------------------------------------------------- |
| RuntimeConfigResolver              | `services/RuntimeConfigResolver.ts`                             | 30s                 | P0       | Immediate invalidation on write via `cache.delete()` |
| ResponsesApiProvider.\_modelsCache | `providers/llamastack/ResponsesApiProvider.ts`                  | Match Kagenti       | P1       | Eliminates model cache asymmetry                     |
| McpAuthService tokens              | `providers/llamastack/auth/McpAuthService.ts`                   | From token expiry   | P1       | Security-sensitive                                   |
| KeycloakTokenManager               | `providers/kagenti/client/KeycloakTokenManager.ts`              | From token expiry   | P1       | Security-sensitive                                   |
| BackendToolExecutor                | `providers/responses-api/tools/BackendToolExecutor.ts`          | 5 min               | P1       | Add max size limit                                   |
| ConversationRegistry               | `providers/responses-api/conversations/ConversationRegistry.ts` | 24h                 | P1       | Replaces unbounded Map                               |
| DocumentSyncService                | `providers/responses-api/documents/DocumentSyncService.ts`      | No expiry           | P2       | Content hash tracking                                |
| KagentiProvider session maps       | `providers/kagenti/KagentiProvider.ts`                          | Session duration    | P2       | Session correlation                                  |
| ClientManager                      | `providers/llamastack/ClientManager.ts`                         | Identity-keyed      | P2       | HTTP client instances                                |
| EmbeddingCache (toolscope)         | `services/toolscope/cache.ts`                                   | Unbounded → bounded | P2       | Via injectable `CacheAdapter`                        |
| SessionCache (toolscope)           | `services/toolscope/session.ts`                                 | 1h                  | P2       | Via injectable `CacheAdapter`                        |
| ConfigResolutionService            | `providers/llamastack/config/ConfigResolutionService.ts`        | Delegates           | P2       | Wrapper around RuntimeConfigResolver                 |
| conversationAgents                 | `OpenAIAgentsOrchestrator.ts`                                   | Session-scoped      | P3       | New cache                                            |
| rateLimiter store                  | `middleware/rateLimiter.ts`                                     | Per-window          | P3       | New cache                                            |
| BackendApprovalStore.pending       | `responses-api/tools/BackendApprovalStore.ts`                   | Request-scoped      | P3       | HITL approvals                                       |

**Design principle:** All providers must use `cacheService` consistently — no asymmetry between Kagenti (cacheService) and Llama Stack (raw Map). Caches use namespace isolation (`coreServices.cache` with provider-specific namespace prefixes).

---

## Architecture Context

**Core design principle:** Augment is the **experience layer** — the AI frontend and orchestration surface. It does not run models, serve inference, or manage GPUs. Those come from the underlying AI platform (OpenShift AI, Kagenti infrastructure, or customer-provided backends).

**Provider capability system:**

```
AgenticProvider (in augment-common)
├── chat() / chatStream()     — required
├── rag?                      — optional
├── safety?                   — optional
├── evaluation?               — optional
└── conversation?             — optional

augmentAiProviderServiceRef (in augment-common)
└── enables cross-plugin consumption of the active provider

ProviderManager
├── switchProvider()          — start new, swap, shutdown old
├── getActiveProvider()       — current provider
└── rollback()                — on failure
```

**Modular packaging:**

```
boost-backend (core plugin)
├── augmentProviderExtensionPoint       — provider registration interface
├── ProviderManager                     — lifecycle, swap, rollback
├── McpEntityProvider                   — MCP server catalog entities (cross-cutting)
├── VectorStoreEntityProvider           — vector store catalog entities (cross-cutting)
├── composes llamastack-entity-provider — (when Llama Stack provider module installed)
├── composes kagenti-entity-provider    — (when Kagenti provider module installed)
└── core routes, services, middleware

plugin-boost-backend-module-llamastack (RHDH dynamic plugin)
├── ResponsesApiProvider                — Llama Stack AI capabilities
├── normalizeLlamaStackEvent()          — stream normalizer
├── composes llamastack-entity-provider — catalog entities
├── registers via augmentProviderExtensionPoint
└── registers via catalogProcessingExtensionPoint

plugin-boost-backend-module-kagenti (RHDH dynamic plugin)
├── KagentiProvider                     — A2A protocol AI capabilities
├── KagentiStreamNormalizer             — stream normalizer
├── composes kagenti-entity-provider    — catalog entities
├── registers via augmentProviderExtensionPoint
└── registers via catalogProcessingExtensionPoint

llamastack-entity-provider (independently deployable RHDH dynamic plugin)
├── LlamaStackModelEntityProvider       — model catalog entities
├── LlamaStackAgentEntityProvider       — agent catalog entities
├── Backstage backend service
└── usable standalone (without boost) OR composed into boost

kagenti-entity-provider (independently deployable RHDH dynamic plugin)
├── KagentiAgentEntityProvider          — agent catalog entities
├── KagentiToolEntityProvider           — tool catalog entities
├── Backstage backend service
└── usable standalone (without boost) OR composed into boost
```

**Two deployment modes for entity providers:**

1. **Standalone:** An RHDH deployment installs `llamastack-entity-provider` or `kagenti-entity-provider` as independent dynamic plugins to get AI domain objects in their catalog — without the full boost portal. Useful for teams that use Llama Stack or Kagenti directly but want catalog discoverability.
2. **Composed:** When the full `boost-backend` is installed with provider modules, the same entity provider packages are composed internally. Installing a provider module gives you both AI capabilities and catalog entities.

**Provider abstraction enforcement:**

- Frontend: capability-based checks (`capabilities?.agentCatalog`, `capabilities?.agentCards`) — not `providerId === 'kagenti'` string checks
- Backend: provider-specific routes confined to provider module directories — no `as KagentiProvider` casts in shared routes
- Common package: `AgenticProvider` interface and conversation types — not 559 lines of Kagenti-specific types
- All operational caches use Backstage `cacheService` consistently across providers — no asymmetric caching

**Streaming pipeline (end-to-end):**

```
ChatInput → AugmentApiClient → POST /chat/stream
    → chatRoutes.ts → setupSseStream → createStreamEventForwarder
    → provider.chatStream() → provider normalizer
    → NormalizedStreamEvent → SSE → sseStreaming.ts
    → useStreamingStateBatching → StreamingMessage.reducer
    → VirtualizedMessageList
```

---

## Traceability

| Capability                        | Use Case        | Priority | Stories                   |
| --------------------------------- | --------------- | -------- | ------------------------- |
| Provider Abstraction              | UC-14           | P1       | 1.1.1-1.1.3, 1.2.1, 1.4.1 |
| Provider Hot-Swap                 | UC-16           | P0       | 1.3.1-1.3.3, 1.5.1-1.5.7  |
| Multi-Agent Orchestration         | (UC-1 related)  | P0       | 2.1.1-2.1.6               |
| Kagenti Provider                  | (UC-1 related)  | P0       | 3.1.1-3.1.2               |
| Providers as RHDH Dynamic Plugins | (new)           | P0       | (new)                     |
| cacheService Migration            | (cross-cutting) | P1       | (new)                     |

---

## Customer Context

Derived from the Citi engagement. Key architecture principle: "Provider-agnostic. Multiple AI backends supported through a pluggable provider interface. No lock-in to any model serving platform or agent framework."

Citi runs their own AI infrastructure and needs to switch between providers as their AI strategy evolves. The pluggable architecture ensures Augment is the stable surface while backends change underneath.
