# AGENTS.md

## Project overview

Boost is a clean-room reimplementation of the Augment agentic developer portal for Red Hat Developer Hub (RHDH). It is a Backstage plugin workspace — not a fork of Augment. The project context, design principles, and relationship to Augment are documented in `specifications/boost-context.md`. Read that file before making any implementation decisions.

## Specification-driven development

This workspace uses a specification-first approach. Before writing code, read the relevant specifications:

```
workspaces/boost/
├── specifications/                # Product requirements
│   ├── boost-context.md           # Project rationale, 12 design principles, upstream monitoring
│   └── prd/                       # Product Requirements Documents (one per capability area)
│       ├── use-case-index.md      # All 25 use cases at a glance
│       ├── ai-chat-interaction-experience.md
│       ├── agent-creation-discovery.md
│       ├── pluggable-ai-platform-architecture.md
│       ├── platform-operations-deployment.md
│       └── security-safety-governance.md
├── openspec/                      # Implementation specifications
│   └── changes/                   # One directory per capability area:
│       ├── ai-chat-interaction-experience/
│       ├── agent-creation-discovery/
│       ├── pluggable-ai-platform-architecture/
│       ├── platform-operations-deployment/
│       └── security-safety-governance/
│           ├── proposal.md        # What and why
│           ├── design.md          # Architecture decisions
│           ├── tasks.md           # Implementation task breakdown
│           └── specs/             # Behavioral specs (Given/When/Then)
└── plugins/                       # Plugin packages (implementation target)
```

When implementing an issue:

1. Read `specifications/boost-context.md` for design principles — these are non-negotiable
2. Find the relevant PRD in `specifications/prd/` for product requirements
3. Find the matching change in `openspec/changes/` for design decisions, task breakdown, and behavioral specs
4. The `specs/` subdirectories contain acceptance criteria as scenarios — implementation must satisfy these

## Architecture rules

### Backstage-native services only

Use Backstage `cacheService`, `permissions`, `httpAuth`, `configApi`, and `catalogApi`. Never build custom equivalents. All caches use `coreServices.cache` — no raw `Map<>` caches.

### Provider isolation

Each AI provider (`boost-backend-module-llamastack`, `boost-backend-module-kagenti`) is a separate `createBackendModule`. Providers must not import from each other. Shared types live in `boost-common`.

### Capability checks, not identity checks

Frontend rendering decisions use `ProviderCapabilities` interface checks. Never use `providerId === 'string'` comparisons.

### Permissions as sole authorization

All authorization decisions use `permissions.authorize()` (single-resource endpoints) or `permissions.authorizeConditional()` (list endpoints with resource-scoped permissions) with fine-grained permissions (`boost.agent.*`, `boost.tool.*`, `boost.kagenti.admin`). No custom route-level authorization logic.

### Schema-driven validation

Config validation uses Zod schemas as single source of truth. TypeScript types are generated from Zod. No hand-written validators.

### Catalog entities for domain objects

Agents, tools, models, MCP servers, and vector stores are Backstage catalog entities — not in-memory caches. Entity providers emit standard catalog entities.

## Code conventions

### Package structure

| Package                           | Purpose                                                              |
| --------------------------------- | -------------------------------------------------------------------- |
| `boost`                           | Chat UI, agent gallery, admin panels, composable routable extensions |
| `boost-common`                    | Shared types, permissions (browser-safe, `common-library` role)      |
| `boost-node`                      | `boostAiProviderServiceRef`, extension points (`node-library` role)  |
| `boost-backend`                   | Core routes, services, middleware, ProviderManager                   |
| `boost-backend-module-llamastack` | Llama Stack provider module                                          |
| `boost-backend-module-kagenti`    | Kagenti provider module                                              |
| `llamastack-entity-provider`      | Independently deployable catalog entity provider                     |
| `kagenti-entity-provider`         | Independently deployable catalog entity provider                     |

### Naming

- Config namespace: `boost.*` (e.g., `boost.features.agentCreation`, `boost.security.mode`)
- Permission names — two namespaces by design:
  - `boost.*` — application-layer agent/tool operations: `boost.agent.*`, `boost.tool.*`, `boost.kagenti.admin`, `boost.access`, `boost.admin`
  - `ai-catalog.*` — catalog-layer RBAC for AI asset visibility and governance: `ai-catalog.asset.read`, `ai-catalog.asset.read.usage-docs`, `ai-catalog.admin`
- Config: `ai-catalog.rbac.*` for catalog RBAC config (e.g., `ai-catalog.rbac.defaultPolicy`)
- Resource types: `boost-agent`, `boost-tool`, `ai-catalog-asset`
- DB tables: `boost_admin_config`, `boost_sessions`, `boost_messages`, `boost_feedback`
- Extension point: `boostProviderExtensionPoint`
- Service ref: `boostAiProviderServiceRef`
- Plugin ID: `boost` (used in `createBackendModule({ pluginId: 'boost', ... })`)

### Testing

Every feature ships with tests. Integration tests use real database and cache backends, not mocks.

### Frontend

- Composable routable extensions with `React.lazy()` at extension boundaries
- PatternFly design system components consistent with RHDH
- WCAG 2.1 AA accessibility
- Feature flags via `boost.features.*` in `app-config.yaml`

## What not to do

- Do not reference the `workspaces/augment/` codebase for implementation patterns — boost is a clean-room build
- Do not use `augment` as a prefix for any new identifiers (config keys, permissions, tables, etc.)
- Do not create raw `Map<>` caches — always use `coreServices.cache`
- Do not add authorization checks outside `permissions.authorize()` / `permissions.authorizeConditional()`
- Do not add provider ID string checks in the frontend
