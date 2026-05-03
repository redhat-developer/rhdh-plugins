# Augment Plugin -- Engineering Handover
## Slide Deck Content + Speaker Notes

**Branch:** feat/kagenti-provider
**Duration:** 90 minutes
**Audience:** RHDH plugin engineering team

---

## SLIDE 1 -- Title

### On Slide:
**Augment Plugin -- Engineering Handover**

Branch: feat/kagenti-provider
Red Hat Developer Hub Plugins

### Speaker Notes:
This session covers the full architecture of the Augment plugin -- an AI chat assistant plugin for Red Hat Developer Hub (Backstage). We will walk through both provider implementations (LlamaStack and Kagenti), the streaming pipeline, the frontend, security, and the admin Command Center. The goal is that by the end of this session, you can independently develop, debug, and extend any part of this plugin. All code is on the feat/kagenti-provider branch of redhat-developer/rhdh-plugins.

---

## SLIDE 2 -- Why This Plugin Exists (5 min)

### On Slide:
- **Augment** = AI chat assistant embedded in RHDH (Backstage)
- Two provider backends:
  - **LlamaStack** -- full AI stack (chat, RAG, safety, evaluation, multi-agent)
  - **Kagenti** -- Kubernetes-native agent operations platform
- Single plugin surface, provider-switchable via `app-config.yaml`
- One line to switch: `augment.provider: 'llamastack'` or `augment.provider: 'kagenti'`

### Speaker Notes:
The Augment plugin gives RHDH users an AI chat experience directly inside the developer portal. It is designed to be provider-agnostic -- you configure which AI backend to use in app-config.yaml and the entire plugin adapts. LlamaStack is the original, full-featured provider that owns the entire AI runtime. Kagenti was added on this branch as a second first-class provider targeting Kubernetes-native agent operations -- it manages agent lifecycle, builds, and execution on K8s instead of owning the inference pipeline. The key architectural insight is that both providers normalize to the same streaming contract, so the frontend works identically regardless of which backend is active.

---

## SLIDE 3 -- Package Topology (5 min)

### On Slide:
**[SCREENSHOT: augment-package-topology.canvas.tsx]**

Three packages in `workspaces/augment/plugins/`:
1. `augment-common` -- Types, Permissions, Constants (common-library)
2. `augment` -- Frontend UI, Hooks, API Client (frontend-plugin)
3. `augment-backend` -- Express Routes, Providers, Services (backend-plugin)

External dependencies:
- `@augment-adk/augment-adk` -- ADK orchestration for LlamaStack
- `@kagenti/adk` -- A2A protocol handling for Kagenti
- `@modelcontextprotocol/sdk` -- MCP client

### Speaker Notes:
Three packages in the workspace, following standard Backstage plugin conventions. Common holds the shared contract -- types, permissions, and streaming event definitions. It is the bridge that keeps frontend and backend in sync. Frontend is a single Backstage frontend-plugin with one routable extension -- the entire chat and admin UI is behind a single mount point. Backend is where the complexity lives: Express routes, two full provider implementations, database services, and security middleware. Both providers live inside augment-backend as subdirectories, not as separate packages. Call out the two external SDKs: @augment-adk/augment-adk is Google's ADK used as the orchestration layer inside LlamaStack, and @kagenti/adk provides A2A protocol handling for the Kagenti provider.

**Live code:** Show `workspaces/augment/package.json` -- the workspace definition with packages/* and plugins/*.

---

## SLIDE 4 -- Provider Abstraction: The Core Design Decision (10 min)

### On Slide:
**The `AgenticProvider` interface** (providers/types.ts, lines 252-367):

Required methods:
- `initialize()` / `postInitialize()`
- `getStatus()` -- health and connectivity
- `chat(request)` -- synchronous chat
- `chatStream(request, onEvent, signal)` -- SSE streaming

Optional capabilities (interfaces):
- `conversations` -- history persistence
- `rag` -- vector stores, documents, search
- `safety` -- input/output shields
- `evaluation` -- quality scoring

Supporting infrastructure:
- `ProviderManager` -- hot-swap with mutex lock
- `factory.ts` -- switch on `augment.provider` config
- `registry.ts` -- built-in descriptors + dynamic registration
- `extensions.ts` -- `augment.providers` extension point for third-party

### Speaker Notes:
This is the most important architectural decision in the plugin. The AgenticProvider interface is the boundary between the HTTP layer and any AI runtime. The router never calls LLM APIs directly -- it always goes through the provider. This means you can swap the entire AI backend without changing any route handler.

Walk the team through providers/types.ts lines 252-367. Point out that chat and chatStream are the only required methods -- everything else is optional. This lets providers declare what they support: LlamaStack supports everything; Kagenti supports chat and tools but not RAG or safety.

Show the ProviderManager class -- it does hot-swap with a mutex: create new provider -> initialize -> swap the reference -> shutdown old. This ensures no service gap during a provider switch. The factory.ts switch statement is simple: 'llamastack' -> ResponsesApiProvider, 'kagenti' -> KagentiProvider.

The extension point at extensions.ts is important for the team to know: any backend module can register a custom provider by calling registerProvider(descriptor, factory) on the augment.providers extension point. This is how third-party providers would be added without forking the plugin.

**Live code:** Open providers/types.ts, factory.ts, registry.ts in sequence.

---

## SLIDE 5 -- Provider Capability Comparison (part of slide 4)

### On Slide:
**[SCREENSHOT: augment-provider-comparison.canvas.tsx]**

### Speaker Notes:
Walk through each row of the capability matrix. Key takeaways: LlamaStack owns the full AI runtime -- models, RAG, safety, evaluation. Kagenti delegates to a K8s platform that manages agent lifecycle. They have complementary strengths. Note that Kagenti listModels actually calls the LlamaStack endpoint -- this is a design choice for model management reuse, but it means the Kagenti config still needs a valid augment.llamaStack.baseUrl if you want model listing. Also note that Kagenti has agent and tool lifecycle management (create, build, deploy, delete) which LlamaStack does not have -- LlamaStack's agents are configured in YAML/admin config, not dynamically built on K8s.

---

## SLIDE 6 -- LlamaStack Provider Deep Dive (10 min)

### On Slide:
**[SCREENSHOT: augment-llamastack-architecture.canvas.tsx]**

Key classes:
- `ResponsesApiProvider` -- the AgenticProvider implementation
- `ResponsesApiCoordinator` -- central wiring, delegates to AdkOrchestrator
- `AdkOrchestrator` -- uses @augment-adk/augment-adk for orchestration
- `ClientManager` -- caches ResponsesApiClient instances
- `ConfigResolutionService` -- merges YAML + DB config with TTL cache
- `VectorStoreFacade` -- lazy vector store init + RAG lifecycle
- `SafetyService` / `EvaluationService` -- input/output checks
- `McpAuthService` -- OAuth client_credentials, K8s SA tokens

### Speaker Notes:
Walk through ResponsesApiProvider.ts. The key insight is that chat and chatStream both go through AdkOrchestrator, which uses Google's ADK library. This is NOT a separate Google ADK provider -- it is the orchestration runtime used inside the LlamaStack provider for single-agent and multi-agent workflows.

Show the ResponsesApiCoordinator -- it is the central wiring class that creates and connects all the services. During initialization, OrchestratorInitializer validates config, loads security settings, sets up the API client, and optionally creates RuntimeConfigResolver for admin DB overrides.

Point out ConfigResolutionService: it merges YAML baseline with DB admin overrides, caches with a TTL, and invalidates on admin writes. This is how admin panel changes take effect without a restart.

VectorStoreFacade does lazy initialization -- ensureVectorStoreReady() is called on first RAG use, not at startup. This means the plugin starts fast even if the vector store is slow to connect.

McpAuthService handles MCP server authentication: OAuth client_credentials, Kubernetes service account tokens, header injection, and TLS control.

**Live code:** Open ResponsesApiProvider.ts, then ResponsesApiCoordinator.ts.

---

## SLIDE 7 -- Kagenti Provider Deep Dive (15 min)

### On Slide:
**[SCREENSHOT: augment-kagenti-architecture.canvas.tsx]**

Key classes:
- `KagentiProvider` -- the AgenticProvider implementation
- `KagentiApiClient` -- REST + SSE client (~50 endpoints)
- `KagentiSandboxClient` -- sandbox operations
- `KagentiAdminClient` -- models, LLM, integrations
- `KeycloakTokenManager` -- OAuth2 client_credentials with streaming-aware refresh
- `KagentiStreamNormalizer` -- A2A task events -> NormalizedStreamEvent
- `KagentiAgentCardCache` -- 5-min TTL, 500 max entries
- `kagentiApprovalHandler` -- HITL resume via chatStream + A2A metadata

### Speaker Notes:
Walk through KagentiProvider.ts. Key design decisions to call out:

1. SESSION MAPPING: Two bounded LRU maps (10k entries each, 10% eviction batch): `kagentiSessionMap` maps backstageSessionId to kagentiContextId, and `sessionAgentMap` maps contextId to agentId. These are in-memory, but NOT lost on restart -- chatRoutes.ts hydrates from the DB's conversationId field on first access after a miss. The key nuance: sessions are recoverable but not pre-loaded, so the first request after restart has a small DB lookup overhead.

2. AGENT CARD CACHING: KagentiAgentCardCache with 5-minute TTL and 500 max entries. When an agent card has extensions, it processes them through @kagenti/adk/core handleAgentCard to extract demands and resolveMetadata, which are merged into chat requests.

3. A2A METADATA: Before sending a chat request, the provider merges agent card demands and resolveMetadata into the A2A payload. This lets Kagenti agents declare what context they need.

4. STREAMING FALLBACK: If the Kagenti API returns JSON-RPC error -32603 (streaming unsupported) and no content has been received yet, the provider falls back to synchronous chat() and emits synthetic stream.started + stream.text.delta + stream.completed events. The user sees a delayed response with no incremental output.

5. KEYCLOAK AUTH: KeycloakTokenManager performs OAuth2 client_credentials grant. Tokens are cached with a configurable expiry buffer (default 60s). For streaming, getTokenForStreaming(minLifetimeMs) ensures the token will survive the duration of the SSE connection.

**Live code:** Open KagentiProvider.ts, then KagentiApiClient.ts, then KagentiStreamNormalizer.ts.

---

## SLIDE 8 -- Kagenti API Surface (part of slide 7)

### On Slide:
53+ backend routes for Kagenti, conditionally registered:

- Config/Health: 4 endpoints
- Agents CRUD + builds: 15+ endpoints  
- Tools CRUD + builds: 12+ endpoints
- Sandbox (sessions, chat, files, sidecars, deploy): 25+ endpoints
- Admin (models, LLM, integrations, triggers): 10+ endpoints

All namespaced routes go through `validateNamespaceParam` -> 403 if unauthorized.

Routes registered only when `providerManager.provider.id === 'kagenti'`.

### Speaker Notes:
Walk through kagentiRoutes.ts to show the registration pattern. The key architectural decision is that these routes are conditionally registered -- if you switch to LlamaStack, none of these routes exist. Show the namespace middleware: validateNamespaceParam reads the namespace from params or query, then calls kagenti.validateNamespace(ns). If the namespace is not in the configured allow-list, it returns 403. Also show the user context propagation: router.use('/kagenti', ...) resolves the Backstage user and calls kagenti.setUserContext(userRef) so the Kagenti API knows who is making the request.

**Live code:** Open kagentiRoutes.ts, kagentiAgentRoutes.ts (to show the agent CRUD pattern).

---

## SLIDE 9 -- Streaming Pipeline End-to-End (10 min)

### On Slide:
**[SCREENSHOT: augment-streaming-pipeline.canvas.tsx]**

### Speaker Notes:
Walk through two parallel paths side by side.

BACKEND: In chatRoutes.ts, POST /chat/stream is the entry point. parseChatRequest validates the body. setupSseStream sets the SSE headers (Content-Type: text/event-stream, X-Accel-Buffering: no, Content-Encoding: identity) and creates an AbortController. createStreamEventForwarder builds a callback that handles backpressure: if res.write() returns false, events queue in a pending array until the socket emits 'drain'. Then provider.chatStream(request, forwarder, signal) is called.

PROVIDER NORMALIZATION: LlamaStack path receives raw SSE from the Responses API and runs normalizeLlamaStackEvent() to produce NormalizedStreamEvent. Kagenti path receives A2A task status updates and runs KagentiStreamNormalizer.normalize() to produce the same NormalizedStreamEvent types. The frontend never sees provider-specific event formats.

FRONTEND: sseStreaming.ts reads 'data: ' lines and JSON-parses each into a StreamingEvent. useStreamingStateBatching batches updates using requestAnimationFrame for smooth 60fps rendering. The StreamingMessage component has a reducer-based state machine with phases: idle -> started -> streaming -> completed. VirtualizedMessageList renders the full conversation with auto-scroll.

KEY DETAIL: On client disconnect, the AbortController fires, which propagates through the signal parameter to stop the upstream provider work. This prevents zombie streaming connections.

**Live code:** Open chatRoutes.ts, focus on setupSseStream and createStreamEventForwarder.

---

## SLIDE 10 -- HITL Tool Approval Flow (part of slide 9)

### On Slide:
**Tool Approval Flow:**
1. Backend emits `stream.tool.approval` event
2. Frontend `useToolApproval` hook detects it, pauses streaming
3. `ToolApprovalDialog` shows tool name, arguments (JSON-editable)
4. User clicks Approve or Reject
5. `POST /chat/approve` with decision
6. Backend resumes streaming

**Kagenti-specific approval types:**
- Generic tool approval (callId, approved, toolName, reason)
- `secrets_response` -- ADK auth/secrets extension (JSON map of secrets)
- `oauth_confirm` -- OAuth redirect confirmation

### Speaker Notes:
The HITL flow is the same from the frontend perspective regardless of provider. The difference is how the backend resumes.

For LlamaStack: submitToolApproval resumes via the Responses API conversation -- it is a continuation of the existing response.

For Kagenti: kagentiApprovalHandler.ts resumes via a NEW chatStream call with the contextId + approval metadata in the A2A payload. There are three types of Kagenti approval: generic (tool approval with callId and arguments), secrets_response (parses a JSON map of secrets and sends as an ADK auth/secrets extension URI), and oauth_confirm (sends an OAuth redirect confirmed extension). The approval handler then parses the response stream to extract content, any new pending approvals, handoff markers, and tool execution results.

**Live code:** Open kagentiApprovalHandler.ts, show buildApprovalMetadata and submitApproval.

---

## SLIDE 11 -- Frontend Architecture (10 min)

### On Slide:
**[SCREENSHOT: augment-frontend-architecture.canvas.tsx]**

### Speaker Notes:
Show plugin.ts (frontend) -- single createPlugin with id 'augment', one rootRouteRef. No sub-routes. The AugmentPage component is lazy-loaded via createRoutableExtension. This is a deliberate design decision: chat and admin are toggled via React state (useAdminView hook), not Backstage route refs. This avoids navigation complexity.

Open AugmentPage.tsx -- show the two modes. When viewMode is 'chat', it renders ChatContainer + RightPane. When viewMode is 'admin', it checks liveStatus?.providerId: if 'kagenti', it renders KagentiSidebar + the Kagenti panel component; otherwise it renders CommandCenterHeader + the LlamaStack panel component.

The provider-aware rendering is important: there are providerId === 'kagenti' checks in ChatContainer, ChatInput, AgentInfoSection, and the admin panels. These adapt the UI behavior -- for example, Kagenti shows agent name in the sidebar while LlamaStack shows RAG and MCP status.

Walk through the hook layers: core chat hooks (useStreamingChat, useChatSessions, useToolApproval) are provider-agnostic. Kagenti-specific hooks (useKagentiToolsList, useKagentiAgentDetail) live in KagentiPanels/ and only activate when Kagenti is the active provider.

The API client (AugmentApiClient) composes endpoint modules: chatEndpoints, sessionEndpoints, conversationEndpoints, documentEndpoints, adminEndpoints, and kagentiEndpoints. Each module is a collection of functions that call fetchJson or streamSSE on the base URL.

**Live code:** Open AugmentPage.tsx, show the provider-conditional rendering.

---

## SLIDE 12 -- Security Model (5 min)

### On Slide:
**[SCREENSHOT: augment-security-model.canvas.tsx]**

### Speaker Notes:
Walk through middleware/security.ts. Key points:

1. Route registration ORDER matters: statusRoutes (health, status, branding) are mounted BEFORE requirePluginAccess middleware. This means /status and /branding are accessible without augment.access permission -- intentionally public so the frontend SecurityGate can check backend readiness.

2. In 'none' mode, everyone is admin and the user identity is user:default/guest. This is for local development only.

3. In 'plugin-only' mode, requirePluginAccess uses httpAuth.credentials(req) to get the user and permissions.authorize(augmentAccessPermission) to check access. Admin access falls back to an adminUsers allow-list in config.

4. In 'full' mode, admin access uses the augmentAdminPermission through Backstage's permission framework. This integrates with RBAC policies.

5. Kagenti adds TWO more security layers on top: Keycloak OAuth2 (KeycloakTokenManager handles client_credentials with streaming-aware token refresh) and namespace validation (validateNamespaceParam returns 403 for unauthorized namespaces).

6. User context propagation: for Kagenti, the X-Backstage-User header is set on every API request via setUserContext().

**Live code:** Open middleware/security.ts.

---

## SLIDE 13 -- Configuration and Persistence (5 min)

### On Slide:
**Configuration layers:**
1. `config.d.ts` -- declarative schema with @visibility annotations
2. `app-config.yaml` -- YAML baseline
3. `AdminConfigService` -- DB overrides (Knex, augment_admin_config table)
4. `RuntimeConfigResolver` -- merges YAML + DB with TTL cache

**Key config blocks:**
- `augment.provider` -- 'llamastack' or 'kagenti'
- `augment.llamaStack.*` -- baseUrl, model, token, toolChoice, RAG, etc.
- `augment.kagenti.*` -- baseUrl, namespace, auth, sandbox, builds, etc. (~250 lines)
- `augment.security.*` -- mode, adminUsers, mcpOAuth

**DB tables:**
- `augment_admin_config` -- JSON key-value for admin overrides
- `augment_sessions` -- chat sessions per user

### Speaker Notes:
Show config.d.ts -- it is the definitive schema. The Kagenti block is about 250 lines covering baseUrl, auth (Keycloak), namespaces, timeouts, sandbox settings, migration, pagination, feature overrides, and dashboards. Point out the @visibility annotations: backend means the value is only available server-side; frontend means it is sent to the browser; secret means it is never logged.

Explain the config precedence: YAML baseline is the starting point. Admin panel writes go through AdminConfigService to the augment_admin_config DB table. RuntimeConfigResolver merges both with a TTL cache and invalidates when admin writes happen. This lets admins change settings without restarting the backend.

Note the Kagenti-specific gotcha: session-to-contextId mapping is in-memory only (not in the DB). If the backend restarts, all Kagenti chat contexts are lost.

**Live code:** Show config.d.ts, then app-config.yaml (current settings).

---

## SLIDE 14 -- Backend Route Architecture (part of slides 4-8)

### On Slide:
**[SCREENSHOT: augment-route-architecture.canvas.tsx]**

### Speaker Notes:
This is the complete route inventory. Walk through the four auth layers: public (before middleware), plugin access, admin access, and Kagenti-only (conditionally registered). Point out the handler wrapper: most handlers use createWithRoute from routeWrapper.ts for logging + try/catch -> sendRouteError. The /chat/stream endpoint is special -- it has its own SSE lifecycle and does not use the standard wrapper.

For Kagenti: the routes tree is large -- 53+ endpoints covering config, agents, tools, builds, sandbox (sessions, chat, files, sidecars, deploy, token usage), and admin (models, LLM teams/keys, integrations, triggers). All namespaced routes go through validateNamespaceParam.

---

## SLIDE 15 -- Known Gaps, Gotchas, and Future Work (5 min)

### On Slide:
**[SCREENSHOT: augment-gaps-and-gotchas.canvas.tsx]**

### Speaker Notes:
Be honest about these with the team. The session maps (kagentiSessionMap and sessionAgentMap) are in-memory LRU caches, but they are NOT lost on restart. chatRoutes.ts has a hydration path: when the in-memory map has no entry for a session, it checks the DB's conversationId field via sessions.getSession() and calls kagenti.hydrateSessionContext() to repopulate the map. So sessions are recoverable -- the first request after restart just has a small DB lookup overhead. The real gap is that the sessionAgentMap (contextId -> agentId) is only in-memory with no DB backing, so the agent association may be lost.

The listModels cross-dependency means Kagenti config still needs a valid augment.llamaStack.baseUrl. The streaming fallback on JSON-RPC -32603 is a workaround -- as Kagenti agents gain streaming support, it becomes less relevant.

The augment-common kagenti.ts types file is large and growing. Consider splitting into sub-modules for better maintainability.

---

## SLIDE 16 -- Developer Onboarding Quickstart (part of slide 15)

### On Slide:
**Getting started:**
```
git checkout feat/kagenti-provider
cd workspaces/augment
yarn install
export KAGENTI_CLIENT_SECRET=<your-secret>
yarn dev
# Open http://localhost:3000
```

**Start reading here:**
1. `plugin.ts` (backend) -- bootstrap flow
2. `router.ts` -- full route tree
3. `providers/types.ts` -- the AgenticProvider contract
4. `KagentiProvider.ts` -- Kagenti implementation
5. `AugmentPage.tsx` -- frontend entry point
6. `augment-common/types/streaming.ts` -- streaming contract

### Speaker Notes:
Give the team these entry points in order. Start with plugin.ts for the backend bootstrap -- it shows how everything is wired together. Then router.ts for the complete route tree and middleware order. Then providers/types.ts for the AgenticProvider contract. From there, branch into either KagentiProvider.ts or ResponsesApiProvider.ts depending on which provider they are working on. For the frontend, start at AugmentPage.tsx and work down through the component tree. For the shared contract, streaming.ts in augment-common defines the NormalizedStreamEvent union that both providers must produce.

---

## SLIDE 17 -- Q&A (10 min)

### On Slide:
**Questions?**

### Speaker Notes (anticipated questions):

**Q: Why single route with state toggle instead of sub-routes?**
A: Avoids Backstage navigation complexity. Admin is a secondary mode, not a primary surface. The useAdminView hook manages this via localStorage. It also means the plugin has a single mount point in the Backstage app, simplifying configuration.

**Q: Why ADK inside the LlamaStack provider?**
A: ADK (@augment-adk/augment-adk) provides the multi-agent orchestration layer. It is an implementation detail of the LlamaStack provider, not a separate provider type. It handles agent graph resolution, tool execution, and conversation management within the LlamaStack runtime.

**Q: How does hot-swap work?**
A: ProviderManager creates and initializes the new provider BEFORE swapping the reference, ensuring no service gap. A mutex lock prevents concurrent swaps. After the swap, the old provider is shut down gracefully. If initialization of the new provider fails, the swap does not happen.

**Q: How is backpressure handled in SSE?**
A: The stream event forwarder checks the return value of res.write(). If it returns false (Node.js backpressure signal), events are queued in a pending array. When the socket emits 'drain', the pending events are flushed. This prevents memory buildup if the client is slow to consume events.

**Q: What happens when Kagenti streaming fails?**
A: If JSON-RPC error -32603 (streaming unsupported) is received AND no content has been streamed yet, KagentiProvider.chatStream() falls back to synchronous chat(). It then emits synthetic stream.started, stream.text.delta (with the full response), and stream.completed events. The user sees a delayed response with no incremental output.

**Q: Why is Kagenti session mapping in-memory?**
A: Design tradeoff for performance. The bounded LRU maps (10k entries) are fast and avoid DB round-trips on every chat message. The in-memory maps are cleared on restart, but chatRoutes.ts hydrates the session-to-context mapping from the DB's conversationId field on the first request. The sessionAgentMap (contextId to agentId) has no DB backing, so the agent association may need to be re-resolved after restart.

**Q: How does Kagenti namespace security work?**
A: Three layers: (1) Config allow-list in augment.kagenti.namespaces or showAllNamespaces flag; (2) validateNamespaceParam Express middleware on all namespaced routes; (3) Kagenti API server itself may have its own namespace RBAC.

**Q: Can I add a third provider?**
A: Yes, via the augment.providers extension point. Create a Backstage backend module that calls augmentProviderExtensionPoint.registerProvider(descriptor, factory). The descriptor defines capabilities and config fields; the factory returns an AgenticProvider implementation. Set augment.provider to your provider ID in app-config.yaml.

---

## Handover Deliverables Checklist

- [ ] Slide deck (use this document + canvas screenshots)
- [ ] Technical reference (see handover-reference.md)
- [ ] Canvas screenshots for all 7 diagrams
- [ ] Shared access to the feat/kagenti-provider branch
- [ ] app-config.yaml with credentials for dev environment
