# Catalog Entities for AI Domain Objects

AI agents, models, MCP servers, and vector stores are modeled as Backstage catalog entities. This replaces in-memory caches with catalog-managed lifecycle, providing discoverability, ownership, search, and RBAC integration.

NOTE: These recommendations align with in-flight upstream Backstage initiatives:

- `AIContext`: Agent Cards will map to this kind when available
- `API Discriminated Union v1alpha2`: MCP Servers and AI Model Servers will map to the expanded `API` kind when available

The specifications below use existing Backstage kinds (`Resource`, `Component`) as the primary implementation path, with migration to upstream kinds when they land. Custom `CatalogProcessor` validators support both during transition.

**Entity type strategy:**
| Domain Object | Immediate Kind | `spec.type` | Future Kind (upstream) |
|---|---|---|---|
| AI Agents | `Component` | `ai-agent` | `AIContext` |
| AI Models | `Resource` | `ai-model` | `API` (v1alpha2 discriminated union) |
| MCP Servers | `Resource` | `mcp-server` | `API` (v1alpha2 discriminated union) |
| Vector Stores | `Resource` | `vector-store` | (no upstream equivalent planned) |
| Tools | `Resource` | `ai-tool` | (no upstream equivalent planned) |

Entity providers are **independently deployable Backstage backend services**, each packaged as its own RHDH dynamic plugin (`llamastack-entity-provider`, `kagenti-entity-provider`). They are registered as backend services per the [Backstage backend system architecture](https://backstage.io/docs/backend-system/architecture/services/).

**Two deployment modes:**

1. **Standalone:** Install `llamastack-entity-provider` or `kagenti-entity-provider` as independent RHDH dynamic plugins — gets AI domain objects in the catalog without the rest of boost. Packages live at `rhdh-plugins/workspace/boost/plugins/`.
2. **Composed:** When `boost-backend` is installed with provider modules, the same entity provider packages are composed internally — installing a provider module gives you both AI capabilities and catalog entities.

Cross-cutting entities (MCP servers, vector stores) that aren't provider-specific live in the core plugin.

## ADDED Requirements

### Requirement: AI Agent Catalog Entities

Agents are represented as Backstage catalog entities with lifecycle, ownership, and relations.

#### Scenario: Kagenti module emits agent entities

- **WHEN** the `KagentiAgentEntityProvider` (inside the Kagenti provider module) runs on its scheduled interval
- **THEN** it polls the Kagenti API for all agents across configured namespaces
- **AND** it emits catalog entities with `kind: Component, spec.type: ai-agent` (or `kind: AIContext` when upstream is available)
- **AND** agent capabilities, LLM demands, and MCP demands map to `spec.dependsOn` relations
- **AND** the entity replaces the in-memory `KagentiAgentCardCache` (cache #2)

#### Scenario: Llama Stack module emits agent entities

- **WHEN** the `LlamaStackAgentEntityProvider` (inside the Llama Stack provider module) runs on its scheduled interval
- **THEN** it reads configured agents from YAML/admin config
- **AND** it emits catalog entities for each configured agent with their tool sets and handoff targets

#### Scenario: Agent lifecycle reflected in catalog

- **WHEN** an agent transitions through lifecycle stages (Draft → Pending → Published → Archived)
- **THEN** the catalog entity's `metadata.annotations` reflect the current 4-stage lifecycle stage
- **AND** catalog entity lifecycle state maps: Draft → `experimental`, Published → `production`, Archived → `deprecated`
- **AND** `createdBy` ownership maps to catalog entity `spec.owner` for RBAC integration

### Requirement: AI Model Catalog Entities

AI models are represented as catalog entities, eliminating duplicate caches.

#### Scenario: Provider modules emit model entities

- **WHEN** the `LlamaStackModelEntityProvider` (inside the Llama Stack module) runs on its scheduled interval
- **THEN** it polls `/v1/models` from the Llama Stack endpoint
- **AND** it emits entities with `kind: Resource, spec.type: ai-model`
- **AND** this eliminates duplicate caches #3 (`ResponsesApiProvider._modelsCache`) and #4 (`KagentiProvider._modelsCache`)

### Requirement: MCP Server Catalog Entities

MCP servers are represented as catalog entities.

#### Scenario: Core plugin emits MCP server entities

- **WHEN** the `McpEntityProvider` (in the core plugin, cross-cutting) runs on its scheduled interval
- **THEN** it reads MCP server configurations from admin config and database
- **AND** it emits entities with `kind: Resource, spec.type: mcp-server` (or expanded `API` kind when upstream is available)
- **AND** auto-discovered tools are reflected as entity annotations
- **AND** this eliminates the unbounded tool schema cache (#7)

### Requirement: Vector Store Catalog Entities

RAG vector stores are represented as catalog entities.

#### Scenario: Core plugin emits vector store entities

- **WHEN** the `VectorStoreEntityProvider` (in the core plugin, cross-cutting) runs on its scheduled interval
- **THEN** it reads vector store configurations from admin config
- **AND** it emits entities with `kind: Resource, spec.type: vector-store`
- **AND** per-agent scoping is reflected via `spec.dependsOn` relations to agent entities

### Requirement: Entity Providers as Independent Backend Services

Entity providers are independently deployable Backstage backend services.

#### Scenario: Standalone entity provider deployment (without boost)

- **WHEN** `llamastack-entity-provider` or `kagenti-entity-provider` is installed as a standalone RHDH dynamic plugin
- **THEN** it registers as a Backstage backend service
- **AND** it registers its entity providers via `catalogProcessingExtensionPoint`
- **AND** it configures scheduled task runners for periodic polling (e.g., every 5 minutes for agents, every 60 seconds for models)
- **AND** AI domain objects appear in the Backstage catalog without the rest of boost installed

#### Scenario: Entity provider composed into boost provider module

- **WHEN** a boost provider module (e.g., `plugin-boost-backend-module-kagenti`) is installed
- **THEN** it composes the `kagenti-entity-provider` package internally
- **AND** it registers both AI capabilities (via `augmentProviderExtensionPoint`) and catalog entities (via `catalogProcessingExtensionPoint`)
- **AND** installing the provider module gives you both AI capabilities and catalog entities in one step

#### Scenario: Cross-cutting entity providers in core plugin

- **WHEN** the core `boost-backend` plugin starts
- **THEN** it registers `McpEntityProvider` and `VectorStoreEntityProvider` via `catalogProcessingExtensionPoint`
- **AND** these cross-cutting entities are available regardless of which provider modules are installed
