# Augment Workspace

This workspace contains the Augment plugin family for Red Hat Developer Hub.

Augment is a configurable AI assistant with RAG, multi-agent orchestration, tool calling via MCP servers, and safety guardrails.

## Plugins

| Plugin                                                                                | Description                  |
| ------------------------------------------------------------------------------------- | ---------------------------- |
| [@red-hat-developer-hub/backstage-plugin-augment](./plugins/augment/)                 | Frontend plugin              |
| [@red-hat-developer-hub/backstage-plugin-augment-backend](./plugins/augment-backend/) | Backend plugin               |
| [@red-hat-developer-hub/backstage-plugin-augment-common](./plugins/augment-common/)   | Shared types and permissions |

## Development

```bash
# Install dependencies
yarn install

# Start the dev server
yarn dev

# Run tests
yarn test:all

# Build all plugins
yarn build:all
```
