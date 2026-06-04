# PRD: Agent Creation & Discovery

**Product:** Boost — Agentic Developer Portal for Red Hat Developer Hub
**Status:** Requirements for new implementation (informed by Augment reference prototype)
**Date:** 2026-05-19
**Updated:** 2026-06-02 — reframed for boost; 4-stage lifecycle, skills marketplace integration, catalog entities from day one, ownership semantics
**Priority:** P0 (creation paths, lifecycle governance) / P1 (discovery, tools, skills marketplace integration)
**Provenance:** Requirements derived from Augment plugin analysis. See `specifications/boost-context.md` for project context.

---

## Why

An agentic AI platform is only as valuable as the agents running on it. Augment must support the full agent lifecycle — from initial creation through discovery by end users — across two fundamentally different personas: citizen developers who create agents visually and professional developers who build agents with code.

This PRD defines the four creation paths, the discovery and browsing experience, and MCP tool connectivity that powers agent capabilities. Together, these form the "supply side" of the agent ecosystem.

## What This Product Does

The platform provides four distinct paths to create an AI agent, a curated gallery for discovering existing agents, and a tool integration system for connecting agents to live infrastructure. All paths converge on a unified agent model that is visible to end users through the same gallery and chat interface.

## Who It's For

### Citizen Developer

Creates agents visually through the no-code builder wizard. Discovers pre-built agents in the gallery. Does not write code.

### Professional Developer

Creates agents through Software Templates, cloud IDEs (DevSpaces), or by importing existing container images/repos. Configures MCP tool integrations. Can also extend the platform with new provider implementations.

### Administrator

Manages agents, orchestration rules, and tool policies across the platform.

## Boundaries

### In Scope

- Agent browsing and selection (gallery, search, filter, pin)
- Four agent creation paths: no-code builder, Software Template, DevSpaces, import
- Skills marketplace integration: proxy to external skills catalog, deploy selected skills locally
- MCP tool server registration, authentication, and approval policies
- Agent lifecycle: 4-stage governance (Draft → Pending → Published → Archived)
- Ownership-based visibility and action gating
- Cascading delete across backend stores
- Backstage catalog representation: agents, tools, models, and MCP servers as catalog entities
- Kagenti-specific admin experience (sidebar, dashboard, build pipelines, sandbox)

### Out of Scope

- Chat interaction with agents (see AI Chat & Interaction PRD)
- Provider architecture and hot-swap (see Platform Architecture PRD)
- Lifecycle governance approval workflows and permissions (see Security & Governance PRD)
- Runtime configuration and branding (see Platform Operations PRD)

### UX/UXD Integration

All agent creation, gallery, and admin UI flows must align with RHDH usability and visual design standards:

- **Mockups as source of truth:** Agent gallery, creation wizards, skills marketplace integration, lifecycle governance UI, and admin panels are built from UX/UXD-provided mockups and wireframes. No user-facing UI ships without an approved design artifact.
- **PatternFly alignment:** All components use PatternFly design system patterns consistent with RHDH. Custom wizard steps, gallery cards, preview panels, and approval queue UIs require UX/UXD review.
- **Design review gates:** Frontend PRs introducing or modifying agent-facing UI require UX/UXD sign-off before merge.

---

## Capabilities

### 1. Browse and Select an Agent (UC-4)

**Goal:** Discover available agents, evaluate their capabilities, and select one to start a conversation.

**How it works (Kagenti):**

- Welcome screen shows a featured agents strip curated by the administrator
- "Browse all agents" opens the full agent catalog dialog
- Search, filter by framework, sort by name/status/newest; tabs: All, Recent, Pinned
- Preview panel shows: starters, about, skills, capabilities (streaming/A2A), technical details (framework, workspace, version, endpoint)
- "Start Conversation" selects the agent and enables the chat input

**Llama Stack path:** Agents are configured by the administrator; the router agent handles delegation automatically. No gallery needed.

**First visit:** Auto-open catalog when no agent is selected (Kagenti).

**Epics/Stories:** Epic 3 (Feature 3.2), Epic 1 (Stories 1.5.2-1.5.3)

### 2. Discover Agents in the Gallery (UC-9)

**Goal:** Browse a curated collection of pre-built agents with rich metadata. (Citizen Developer focused, Kagenti only.)

**How it works:**

- Welcome screen shows featured agents curated by administrator
- Agent cards display: name, description, avatar, capabilities, framework, status
- Click-through to preview panel with detailed information and "Start Conversation"
- Search by keyword, filter by framework, pin favorites

**Epics/Stories:** Epic 3 (Feature 3.2), Epic 4 (Story 4.5.1), Epic 9 (Story 9.4.3)

### 3. Create an Agent — Umbrella (UC-7)

**Goal:** Create a new AI agent that serves users through the Augment chat interface.

Four creation methods converge to a unified `ChatAgent` model:

| Method             | Persona                | How                            | Provider               |
| ------------------ | ---------------------- | ------------------------------ | ---------------------- |
| No-code builder    | Citizen Developer      | Visual wizard in admin UI      | Llama Stack or Kagenti |
| Software Template  | Professional Developer | Backstage scaffolder           | Kagenti                |
| Write from scratch | Professional Developer | Code in DevSpaces              | Kagenti                |
| Import existing    | Professional Developer | Container image or source repo | Kagenti                |

All methods produce an agent visible in the gallery and available in chat.

**Epics/Stories:** Epic 2 (Story 2.1.1), Epic 3 (Features 3.3, 3.4)

### 4. No-Code Agent Builder (UC-8)

**Goal:** Create an AI agent visually — defining its purpose, tools, knowledge base, and handoff rules — without writing code.

**Llama Stack flow:**

1. Admin panel → Agents → "Create Agent"
2. Agent editor: name, instructions, model, temperature, max tokens
3. Configure tool access (MCP servers/tools)
4. Scope knowledge base (vector store IDs)
5. Configure handoffs (target agents)
6. Save — agent is immediately available

**Kagenti flow:**

1. CreateAgentWizard: 3 steps (basics, deployment, runtime) + optional build
2. Optional: `AgentCreateIntentDialog` for quick creation from natural language intent
3. Build step triggers Shipwright container build if needed
4. Agent appears in gallery

**Epics/Stories:** Epic 2 (Stories 2.1.1, 2.1.5), Epic 3 (Feature 3.3), Epic 9 (Story 9.3.1)

### 5. Agent from Software Template (UC-10)

**Goal:** Bootstrap a new agent project using a Backstage Software Template with boilerplate, CI/CD, and Kagenti registration.

**How it works:**

1. Navigate to Backstage Software Templates catalog
2. Select agent template (LangGraph, CrewAI, Python A2A, etc.)
3. Scaffolder wizard collects: name, description, namespace, repo, framework options
4. Generates: source code, Dockerfile, CI/CD pipeline, Kagenti manifest, MCP tool definitions
5. Project created in source repo with initial commit
6. CI/CD builds container and registers agent on merge
7. Developer opens generated project to customize logic

**Epics/Stories:** Epic 3 (Feature 3.3, Stories 3.7.3, 3.7.6)

### 6. Agent from DevSpaces (UC-11)

**Goal:** Write agent code from scratch in a cloud development environment, build as a container, deploy to Kagenti.

**How it works:**

1. Kagenti admin → DevSpaces → configure workspace
2. Cloud IDE launches with agent SDK/ADK pre-installed
3. Developer writes agent in chosen framework
4. Test in sandbox environment
5. Trigger Shipwright container build from admin panel
6. Build pipeline panel shows status, logs, history in real time
7. On success: deployed as K8s workload, discovered via A2A protocol
8. Agent appears in gallery

**Epics/Stories:** Epic 3 (Stories 3.7.6, 3.7.3, 3.8.1-3.8.2, 3.1.1)

### 7. Import an Existing Agent (UC-12)

**Goal:** Bring an already-built agent (container image or source repo) and make it available through Augment.

**Container image flow:**

1. Provide container image reference (e.g., quay.io/team/my-agent:latest)
2. Configure deployment: namespace, resource limits, env vars, MCP connections
3. Kagenti deploys as K8s workload, discovers via A2A
4. Agent appears in gallery with auto-detected capabilities

**Source code flow:**

1. Provide source repo URL
2. Configure build settings → Shipwright build triggered
3. On success: deployed and registered

**Additional options:** Auth Bridge/SPIRE security toggles, namespace scoping, image tag updates for versioning.

**Epics/Stories:** Epic 3 (Stories 3.1.1, 3.3.1-3.3.3, 3.5.1, 3.6.1-3.6.2)

### 8. Configure MCP Tools (UC-13)

**Goal:** Connect agents to live systems by registering MCP servers, configuring authentication, and setting tool approval policies.

**How it works:**

1. Admin panel → MCP Servers (Llama Stack) or Tools (Kagenti)
2. Add server: URL, transport (Streamable HTTP / SSE), display name
3. Configure authentication: OAuth client credentials, K8s ServiceAccount token, static headers, or infrastructure-level mTLS (Kagenti)
4. Test connection — system auto-discovers available tools
5. Configure per-server/per-tool `requireApproval` policies
6. Scope tools to specific agents (per-agent tool subsets)
7. Save — tools immediately available to configured agents

**Kagenti-specific:** CreateToolWizard (3 steps: basics, runtime, deploy), ToolInvokeDialog for direct testing, backend proxy mode for air-gapped environments.

**Epics/Stories:** Epic 7 (Features 7.1-7.3), Epic 3 (Feature 3.4)

### 9. Skills Marketplace Integration

**Goal:** Integrate with an external skills marketplace (provided by a separate workspace) to browse, select, and deploy pre-built skills-based agents into the Augment environment.

**Note:** Augment does not own or implement the skills marketplace itself. The marketplace is provided by another workspace/team. Augment is a consumer that proxies requests to the external skills catalog and handles the deployment of selected skills into the local Kagenti environment.

**How it works:**

1. Admin navigates to the Skills section in the admin panel
2. Augment proxies browse/filter requests to the external skills catalog backend
3. Admin selects a skill → Augment generates the K8s deployment manifest with init container for OCI skill extraction
4. Deploy skill agent to local namespace → deployment progress polling shows status
5. Deployed skill agents appear in the Augment gallery with a `DocsClaw` framework label and skill badge

**Integration architecture:**

- `GET /skills` proxies to the external skills catalog backend (endpoint configured via `boost.skillsMarketplace.endpoint`)
- `GET /skills/runtimes` and `GET /skills/domains` proxy filter metadata from the external catalog
- Augment handles deployment only: K8s manifest generation, OCI init containers, namespace scoping
- Deployed skills agents carry a `chatEndpoint` field for direct chat routing within Augment

### 10. Backstage Catalog Representation

**Goal:** Model AI domain objects (agents, tools, models, MCP servers, vector stores) as Backstage catalog entities for discoverability, ownership, search, and RBAC integration.

**Entity types and providers:**

| Domain Object      | Entity Kind | `spec.type`    | Entity Provider                 | Lives In                    | Polling Interval |
| ------------------ | ----------- | -------------- | ------------------------------- | --------------------------- | ---------------- |
| Kagenti Agents     | `Component` | `ai-agent`     | `KagentiAgentEntityProvider`    | Kagenti provider module     | 5 min            |
| Kagenti Tools      | `Resource`  | `ai-tool`      | `KagentiToolEntityProvider`     | Kagenti provider module     | 5 min            |
| Llama Stack Models | `Resource`  | `ai-model`     | `LlamaStackModelEntityProvider` | Llama Stack provider module | 60s              |
| Llama Stack Agents | `Component` | `ai-agent`     | `LlamaStackAgentEntityProvider` | Llama Stack provider module | 5 min            |
| MCP Servers        | `Resource`  | `mcp-server`   | `McpEntityProvider`             | Core plugin (cross-cutting) | 5 min            |
| Vector Stores      | `Resource`  | `vector-store` | `VectorStoreEntityProvider`     | Core plugin (cross-cutting) | 10 min           |

**Architecture:** Entity providers are **independently deployable Backstage backend services**, each packaged as its own RHDH dynamic plugin:

- `llamastack-entity-provider` — emits Llama Stack models and agents as catalog entities. Loadable standalone (without the rest of boost) for RHDH deployments that use Llama Stack but don't need the full agentic portal.
- `kagenti-entity-provider` — emits Kagenti agents and tools as catalog entities. Loadable standalone for RHDH deployments that use Kagenti but don't need the full portal.

These packages live at `rhdh-plugins/workspaces/boost/plugins/` and are registered as Backstage backend services per the [Backstage backend system architecture](https://backstage.io/docs/backend-system/architecture/services/). When the full `boost-backend` plugin is installed, it composes these same entity provider packages internally alongside the agentic provider modules. Cross-cutting entities (MCP servers, vector stores) that aren't provider-specific live in the core plugin.

**Entity kind strategy:**

- Agents use `kind: Component` with `spec.type: ai-agent` as the immediate path. When upstream Backstage `AIContext` kind is available, agents will migrate to the purpose-built kind.
- Models, MCP servers, vector stores, and tools use `kind: Resource` with discriminated `spec.type` values.
- Agent capabilities (tools, knowledge bases, downstream agents) map to `spec.dependsOn` relations.

---

## Architecture Context

**Agent creation paths converge:**
All four creation paths (no-code, template, DevSpaces, import) plus skills marketplace produce a `ChatAgent` — a unified agent model with `id`, `name`, `providerType`, `lifecycleStage`, `createdBy`, and `ChatAgentConfig`. Agents progress through a 4-stage lifecycle: `Draft` → `Pending` → `Published` → `Archived`.

Boost uses the 4-stage model from the start — no legacy stage mappings or normalization layers needed.

**Agent lifecycle and ownership:**

- `createdBy` field set at registration, used for visibility filtering, action gating, and self-approval prevention
- Non-admins see: published agents + own draft/pending agents + unowned legacy agents
- Governance registration required before lifecycle promotion (`governanceRegistered` flag)
- Cascading delete: `DELETE /agents/:id` detects source (kagenti/orchestration/workflow) and cleans up across all corresponding stores

**Agent discovery pipeline:**

- `buildUnifiedAgentList()` merges agents from all providers
- `GET /agents?published=true` → `useAgentGalleryData()` (155ms timeout, guard merge + dedup) → `AgentCatalogDialog`
- Featured agents configured via `ChatExperiencePanel`
- Future: gallery reads from Backstage catalog entities instead of in-memory caches

**Backstage catalog integration:**

- Entity providers are independently deployable backend services: `llamastack-entity-provider` and `kagenti-entity-provider`
- Each is loadable as a standalone RHDH dynamic plugin (without the rest of boost) or composed into the full `boost-backend`
- Kagenti entity provider emits agents and tools; Llama Stack entity provider emits models and agents
- Cross-cutting entities (MCP servers, vector stores) are emitted by the core plugin
- Eliminates duplicate in-memory caches and enables Backstage-native search, ownership, and RBAC

**Skills marketplace integration:**

- Augment proxies browse/filter requests to an external skills catalog backend (separate workspace)
- Augment owns deployment only: K8s manifest generation with OCI init containers
- Deployed skill agents carry `framework: 'docsclaw'` and `chatEndpoint` field

**Kagenti admin surface:**
Home Dashboard, Agents, Tools, Build Pipelines, Sandbox, Platform Links, Dashboard Links, Admin Settings. UI uses "Save to My Agents" (green button) instead of "Publish". Review Queue filters by normalized lifecycle stage.

**MCP architecture:**

- 4-level auth chain: auth references → per-server OAuth → ServiceAccount tokens → global fallback
- `McpAuthService` with caching and deduplication
- Backend execution mode (`BackendToolExecutor`) for air-gapped environments
- Tool scoping: per-agent allowed tool subsets via configuration

---

## Traceability

| Capability                     | Use Case | Priority | Stories                                |
| ------------------------------ | -------- | -------- | -------------------------------------- |
| Browse & Select Agent          | UC-4     | P1       | 3.2.1-3.2.5, 1.5.2-1.5.3               |
| Create Agent (umbrella)        | UC-7     | P0       | 2.1.1, 3.3.1-3.3.3, 3.4.1-3.4.3        |
| No-Code Builder                | UC-8     | P0       | 2.1.1, 2.1.5, 3.3.1-3.3.3, 9.3.1       |
| Gallery Discovery              | UC-9     | P1       | 3.2.1-3.2.5, 4.5.1, 9.4.3              |
| Agent from Template            | UC-10    | P1       | 3.3.1-3.3.3, 3.7.3, 3.7.6              |
| Agent from DevSpaces           | UC-11    | P1       | 3.7.6, 3.7.3, 3.8.1-3.8.2, 3.1.1       |
| Import Existing Agent          | UC-12    | P0       | 3.1.1, 3.3.1-3.3.3, 3.5.1, 3.6.1-3.6.2 |
| Configure MCP Tools            | UC-13    | P1       | 7.1.1-7.1.2, 7.2.1, 7.3.1, 3.4.1-3.4.3 |
| Skills Marketplace Integration | (new)    | P1       | (new)                                  |
| Catalog Entities               | (new)    | P2       | (new)                                  |

---

## Customer Context

Derived from the Citi engagement. Success outcomes addressed:

- Specialist agents collaborate on complex, multi-step tasks (UC-7, UC-8, UC-10, UC-11, UC-12)
- Teams bring their own agents built in any framework (UC-10, UC-11, UC-12)
- Agents act on live systems/applications with human oversight (UC-13)
- Self-service developer onboarding reduces support volume (UC-4, UC-7)
