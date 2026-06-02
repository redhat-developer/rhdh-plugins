# Boost Workspace

This workspace contains the Boost plugin family for Red Hat Developer Hub.

Boost is a rewrite of the [Augment](../augment/) plugin — an AI assistant plugin for Backstage that provides RAG-powered document search, multi-agent orchestration, tool calling via MCP servers, and safety guardrails, all running against open-source models on your own infrastructure.

## Plugins

The following plugins are planned:

| Plugin                                                    | Description                                      |
| --------------------------------------------------------- | ------------------------------------------------ |
| @red-hat-developer-hub/backstage-plugin-boost             | Frontend UI — chat interface and agent status     |
| @red-hat-developer-hub/backstage-plugin-boost-backend     | Backend service — API routes, orchestration logic |
| @red-hat-developer-hub/backstage-plugin-boost-common      | Shared types, constants, and utilities            |

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
