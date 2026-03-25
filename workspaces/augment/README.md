# Augment Workspace

This workspace contains the Augment plugin family for Red Hat Developer Hub.

Augment is a config-driven AI assistant built on [Llama Stack's OpenAI-compatible Responses API](https://developers.redhat.com/articles/2025/08/20/your-agent-your-rules-deep-dive-responses-api-llama-stack). It provides RAG-powered document search, multi-agent orchestration, tool calling via MCP servers, and safety guardrails — all running against open-source models on your own infrastructure.

## Architecture

Augment follows the same agent architecture as the [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/multi_agent/): an agent is **not** a server-side resource — it is a client-side abstraction of `instructions + tools + model`, assembled into a `POST /v1/responses` call against Llama Stack.

```
┌──────────────────────────────────────────────────────────┐
│  Backstage Frontend (augment plugin)                     │
│  Chat UI · Handoff visualization · Agent status panel    │
└──────────────────────┬───────────────────────────────────┘
                       │  SSE / REST
┌──────────────────────▼───────────────────────────────────┐
│  Backstage Backend (augment-backend plugin)              │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  ResponsesApiCoordinator (multi-agent orchestrator) │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │ │
│  │  │ Router   │→ │Specialist│→ │ Specialist        │  │ │
│  │  │ Agent    │  │ Agent A  │  │ Agent B           │  │ │
│  │  │          │  │          │  │                    │  │ │
│  │  │ tools:   │  │ tools:   │  │ tools:            │  │ │
│  │  │ transfer │  │ MCP svrs │  │ file_search, MCP  │  │ │
│  │  │ _to_*    │  │          │  │                    │  │ │
│  │  └──────────┘  └──────────┘  └──────────────────┘  │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  DocumentService · ConversationManager · SafetyService   │
└──────────────────────┬───────────────────────────────────┘
                       │  OpenAI-compatible REST
┌──────────────────────▼───────────────────────────────────┐
│  Llama Stack Server                                      │
│  /v1/responses · /v1/conversations · /v1/vector_stores   │
│  /v1/files · /v1/models · /v1/shields                    │
└──────────────────────────────────────────────────────────┘
```

### Multi-Agent Orchestration

Each agent in the YAML config becomes a unique `POST /v1/responses` call with its own `instructions`, `tools`, `temperature`, and `toolChoice`. Multi-agent routing uses the [OpenAI Agents SDK handoff pattern](https://openai.github.io/openai-agents-js/guides/handoffs/):

- **Handoffs** (`transfer_to_{agent}`): A router agent delegates to a specialist who takes over the conversation.
- **Agents-as-tools** (`call_{agent}`): A manager agent calls specialists as tools and retains control of the response.

All agents share the same Llama Stack `conversation` ID for context continuity across handoffs.

### Key APIs Used

| Llama Stack API              | Purpose                                                            |
| ---------------------------- | ------------------------------------------------------------------ |
| `POST /v1/responses`         | All LLM inference — each agent config becomes a parameterized call |
| `POST /v1/conversations`     | Persistent conversation state across agent handoffs                |
| `POST /v1/vector_stores`     | RAG document storage and retrieval                                 |
| `POST /v1/files`             | Document upload for ingestion                                      |
| `GET /v1/models`             | Model discovery and validation                                     |
| `POST /v1/safety/run-shield` | Input/output safety guardrails                                     |

## Plugins

| Plugin                                                                                | Description                                                        |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| [@red-hat-developer-hub/backstage-plugin-augment](./plugins/augment/)                 | Frontend — chat UI, agent handoff visualization, admin panels      |
| [@red-hat-developer-hub/backstage-plugin-augment-backend](./plugins/augment-backend/) | Backend — multi-agent orchestrator, RAG ingestion, MCP integration |
| [@red-hat-developer-hub/backstage-plugin-augment-common](./plugins/augment-common/)   | Shared types, permissions, and security mode definitions           |

## Development

```bash
# Install dependencies
yarn install

# Start the dev server
yarn dev

# Run tests
yarn test:all

# Build all plugins
yarn build:all
```
