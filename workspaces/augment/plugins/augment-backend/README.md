# Augment Backend

Backend plugin for Augment — a multi-agent AI assistant built on Llama Stack's OpenAI-compatible Responses API.

Every agent is a **client-side abstraction** (`instructions` + `tools` + `model`), following the [OpenAI Agents SDK pattern](https://openai.github.io/openai-agents-python/multi_agent/). Agent configs in YAML are assembled into parameterized `POST /v1/responses` calls — there is no persistent agent resource on the server.

## Features

- **Multi-Agent Orchestration**: Define router and specialist agents with handoffs and agents-as-tools patterns
- **OpenAI Agents SDK Compatibility**: `transfer_to_{agent}` handoffs, `call_{agent}` tool delegation, handoff input filters, tool guardrails, output schemas
- **Config-Driven Ingestion**: Documents are automatically synced from configured sources
- **Multiple Sources**: Support for local directories, URLs, and GitHub repositories
- **Llama Stack Integration**: Uses Llama Stack's OpenAI-compatible APIs (`/v1/responses`, `/v1/conversations`, `/v1/vector_stores`, `/v1/files`)
- **File Search (RAG)**: Built-in `file_search` tool backed by vector stores
- **Conversations API**: Persistent chat sessions via Llama Stack's `/v1/conversations` — context is maintained across agent handoffs
- **Server-Side Prompt Management**: Reference versioned prompts from Llama Stack's `/v1/prompts` API via `promptRef`
- **Periodic Sync**: Optional scheduled re-sync to keep documents up-to-date
- **Status Monitoring**: Health checks for provider and vector store connections
- **3 Security Modes**: Flexible authentication (`none`, `plugin-only`, `full`)
- **MCP Server Integration**: Connect to MCP servers for extended tool capabilities
- **Safety Guardrails**: Input/output shields via Llama Stack Safety API, plus per-agent tool guardrails

## Installation

```bash
yarn --cwd packages/backend add @red-hat-developer-hub/backstage-plugin-augment-backend
```

```ts
// In packages/backend/src/index.ts
const backend = createBackend();
backend.add(import('@red-hat-developer-hub/backstage-plugin-augment-backend'));
```

## How Multi-Agent Orchestration Works

The `ResponsesApiCoordinator` reads agent definitions from YAML config and builds each agent's `POST /v1/responses` call at runtime:

1. **Agent resolution**: The coordinator looks up the target agent's `AgentConfig` (instructions, tools, model, temperature, etc.)
2. **Tool assembly**: Handoffs become `transfer_to_{key}` function tools; agents-as-tools become `call_{key}` function tools; MCP tools, `file_search`, `web_search`, and custom functions are merged in
3. **API call**: A single `POST /v1/responses` is sent with the assembled payload
4. **Tool execution**: If the response includes tool calls (MCP, handoff, RAG, etc.), the coordinator executes them and loops back for another response
5. **Handoff handling**: When a `transfer_to_{key}` tool is called, the coordinator switches the active agent and continues the conversation loop with the new agent's instructions and tools

All agents within a session share the same Llama Stack `conversation_id` via the Conversations API, maintaining full context across handoffs.

### Agent Configuration Reference

Each agent supports the full OpenAI Agents SDK surface area:

| Field                   | Description                                                                     |
| ----------------------- | ------------------------------------------------------------------------------- |
| `name`                  | Display name of the agent                                                       |
| `instructions`          | System prompt (the complete prompt sent to the LLM)                             |
| `handoffs`              | Agent keys this agent can delegate to (`transfer_to_{key}` functions)           |
| `asTools`               | Agent keys this agent can call as tools (`call_{key}` functions)                |
| `mcpServers`            | Subset of MCP server IDs this agent can use                                     |
| `enableRAG`             | Whether this agent has access to `file_search`                                  |
| `enableWebSearch`       | Whether this agent has access to `web_search`                                   |
| `enableCodeInterpreter` | Whether this agent can run code                                                 |
| `functions`             | Custom function definitions specific to this agent                              |
| `handoffDescription`    | Description shown to other agents when this agent is a handoff target           |
| `handoffInputSchema`    | JSON Schema for structured handoff metadata (maps to OpenAI `inputType`)        |
| `handoffInputFilter`    | How history is transformed on handoff: `none`, `removeToolCalls`, `summaryOnly` |
| `toolUseBehavior`       | What happens after tool results: `run_llm_again` or `stop_on_first_tool`        |
| `outputSchema`          | JSON Schema for structured output validation                                    |
| `toolGuardrails`        | Per-tool input/output guardrail rules                                           |
| `guardrails`            | Server-side shield IDs for this agent                                           |
| `toolChoice`            | Override tool choice strategy (`auto`, `required`, `none`, or specific tool)    |
| `reasoning`             | Reasoning/chain-of-thought configuration                                        |
| `model`                 | Override LLM model for this agent                                               |
| `temperature`           | Sampling temperature override                                                   |
| `maxToolCalls`          | Cap on tool calls per response to prevent loops                                 |
| `maxOutputTokens`       | Override max output tokens                                                      |
| `promptRef`             | Reference to a server-managed prompt template in Llama Stack's Prompts API      |
| `truncation`            | Context window truncation strategy (`auto` or `disabled`)                       |

## Configuration

```yaml
augment:
  # =============================================================================
  # SECURITY - 3 Modes Available (see docs/SECURITY_MODES.md for details)
  # =============================================================================
  security:
    mode: 'plugin-only' # Options: 'none' | 'plugin-only' | 'full'

  llamaStack:
    baseUrl: 'https://your-llama-stack-server.com'
    vectorStoreId: 'your-vector-store-id'
    model: 'gemini/gemini-2.5-flash'
    chunkingStrategy: 'static'
    maxChunkSizeTokens: 200
    chunkOverlapTokens: 50
    skipTlsVerify: true # For self-signed certs

  # Document sources for automatic ingestion
  documents:
    syncMode: full # 'full' or 'append'
    syncSchedule: '1h' # Optional: periodic sync
    sources:
      # Local directory
      - type: directory
        path: ./docs/knowledge-base
        patterns:
          - '**/*.md'
          - '**/*.yaml'

      # URLs
      - type: url
        urls:
          - https://example.com/docs/guide.md

      # GitHub repository
      - type: github
        repo: 'org/documentation'
        branch: main
        path: docs/
        patterns:
          - '*.md'
        token: ${GITHUB_TOKEN}

  # MCP Servers for extended tool capabilities
  mcpServers:
    - id: openshift-server
      name: OpenShift MCP Server
      type: streamable-http # or 'sse'
      url: 'https://mcp-server.example.com/mcp'
      requireApproval: 'never' # or 'always' or { always: [...], never: [...] }

  # Multi-agent orchestration
  agents:
    triage:
      name: Triage Agent
      instructions: 'You are a triage agent. Route to the appropriate specialist.'
      handoffs: [docs, kubernetes]
      toolChoice: { type: 'required' }
      temperature: 0.1
    docs:
      name: Documentation Specialist
      instructions: 'You answer questions from the knowledge base.'
      enableRAG: true
      handoffDescription: 'Handles documentation and knowledge-base questions'
    kubernetes:
      name: Kubernetes Specialist
      instructions: 'You help with Kubernetes and OpenShift operations.'
      mcpServers: [openshift-server]
      handoffDescription: 'Handles Kubernetes and OpenShift operations'
```

### Kagenti Provider

To use Kagenti as the AI provider instead of Llama Stack, set `augment.provider` to `kagenti` and add the `augment.kagenti` configuration block:

```yaml
augment:
  provider: kagenti

  kagenti:
    # Required: Kagenti API server URL
    baseUrl: https://kagenti-api-kagenti-system.apps.ocp.example.com

    # Required: OAuth2 client credentials for Kagenti API authentication
    auth:
      tokenEndpoint: https://keycloak.example.com/realms/kagenti/protocol/openid-connect/token
      clientId: backstage-augment
      clientSecret: ${KAGENTI_CLIENT_SECRET}

    # Optional: Default namespace for agents and tools (default: "default")
    namespace: my-namespace

    # Optional: Restrict to specific namespaces (allowlist)
    namespaces:
      - team-a
      - team-b

    # Optional: Show all namespaces in the namespace picker (default: true)
    showAllNamespaces: true

    # Optional: Default agent name for chat
    agentName: my-agent

    # Optional: Skip TLS verification for self-signed certs (default: false)
    skipTlsVerify: false

    # Optional: Timeout configuration
    requestTimeoutMs: 30000
    streamTimeoutMs: 300000
    maxRetries: 3

    # Optional: Local overrides for feature flags from the Kagenti API
    featureOverrides:
      sandbox: true
      integrations: true
      triggers: true

    # Optional: Dashboard URL overrides
    dashboards:
      traces: https://jaeger.example.com
      network: https://kiali.example.com
      mcpInspector: https://mcp-inspector.example.com
      mcpProxy: https://mcp-proxy.example.com
      keycloakConsole: https://keycloak.example.com/admin

    # Optional: Sandbox default settings
    sandbox:
      sessionTtlMinutes: 30
      defaultSkill: python
      sidecar:
        autoApprove: false
```

### Kagenti Agent Security

Kagenti supports several layers of agent security that are integrated with the Augment plugin:

**Service Authentication**: The plugin authenticates to the Kagenti API using OAuth2 client credentials (configured via `augment.kagenti.auth`). All API calls use a shared service token.

**User Identity Propagation**: The Backstage user's identity is forwarded to the Kagenti API via the `X-Backstage-User` header on every request, enabling per-user audit trails and access control on the Kagenti side.

**Namespace Access Control**: When `namespaces` is configured as an allowlist, the plugin enforces that users can only access agents and tools within those namespaces. If `showAllNamespaces: false`, only the default `namespace` is accessible.

**Route-Level Authorization**: Kagenti mutation routes (create/delete agents, tools, builds, LLM configuration, integrations) require admin access (`augment.admin` permission). Read-only routes (list agents, list tools, view agent cards) are accessible to all plugin users.

**Auth Bridge**: When creating agents or tools, the "Auth bridge enabled" flag enables identity propagation between services. The calling user's identity is forwarded to the tool via Kagenti's auth bridge, allowing the tool to make authenticated calls on behalf of the user.

**SPIRE (Workload Identity)**: The "SPIRE enabled" flag enables SPIFFE-based workload identity with mutual TLS. When enabled, the tool receives a cryptographic workload identity and communicates with other services using mTLS.

**A2A Interactive Security**: During agent conversations, Kagenti agents can request:
- **User Approval**: Human-in-the-loop confirmation before executing tools
- **OAuth Authentication**: Redirect the user to an identity provider for authentication
- **Secrets**: Prompt the user for credentials or API keys
- **Form Input**: Request structured data from the user

### Kagenti — API-Only Features (No UI)

The following 9 capabilities have full backend routes and client support but are **not available in the Augment UI**. They can be accessed programmatically via the REST API.

#### Sandbox (requires `sandbox` feature flag)

| Feature | Endpoints | Notes |
|---------|-----------|-------|
| Sandbox Chat | `POST /kagenti/sandbox/:ns/chat` | Non-streaming chat within a sandbox session |
| Sandbox Streaming Chat | `POST /kagenti/sandbox/:ns/chat/stream` | SSE streaming chat within a sandbox session |
| Session Subscribe (SSE) | `GET /kagenti/sandbox/:ns/sessions/:id/subscribe` | Real-time session event stream |
| Create / Delete Sandbox | `POST /DELETE /kagenti/sandbox/:ns/...` | Sandbox lifecycle management |
| Browse Sandbox Files | `GET /kagenti/sandbox/:ns/files/...` | File browsing, directory listing, file content retrieval |
| Sidecar Management | `POST /kagenti/sandbox/:ns/.../sidecars/...` | Enable, disable, configure, approve, deny sidecars |
| Session Chain / History | `GET .../chain`, `GET .../history` | Detailed session execution chain and conversation history |

#### Agent Management

| Feature | Endpoints | Notes |
|---------|-----------|-------|
| Agent Migration | `POST /kagenti/agents/:ns/:name/migrate`, `POST .../migrate-all` | Migrate agents from legacy CRD format to deployment-based format |

#### Integrations (requires `integrations` feature flag)

| Feature | Endpoints | Notes |
|---------|-----------|-------|
| Update Integration | `PUT /kagenti/integrations/:ns/:name` | Modify an existing integration's configuration |

These are tracked as planned enhancements. The core agent chat flow uses the main `chatStream` endpoint and is fully functional in the UI.

## Document Sources

### Directory Source

Fetch documents from a local directory:

```yaml
- type: directory
  path: ./docs/knowledge-base # Relative to Backstage root
  patterns:
    - '**/*.md'
    - '**/*.yaml'
    - '**/*.json'
```

### URL Source

Fetch documents from URLs:

```yaml
- type: url
  urls:
    - https://raw.githubusercontent.com/org/repo/main/README.md
    - https://internal-wiki.example.com/api/export/runbooks.md
  headers:
    Authorization: 'Bearer ${API_TOKEN}'
```

### GitHub Source

Fetch documents from a GitHub repository:

```yaml
- type: github
  repo: 'your-org/documentation'
  branch: main
  path: docs/ # Optional: subdirectory
  patterns:
    - '**/*.md'
  token: ${GITHUB_TOKEN} # Required for private repos
```

## Sync Behavior

- **On Startup**: Documents are synced immediately when the plugin starts
- **Periodic Sync**: If `syncSchedule` is set, documents are re-synced at the specified interval
- **Sync Modes**:
  - `append`: Only add new documents, never remove
  - `full`: Add new documents and remove documents no longer in sources

## API Reference

### Backstage Plugin API

| Endpoint                         | Method | Description                                                                |
| -------------------------------- | ------ | -------------------------------------------------------------------------- |
| `/api/augment/chat`              | POST   | Send chat messages with streaming RAG responses (proxied to Responses API) |
| `/api/augment/documents`         | GET    | List indexed documents (read-only)                                         |
| `/api/augment/conversations`     | GET    | List conversation history                                                  |
| `/api/augment/conversations/:id` | GET    | Get a specific conversation                                                |
| `/api/augment/conversations/:id` | DELETE | Delete a conversation                                                      |
| `/api/augment/sync`              | POST   | Trigger manual document sync                                               |
| `/api/augment/status`            | GET    | Get service and MCP server status                                          |

### Underlying Llama Stack APIs

The backend plugin communicates with these Llama Stack endpoints:

| Llama Stack Endpoint                 | Used For                                                                  |
| ------------------------------------ | ------------------------------------------------------------------------- |
| `POST /v1/responses`                 | All LLM inference — each agent config becomes a unique parameterized call |
| `POST /v1/conversations`             | Creating and managing persistent chat sessions across agent handoffs      |
| `GET /v1/conversations/:id/messages` | Retrieving conversation history                                           |
| `POST /v1/vector_stores`             | Creating and managing RAG vector stores                                   |
| `POST /v1/vector_stores/:id/files`   | Attaching documents to vector stores                                      |
| `POST /v1/files`                     | Uploading documents for ingestion                                         |
| `GET /v1/models`                     | Model discovery and validation                                            |
| `POST /v1/safety/run-shield`         | Running input/output safety guardrails                                    |
| `GET /v1/prompts`                    | Fetching server-managed prompt templates                                  |

## Further Documentation

| Document                                                          | Description                                                                       |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| [CONFIG_REFERENCE.md](../augment-common/docs/CONFIG_REFERENCE.md) | YAML requirements, code-level defaults, admin UI scope, and precedence rules      |
| [TROUBLESHOOTING.md](../augment-common/docs/TROUBLESHOOTING.md)   | Diagnostic steps for common issues (400 errors, plugin not loading, RAG failures) |
| [SECURITY_MODES.md](../augment-common/docs/SECURITY_MODES.md)     | Detailed explanation of the 3 security modes                                      |
| [MCP_SERVER_SETUP.md](../augment-common/docs/MCP_SERVER_SETUP.md) | How to configure MCP servers                                                      |

## License

Apache-2.0
