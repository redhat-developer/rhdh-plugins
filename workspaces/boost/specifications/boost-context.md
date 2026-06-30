# Boost: Project Context and Upstream Monitoring

**Date:** 2026-06-02

---

## What Is Boost

Boost is a new workspace delivering a clean-slate implementation of the agentic developer portal for Red Hat Developer Hub. It provides the same product capabilities as the Augment plugin — AI chat, agent creation and discovery, pluggable AI platform backends, governance, and platform operations — but built from scratch with intentional architecture, avoiding the accumulated tech debt of the reference prototype.

## Relationship to Augment

The Augment plugin (in `redhat-developer/rhdh-plugins`, workspace `augment`) is the **reference prototype**. It was the first implementation of the agentic developer portal and served as the basis for customer engagements (notably an early enterprise engagement). Boost's requirements, architecture decisions, and design principles are drawn from augment's experience — both what worked and what didn't.

**Augment is the source of requirements.** The PRDs and OpenSpec changes in this directory were originally written as retroactive documentation of augment's capabilities. They have been reframed as forward-looking requirements for boost, informed by augment's implementation experience and three rounds of tech debt analysis (May 13, May 26, May 30 2026).

**Boost is not a fork of augment.** It is a new codebase. There is no migration path from augment to boost — boost starts clean and implements the same (and evolving) product requirements with the right architecture from day one.

## Product Requirements

- [Use Case Index](prd/use-case-index.md) — all 25 use cases at a glance
- [AI Chat & Interaction Experience](prd/ai-chat-interaction-experience.md) — streaming chat, RAG, HITL approval, conversation history, debug tools (UC-1 through UC-6)
- [Agent Creation & Discovery](prd/agent-creation-discovery.md) — agent gallery, 4 creation paths, MCP tools, skills marketplace integration, catalog entities (UC-4, UC-7 through UC-13)
- [Pluggable AI Platform Architecture](prd/pluggable-ai-platform-architecture.md) — provider abstraction, streaming protocol, hot-swap, multi-agent orchestration, providers as RHDH dynamic plugins (UC-14, UC-16)
- [Platform Operations & Deployment](prd/platform-operations-deployment.md) — deployment, runtime config, RAG pipelines, white-labeling, workspace package structure (UC-15, UC-17, UC-18, UC-21, UC-22)
- [Security, Safety & Governance](prd/security-safety-governance.md) — 16 fine-grained permissions, lifecycle governance, token exchange, safety shields, resilience (UC-19, UC-20, UC-23 through UC-25)

## Workspace Structure

All packages live at `rhdh-plugins/workspaces/boost/plugins/`:

```
workspace/boost/plugins/
├── boost-frontend                    — Chat UI, agent gallery, admin panels, composable extensions
├── boost-common                      — Shared types, permissions (browser-safe, common-library role)
├── boost-node                        — Service refs, extension points (node-library role)
├── boost-backend                     — Core routes, services, middleware, ProviderManager, cross-cutting entity providers
├── boost-backend-module-llamastack   — Llama Stack agentic provider (composes llamastack-entity-provider)
├── boost-backend-module-kagenti      — Kagenti agentic provider (composes kagenti-entity-provider)
├── boost-responses-api-toolkit       — Shared Responses API utilities (minimal Backstage dependencies via boost-common)
├── boost-toolscope                   — Standalone tool-scope resolution (zero Backstage dependencies, injectable CacheAdapter)
├── llamastack-entity-provider        — Backstage backend service: Llama Stack catalog entities (independently deployable)
└── kagenti-entity-provider           — Backstage backend service: Kagenti catalog entities (independently deployable)
```

The core packages (`boost-frontend`, `boost-common`, `boost-node`, `boost-backend`) mirror augment's structure with the addition of `boost-node` for service refs and extension points (following the Backstage `plugin-catalog-common`/`plugin-catalog-node` pattern). `boost-toolscope` is a standalone utility package with zero Backstage dependencies. `boost-responses-api-toolkit` has minimal Backstage dependencies (transitive via `boost-common` → `@backstage/plugin-permission-common`). Both can be consumed by provider modules or used outside Backstage with minor shims. Provider modules and entity providers are additive — deployers install only what they need. Entity providers are independently deployable as RHDH dynamic plugins for catalog-only use cases.

## Local Development

### Host Packages

Backstage workspace convention requires `packages/app` and `packages/backend` as host packages — these are standard Backstage scaffolding, not boost product code. Even for backend-only development, `backstage-cli package start` requires a minimal `packages/app` scaffold because `@backstage/plugin-app-backend` (registered in `packages/backend`) serves frontend assets.

The stock Backstage scaffold (catalog, search UI) is useful for verifying that entity providers emit correct catalog entities. When `boost-frontend` is implemented, it will be a plugin registered _into_ the app host — the same way `boost-backend` is a plugin wired into `packages/backend/src/index.ts`.

### Metrics Compatibility Shim

`packages/backend/src/index.ts` requires a no-op `metricsServiceRef` factory because `@backstage/plugin-catalog-backend` depends on a metrics service that `@backstage/backend-defaults` does not yet provide (still absent as of Backstage 1.52 / `backend-defaults` 0.17.3). The import uses `@backstage/backend-plugin-api/alpha` — an unstable API surface. This shim should be removed when `backend-defaults` adds a default metrics service factory.

### TLS and IDE Environment Caveats

When developing against OpenShift routes with self-signed certificates, set `NODE_TLS_REJECT_UNAUTHORIZED=0` in the process environment.

IDE "Before Launch" shell scripts (e.g. WebStorm) run in a subprocess — `export` statements do not propagate to the debugger process. Environment variables without `:-` defaults in `app-config.yaml` (such as `KAGENTI_CLIENT_SECRET`) must be set directly in the IDE's Run/Debug Configuration environment variables, not in shell scripts.

## Design Principles (Learned from Augment)

These principles are derived from augment's tech debt analysis. Each represents a pattern that augment got wrong or accumulated as debt, and that boost will implement correctly from the start.

### 1. Backstage cacheService from Day One

All operational caches use Backstage `cacheService` with appropriate TTL, namespace isolation, and Redis backing in production. No raw `Map<>` caches with manual TTL tracking.

_Augment lesson: 17 home-grown caches identified, only 2 migrated after months of development. Asymmetric caching (Kagenti on cacheService, Llama Stack on raw Map) created inconsistent multi-instance behavior._

### 2. Fine-Grained Backstage Permissions from Day One

All authorization decisions use `permissions.authorize()` with specific permissions and conditional rules. No parallel authorization systems in route handlers.

_Augment lesson: 2,132 lines of custom governance code implementing 12 authorization decisions outside Backstage permissions, vs. 73 lines of actual Backstage permission integration (29x ratio). Shadow authorization invisible to RBAC configuration._

### 3. Providers as Independent RHDH Dynamic Plugins

Each AI platform provider is a separate `createBackendModule` packaged as an RHDH dynamic plugin. Provider types live in `boost-common`; `boostAiProviderServiceRef` and the extension point live in `boost-node`. Cross-plugin consumption via the service ref.

_Augment lesson: Monolithic plugin with providers locked inside. No serviceRef for cross-plugin consumption. 559 lines of Kagenti-specific types polluting the common package. 13+ provider ID string checks coupling frontend to specific providers._

### 4. Capability-Based Feature Gating, Not Provider Identity Checks

Frontend features are gated by `ProviderCapabilities` interface checks, never by `providerId === 'string'` comparisons. Provider-specific routes are confined to provider module directories.

_Augment lesson: 18+ provider ID string checks and 12 `as KagentiProvider` type casts broke the provider abstraction at scale._

### 5. Catalog Entities for AI Domain Objects

Agents, tools, models, MCP servers, and vector stores are Backstage catalog entities from the start — not plugin-internal caches. Entity providers poll external APIs and emit standard catalog entities with ownership, lifecycle, and RBAC integration.

_Augment lesson: Four separate in-memory caches storing what should be catalog entities. Duplicate model caches across providers. No discoverability, ownership, or catalog-level RBAC for AI domain objects._

### 6. Schema-Driven Configuration Validation

Runtime configuration uses Zod schemas as single source of truth. TypeScript types are derived from schemas. DB-stored overrides are validated by the same rules as YAML values. Each field is annotated with its scope: `yaml-only`, `db-overridable`, or `db-only`.

_Augment lesson: 671 lines of hand-written validators duplicating what schemas should enforce. 1,500+ line config schema growing without resolution. DB values could bypass YAML validation._

### 7. Composable Frontend Extensions with Lazy Loading

The frontend is decomposed into composable routable extensions (`ChatPage`, `AdminPage`, `AgentStudioPage`) with `React.lazy()` at extension boundaries. Feature flags control visibility per deployment.

_Augment lesson: Single monolithic `AugmentPage` extension eagerly loading 200+ admin panel files. 13 components over 500 lines with zero lazy loading at primary entry points. No config-driven feature flags._

### 8. UX/UXD-Driven UI Development

All user-facing UI is built from UX/UXD-provided mockups and wireframes. Frontend PRs modifying visible UI require design review. PatternFly design system alignment and WCAG 2.1 AA accessibility are baseline requirements.

_Augment lesson: No UX/UXD integration in development workflow. UI components built code-first without design artifacts._

### 9. Clean 4-Stage Lifecycle Model

Agent lifecycle uses the 4-stage model (Draft → Pending → Published → Archived) from the start, with no legacy stage mappings or normalization layers.

_Augment lesson: Pivoted from 5-stage to 4-stage model mid-development, requiring `LEGACY_STAGE_MAP` and `normalizeLifecycleStage` compatibility layers._

### 10. Per-User Identity Delegation

Kagenti authentication uses RFC 8693 token exchange for per-user authorization from the start (when enabled). No shared service-account-only authentication presenting all users as the same identity.

_Augment lesson: All Kagenti requests used a shared service-account token. `X-Backstage-User` header was informational only. Per-user audit trail impossible at the provider level._

### 11. Testing from Day One

Every feature ships with tests. Lifecycle routes, provider integrations, governance decisions, and streaming pipelines all have test coverage. Integration tests use real database and cache backends, not mocks.

_Augment lesson: Zero tests for lifecycle routes, WorkflowBuilder (3,000+ lines), DevSpacesService, KagentiApiClient (922 lines). Mocked tests passed while production migrations failed._

### 12. Observability Built In

Metrics, structured logging, and trace context propagation are implemented alongside features, not bolted on after. Provider health, cache hit rates, permission decision latency, lifecycle transition counts, and streaming pipeline throughput are observable from the start.

_Augment lesson: No metrics, no dashboards, no alerting, no SLO tracking. Provider offline detection existed but no systematic observability framework for operations teams._

---

## Upstream Monitoring: Tracking Augment Changes

Augment continues to evolve in `rhdh-plugins`. Boost must periodically check for changes that represent real requirement shifts (vs. augment-specific implementation choices) and decide whether to adopt them.

### What to Monitor

1. **New use cases or capabilities** — features that augment adds which aren't in boost's PRDs
2. **API contract changes** — changes to the `AgenticProvider` interface, `NormalizedStreamEvent` union, or REST API surface
3. **Provider protocol changes** — changes to A2A protocol integration, Llama Stack Responses API usage, or Kagenti API client patterns
4. **Governance model changes** — new lifecycle actions, new approval workflow patterns, new permission requirements
5. **External integration changes** — new MCP auth patterns, new catalog entity types, new SonataFlow integration patterns
6. **UX/UXD design changes** — new UI patterns, component redesigns, or interaction model changes that reflect product direction

### What to Ignore

1. **Tech debt fixes** — augment migrating its own caches, extracting its own packages, fixing its own provider abstraction violations. Boost starts clean; these are augment catching up.
2. **Backward compatibility scaffolding** — legacy stage maps, deprecated aliases, fallback patterns. Boost has no legacy deployments.
3. **Monolithic-to-modular transitions** — augment breaking apart its monolith. Boost starts modular.

### Adoption Decision Process

For each significant augment change:

1. **Classify:** Is this a requirement change (new capability, changed behavior) or an implementation fix (tech debt, refactoring)?
2. **Evaluate:** If requirement change — does it apply to boost's product scope? Is it customer-driven or augment-specific?
3. **Decide:** Adopt (take the requirement as-is), Adapt (take the requirement but implement differently), or Ignore (augment-specific, not applicable to boost)
4. **Update:** If adopted/adapted, update the relevant PRD and OpenSpec change

### Monitoring Cadence

- **Weekly:** Quick scan of augment workspace commits and PRs for new capabilities or API changes
- **Bi-weekly:** Deeper review of merged PRs with architecture implications
- **On major PRs:** Any PR touching provider interfaces, governance model, or permission system warrants immediate review against boost specs
