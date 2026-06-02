# Boost Workspace

This workspace contains the Boost plugin family for Red Hat Developer Hub.

Boost is a rewrite of the [Augment](../augment/) plugin — an AI assistant plugin for Backstage that provides RAG-powered document search, multi-agent orchestration, tool calling via MCP servers, and safety guardrails, all running against open-source models on your own infrastructure.

## Planned Plugin Structure

| Plugin           | Package                                        | Description                                      |
| ---------------- | ---------------------------------------------- | ------------------------------------------------ |
| boost            | `@red-hat-developer-hub/backstage-plugin-boost` | Frontend UI — chat interface and agent status     |
| boost-backend    | `@red-hat-developer-hub/backstage-plugin-boost-backend` | Backend service — API routes, orchestration logic |
| boost-common     | `@red-hat-developer-hub/backstage-plugin-boost-common` | Shared types, constants, and utilities            |

## Prerequisites

- **Node.js** 22 or later
- **Yarn** (see the repository root `.yarnrc.yml` for the pinned version)

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
