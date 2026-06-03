# Boost Workspace

This workspace contains the Boost plugin family for Red Hat Developer Hub.

## Why Boost Exists

Boost is a clean-room reimplementation of the [Augment](../augment/) plugin. Rather than refactoring Augment's accumulated tech debt in-place, Boost starts from a new codebase and implements the same (and evolving) product requirements with the right architecture from day one. There is no migration path or code sharing between the two — Augment remains the reference prototype and source of requirements, while Boost is the forward-looking implementation.

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
└── plugins/                     # Plugin packages (not yet created)
```

**`specifications/`** contains the product-level requirements — what Boost must do and why. The PRDs are organized by capability area: AI chat, agent discovery, platform architecture, security, and operations.

**`openspec/`** contains the implementation-level specifications — how each capability area will be built. Each change includes a proposal, design decisions, task breakdown, and behavioral specs that serve as acceptance criteria.

All specs are currently in **draft** status (pre-implementation). They will be maintained alongside the code as implementation progresses.

## Plugins

| Plugin        | Description |
| ------------- | ----------- |
| _coming soon_ |             |

## Development

```bash
# Install dependencies
yarn install

# Start the dev server
yarn start

# Run tests
yarn test:all

# Build all plugins
yarn build:all
```
