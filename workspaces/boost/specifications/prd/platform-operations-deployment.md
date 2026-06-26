# PRD: Platform Operations & Deployment

**Product:** Boost — Agentic Developer Portal for Red Hat Developer Hub
**Status:** Requirements for new implementation (informed by Augment reference prototype)
**Date:** 2026-05-19
**Updated:** 2026-06-02 — reframed for boost; Zod schema-driven validation from day one, cacheService throughout, modular dynamic plugin deployment
**Priority:** P0 (deployment, runtime config, agent management, RAG) / P1 (white-labeling)
**Provenance:** Requirements derived from Augment plugin analysis. See `specifications/boost-context.md` for project context.

---

## Why

An agentic AI platform that requires code changes, rebuilds, or restarts for every configuration change is unusable in production. Administrators need to deploy the plugin cleanly, manage agents and their orchestration rules, configure knowledge pipelines, tune 25+ runtime parameters, and white-label the experience — all without touching source code or restarting the deployment.

This PRD defines the platform operations surface: deployment paths, agent and orchestration management, RAG pipeline configuration, runtime configuration engine, and branding customization.

## What This Product Does

Boost deploys as a set of modular dynamic plugins (RHDH) or static plugins (Backstage) with zero code changes. Core plugin and provider modules are independently installable from day one. Once deployed, administrators manage agents, configure RAG pipelines, change runtime configuration (model, prompts, tools, caps, appearance), and white-label the portal — all at runtime via the admin panel, with changes taking effect within seconds. Configuration validation uses Zod schemas as single source of truth from the start.

## Who It's For

### Administrator

Deploys the platform, manages agents and orchestration rules, configures RAG knowledge pipelines, tunes runtime configuration, and customizes branding.

## Boundaries

### In Scope

- Plugin deployment: RHDH dynamic plugin (OCI) and Backstage static plugin (npm)
- Agent and orchestration management (admin panel)
- RAG knowledge pipeline configuration (document ingestion, vector stores, RAG playground)
- Runtime configuration engine (YAML baseline + database overrides, 25+ keys)
- White-label branding (name, logo, colors, welcome screen, featured agents)
- Admin onboarding experience

### Out of Scope

- Chat interaction (see AI Chat & Interaction PRD)
- Agent creation paths (see Agent Creation & Discovery PRD)
- Provider architecture and hot-swap (see Platform Architecture PRD)
- Security posture and safety shields (see Security & Governance PRD)

### UX/UXD Integration

Admin panels, branding controls, RAG configuration, and onboarding flows must align with RHDH usability and visual design standards:

- **Mockups as source of truth:** Admin panel layouts, config editors, RAG playground, branding controls, and onboarding cards are built from UX/UXD-provided mockups. No admin-facing UI ships without an approved design artifact.
- **PatternFly alignment:** All admin components use PatternFly design system patterns. Custom config editors, knowledge base panels, and branding controls require UX/UXD review.
- **Design review gates:** Frontend PRs modifying admin-facing UI require UX/UXD sign-off before merge.

---

## Capabilities

### 1. Deploy Boost (UC-15)

**Goal:** Install and configure Boost in an RHDH or vanilla Backstage instance.

**Workspace package structure:**

All packages live at `rhdh-plugins/workspaces/boost/plugins/`:

| Package                           | Type            | Description                                                                                                   |
| --------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------- |
| `boost-frontend`                  | Frontend plugin | Chat UI, agent gallery, admin panels, composable extensions                                                   |
| `boost-common`                    | Common library  | Shared types (`AgenticProvider`, `NormalizedStreamEvent`, permissions) — browser-safe, no backend API imports |
| `boost-node`                      | Node library    | `boostAiProviderServiceRef`, `boostProviderExtensionPoint` — service refs and extension points                |
| `boost-backend`                   | Backend plugin  | Core routes, services, middleware, `ProviderManager`, cross-cutting entity providers (MCP, vector stores)     |
| `boost-backend-module-llamastack` | Backend module  | Llama Stack agentic provider (composes `llamastack-entity-provider`)                                          |
| `boost-backend-module-kagenti`    | Backend module  | Kagenti agentic provider (composes `kagenti-entity-provider`)                                                 |
| `llamastack-entity-provider`      | Backend service | Llama Stack model + agent catalog entities (independently deployable)                                         |
| `kagenti-entity-provider`         | Backend service | Kagenti agent + tool catalog entities (independently deployable)                                              |

**RHDH — Dynamic Plugin (recommended):**

1. Obtain OCI-packaged dynamic plugin images for all needed packages
2. Configure `dynamic-plugins.override.yaml` with plugin references and configuration
3. Set up `app-config.yaml` with Boost configuration: provider settings, security mode, base URLs
4. RHDH loads plugins dynamically via Scalprum — no code changes or rebuilds
5. Boost appears as a sidebar entry in RHDH

**Full portal deployment** installs `boost-frontend`, `boost-common`, `boost-node`, `boost-backend`, plus one or both provider modules. Provider modules compose their entity providers internally.

**Entity-provider-only deployment** installs `llamastack-entity-provider` or `kagenti-entity-provider` as standalone dynamic plugins — gets AI domain objects in the Backstage catalog without the rest of boost.

**Backstage — Static Plugin:**

1. Install npm packages: `@boost/plugin-boost-frontend`, `@boost/plugin-boost-backend`, `@boost/plugin-boost-common`, `@boost/plugin-boost-node`
2. Optionally install provider modules: `@boost/plugin-boost-backend-module-llamastack`, `@boost/plugin-boost-backend-module-kagenti`
3. Register frontend route, sidebar entry, and icon
4. Register backend plugin and provider modules in backend startup
5. Configure `app-config.yaml`
6. Rebuild and deploy

**Epics/Stories:** Epic 10 (Features 10.1, 10.2)

### 2. Manage Platform Agents and Orchestration (UC-17)

**Goal:** Create, edit, delete, and configure agents and their orchestration rules from the admin panel.

**Llama Stack flow:**

- Agents panel shows all configured agents with status
- Create agent: name, instructions, model, temperature, tools, knowledge base, handoff targets
- Configure router agent as default entry point delegating to specialists
- Define handoff rules: which agents can transfer to which
- Save — agents immediately available in chat

**Kagenti flow:**

- Kagenti admin sidebar → home dashboard with summary cards
- Agents catalog across all namespaces
- Create, edit, delete agents via agent detail view (tabs: details, resources, status, agent card)
- Manage tools via tools panel
- Monitor build pipelines, manage sandbox sessions
- Configure namespace scoping and access controls

**Additional features:**

- Agent template browser for bootstrapping
- Namespace picker for multi-tenant scoping
- Observability links: Jaeger, Kiali, MCP inspector, Keycloak console

**Epics/Stories:** Epic 2 (Stories 2.1.1-2.1.6), Epic 3 (Features 3.3-3.4, 3.6-3.7), Epic 9 (Story 9.3.1)

### 3. Configure RAG Knowledge Pipelines (UC-18)

**Goal:** Ingest customer documentation into vector stores so agents can ground their answers in real data.

**How it works:**

1. Admin panel → Knowledge Base
2. Create vector store: configure search mode (semantic, keyword, or hybrid)
3. Add document sources:
   - GitHub repository (public/private, path filters, glob patterns)
   - URL (web page fetch and chunk)
   - File upload (drag-and-drop via IngestDropZone)
4. Configure sync schedule (e.g., hourly) with full or append mode
5. Ingestion pipeline: fetch content → detect changes via content hash → chunk text → push to vector store on AI platform
6. Scope vector store to specific agents via per-agent `vectorStoreIds`
7. Test retrieval quality in RAG playground: test queries, retrieved chunks with relevance scores, adjustable thresholds

**Change detection:** Subsequent syncs only re-ingest changed files; deleted files are removed from the store.

**Multiple stores:** Separate vector stores for different domains (migration docs, runbooks, API docs), each scoped to the relevant agent.

**Admin UI components:**

- `KnowledgeBasePanel` with `KBManageStores`, `KBCreateStore`, documents table, sync trigger
- `IngestDropZone` for file upload
- `KBRagTest` with `RagQueryForm`, `RagResultsTable`, `ChunkCard`, `ScoreBar`, `GeneratedAnswerCard`

**Backend:** `DocumentIngestionService` with multi-source fetching, content-hash change detection, chunking.

**Epics/Stories:** Epic 6 (Features 6.1, 6.2)

### 4. Manage Runtime Configuration (UC-21)

**Goal:** Change Boost's behavior at runtime — model, system prompt, tools, caps, and more — without restarting.

**Configuration engine:**

- Two-layer resolution: YAML baseline + `AdminConfigService` database overrides
- `RuntimeConfigResolver` resolves values with database overrides taking precedence; cache backed by Backstage `cacheService` with 30s TTL and immediate invalidation on write
- 25+ configurable keys (schema has grown to 1,500+ lines)
- If database value is removed, YAML baseline is restored

**Schema-driven validation (target architecture):**

- Replace 668+ lines of hand-written validators in `configValidation.ts` with Zod schemas as single source of truth
- TypeScript `config.d.ts` generated from Zod schemas
- DB validators match YAML schema validation — no drift
- Each config field annotated with `configScope`: `yaml-only`, `db-overridable`, or `db-only`

**Configurable categories:**

- **Model Connection:** Base URL, model name, connection test
- **System Prompt:** Edit or use LLM-assisted prompt generation (`GeneratePromptForm`)
- **Tools and Capabilities:** Enable/disable tools, set allowed tool subsets
- **Agent Configuration:** Per-agent model, temperature, max tokens, tool choice
- **Agent Approval:** Governance workflow configuration, SonataFlow integration
- **Skills Marketplace Integration:** External skills catalog endpoint (provided by separate workspace), runtime filters, domain filters
- **Token and Turn Caps:** Maximum output tokens, tool calls per turn, agent turns
- **Chat Experience:** Featured agents, conversation starters (Kagenti)
- **Appearance:** Logo, colors, theme presets
- **Kagenti Auth:** Service-account Keycloak configuration (`tokenEndpoint`, `clientId`, `clientSecret`, `tokenExpiryBufferSeconds`)
- **DevSpaces:** Workspace configuration (credentials must be stored encrypted, not plaintext)

**Admin onboarding:** `AdminOnboardingCard` provides guided setup steps on first admin visit.

**Epics/Stories:** Epic 9 (Features 9.1-9.3, 9.5-9.6)

### 5. White-Label the Portal (UC-22)

**Goal:** Customize the Boost experience to match the organization's brand — all at runtime.

**Customizable elements:**

- Application name and logo
- Color theme (from presets or custom)
- Welcome screen hero content
- Prompt groups: create/edit with icons, colors, suggested prompts; reorder; live preview
- Featured agents for welcome screen strip (Kagenti)
- Conversation starters per agent (Kagenti)

**Admin UI components:**

- `BrandingPanel` → `AppearanceSection` (logo, colors, themes)
- `PromptsPanel` → `GroupEditor`, `CardEditor`, `IconPicker`, `ColorPicker`, `LivePreview`
- `ChatExperiencePanel` → agent gallery configuration, conversation starters

**All changes apply at runtime.** Users see updated branding immediately. No deployment or restart required.

**Epics/Stories:** Epic 9 (Feature 9.4)

---

## Architecture Context

**Runtime configuration engine:**

```
app-config.yaml (YAML baseline)
         ↓
RuntimeConfigResolver (cacheService-backed, 30s TTL)
         ↓ (merges)
AdminConfigService (DB overrides, boost_admin_config table)
         ↓
Zod schema validation (single source of truth)
         ↓
Resolved config value
         ↓ (immediate invalidation on write via cache.delete())
Backend services + Frontend via admin API
```

**Database layer:**

- 6 tables in Backstage database (SQLite dev, PostgreSQL prod)
- `boost_admin_config`: runtime configuration overrides
- `boost_sessions`: conversation persistence
- `boost_messages`: message history
- `boost_feedback`: user feedback on messages

**Deployment models:**

```
RHDH Dynamic Plugin (full portal):
  boost-frontend + boost-common + boost-node + boost-backend + provider module(s)
  OCI images → dynamic-plugins.override.yaml → Scalprum → sidebar entry
  No code changes, no rebuilds

RHDH Dynamic Plugin (entity providers only):
  llamastack-entity-provider and/or kagenti-entity-provider
  Catalog entities without the full portal
  No boost-backend or boost-frontend needed

Backstage Static Plugin:
  npm packages → manual registration → rebuild → deploy
  Provider modules and entity providers optionally installed alongside core
```

**Knowledge pipeline:**

```
Sources (GitHub, URL, File Upload)
    → DocumentIngestionService
    → Content-hash change detection
    → Chunking
    → Vector Store (OpenShift AI)
    → Per-agent vectorStoreIds scoping
    → Agent RAG queries at chat time
```

---

## Traceability

| Capability                    | Use Case | Priority | Stories                                                                |
| ----------------------------- | -------- | -------- | ---------------------------------------------------------------------- |
| Deploy Plugin                 | UC-15    | P0       | 10.1.1, 10.2.1                                                         |
| Manage Agents & Orchestration | UC-17    | P0       | 2.1.1-2.1.6, 3.3.1-3.3.3, 3.4.1-3.4.3, 3.6.1-3.6.2, 3.7.1-3.7.6, 9.3.1 |
| Configure RAG Pipelines       | UC-18    | P0       | 6.1.1-6.1.3, 6.2.1-6.2.3                                               |
| Runtime Configuration         | UC-21    | P0       | 9.1.1, 9.2.1-9.2.3, 9.3.1, 9.5.1, 9.6.1                                |
| White-Label Portal            | UC-22    | P1       | 9.4.1-9.4.3                                                            |

---

## Customer Context

Derived from early enterprise engagement experience. Architecture principle: "Runtime-configurable. All configuration changes take effect without restart or redeployment."

The customer's vision was for the portal to present as their own product, not as a Red Hat product. White-labeling is foundational to the engagement, not cosmetic.

Success outcomes addressed:

- The portal experience is fully white-labeled (UC-22)
- Self-service developer onboarding reduces support volume (UC-15)
- Agents are grounded in customer knowledge (UC-18)
