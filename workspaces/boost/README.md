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
└── plugins/                     # Plugin packages
```

**`specifications/`** contains the product-level requirements — what Boost must do and why. The PRDs are organized by capability area: AI chat, agent discovery, platform architecture, security, and operations.

**`openspec/`** contains the implementation-level specifications — how each capability area will be built. Each change includes a proposal, design decisions, task breakdown, and behavioral specs that serve as acceptance criteria.

All specs are currently in **draft** status (pre-implementation). They will be maintained alongside the code as implementation progresses.

## Plugins

| Plugin                          | Package                                                                   | Description                                                    |
| ------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------- |
| boost                           | `@red-hat-developer-hub/backstage-plugin-boost`                           | Frontend plugin — AI Catalog browse page and entity extensions |
| boost-backend                   | `@red-hat-developer-hub/backstage-plugin-boost-backend`                   | Backend plugin — chat, agent lifecycle, MCP, admin APIs        |
| boost-common                    | `@red-hat-developer-hub/backstage-plugin-boost-common`                    | Shared types and permissions                                   |
| boost-node                      | `@red-hat-developer-hub/backstage-plugin-boost-node`                      | Node library — service refs and extension points               |
| boost-backend-module-llamastack | `@red-hat-developer-hub/backstage-plugin-boost-backend-module-llamastack` | Llama Stack provider module                                    |
| boost-backend-module-kagenti    | `@red-hat-developer-hub/backstage-plugin-boost-backend-module-kagenti`    | Kagenti provider module                                        |
| llamastack-entity-provider      | `@red-hat-developer-hub/backstage-plugin-llamastack-entity-provider`      | Llama Stack catalog entity provider                            |
| kagenti-entity-provider         | `@red-hat-developer-hub/backstage-plugin-kagenti-entity-provider`         | Kagenti catalog entity provider                                |

## Compatibility

This workspace is aligned with **Backstage 1.52.0** (see [`backstage.json`](backstage.json)).

## Development

The workspace includes a dev app (`packages/app`) and dev backend (`packages/backend`) for local development.

```bash
# Install dependencies
yarn install

# Start the dev app + backend
yarn start
# Frontend: http://localhost:3000 (AI Catalog at /ai-catalog)
# Backend: http://localhost:7007

# Run tests
yarn test:all

# Build all plugins
yarn build:all
```
