# Catalog Entities for AI Domain Objects

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

AI agents, models, MCP servers, and vector stores are modeled as Backstage catalog entities. This replaces in-memory caches with catalog-managed lifecycle, providing discoverability, ownership, search, and RBAC integration.

NOTE: These recommendations align with in-flight upstream Backstage initiatives:

- `AIContext`: Agent Cards will map to this kind when available
- `API Discriminated Union v1alpha2`: MCP Servers and AI Model Servers will map to the expanded `API` kind when available

The specifications below use existing Backstage kinds (`Resource`, `Component`) as the primary implementation path, with adoption of upstream kinds when they land. Custom `CatalogProcessor` validators support both during transition.

**Entity type strategy:**
| Domain Object | Preferred Kind | `spec.type` | Fallback Kind | Notes |
|---|---|---|---|---|
| AI Agents | `Component` | `ai-agent` | — | Future: `AIContext` when upstream lands |
| AI Models | `Resource` | `ai-model` | — | Future: `API` v1alpha2 discriminated union |
| MCP Servers | `API` | `mcp-server` | `Resource` | Upstream `McpServerApiEntity` available via `@backstage/plugin-catalog-backend-module-ai-model` ([backstage#34016](https://github.com/backstage/backstage/pull/34016), merged). Uses `spec.remotes: {type, url}[]` instead of `spec.definition`. Fall back to `kind: Resource, spec.type: mcp-server` if the catalog model module is not installed. |
| Vector Stores | `Resource` | `vector-store` | — | No upstream equivalent planned |
| Kagenti Tools | `Resource` | `ai-tool` | — | No upstream equivalent planned |

**Note on MCP Server entity kind:** When `@backstage/plugin-catalog-backend-module-ai-model` is installed, MCP servers use `kind: API, spec.type: mcp-server` with `spec.remotes` for transport endpoints. The `McpEntityProvider` should detect whether the model module is available and emit the appropriate kind. Use `isMcpServerApiEntity` type guard from `@backstage/catalog-model` when available.

**Note on tools:** "Kagenti Tools" (`ai-tool`) are K8s workloads with lifecycle governance (`boost-tool` permission resource type). "MCP Servers" (`mcp-server`) are registered protocol endpoints. Individual MCP tools (discovered at runtime via MCP `tools/list`) are not separate catalog entities — they are nested data within their parent MCP server.

Entity providers are **independently deployable Backstage backend services**, each packaged as its own RHDH dynamic plugin (`llamastack-entity-provider`, `kagenti-entity-provider`). They are registered as backend services per the [Backstage backend system architecture](https://backstage.io/docs/backend-system/architecture/services/).

**Two deployment modes:**

1. **Standalone:** Install `llamastack-entity-provider` or `kagenti-entity-provider` as independent RHDH dynamic plugins — gets AI domain objects in the catalog without the rest of boost. Packages live at `rhdh-plugins/workspaces/boost/plugins/`.
2. **Composed:** When `boost-backend` is installed with provider modules, the same entity provider packages are composed internally — installing a provider module gives you both AI capabilities and catalog entities.

Cross-cutting entities (MCP servers, vector stores) that aren't provider-specific live in the core plugin.

## ADDED Requirements

### Requirement: AI Agent Catalog Entities

Agents MUST be represented as Backstage catalog entities with lifecycle, ownership, and relations.

#### Scenario: Kagenti module emits agent entities

- **WHEN** the `KagentiAgentEntityProvider` (inside the Kagenti provider module) refreshes its upstream data
- **THEN** it polls the Kagenti API for all agents across configured namespaces
- **AND** the upstream refresh interval is configurable via `app-config.yaml` (default: 5m)
- **AND** Backstage's catalog infrastructure polls the entity provider on its own independent schedule
- **AND** it emits catalog entities with `kind: Component, spec.type: ai-agent` (or `kind: AIContext` when upstream is available)
- **AND** agent capabilities, LLM demands, and MCP demands map to `spec.dependsOn` relations
- **AND** the catalog is the source of truth for agent data — no in-memory cache needed

#### Scenario: Llama Stack module emits agent entities

- **WHEN** the `LlamaStackAgentEntityProvider` (inside the Llama Stack provider module) refreshes its upstream data
- **THEN** it reads configured agents from YAML/admin config
- **AND** the upstream refresh interval is configurable via `app-config.yaml` (default: 5m)
- **AND** it emits catalog entities for each configured agent with their tool sets and handoff targets

#### Scenario: Agent lifecycle reflected in catalog

- **WHEN** an agent transitions through lifecycle stages (Draft → Pending → Published → Archived)
- **THEN** the catalog entity's `metadata.annotations` reflect the current 4-stage lifecycle stage
- **AND** catalog entity lifecycle state maps: Draft → `experimental`, Pending → `experimental`, Published → `production`, Archived → `deprecated`
- **AND** `createdBy` ownership maps to catalog entity `spec.owner` for RBAC integration

### Requirement: AI Model Catalog Entities

AI models MUST be represented as catalog entities, eliminating duplicate caches.

#### Scenario: Provider modules emit model entities

- **WHEN** the `LlamaStackModelEntityProvider` (inside the Llama Stack module) runs on its scheduled interval
- **THEN** it polls `/v1/models` from the Llama Stack endpoint
- **AND** it emits entities with `kind: Resource, spec.type: ai-model`
- **AND** this eliminates duplicate caches #3 (`ResponsesApiProvider._modelsCache`) and #4 (`KagentiProvider._modelsCache`)

### Requirement: MCP Server Catalog Entities

MCP servers MUST be represented as catalog entities.

#### Scenario: Core plugin emits MCP server entities

- **WHEN** the `McpEntityProvider` (in the core plugin, cross-cutting) runs on its scheduled interval
- **THEN** it reads MCP server configurations from admin config and database
- **AND** it emits entities with `kind: Resource, spec.type: mcp-server` (or expanded `API` kind when upstream is available)
- **AND** auto-discovered tools are reflected as entity annotations
- **AND** this eliminates the unbounded tool schema cache (#7)

### Requirement: Vector Store Catalog Entities

RAG vector stores MUST be represented as catalog entities.

#### Scenario: Core plugin emits vector store entities

- **WHEN** the `VectorStoreEntityProvider` (in the core plugin, cross-cutting) runs on its scheduled interval
- **THEN** it reads vector store configurations from admin config
- **AND** it emits entities with `kind: Resource, spec.type: vector-store`
- **AND** per-agent scoping is reflected via `spec.dependsOn` relations to agent entities

### Requirement: Entity Providers as Independent Backend Services

Entity providers MUST be independently deployable Backstage backend services.

#### Scenario: Standalone entity provider deployment (without boost)

- **WHEN** `llamastack-entity-provider` or `kagenti-entity-provider` is installed as a standalone RHDH dynamic plugin
- **THEN** it registers as a Backstage backend service
- **AND** it registers its entity providers via `catalogProcessingExtensionPoint`
- **AND** it configures scheduled task runners for periodic polling (e.g., every 5 minutes for agents, every 60 seconds for models)
- **AND** AI domain objects appear in the Backstage catalog without the rest of boost installed

#### Scenario: Entity provider composed into boost provider module

- **WHEN** a boost provider module (e.g., `plugin-boost-backend-module-kagenti`) is installed
- **THEN** it composes the `kagenti-entity-provider` package internally
- **AND** it registers both AI capabilities (via `boostProviderExtensionPoint`) and catalog entities (via `catalogProcessingExtensionPoint`)
- **AND** installing the provider module gives you both AI capabilities and catalog entities in one step

#### Scenario: Cross-cutting entity providers in core plugin

- **WHEN** the core `boost-backend` plugin starts
- **THEN** it registers `McpEntityProvider` and `VectorStoreEntityProvider` via `catalogProcessingExtensionPoint`
- **AND** these cross-cutting entities are available regardless of which provider modules are installed
