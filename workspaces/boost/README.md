# Boost Workspace

This workspace contains the Boost plugin family for Red Hat Developer Hub.

## Why Boost Exists

Boost is a clean-room reimplementation of the [Augment](../augment/) plugin. This effort:

- Initially serves as a litmus test for our organization's agentic SDLC initiatives that are based on [Fullsend](https://github.com/fullsend-ai/fullsend).
- Subsequently provides a comparison with Augment as it evolves in parallel via work from Red Hat Consulting, where we can see how differences in RHDH architectural alignment and accumulated technical debt impact how well each plugin addresses customer requirements.
  - As Augment remains the reference prototype and source of requirements, being able to properly translate those requirements into Boost will be an interesting subplot of this exercise.

The rationale for this approach is documented in detail in [`specifications/boost-context.md`](specifications/boost-context.md).

## Directory Structure

This workspace uses a specification-driven layout that differs from other workspaces in the repo:

```
workspaces/boost/
├── specifications/              # Product requirements
│   ├── boost-context.md         # Project rationale, principles, and relationship to Augment
│   └── prd/                     # Product Requirements Documents (one per capability area)
├── openspec/                    # Implementation specifications (OpenSpec format)
│   └── changes/                 # One directory per change, each containing:
│       ├── .openspec.yaml       #   Change metadata and status
│       ├── proposal.md          #   Problem statement and approach
│       ├── design.md            #   Architecture decisions
│       ├── tasks.md             #   Implementation task breakdown
│       └── specs/               #   Behavioral specs (Given/When/Then scenarios)
├── packages/                    # Full-stack local dev shell
│   ├── app/                     # New Frontend System app (registers all Boost frontend plugins)
│   └── backend/                 # Backstage backend (registers all Boost backend plugins)
├── plugins/                     # Plugin packages (implementation)
├── app-config.yaml              # Local dev configuration (includes boost: section)
├── dynamic-plugins-filesystem-reference.yaml  # RHDH dynamic plugin config (filesystem)
└── dynamic-plugins-image-reference.yaml       # RHDH dynamic plugin config (OCI images)
```

**`specifications/`** contains the product-level requirements — what Boost must do and why. The PRDs are organized by capability area: AI chat, agent discovery, platform architecture, security, and operations.

**`openspec/`** contains the implementation-level specifications — how each capability area will be built. Each change includes a proposal, design decisions, task breakdown, and behavioral specs that serve as acceptance criteria.

**`packages/`** hosts the full Backstage app and backend used for local development via `yarn start`. All registerable Boost plugins are wired into `packages/app` and `packages/backend`.

## Plugins

| Package                           | Role                  | Description                                                          |
| --------------------------------- | --------------------- | -------------------------------------------------------------------- |
| `boost`                           | frontend-plugin       | Chat UI, agent gallery, admin panels, composable routable extensions |
| `boost-backend`                   | backend-plugin        | Core routes, services, middleware, ProviderManager                   |
| `boost-backend-module-llamastack` | backend-plugin-module | Llama Stack AI provider module                                       |
| `boost-backend-module-kagenti`    | backend-plugin-module | Kagenti AI provider module                                           |
| `llamastack-entity-provider`      | backend-plugin-module | Catalog entity provider for Llama Stack models and agents            |
| `kagenti-entity-provider`         | backend-plugin-module | Catalog entity provider for Kagenti agents and tools                 |
| `boost-common`                    | common-library        | Shared types and permissions (browser-safe)                          |
| `boost-node`                      | node-library          | Service refs and extension points                                    |
| `boost-responses-api-toolkit`     | node-library          | Shared Responses API utilities                                       |
| `boost-toolscope`                 | node-library          | Injectable cache adapter for tool scope                              |

The first six packages are registered in `packages/app` and/or `packages/backend`. The four library packages are pulled in transitively as dependencies.

## Compatibility

This workspace is aligned with **Backstage 1.52.0** (see [`backstage.json`](backstage.json)).

## Development

```bash
# Install dependencies
yarn install

# Start the full app (frontend + backend with all Boost plugins)
yarn start
# Navigate to http://localhost:3000/ai-catalog

# Isolated plugin development (frontend + backend plugins only, faster iteration)
yarn dev

# Run the full validation pipeline (format, lint, typecheck, API reports, OpenSpec, tests)
yarn chores

# Run tests
yarn test:all

# Build all plugins
yarn build:all
```

### Configuration

Local dev settings live in [`app-config.yaml`](app-config.yaml). The `boost:` section configures security mode, model endpoints, AI providers, and catalog entity providers. See [`dynamic-plugins-filesystem-reference.yaml`](dynamic-plugins-filesystem-reference.yaml) and [`dynamic-plugins-image-reference.yaml`](dynamic-plugins-image-reference.yaml) for RHDH production deployment.

For agent and architecture guidance, see [`AGENTS.md`](AGENTS.md).
