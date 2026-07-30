# Kagenti + Augment Plugin: Integration Research Findings

**Date:** 2026-04-02
**Scope:** Value proposition and technical fitment of integrating the RHDH Augment plugin with Kagenti

---

## Executive Summary

Kagenti and the Augment plugin are **highly complementary** with minimal overlap. Augment provides the developer-facing AI assistant experience (chat UI, agent orchestration logic, conversation management) while Kagenti provides production-grade cloud-native infrastructure (MCP gateway, zero-trust identity, agent lifecycle, observability). The two occupy different layers of the stack, making integration natural rather than forced.

**Recommendation:** Start with **Option A (Kagenti as MCP/Agent Infrastructure Layer)** — point Augment's `BackendToolExecutor` at Kagenti's MCP Gateway and adopt Kagenti's auth model. This delivers the highest value (centralized MCP management, zero-trust security, observability) with the lowest risk (minimal Augment code changes, no architectural overhaul).

---

## 1. Capability Overlap vs. Complementarity Matrix

| Dimension               | Augment Today                                                                                                           | Kagenti Offers                                                                                                  | Relationship   | Value Add                                                                         |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------- | --------------------------------------------------------------------------------- |
| **MCP connections**     | Direct SDK client per server (`mcpClient.ts`, `BackendToolExecutor`)                                                    | Centralized Envoy-based MCP Gateway with tool routing, prefixing, and hot-reload                                | **Complement** | Eliminates per-server connection management, adds routing + load balancing        |
| **MCP auth**            | Per-server OAuth/SA/headers chain in `McpAuthService` (4-level priority: authRef > inline OAuth > SA > global mcpOAuth) | SPIFFE/SPIRE workload identity + Keycloak OIDC + mTLS via Istio Ambient                                         | **Complement** | Replaces static credentials with cryptographic identity; no secrets in ConfigMaps |
| **Agent orchestration** | ADK in-process (`AdkOrchestrator` with `run()`/`runStream()`, handoffs, conversation state)                             | A2A protocol for cross-framework agent communication                                                            | **Complement** | A2A enables remote agents (LangGraph, CrewAI) alongside ADK agents                |
| **Agent discovery**     | Static YAML + DB config (`AgentGraphManager`, `ConfigResolutionService`)                                                | K8s-native: labeled Deployments + AgentCard CRD with `/.well-known/agent-card.json` + JWS verification          | **Complement** | Dynamic agent registration without restarts or DB updates                         |
| **Tool policy**         | SSRF guard (`SsrfGuard.ts`) + HITL approval handler (`BackendApprovalHandler`)                                          | Envoy policy plugins (Authorino/Kuadrant), rate limiting, per-tool ACLs via Keycloak groups                     | **Complement** | Centralized, declarative policy enforcement across all MCP traffic                |
| **Observability**       | Backstage `LoggerService` only — no tracing, no metrics                                                                 | OpenTelemetry + Phoenix/Jaeger for distributed tracing; Kiali for network visualization; MLflow for LLM tracing | **Complement** | Production-grade observability for chat turns, tool calls, and agent handoffs     |

**Zero overlap or conflicts identified.** Kagenti operates below the application layer where Augment operates.

---

## 2. MCP Gateway Integration (Highest Value)

### Current Architecture

Augment manages MCP connections in two modes:

- **Backend mode (default):** `BackendToolExecutor` opens individual `@modelcontextprotocol/sdk` `Client` connections per server URL. Each server is configured in `augment.mcpServers[]` with its own URL, auth, and tool filtering. Tool names are prefixed as `{serverId}__{toolName}`.

- **Direct mode:** MCP servers are passed as `type: 'mcp'` tools to Llama Stack, which opens its own connections using `server_url` + `headers`.

### Kagenti MCP Gateway Architecture

The MCP Gateway consists of three components:

1. **Broker** — Control hub that tracks servers, exposes filtered tool views, manages tool prefixes, and stores policy catalogs
2. **Router** — Runtime data path that examines requests, applies routing logic, injects metadata (`x-mcp-tool`, `x-mcp-server`), and validates auth
3. **Discovery Controller** — Watches `MCPServerRegistration` CRDs and `HTTPRoute` resources, dynamically updates broker/router

### Wire Protocol Compatibility

**Critical finding:** The MCP Gateway exposes standard MCP over Streamable HTTP at a single `/mcp` endpoint. This is the same transport that Augment's `StreamableHTTPClientTransport` in `mcpClient.ts` uses. The gateway is **wire-compatible** with Augment's existing SDK client — no SDK changes needed.

The gateway also supports OAuth protected resource discovery at `/.well-known/oauth-protected-resource`, which aligns with Augment's OAuth auth flow.

### Integration Path

**Backend mode integration (recommended):**

1. Configure a single `MCPServerConfig` in `augment.mcpServers[]` pointing to the Kagenti MCP Gateway URL (e.g., `http://mcp-gateway.kagenti-system.svc.cluster.local/mcp`)
2. The gateway handles routing to individual MCP servers via tool prefixes
3. `BackendToolExecutor` connects to one endpoint instead of N servers
4. Tool prefix collision is handled by the gateway's `toolPrefix` per `MCPServerRegistration`

**Change required in Augment:** Minimal. The `BackendToolExecutor.discoverTools()` method already connects to URLs via the SDK client and lists tools. Pointing it at a single gateway URL works without code changes — only config changes:

```yaml
augment:
  mcpServers:
    - id: kagenti-gateway
      name: Kagenti MCP Gateway
      type: streamable-http
      url: http://mcp-gateway.kagenti-system.svc.cluster.local/mcp
```

**Considerations:**

- Augment's `serverId__toolName` prefixing and Kagenti's `toolPrefix_toolName` may double-prefix. Either disable Augment's prefixing for gateway-backed servers or configure the gateway without prefixes.
- Latency: adds one network hop (Envoy proxy). In-cluster latency is typically <1ms; acceptable for tool calls that involve external API calls.
- SSRF guard in Augment becomes unnecessary when all traffic goes through the gateway (the gateway controls backend topology).

### Direct mode integration:

For direct mode, set `server_url` to the gateway URL in `McpToolBuilder`. Llama Stack connects to the gateway instead of individual servers. Same wire protocol compatibility applies.

---

## 3. Security Model Integration

### Current Augment Auth Architecture

`McpAuthService` implements a 4-level priority chain per MCP server:

1. `authRef` — Named config from `augment.mcpAuth.*` (OAuth or ServiceAccount)
2. Inline `oauth` — Client credentials flow to a `tokenUrl`
3. Inline `serviceAccount` — K8s TokenRequest API for SA tokens
4. Global `security.mcpOAuth` — Fallback in `full` security mode

This is **508 lines** of token management code with caching, expiry buffers, in-flight deduplication, and TLS control.

### Kagenti Security Model

Kagenti replaces all of the above with infrastructure-level identity:

| Layer                 | Mechanism                                                                    | Effect                                                   |
| --------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------- |
| **Workload identity** | SPIFFE/SPIRE issues X.509 SVIDs per pod: `spiffe://{domain}/ns/{ns}/sa/{sa}` | Each pod has a cryptographic identity; no static secrets |
| **Transport**         | Istio Ambient mesh — per-node `ztunnel` enforces mTLS at L4                  | All pod-to-pod traffic encrypted; no sidecar overhead    |
| **Authorization**     | Istio `AuthorizationPolicy` CRDs — namespace-level and service-level ACLs    | Declarative YAML, not application code                   |
| **Token exchange**    | RFC 8693 OAuth2 token exchange via Keycloak                                  | Short-lived, scoped tokens for cross-boundary calls      |
| **Injection**         | Auto-injected sidecars: `spiffe-helper` + `kagenti-client-registration`      | Zero config per agent/tool pod                           |

### Integration Path

**Option 1: "Kagenti mode" in McpAuthService (minimal change)**

Add a new auth type that trusts the mesh:

```typescript
// In McpAuthService.getServerHeaders()
if (this.securityConfig.mode === 'kagenti') {
  // mTLS handles auth at the transport layer
  // No Bearer token needed — ztunnel verifies identity
  return headers;
}
```

When RHDH runs inside the Kagenti mesh, all traffic to MCP servers (via the gateway) is authenticated by mTLS. The entire `McpAuthService` priority chain becomes a no-op.

**Option 2: Kagenti as the OAuth provider (moderate change)**

Configure Augment's existing `security.mcpOAuth` to point to Kagenti's Keycloak instance:

```yaml
augment:
  security:
    mode: full
    mcpOAuth:
      tokenUrl: https://keycloak.kagenti-system.svc.cluster.local/realms/mcp/protocol/openid-connect/token
      clientId: augment-backend
      clientSecret: ${KEYCLOAK_CLIENT_SECRET}
      scopes: [openid, mcp-tools]
```

This requires no code changes — just configuration. The MCP Gateway validates the token via Authorino/Keycloak.

**Recommendation:** Option 2 for initial integration (config-only change), then Option 1 when RHDH is fully inside the mesh.

### Security Improvement Quantification

| Metric                   | Augment Today                        | With Kagenti                   |
| ------------------------ | ------------------------------------ | ------------------------------ |
| Static secrets in config | Per-server `clientSecret`, SA tokens | Zero — SPIFFE handles identity |
| Token management code    | 508 lines (`McpAuthService`)         | 0 lines (mesh handles it)      |
| Credential rotation      | Manual config update                 | Automatic SVID rotation        |
| Auth policy location     | Scattered across YAML, DB, code      | Centralized K8s CRDs           |

---

## 4. Agent Lifecycle and Discovery

### Current Augment Agent Architecture

Agents are defined in two sources, merged by `ConfigResolutionService`:

1. **YAML** (`app-config.yaml` → `augment.agents`): Static, requires restart
2. **Database** (`augment_admin_config` table, key `agents`): Dynamic via admin UI, but still a JSON blob

`AgentGraphManager` resolves these into an `AgentGraphSnapshot` — a frozen graph of `ResolvedAgent` objects used per-request. Agents run **in-process** within the Backstage Node.js runtime via the ADK.

### Kagenti Agent Lifecycle

Kagenti manages agents as **Kubernetes workloads**:

1. Deploy agent as a standard K8s Deployment with label `kagenti.io/type: agent`
2. AgentCard Sync Controller creates an `AgentCard` CRD automatically
3. AgentCard Controller fetches `/.well-known/agent-card.json` from the pod
4. JWS signature verification via SPIFFE x5c signing
5. Agent becomes discoverable via K8s API

### Architectural Mismatch

**Key tension:** Augment agents are in-process ADK constructs (functions within the Node.js process). Kagenti agents are out-of-process services (separate pods/deployments).

This is **not a blocker** — it's a design spectrum:

| Agent Type                   | Where It Runs                    | Protocol       | Use Case                                                 |
| ---------------------------- | -------------------------------- | -------------- | -------------------------------------------------------- |
| **ADK agent** (Augment)      | In-process, same Node.js runtime | Function calls | Low-latency, tightly coupled (router, specialist agents) |
| **Kagenti agent** (external) | Separate pod/deployment          | A2A over HTTP  | Independent lifecycle, different framework, scaling      |

### Integration Path: Hybrid Agent Discovery

Extend `AgentGraphManager` to support a third agent source:

1. **YAML** (static, restart-required)
2. **Database** (dynamic, admin UI)
3. **Kagenti K8s API** (dynamic, fully automated)

Implementation sketch:

```typescript
// In AgentGraphManager.resolveSnapshot()
if (config.kagentiDiscovery?.enabled) {
  const kagentiAgents = await this.discoverKagentiAgents(
    config.kagentiDiscovery,
  );
  agents = { ...agents, ...kagentiAgents };
}
```

Each Kagenti-discovered agent would be represented as an `AgentConfig` with:

- `type: 'a2a'` (new type)
- `endpoint: <service URL from AgentCard>`
- `skills: <from agent-card.json>`

The ADK orchestrator would treat these as remote agents, routing to them via A2A instead of in-process handoffs.

### Value Proposition

- **Agent marketplace:** RHDH users see all available agents (both built-in ADK and Kagenti-managed) in one place
- **Framework diversity:** LangGraph, CrewAI, BeeAI agents alongside ADK agents
- **Independent scaling:** Kagenti agents scale independently of the Backstage process
- **No restart:** New agents are auto-discovered via K8s labels

---

## 5. A2A Protocol Feasibility

### Protocol Maturity

A2A reached **v1.0.0 in March 2026** — production-ready:

- 22,955 GitHub stars, 140 contributors
- SDKs: Python, Go, **JavaScript**, Java, .NET
- Backed by 150+ organizations including Google, Red Hat, IBM
- Full specification: JSON-RPC over HTTPS, Agent Cards for discovery, task lifecycle

### A2A vs. ADK In-Process Handoffs

| Aspect                | ADK Handoffs (current)                     | A2A Protocol                            |
| --------------------- | ------------------------------------------ | --------------------------------------- |
| **Latency**           | Microseconds (function call)               | Milliseconds (HTTP round-trip)          |
| **State sharing**     | Full — shared memory, conversation context | Partial — task artifacts, not raw state |
| **Framework lock-in** | ADK only                                   | Any A2A-compatible framework            |
| **Scaling**           | Monolithic (scales with Backstage)         | Independent per agent                   |
| **Failure isolation** | One agent crash affects all                | Isolated — circuit breaker possible     |

### Recommendation: Additive, Not Replacement

A2A should **supplement** ADK's in-process orchestration, not replace it:

1. **Core agents** (Router, specialist agents with sub-second response needs) stay in-process via ADK
2. **External agents** (domain-specific, long-running, different-framework) accessed via A2A through Kagenti

Implementation approach in `AdkOrchestrator`:

```typescript
// New agent type in AgentConfig
interface AgentConfig {
  // ... existing fields
  type?: 'adk' | 'a2a'; // default: 'adk'
  a2aEndpoint?: string; // URL for A2A agents
  a2aCapabilities?: string[]; // from Agent Card skills
}

// In buildRunOptions, A2A agents become function tools that delegate
const a2aFunctionTool: FunctionTool = {
  type: 'function',
  name: sanitizeName(agent.name),
  description: agent.instructions,
  parameters: { type: 'object', properties: { task: { type: 'string' } } },
  execute: async args => {
    return await a2aClient.sendTask(agent.a2aEndpoint, args.task);
  },
};
```

### JavaScript SDK Status

The A2A JavaScript SDK exists and is Apache 2.0 licensed. It would be added as a dependency to `augment-backend`.

---

## 6. Observability Gap Analysis

### Current State

Augment has **no distributed tracing**. All logging goes through Backstage's `LoggerService` — structured text logs, no trace correlation, no spans.

Critical operations that lack observability:

- `ResponsesApiService.chatTurn()` — LLM API calls
- `BackendToolExecutor.executeTool()` — MCP tool executions
- `AdkOrchestrator.chat()/chatStream()` — agent runs and handoffs
- `BackendApprovalHandler` — HITL approval flows

### Kagenti Observability Stack

| Component                   | Role                                        | Status                |
| --------------------------- | ------------------------------------------- | --------------------- |
| **OpenTelemetry Collector** | Ingests spans from all services             | Production-ready      |
| **Phoenix**                 | LLM-specific trace visualization            | Deployed with Kagenti |
| **Jaeger**                  | General distributed tracing UI              | Optional backend      |
| **MLflow**                  | LLM tracing with GenAI semantic conventions | Integration available |
| **Kiali**                   | Service mesh network visualization          | Via Istio             |

### Integration Path

**Phase 1: OpenTelemetry instrumentation in Augment (moderate effort)**

Add `@opentelemetry/api` and create spans at key points:

```typescript
// In ResponsesApiService.chatTurn()
const span = tracer.startSpan('augment.chat_turn', {
  attributes: {
    'gen_ai.system': 'llama-stack',
    'gen_ai.request.model': deps.config.model,
    'augment.agent': agentName,
    'augment.conversation_id': conversationId,
  },
});

// In BackendToolExecutor.executeTool()
const span = tracer.startSpan('augment.tool_call', {
  attributes: {
    'mcp.server_id': serverId,
    'mcp.tool_name': toolName,
  },
});
```

**Phase 2: Export to Kagenti's collector**

Configure the OTEL exporter to send to Kagenti's collector:

```yaml
augment:
  observability:
    otlpEndpoint: http://otel-collector.kagenti-system.svc.cluster.local:4317
    serviceName: augment-backend
```

**Known pitfall (from Kagenti deployment experience):** Use gRPC port 4317, not HTTP port 4318. Silent trace drops occur with port mismatch.

### Observability Value

| Metric                   | Before   | After                                    |
| ------------------------ | -------- | ---------------------------------------- |
| Trace correlation        | None     | Full request → agent → tool chain        |
| LLM latency visibility   | Log grep | Phoenix dashboard                        |
| Tool execution debugging | Log grep | Per-tool spans with arguments/results    |
| Agent handoff tracking   | None     | Span hierarchy showing routing decisions |
| Network topology         | None     | Kiali visualization                      |

---

## 7. Deployment Topology Recommendation

### Option A: Kagenti as MCP/Agent Infrastructure Layer (Recommended)

```
┌─────────────────────────────────────────────────────────┐
│                    RHDH (Backstage)                      │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Augment Plugin                      │    │
│  │  ┌──────────────┐  ┌────────────────────────┐   │    │
│  │  │ ADK          │  │ BackendToolExecutor    │   │    │
│  │  │ Orchestrator │  │ (single gateway conn)  │   │    │
│  │  └──────┬───────┘  └──────────┬─────────────┘   │    │
│  └─────────┼─────────────────────┼─────────────────┘    │
│            │                     │                       │
└────────────┼─────────────────────┼───────────────────────┘
             │ A2A (future)        │ MCP over Streamable HTTP
             │                     │
┌────────────┼─────────────────────┼───────────────────────┐
│            │   Kagenti Platform  │                       │
│  ┌─────────▼────────┐  ┌────────▼──────────────────┐    │
│  │  Kagenti Agents   │  │    MCP Gateway            │    │
│  │  (A2A workloads)  │  │  ┌──────┐ ┌──────────┐   │    │
│  │                   │  │  │Broker│ │Router    │   │    │
│  │  - LangGraph      │  │  └───┬──┘ └────┬─────┘   │    │
│  │  - BeeAI          │  │      │          │         │    │
│  │  - CrewAI         │  │      ▼          ▼         │    │
│  └───────────────────┘  │  ┌──────┐  ┌──────────┐  │    │
│                         │  │MCP-A │  │MCP-B     │  │    │
│  ┌───────────────────┐  │  └──────┘  └──────────┘  │    │
│  │  Observability    │  └───────────────────────────┘    │
│  │  OTEL + Phoenix   │                                   │
│  │  + Kiali          │  ┌───────────────────────────┐    │
│  └───────────────────┘  │  Auth Bridge              │    │
│                         │  SPIFFE/SPIRE + Keycloak   │    │
│                         └───────────────────────────┘    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Istio Ambient Mesh (mTLS via ztunnel)           │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

**What changes in Augment:**

| Component                     | Change                                                         | Effort      |
| ----------------------------- | -------------------------------------------------------------- | ----------- |
| `augment.mcpServers[]` config | Single gateway URL instead of N server URLs                    | Config only |
| `McpAuthService`              | Point `security.mcpOAuth` to Kagenti's Keycloak                | Config only |
| `SsrfGuard`                   | Disable for gateway-backed servers (gateway controls topology) | 1-line flag |
| OTEL instrumentation          | Add spans in `chatTurn()`, `executeTool()`, `chat()`           | ~100 lines  |
| `AgentGraphManager`           | Add Kagenti K8s API discovery source (Phase 2)                 | ~200 lines  |

**What stays the same:**

- All ADK orchestration logic (in-process agents, handoffs, conversation state)
- Frontend UI (chat, admin panels, agent capabilities)
- Conversation persistence, HITL approval flows
- Llama Stack / Responses API integration

### Option B: Kagenti as Full Agent Platform (Future)

In this model, Augment's ADK agents are deployed as Kagenti-managed workloads communicating via A2A. This gives full scaling independence and framework flexibility but requires:

- Extracting each agent into a standalone A2A service
- Replacing in-process conversation state with distributed state (Redis/DB)
- Rewriting the streaming pipeline for A2A's task lifecycle model
- Accepting the latency cost of HTTP round-trips for every handoff

**Verdict:** Not justified today. The latency and complexity cost outweighs the scaling benefits for RHDH's typical deployment (single tenant, moderate concurrency).

### Option C: Hybrid (Recommended Long-term)

Start with Option A. Incrementally add:

1. **Phase 1 (weeks):** MCP Gateway + Keycloak auth (config-only changes)
2. **Phase 2 (sprint):** OTEL instrumentation in Augment backend
3. **Phase 3 (sprint):** A2A agent type in `AgentGraphManager` for external agents
4. **Phase 4 (quarter):** Evaluate moving compute-heavy agents (RAG indexing, code analysis) to Kagenti workloads

---

## 8. Proof-of-Concept Scope

**Smallest change to validate the integration:**

1. Deploy Kagenti on the existing OpenShift cluster (already has RHDH)
2. Deploy the existing MCP servers (e.g., `okp-mcp`, `ocp-mcp`) behind the Kagenti MCP Gateway
3. Change Augment's `mcpServers` config to point to the single gateway URL
4. Configure Augment's `security.mcpOAuth` to use Kagenti's Keycloak
5. Verify: tool discovery, tool execution, HITL approvals all work through the gateway
6. Measure: latency delta (direct vs. gateway)

**Expected effort:** 1-2 days of infrastructure work, zero code changes in Augment.

**Success criteria:**

- All existing MCP tools discoverable through gateway
- Tool execution latency increase < 10ms (in-cluster)
- OAuth flow works end-to-end (Augment → Keycloak → Gateway → MCP server)

---

## 9. Risks and Open Questions

| Risk                                                                                                                           | Severity | Mitigation                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------ | -------- | ----------------------------------------------------------------------------------------- |
| **Tool prefix collision** — Augment's `serverId__` and gateway's `toolPrefix_` may double-prefix                               | Medium   | Configure gateway without toolPrefix OR strip Augment's prefix for gateway-backed servers |
| **HITL through gateway** — Augment's `requireApproval` interception happens before MCP call; gateway adds another policy layer | Low      | HITL stays in Augment (application layer); gateway policy is additive (network layer)     |
| **Streaming through gateway** — SSE/streaming MCP responses through Envoy                                                      | Low      | Envoy supports streaming; the Router handles SSE transport                                |
| **Kagenti maturity** — v0.6.0-alpha (not GA)                                                                                   | Medium   | Use for MCP Gateway only (most mature component); avoid depending on alpha CRD APIs       |
| **A2A JS SDK maturity** — Less battle-tested than Python SDK                                                                   | Medium   | Start with Python-based external agents; JS SDK for later phases                          |
| **Observability silent failures** — OTEL port/filter mismatches cause silent trace drops                                       | Medium   | Validate trace pipeline end-to-end in PoC; use gRPC port 4317                             |

### Open Questions

1. **Can Kagenti's MCP Gateway aggregate tool lists from multiple servers into a single `listTools` response?** — Yes (confirmed from gateway docs: broker aggregates and the gateway exposes a unified tool view)
2. **Does the gateway preserve MCP session state (for stateful tools)?** — Needs validation in PoC
3. **How does Kagenti handle MCP server health when a backend is down?** — Gateway has readiness status on `MCPServerRegistration` CRs; need to verify behavior during partial outages
4. **Can RHDH run inside the Istio Ambient mesh?** — RHDH is a standard Kubernetes deployment; no known incompatibility, but needs testing with ztunnel
