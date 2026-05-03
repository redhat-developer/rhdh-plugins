# Augment Plugin -- Technical Reference

**Branch:** feat/kagenti-provider
**Companion to:** handover-slides.md (presentation deck)

This document is the written reference for engineers who need to develop, debug, or extend the Augment plugin. It covers every architectural layer with exact file paths and key code locations.

---

## 1. Package Structure

```
workspaces/augment/
  packages/
    app/          -- Backstage frontend app (development shell)
    backend/      -- Backstage backend app (development shell)
  plugins/
    augment-common/    -- Shared types, permissions, constants
    augment/           -- Frontend plugin (UI, hooks, API client)
    augment-backend/   -- Backend plugin (routes, providers, services)
```

| Package | npm Name | Backstage Role | Version |
|---------|----------|---------------|---------|
| augment-common | @red-hat-developer-hub/backstage-plugin-augment-common | common-library | 0.1.0 |
| augment | @red-hat-developer-hub/backstage-plugin-augment | frontend-plugin | 0.1.0 |
| augment-backend | @red-hat-developer-hub/backstage-plugin-augment-backend | backend-plugin | 0.1.0 |

---

## 2. Provider Abstraction

### 2.1 AgenticProvider Interface

**File:** `plugins/augment-backend/src/providers/types.ts` (lines 252-367)

Required methods:
- `initialize(): Promise<void>`
- `postInitialize(): Promise<void>`
- `getStatus(): Promise<AgenticProviderStatus>`
- `chat(request: ChatRequest): Promise<ChatResponse>`
- `chatStream(request: ChatRequest, onEvent: (event: NormalizedStreamEvent) => void, signal?: AbortSignal): Promise<void>`

Optional capabilities:
- `conversations?: ConversationCapability`
- `rag?: RAGCapability`
- `safety?: SafetyCapability`
- `evaluation?: EvaluationCapability`

Optional admin methods:
- `listModels?()`, `testModel?()`, `generateSystemPrompt?()`, `getEffectiveConfig?()`

### 2.2 Built-in Providers

**File:** `plugins/augment-backend/src/providers/registry.ts`

| Provider | ID | Class | Capabilities |
|----------|----|-------|-------------|
| LlamaStack | llamastack | ResponsesApiProvider | chat, rag, safety, evaluation, conversations, mcpTools, tools |
| Kagenti | kagenti | KagentiProvider | chat, mcpTools |
| Google ADK | googleadk | (stub) | Not implemented |

### 2.3 Provider Factory

**File:** `plugins/augment-backend/src/providers/factory.ts`

```typescript
switch (providerType) {
  case 'llamastack':
    return new ResponsesApiProvider({ logger, config, database, adminConfig });
  case 'kagenti':
    return new KagentiProvider({ logger, config });
  case 'googleadk':
    throw new Error('Google ADK provider is not yet implemented.');
  default:
    // Check extension-registered factories
}
```

### 2.4 ProviderManager (Hot-Swap)

**File:** `plugins/augment-backend/src/providers/ProviderManager.ts`

Strategy: create new -> initialize -> swap reference -> shutdown old. Mutex lock prevents concurrent swaps.

### 2.5 Extension Point

**File:** `plugins/augment-backend/src/extensions.ts`

Extension ID: `augment.providers`

External backend modules call `registerProvider(descriptor, factory)` to add custom providers.

---

## 3. LlamaStack Provider

### 3.1 Class Hierarchy

**Entry:** `plugins/augment-backend/src/providers/llamastack/ResponsesApiProvider.ts`

ResponsesApiProvider composes:
- ResponsesApiCoordinator (central wiring)
  - AdkOrchestrator (@augment-adk/augment-adk)
  - ClientManager (caches ResponsesApiClient, probes /v1/version)
  - ConfigResolutionService (YAML + DB merge, TTL cache)
    - ConfigLoader (raw YAML)
    - McpConfigLoader (MCP servers + auth)
  - McpAuthService (OAuth, K8s SA tokens, TLS)
  - AgentGraphManager (multi-agent resolution)
  - ChatDepsBuilder (per-agent dependencies)
  - VectorStoreFacade (lazy init, doc sync, search)
  - ConversationFacade (history persistence)
  - BackendApprovalHandler / BackendApprovalStore (HITL)
  - DocumentSyncService (scheduled sync)
- SafetyService (input/output shields)
- EvaluationService (quality scoring)
- StatusService / StatusAggregator (health)

### 3.2 Key Files

| File | Purpose |
|------|---------|
| `llamastack/ResponsesApiProvider.ts` | AgenticProvider implementation |
| `llamastack/ResponsesApiCoordinator.ts` | Central wiring, delegates to AdkOrchestrator |
| `llamastack/adk-adapters/AdkOrchestrator.ts` | @augment-adk/augment-adk integration |
| `llamastack/ClientManager.ts` | HTTP client caching |
| `llamastack/config/ConfigResolutionService.ts` | Config merge + cache |
| `llamastack/config/ConfigLoader.ts` | YAML config loading |
| `llamastack/config/McpConfigLoader.ts` | MCP server configs |
| `llamastack/auth/McpAuthService.ts` | MCP authentication |
| `llamastack/AgentGraphManager.ts` | Multi-agent graph |
| `llamastack/VectorStoreFacade.ts` | RAG lifecycle |
| `llamastack/safety/SafetyService.ts` | Safety shields |
| `llamastack/safety/EvaluationService.ts` | Quality evaluation |
| `llamastack/status/StatusService.ts` | Health checks |

### 3.3 Stream Normalization

**File:** `providers/responses-api/stream/StreamEventNormalizer.ts` (re-exported from `llamastack/index.ts`)

Maps Llama Stack SSE event types (response.output_text.delta, MCP call events, etc.) to NormalizedStreamEvent union.

---

## 4. Kagenti Provider

### 4.1 Class Hierarchy

**Entry:** `plugins/augment-backend/src/providers/kagenti/KagentiProvider.ts`

KagentiProvider composes:
- KagentiApiClient (REST + SSE to Kagenti API, ~50 endpoints)
- KagentiSandboxClient (sandbox operations)
- KagentiAdminClient (models, LLM, integrations)
- KeycloakTokenManager (OAuth2 client_credentials)
- KagentiStreamNormalizer (A2A -> NormalizedStreamEvent)
- KagentiAgentCardCache (5-min TTL, 500 max)
- kagentiApprovalHandler (HITL resume)

### 4.2 Key Files

| File | Purpose |
|------|---------|
| `kagenti/KagentiProvider.ts` | AgenticProvider implementation |
| `kagenti/client/KagentiApiClient.ts` | REST + SSE client |
| `kagenti/client/KagentiSandboxClient.ts` | Sandbox operations |
| `kagenti/client/KagentiAdminClient.ts` | Admin API |
| `kagenti/client/KeycloakTokenManager.ts` | OAuth2 token management |
| `kagenti/stream/KagentiStreamNormalizer.ts` | A2A event normalization |
| `kagenti/KagentiAgentCardCache.ts` | Agent card caching |
| `kagenti/kagentiApprovalHandler.ts` | HITL tool approval |
| `kagenti/kagentiConversationCapability.ts` | Conversation stubs |
| `kagenti/kagentiNamespaceUtils.ts` | Namespace resolution |
| `kagenti/config/KagentiConfigLoader.ts` | Config loading + validation |

### 4.3 Session Mapping

In-memory bounded LRU maps:
- `kagentiSessionMap`: backstageSessionId -> kagentiContextId
- `sessionAgentMap`: kagentiContextId -> agentId (namespace/name)
- Max entries: 10,000 per map
- Eviction: 10% batch when limit reached
- Primary lookup is in-memory, but chatRoutes.ts hydrates from DB on miss: if an in-memory entry is missing, it checks `sessions.getSession(sessionId, userRef).conversationId` and calls `kagenti.hydrateSessionContext()` to repopulate the map. Sessions are recoverable after restart, but not pre-loaded.

### 4.4 Agent Card Cache

- Key: `namespace/name`
- TTL: 5 minutes (AGENT_CARD_CACHE_TTL_MS)
- Max entries: 500 (overflow evicts oldest)
- Optional Zod validation when `config.validateResponses = true`
- Processes cards via @kagenti/adk/core handleAgentCard for demands/resolveMetadata

### 4.5 Stream Normalization

**File:** `kagenti/stream/KagentiStreamNormalizer.ts`

| A2A Status | NormalizedStreamEvent |
|-----------|----------------------|
| WORKING | stream.reasoning.delta |
| COMPLETED | stream.text.delta + stream.text.done + stream.completed |
| FAILED | stream.error (from ERROR_EXTENSION_URI) |
| CANCELED | stream.completed |
| REJECTED | stream.error (kagenti_rejected) |
| INPUT_REQUIRED | stream.form.request or stream.tool.approval |
| AUTH_REQUIRED | stream.auth.required |
| Artifact update | stream.artifact + stream.text.delta |
| JSON-RPC error | stream.error (-32603 triggers streaming fallback) |

Also handles: TRAJECTORY_EXTENSION_URI (reasoning), CITATION_EXTENSION_URI (citations), agent handoff detection.

### 4.6 Keycloak Authentication

**File:** `kagenti/client/KeycloakTokenManager.ts`

- Grant type: client_credentials
- Token endpoint: configurable via `augment.kagenti.auth.tokenEndpoint`
- Expiry buffer: configurable (default 60s)
- Streaming: `getTokenForStreaming(minLifetimeMs)` discards cache if remaining lifetime is insufficient
- TLS: optional skipTlsVerify
- 401 handling: `clearCache()` bumps generation, clears token + pending promise

### 4.7 HITL Approval

**File:** `kagenti/kagentiApprovalHandler.ts`

Three approval types:
1. **Generic:** approval metadata with callId, approved, toolName, reason, toolArguments
2. **secrets_response:** parses JSON map -> ADK auth/secrets extension URI
3. **oauth_confirm:** sends OAuth redirect confirmed extension

All approvals resume via `apiClient.chatStream` with contextId + metadata in A2A payload.

### 4.8 Kagenti API Endpoints (called by KagentiApiClient)

**Unprefixed:** GET /health, GET /ready

**Under /api/v1:**
- Auth: /auth/config, /auth/status, /auth/userinfo, /auth/me
- Config: /config/features, /config/dashboards
- Namespaces: /namespaces
- Chat: /chat/{ns}/{name}/agent-card, /send, /stream
- Agents: CRUD /agents, migration, Shipwright builds, env parsing
- Tools: CRUD /tools, connect, invoke, Shipwright builds
- Contexts: /contexts/{id}/history

---

## 5. Backend Routes

### 5.1 Route Registration Order

**File:** `plugins/augment-backend/src/router.ts`

```
1. registerStatusRoutes         -- /health, /status, /branding (PUBLIC)
2. router.use(requirePluginAccess)  -- auth gate
3. registerChatRoutes           -- /chat, /chat/stream, /chat/approve
4. registerDocumentRoutes       -- /documents, /sync, /safety/status, /evaluation/status
5. registerConfigRoutes         -- /workflows, /quick-actions, /prompt-groups
6. registerSessionRoutes        -- /sessions CRUD
7. registerConversationRoutes   -- /conversations CRUD
8. registerAdminRoutes          -- /admin/* (requireAdminAccess inside)
9. if (provider.id === 'kagenti'):
     registerKagentiRoutes      -- /kagenti/*
     registerKagentiSandboxRoutes
     registerKagentiAdminRoutes
```

### 5.2 SSE Streaming Implementation

**File:** `plugins/augment-backend/src/routes/chatRoutes.ts`

Key functions:
- `setupSseStream(res, logger)` -- sets headers, creates AbortController, links to res.close
- `createStreamEventForwarder(res, logger, ...)` -- writes `data: JSON\n\n`, handles backpressure
- `handleStreamErrorAndCleanup(res, error, ...)` -- sends stream.error event, ends response

Headers:
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
X-Accel-Buffering: no
Content-Encoding: identity
```

Completion: `data: [DONE]\n\n` + `res.end()`

---

## 6. Frontend Architecture

### 6.1 Plugin Registration

**File:** `plugins/augment/src/plugin.ts`

- createPlugin({ id: 'augment' }) with rootRouteRef
- API factory: augmentApiRef -> AugmentApiClient
- Routable extension: AugmentPage (lazy loaded)
- Icon: AugmentIcon

### 6.2 Page Structure

**File:** `plugins/augment/src/components/AugmentPage/AugmentPage.tsx`

Two modes controlled by useAdminView (localStorage):
- Chat mode: ChatContainer + RightPane
- Admin mode: provider-specific sidebar + panels

Provider-conditional rendering: `liveStatus?.providerId === 'kagenti'` switches between KagentiSidebar and CommandCenterHeader.

### 6.3 Component Directory

**Shared (both providers):**
- ChatContainer/ -- main chat shell, virtualized message list
- ChatMessage/ -- message rendering (markdown, math, tools, RAG)
- StreamingMessage/ -- live streaming with reducer state machine
- WelcomeScreen/ -- prompt groups + workflows
- ChatInput/ -- multiline input, attachments
- ConversationHistory/ -- session list, search, grouping
- RightPane/ -- sidebar with agent info, status
- ToolApprovalDialog/ -- HITL approval UI

**LlamaStack admin:**
- AdminPanels/ModelToolsPanel/ -- model, tools, MCP, RAG, safety
- AdminPanels/AgentsPanel/ -- multi-agent editor
- AdminPanels/BrandingPanel/ -- branding customization

**Kagenti admin:**
- AdminPanels/KagentiPanels/ -- 7 panels + wizards (agents, tools, builds, sandbox, dashboard links, admin, home)

### 6.4 Hook Inventory

**Core chat:** useStreamingChat, useStreamingStateBatching, useChatSessions, useToolApproval, useChatKeyboardShortcuts, useScrollToBottom

**Data fetching:** useApiQuery (generic), useBackendStatus, useStatus (30s poll), useBranding, useWelcomeData

**Admin:** useAdminView, useAdminConfig, useEffectiveConfig, useConfigSync, useModels, useProviders, useGeneratePrompt, useFormState, useToast

**RAG:** useDocuments, useVectorStoreConfig, useVectorStores, useRagTest, useRagGenerate, useFileUpload

**Kagenti:** useKagentiToolsList, useKagentiToolDetail, useKagentiAgentDetail, useAgentWizardForm, useToolWizardForm, useToolInvoke, useAgentTemplates

### 6.5 API Client Modules

**File:** `plugins/augment/src/api/`

| Module | Endpoints |
|--------|-----------|
| chatEndpoints | POST /chat, /chat/stream, /chat/approve |
| sessionEndpoints | CRUD /sessions, admin listing |
| conversationEndpoints | /conversations (by response, by conversation, chain) |
| documentEndpoints | RAG admin: vector stores, documents, rag-test |
| adminEndpoints | Providers, models, config CRUD, safety/eval status |
| kagentiEndpoints/ | All /kagenti/* endpoints (health, agents, tools, sandbox, admin) |

---

## 7. Security

### 7.1 Three Security Modes

**Config:** `augment.security.mode` (default: 'plugin-only')

**File:** `plugins/augment-backend/src/middleware/security.ts`

| Mode | Plugin Access | Admin Access | User Identity |
|------|--------------|-------------|---------------|
| none | Skipped | Everyone | user:default/guest |
| plugin-only | augment.access permission | adminUsers allow-list | Real user principal |
| full | augment.access permission | augment.admin permission | Real user principal |

### 7.2 Permissions

**File:** `plugins/augment-common/src/permissions.ts`

- `augment.access` -- action: 'read' (basic plugin access)
- `augment.admin` -- action: 'update' (admin features)

### 7.3 Kagenti-Specific Security

- Keycloak OAuth2 via KeycloakTokenManager (client_credentials)
- Namespace validation via validateNamespaceParam (403 for unauthorized)
- User context propagation via X-Backstage-User header

---

## 8. Configuration

### 8.1 Config Schema

**File:** `plugins/augment-backend/config.d.ts`

Key blocks:
- `augment.provider` -- 'llamastack' | 'kagenti'
- `augment.security.*` -- mode, adminUsers, mcpOAuth
- `augment.llamaStack.*` -- baseUrl, model, token, TLS, toolChoice, RAG, etc.
- `augment.kagenti.*` -- baseUrl, namespace, auth, sandbox, builds, etc. (~250 lines)
- `augment.documents.*` -- sources, sync schedule
- `augment.mcpServers.*` -- MCP server configs
- `augment.branding.*` -- app name, colors, logos
- `augment.safety.*` / `augment.evaluation.*`
- `augment.promptGroups.*` -- welcome screen cards

### 8.2 Config Precedence

YAML baseline -> DB admin overrides (AdminConfigService) -> RuntimeConfigResolver (TTL cache)

### 8.3 DB Tables

| Table | Service | Purpose |
|-------|---------|---------|
| augment_admin_config | AdminConfigService | JSON key-value for admin overrides |
| augment_sessions | ChatSessionService | Chat sessions per user |

---

## 9. Shared Types (augment-common)

### 9.1 Streaming Protocol

**File:** `plugins/augment-common/src/types/streaming.ts`

NormalizedStreamEvent is a discriminated union of 16+ event types that both providers must produce. The frontend reducer only processes these shapes.

### 9.2 Config Keys

**File:** `plugins/augment-common/src/types/provider.ts`

- `BuiltInProviderType = 'llamastack' | 'googleadk' | 'kagenti'`
- `GLOBAL_CONFIG_KEYS` -- systemPrompt, branding, promptGroups, etc.
- `PROVIDER_SCOPED_KEYS` -- stored as `provider::key` in DB
- `scopedConfigKey(provider, key)` / `isProviderScopedKey(key)` helpers

### 9.3 Kagenti Types

**File:** `plugins/augment-common/src/types/kagenti.ts`

Shared DTOs for agents, tools, agent cards, builds, sandbox, integrations, LLM teams/keys, triggers, Dev Spaces.

---

## 10. Known Issues and Gotchas

1. **Kagenti session mapping is in-memory with DB hydration** -- maps are cleared on restart but chatRoutes hydrates from DB conversationId on first access (MEDIUM)
2. **Kagenti conversations capability is stubs** -- history via local DB only (MEDIUM)
3. **Kagenti listModels calls LlamaStack** -- cross-provider dependency (MEDIUM)
4. **Streaming fallback on -32603** -- no incremental output (LOW)
5. **googleadk is a stub** -- factory throws if selected (LOW)
6. **kagenti.ts types are large** -- consider splitting (LOW)
