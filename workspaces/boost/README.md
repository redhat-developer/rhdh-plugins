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
└── plugins/                     # Plugin packages (not yet created)
```

**`specifications/`** contains the product-level requirements — what Boost must do and why. The PRDs are organized by capability area: AI chat, agent discovery, platform architecture, security, and operations.

**`openspec/`** contains the implementation-level specifications — how each capability area will be built. Each change includes a proposal, design decisions, task breakdown, and behavioral specs that serve as acceptance criteria.

All specs are currently in **draft** status (pre-implementation). They will be maintained alongside the code as implementation progresses.

## Plugins

| Plugin        | Description |
| ------------- | ----------- |
| _coming soon_ |             |

## Compatibility

This workspace is aligned with **Backstage 1.52.0** (see [`backstage.json`](backstage.json)).

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
