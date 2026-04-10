# Augment Platform

**Audience:** Principal engineers, architecture reviewers, technical leadership
**Status:** Based on production-deployed codebase (April 2026)

> For customer outcomes and use case scenarios, see [Augment Outcomes and Use Cases](augment-outcomes-and-use-cases.md).

---

## What Augment Is

Augment is an agentic AI platform embedded in Red Hat Developer Hub. It connects to **Llama Stack** and **Kagenti** via their APIs to provide a multi-agent conversational experience — each agent with its own instructions, tools, model, and knowledge base, collaborating to reason over questions, execute operations against live systems, and synthesize answers grounded in customer documentation.

- **Llama Stack** (`augment.llamaStack.baseUrl`) provides inference (`POST /v1/responses`), RAG (`/v1/vector_stores`, `/v1/files`), safety (`/v1/safety/run-shield`), and model discovery (`GET /v1/models`) APIs. Augment orchestrates multi-agent workflows on top of these APIs using an in-process orchestration layer (`@augment-adk/augment-adk`).
- **Kagenti** (`augment.kagenti.baseUrl`) provides remote agent management, discovery, streaming chat (A2A protocol over SSE), and a centralized MCP tool gateway. Augment connects to Kagenti's API via `KagentiApiClient` with Keycloak OAuth2 authentication.

Customers can define agents in configuration (YAML or admin UI) for the Llama Stack path, or bring their own agents built in any framework (LangGraph, CrewAI, custom) via Kagenti. All inference runs on the customer's own infrastructure using any model served by Llama Stack (Llama 3.3 is the default).

The platform is composed of three packages: a frontend plugin (React, streaming chat UI, admin panels), a backend plugin (Express, orchestration, provider abstraction), and a shared common package (types, permissions). It ships as a Backstage dynamic plugin — no fork required.

---

## Platform Capabilities

### 1. Multi-Agent Orchestration

The platform supports multiple specialist agents orchestrated by a router. Each agent has its own instructions, tool access, knowledge base, and model configuration. The router receives every first message and delegates to the right specialist via declared handoff targets.

How agents are defined (from the config schema):

```yaml
augment:
  agents:
    router:
      name: Router
      instructions: 'You triage questions. Hand off to migration-assistant for migration topics, to ops-agent for cluster issues.'
      handoffs: [migration-assistant, ops-agent]
    migration-assistant:
      name: Migration Assistant
      instructions: 'You help developers migrate applications to OpenShift...'
      mcpServers: [openshift]
      enableRAG: true
      vectorStoreIds: [vs_migration_docs]
      handoffDescription: 'Specialist for application migration to OpenShift'
    ops-agent:
      name: Cluster Operations
      instructions: 'You diagnose and fix OpenShift cluster issues...'
      mcpServers: [openshift]
      enableRAG: true
      vectorStoreIds: [vs_runbooks]
      handoffDescription: 'Specialist for OpenShift troubleshooting'
  defaultAgent: router
  maxAgentTurns: 10
```

Properties:

- **Router pattern.** The default agent receives every first message. Its instructions define how to triage. Handoff targets are declared — the orchestrator generates `transfer_to_{agent}` functions automatically.
- **Per-agent tool scoping.** Each agent sees only the MCP servers listed in its `mcpServers` field.
- **Per-agent knowledge bases.** Each agent searches its own vector stores via `vectorStoreIds`.
- **Config-driven.** Adding a new specialist is a YAML change or admin UI edit. No code, no redeployment.
- **Handoff visualization.** The UI shows a divider with agent names during handoffs. The developer sees the routing decision in real time.

Complete `AgentConfig` interface:

```typescript
interface AgentConfig {
  name: string;
  instructions: string;
  handoffDescription?: string;
  model?: string;
  mcpServers?: string[]; // subset of global MCP server IDs
  handoffs?: string[]; // generates transfer_to_{key} functions
  asTools?: string[]; // generates call_{key} functions
  enableRAG?: boolean;
  vectorStoreIds?: string[];
  enableWebSearch?: boolean;
  enableCodeInterpreter?: boolean;
  functions?: FunctionDefinition[];
  toolChoice?: ToolChoiceConfig;
  reasoning?: ReasoningConfig;
  handoffInputSchema?: Record<string, unknown>; // structured handoff metadata
  handoffInputFilter?: 'none' | 'removeToolCalls' | 'summaryOnly';
  toolUseBehavior?: 'run_llm_again' | 'stop_on_first_tool';
  outputSchema?: OutputSchema; // validated structured output
  enabled?: boolean; // runtime handoff gating
  toolGuardrails?: ToolGuardrailRule[];
  guardrails?: string[]; // server-side shield IDs
}
```

### 2. RAG / Knowledge Management

The platform provides a full pipeline for ingesting, indexing, and searching customer documentation.

**Ingestion sources:**

- **File upload** — drag-and-drop in the admin UI (`.md`, `.txt`, `.pdf`, `.json`, `.yaml`)
- **GitHub repos** — specify `owner/repo`, branch, path filter, glob patterns; supports private repos with tokens
- **URLs** — fetch from any accessible URL (with SSRF protection)
- **Local directories** — for development/testing

**Indexing:** Vector stores with configurable embedding models (default: `sentence-transformers/all-MiniLM-L6-v2`), chunking strategies (auto or static with configurable chunk size/overlap), and hybrid search settings (semantic + BM25 keyword, with configurable weights).

**Sync:** `syncSchedule: '1h'` triggers periodic re-sync. `syncMode: 'full'` adds new files, updates changed files (content-hash based), and removes deleted files. `syncMode: 'append'` only adds new files.

**Admin playground:** Built-in RAG testing lets admins run search queries (see retrieved chunks with relevance scores), run generate queries (RAG context + LLM), compare search modes, and adjust thresholds — all before deploying to users.

**Technical detail:** `DocumentIngestionService.fetchFromSources()` → content-hash categorization against `augment_content_hashes` DB table → `POST /v1/files` (multipart) → `POST /v1/vector_stores/{id}/files` with chunking config. At inference time, `ToolsBuilder.buildTools()` adds `{ type: 'file_search', vector_store_ids, max_num_results, ranking_options }`. Llama Stack executes `file_search` server-side; results appear in `stream.rag.results` events.

### 3. MCP Tool Connectivity

Any tool that speaks the Model Context Protocol can be connected. Tool discovery is automatic — the platform queries each server's tool list and makes them available to agents.

```yaml
mcpServers:
  - id: openshift
    name: OpenShift Cluster
    type: streamable-http
    url: https://kubernetes-mcp.example.com/mcp
    requireApproval: always
    serviceAccount:
      name: mcp-client-sa
      namespace: backstage
```

**Two execution modes** (selected by `augment.toolExecutionMode`):

- **Direct mode (default):** Tools are passed to Llama Stack as `type: 'mcp'` entries. Llama Stack opens MCP connections and calls tools directly. The Backstage backend never sees tool traffic.
- **Backend mode:** `BackendToolExecutor` opens MCP SDK `Client` connections via `StreamableHTTPClientTransport`. Tools are discovered via `client.listTools()`, converted to `type: 'function'` tools with `serverId__toolName` naming, and sent to Llama Stack. When the model returns `function_call` items, `BackendToolExecutor.executeTool()` routes the call to the correct MCP client. Required for air-gapped deployments where Llama Stack cannot reach MCP servers.

**Authentication chain** — `McpAuthService.getServerHeaders(server)` resolves auth per server using a 4-level priority:

1. **`authRef`** — Named config from `augment.mcpAuth[]` (OAuth client_credentials or ServiceAccount)
2. **Inline `oauth`** — Per-server OAuth client_credentials to a `tokenUrl`
3. **Inline `serviceAccount`** — Kubernetes TokenRequest API for ServiceAccount tokens
4. **Global `security.mcpOAuth`** — Fallback in `full` security mode

Token caching with TTL, in-flight deduplication (concurrent callers share one token fetch), TLS control via `skipTlsVerify`.

### 4. Human-in-the-Loop

When an agent proposes a sensitive action, the platform pauses the inference loop and presents the developer with an interactive dialog.

**Tool approval:** Per-server, per-tool granularity via `requireApproval` field (`always`, `never`, or explicit tool name lists). The approval dialog shows the tool name, arguments as editable JSON, and the server label. The developer can modify arguments before approving, or reject with a reason that feeds back to the model.

**Additional interactive flows:**

| Flow               | When It Triggers                                                   | What the Developer Sees                                 |
| ------------------ | ------------------------------------------------------------------ | ------------------------------------------------------- |
| **Form input**     | Agent needs structured data (namespace, parameters)                | A form card with typed fields rendered in the chat      |
| **OAuth required** | Agent needs the developer to authenticate with an external service | An auth card with a "Sign in" button and the target URL |
| **Secrets input**  | Agent needs credentials the developer must supply                  | A secrets card with password fields                     |

**Technical detail:** The SSE stream enters a `pending_approval` phase. The frontend reducer transitions to a terminal interactive state (blocking stray text deltas). After approval/form-submit/auth-confirm, `POST /chat/approve` sends the response, the backend continues the inference loop, and a new stream begins.

### 5. Safety and Governance

**Security modes** — three levels, chosen by the platform team:

| Mode          | Access Control                 | MCP Tool Auth                              | Recommendation             |
| ------------- | ------------------------------ | ------------------------------------------ | -------------------------- |
| `none`        | Open to all                    | No auth                                    | Development only           |
| `plugin-only` | Keycloak OIDC + Backstage RBAC | MCP servers use their own service accounts | **Production recommended** |
| `full`        | Keycloak + RBAC                | OAuth tokens passed to MCP servers         | Experimental               |

**Security enforcement points:**

| Layer                 | Mechanism                      | Implementation                                                         |
| --------------------- | ------------------------------ | ---------------------------------------------------------------------- |
| Plugin access         | Backstage permission framework | `augmentAccessPermission` checked in `createRouter()` auth middleware  |
| Admin access          | Backstage permission framework | `augmentAdminPermission` checked in `requireAdminAccess()` middleware  |
| MCP tool auth         | 4-level priority chain         | `McpAuthService.getServerHeaders()`                                    |
| SSRF                  | URL + DNS validation           | `SsrfGuard.isPrivateUrlWithDns()` on ingestion and MCP connections     |
| Content safety        | Llama Stack Safety API         | `SafetyService.checkInput/checkOutput()` with shields                  |
| Destructive detection | Regex patterns                 | `safetyPatterns` in admin config, applied before inference             |
| Tool approval         | HITL dialog                    | `requireApproval` per MCP server, enforced by `BackendApprovalHandler` |
| Data retention        | ZDR mode                       | `store: false` on all Responses API calls, encrypted reasoning tokens  |
| Transport             | TLS / optional mTLS            | `skipTlsVerify` flag; Kagenti mode adds Istio ambient mesh             |

**SSRF protection detail:** `SsrfGuard.isPrivateUrlWithDns(url)` validates protocol, checks against blocked hostnames, pattern-matches private IP ranges (RFC-1918, loopback, link-local, IPv6 ULA, cloud metadata), and resolves DNS to re-check all resolved addresses (prevents DNS rebinding attacks).

### 6. Runtime Configuration

The platform resolves configuration at runtime using a two-layer model:

```
EffectiveConfig = YAML baseline + database admin overrides
```

- **29 keys** are configurable from the admin UI at runtime (model, system prompt, temperature, agents, MCP servers, vector stores, safety, branding, prompt groups).
- **18 keys** are YAML-only (security mode, admin users, OAuth secrets, document sources, ZDR mode).
- Database overrides win per-key. If the database is unreachable, YAML-only fallback with a warning.
- The merged result is cached for 5 seconds; admin saves invalidate the cache immediately.

**Technical detail:** `RuntimeConfigResolver.resolve()` checks the cache (5s TTL). If stale, `buildEffectiveConfig()` runs: `loadYamlBaseline()` (synchronous, from in-memory Backstage config) → `applyDbOverrides()` (async, parallel reads of 27 admin keys from PostgreSQL) → `snapshot()` (deep-clone to prevent cache mutation). Concurrent callers share one in-flight build (Promise deduplication). A generation counter prevents stale builds from caching after an invalidation. Three special merge rules: `branding` (shallow merge), `mcpServers` (smart merge preserving YAML-only auth fields), `agents` (full replacement from DB).

### 7. Provider Abstraction

The entire AI backend is behind a provider interface. Two providers ship today:

- **Llama Stack (Responses API):** Full-featured — multi-agent orchestration, RAG, safety shields, evaluation, MCP tools. Runs any model served by Llama Stack (Llama 3.3 is the default) on the customer's own GPU infrastructure. All inference, embedding, and safety run on-premises.
- **Kagenti:** Remote agent platform integration where agents run as Kubernetes workloads with their own lifecycle, accessed via the Kagenti API. Adds infrastructure-grade security (SPIFFE/SPIRE workload identity, Istio ambient mesh with mTLS, centralized MCP gateway via Envoy).

The provider can be switched at runtime from the admin UI. The extension point system (`augmentProviderExtensionPoint`) allows third-party providers to be registered without forking the plugin.

**`AgenticProvider` interface:**

```typescript
interface AgenticProvider {
  readonly id: string;
  readonly displayName: string;
  initialize(): Promise<void>;
  postInitialize(): Promise<void>;
  getStatus(): Promise<AgenticProviderStatus>;
  chat(request: ChatRequest): Promise<ChatResponse>;
  chatStream(
    request: ChatRequest,
    onEvent: (event: NormalizedStreamEvent) => void,
    signal?: AbortSignal,
  ): Promise<void>;
  listModels(): Promise<Array<{ id: string; owned_by?: string }>>;
  readonly conversations?: ConversationCapability;
  readonly rag?: RAGCapability;
  readonly safety?: SafetyCapability;
  readonly evaluation?: EvaluationCapability;
  invalidateRuntimeConfig?(): void;
  shutdown?(): Promise<void>;
}
```

**Provider registry:**

| Provider     | `implemented` | Capabilities                                                  |
| ------------ | :-----------: | ------------------------------------------------------------- |
| `llamastack` |     true      | chat, rag, safety, evaluation, conversations, mcpTools, tools |
| `kagenti`    |     true      | chat only (rag/safety/evaluation handled by remote agents)    |
| `googleadk`  |     false     | Placeholder for future                                        |

**Hot-swap:** `ProviderManager.switchProvider(type)` uses a Promise-based mutex and "start new, then stop old" strategy — no gap in service during a swap.

### 8. Branding and White-Labeling

The portal team can customize everything the developer sees:

- **Brand identity.** Application name, tagline, logo URL, custom bot avatar, favicon — all from the admin UI or YAML.
- **Color system.** Primary, secondary, success, warning, error, info colors. Theme presets (`default`, `enterprise`) or fully custom hex values.
- **Welcome experience.** Prompt groups (grouped cards with icons, colors, ordering) on the welcome screen, configurable via drag-and-drop in the admin UI. Featured agents appear prominently.
- **Agent gallery.** When Kagenti is the provider, the welcome screen shows an agent gallery with search, favorites, and detail drawers.

### 9. Streaming Chat UX

Every response streams via SSE. The UI shows reasoning steps, tool calls, RAG searches, and agent handoffs in real time.

**SSE event protocol** — all events are JSON objects with a `type` field in `stream.*` namespace:

| Event Type               | Payload                                        | Frontend Phase         |
| ------------------------ | ---------------------------------------------- | ---------------------- |
| `stream.started`         | `responseId`, `model`, `createdAt`             | `thinking`             |
| `stream.text.delta`      | `delta` (text chunk)                           | `generating`           |
| `stream.reasoning.delta` | `delta` (reasoning chunk)                      | `reasoning`            |
| `stream.tool.started`    | `callId`, `name`, `serverLabel`, `arguments`   | `calling_tools`        |
| `stream.tool.completed`  | `callId`, `name`, `output`                     | `calling_tools`        |
| `stream.tool.approval`   | `callId`, `name`, `arguments`, `responseId`    | `pending_approval`     |
| `stream.agent.handoff`   | `fromAgent`, `toAgent`, `reason`               | updates `currentAgent` |
| `stream.rag.results`     | `sources[]` (filename, text, score)            | `searching`            |
| `stream.form.request`    | `taskId`, `form` (StreamFormDescriptor)        | `form_input`           |
| `stream.auth.required`   | `authType`, `url`, `demands`                   | `auth_required`        |
| `stream.artifact`        | `artifactId`, `content`, `append`, `lastChunk` | --                     |
| `stream.citation`        | `citations[]`                                  | --                     |
| `stream.completed`       | `usage`, `agentName`, `responseId`             | `completed`            |
| `stream.error`           | `error`, `code`                                | --                     |

**State machine:**

```
connecting → thinking → [reasoning] → [discovering_tools] → [searching]
    → [calling_tools] → [executing_backend_tools] → generating → completed
                                    ↓
                            pending_approval (modal)
                                    ↓
                            form_input (inline card)
                                    ↓
                            auth_required (inline card)
```

Interactive phases are terminal until the user acts.

### 10. Persistent Conversations

Sessions are stored in PostgreSQL and survive pod restarts. Conversation history is searchable with session grouping. A developer can ask a follow-up question in a different session.

---

## Technical Architecture

### System Topology

```
Developer (browser)
        |
        |  HTTPS
        v
Augment Frontend Plugin (@red-hat-developer-hub/backstage-plugin-augment)
   React SPA inside Backstage, communicates via DiscoveryApi + FetchApi
        |
        |  SSE (POST /chat/stream) + REST (/sessions, /admin/*, /kagenti/*)
        v
Augment Backend Plugin (@red-hat-developer-hub/backstage-plugin-augment-backend)
   Backstage backend-plugin, Express router, PostgreSQL for sessions + config
        |
        +--- ResponsesApiProvider (Llama Stack path)
        |    |--- ResponsesApiCoordinator (composition root)
        |    |    |--- ConfigLoader → RuntimeConfigResolver → EffectiveConfig
        |    |    |--- ClientManager → ResponsesApiClient (HTTP to Llama Stack)
        |    |    |--- AgentGraphManager → resolveAgentGraph() → AgentGraphSnapshot
        |    |    |--- AdkOrchestrator → @augment-adk/augment-adk runStream()
        |    |    |--- ChatDepsBuilder → per-request ChatDeps
        |    |    |--- McpAuthService (4-level auth priority chain)
        |    |    |--- BackendToolExecutor (optional, for backend MCP mode)
        |    |    |--- BackendApprovalStore + BackendApprovalHandler (HITL)
        |    |    |--- VectorStoreFacade → VectorStoreService + DocumentSyncService
        |    |    |--- ConversationFacade → ConversationService
        |    |--- SafetyService (Llama Stack Safety API)
        |    |--- EvaluationService (Llama Stack Scoring API)
        |
        +--- KagentiProvider (Kagenti path)
        |    |--- KeycloakTokenManager (OAuth2 client_credentials)
        |    |--- KagentiApiClient (HTTP + SSE to Kagenti API)
        |    |--- KagentiStreamNormalizer (A2A protocol → NormalizedStreamEvent)
        |    |--- KagentiSandboxClient, KagentiAdminClient
        |
        +--- ProviderManager (hot-swap with mutex, "start new then stop old")
        |
        v
Llama Stack Server (OpenAI-compatible Responses API)
   POST /v1/responses, /v1/vector_stores, /v1/files, /v1/models, /v1/safety/*
        |
        +--- MCP Servers (Streamable HTTP or SSE transport)
             kubernetes-mcp-server, docs-mcp, custom MCP endpoints
```

### Request Lifecycle: Chat Stream (Llama Stack Path)

```
1. POST /chat/stream
   ↓
2. Express route → chatRoutes.ts → provider.chatStream(request, onEvent, signal)
   ↓
3. ResponsesApiProvider.chatStream()
   → ResponsesApiCoordinator.chatStream()
   ↓
4. AgentGraphManager.getSnapshot()
   Resolves EffectiveConfig (YAML + DB via RuntimeConfigResolver)
   → resolveAgentGraph() if agents defined, else single-agent fallback
   → Returns AgentGraphSnapshot { agents: Map, defaultAgentKey, maxTurns }
   Cache keyed by generation counter; invalidated on admin save
   ↓
5. AdkOrchestrator.chatStream(request, snapshot, onEvent, buildDepsForAgent, signal)
   → resolveAgentContinuity(): resume from stored RunState or start at defaultAgent
   → buildRunOptions(): model adapter, agent configs, MCP servers, function tools
   → @augment-adk/augment-adk runStream(userInput, runOptions)
   ↓
6. ADK multi-turn loop (inside @augment-adk):
   For each turn:
     a. POST /v1/responses with agent's {instructions, tools, model, store, previous_response_id}
     b. Stream SSE response
     c. If tool_call → execute tool (MCP via BackendToolExecutor or Llama Stack direct)
     d. If handoff → switch active agent, emit agent_start/handoff_occurred events
     e. If approval_requested → emit approval event, pause for HITL
     f. Loop until final text response or maxTurns
   ↓
7. mapAdkEventToFrontend(event) → JSON strings in stream.* namespace
   → ResponsesApiProvider passes through or normalizes via normalizeLlamaStackEvent()
   → SSE write to HTTP response
   ↓
8. Frontend: parseSSEStream() → updateStreamingState() → React render
```

### Kagenti Provider: Wire Protocol

When `provider: kagenti`, the backend does not run Llama Stack. All inference is handled by remote Kagenti agents.

**Auth chain:** `loadKagentiConfig()` → `KeycloakTokenManager` (OAuth2 `client_credentials` POST to `tokenEndpoint`, cached with expiry buffer, deduped in-flight) → `KagentiApiClient` (attaches `Authorization: Bearer` header, retries on 429/502/503/504 with exponential backoff, forwards `X-Backstage-User` from request context).

**Chat stream path:**

1. `KagentiProvider.chatStream()` resolves namespace/agent from request
2. Maps Backstage session ID to Kagenti context ID (bounded map with 10% LRU eviction at 10k entries)
3. `KagentiApiClient.chatStream(namespace, name, message, contextId, onLine, signal, metadata)` — SSE connection to Kagenti API
4. Each SSE JSON line → `KagentiStreamNormalizer.normalize()`:
   - **A2A protocol** (`statusUpdate` with states: `submitted`, `working`, `input_required`, `auth_required`, `completed`, `failed`, `canceled`) → mapped to `NormalizedStreamEvent` using `@kagenti/adk` handlers
   - **Legacy flat format** (backward compat with older Kagenti API) → direct mapping
   - **JSON-RPC errors** (codes -32700 through -32007) → `stream.error`
5. Normalized events emitted to frontend via same SSE protocol as Llama Stack path

---

## Feature Maturity

| Area                       | Working Features | API-Only (No UI) | Test Coverage               |
| -------------------------- | ---------------- | ---------------- | --------------------------- |
| Chat and streaming         | 23               | 0                | Stream normalizer: 40 tests |
| Human-in-the-loop          | 8                | 0                | Part of route tests         |
| Agent management (Kagenti) | 7                | 2 (migration)    | HTTP client: 36 tests       |
| Tool management (Kagenti)  | 10               | 0                | Provider: 18 tests          |
| Sandbox (Kagenti)          | 7                | 8                | Sandbox client tests        |
| Platform admin (Kagenti)   | 11               | 1                | Config loader: 7 tests      |
| Total                      | **66 working**   | **11 API-only**  | Express routes: 33 tests    |

80 features total. 66 have both backend and frontend wired. 11 have backend routes but no frontend UI (sandbox chat, sandbox file browsing, agent migration). E2E tests are stubbed but not yet implemented.

---

## Engineering Q&A

| Question                                                              | Answer                                                                                                                                                                                                                                                                                                                   |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| What is the API surface to Llama Stack?                               | Single endpoint: `POST /v1/responses` for all inference. Plus `/v1/models` (discovery), `/v1/vector_stores` (RAG), `/v1/files` (ingestion), `/v1/safety/run-shield` (safety). No proprietary SDK — raw HTTP/JSON.                                                                                                        |
| How does provider hot-swap work?                                      | `ProviderManager.switchProvider()` acquires a Promise-based mutex, creates the new provider via `createProvider()`, calls `initialize()` + `postInitialize()`, swaps the reference, then shuts down the old provider. Concurrent requests during swap hit the old provider until the swap completes.                     |
| What prevents config corruption from concurrent admin writes?         | `RuntimeConfigResolver` uses a generation counter. `invalidateCache()` bumps the generation; any in-flight `buildEffectiveConfig()` checks its start-generation against current and skips caching if stale. Deep-clone `snapshot()` prevents callers from mutating the cache.                                            |
| What is the ADK and how does it relate to Llama Stack?                | `@augment-adk/augment-adk` is an in-process orchestration library that implements the multi-agent loop (router → specialist handoffs, tool calls, streaming). It calls Llama Stack's Responses API as the LLM backend. The ADK handles agent continuity (resume from stored RunState), turn counting, and handoff logic. |
| How does the Kagenti stream protocol differ from the Llama Stack one? | Kagenti uses the A2A (Agent-to-Agent) protocol: JSON-RPC over SSE with `TaskStatusUpdateEvent` and `TaskArtifactUpdateEvent` payloads. `KagentiStreamNormalizer` maps these to the same `NormalizedStreamEvent` union used by the Llama Stack path, so the frontend sees identical event shapes from both providers.     |
| How are MCP tools authenticated?                                      | Four-level priority: `authRef` (named config), inline `oauth` (client_credentials), Kubernetes `ServiceAccount` (TokenRequest API), global `security.mcpOAuth`. In Kagenti mode, mTLS via Istio ambient mesh replaces all of these.                                                                                      |
| What models does it support?                                          | Any model served by Llama Stack's `/v1/responses` endpoint — Llama 3.3 is the default, but any compatible model works. Model is a per-agent config parameter (`AgentConfig.model`). `testModel()` verifies connectivity + inference capability.                                                                          |
| What if the AI server goes down?                                      | `StatusService` detects failure, frontend shows provider-offline banner. Config and sessions in PostgreSQL are unaffected. `ProviderManager` supports hot-swap to a different provider without restart.                                                                                                                  |
| What is the deployment footprint?                                     | RHDH plugin (dynamic or static install) + Llama Stack server (inference, embedding, safety) + PostgreSQL (sessions, admin config) + optional Kagenti platform (gateway, identity, observability).                                                                                                                        |
