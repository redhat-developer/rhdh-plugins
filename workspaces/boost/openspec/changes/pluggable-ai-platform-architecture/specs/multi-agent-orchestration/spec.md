# Multi-Agent Orchestration

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

Config-driven multi-agent orchestration without writing code. Llama Stack agents are defined in YAML and assembled into handoff chains. Kagenti agents are framework-neutral K8s workloads discovered via A2A protocol.

## EXISTING Requirements

### Requirement: Llama Stack Config-Driven Agents

Agents are defined declaratively and assembled into orchestration chains.

#### Scenario: Agent defined in YAML configuration

- **WHEN** an agent is defined in YAML or admin config with name, instructions, tools, model, temperature, and handoffs
- **THEN** `ResponsesApiCoordinator` assembles it into a `POST /v1/responses` call against the Llama Stack endpoint
- **AND** per-agent config includes: model, temperature, max tokens, tool choice, MCP server subsets, and vector store IDs

#### Scenario: Router agent delegates to specialists

- **WHEN** a router agent is configured as the default entry point with handoff targets
- **THEN** `ResponsesApiCoordinator` generates `transfer_to_{agent}` functions for handoff routing
- **AND** the router delegates to specialist agents mid-conversation while maintaining shared conversation context
- **AND** the user sees a handoff divider in the chat UI

#### Scenario: Agents-as-tools pattern

- **WHEN** an agent is configured with `call_{agent}` tool references
- **THEN** the manager agent can invoke specialist agents as tools
- **AND** the manager retains control of the conversation after the specialist returns

### Requirement: Kagenti Framework-Neutral Agent Operations

Agents built in any framework are accessible via RHDH through the A2A protocol.

#### Scenario: Kagenti provider discovers agents via A2A

- **WHEN** agents are deployed as K8s workloads in a Kagenti-managed namespace
- **THEN** `KagentiProvider` discovers them via the A2A protocol
- **AND** `KagentiApiClient` uses Keycloak OAuth2, retry logic, and namespace-scoped API calls
- **AND** agents appear in the gallery with auto-detected capabilities

#### Scenario: Namespace-scoped multi-tenancy

- **WHEN** multiple namespaces are configured in the Kagenti backend
- **THEN** agents are scoped to their namespace with backend-enforced allowlists
- **AND** the namespace picker in the admin UI filters the agent catalog accordingly

### Requirement: OpenAI Agent SDK Orchestration

The OpenAI Agent SDK (via Llama Stack Responses API) handles agent orchestration, handoff logic, and tool execution for the Llama Stack provider.

#### Scenario: Agent SDK manages multi-agent orchestration

- **WHEN** a chat interaction involves multi-agent handoffs
- **THEN** the OpenAI Agent SDK manages agent handoff transitions via the Responses API
- **AND** it coordinates tool execution within agent turns
- **AND** orchestration is defined via YAML configuration (not custom code)
