# Boost Workspace

This workspace contains the Boost plugin family for Red Hat Developer Hub.

## Plugins

| Plugin                         | Package                                                                  | Description                                                                |
| ------------------------------ | ------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| ai-catalog                     | `@red-hat-developer-hub/backstage-plugin-ai-catalog`                     | Frontend plugin — AI Catalog browse page and entity extensions             |
| boost-backend                  | `@red-hat-developer-hub/backstage-plugin-boost-backend`                  | Backend plugin — chat, agent lifecycle, MCP, admin APIs                    |
| ai-catalog-common              | `@red-hat-developer-hub/backstage-plugin-ai-catalog-common`              | Shared types and permissions                                               |
| boost-node                     | `@red-hat-developer-hub/backstage-plugin-boost-node`                     | Node library — service refs and extension points                           |
| ai-catalog-connector-utils     | `@red-hat-developer-hub/backstage-plugin-ai-catalog-connector-utils`     | Shared CA/fault-isolation/startup helpers for AI Catalog connectors        |
| ai-catalog-entity-provider-sdk | `@red-hat-developer-hub/backstage-plugin-ai-catalog-entity-provider-sdk` | SDK for AI Catalog entity providers                                        |
| boost-backend-module-ogx       | `@red-hat-developer-hub/backstage-plugin-boost-backend-module-ogx`       | OGX provider module                                                        |
| boost-backend-module-kagenti   | `@red-hat-developer-hub/backstage-plugin-boost-backend-module-kagenti`   | Kagenti provider module                                                    |
| ogx-entity-provider            | `@red-hat-developer-hub/backstage-plugin-ogx-entity-provider`            | OGX catalog entity provider                                                |
| kagenti-entity-provider        | `@red-hat-developer-hub/backstage-plugin-kagenti-entity-provider`        | Kagenti catalog entity provider                                            |
| boost-migration-readiness      | `@red-hat-developer-hub/backstage-plugin-boost-migration-readiness`      | Read-only CLI assessing AI asset entities against upstream Backstage kinds |

## Consumer migration

For the first release, install `@red-hat-developer-hub/backstage-plugin-ai-catalog`
and `@red-hat-developer-hub/backstage-plugin-ogx-entity-provider`; the common,
connector-utils, and entity-provider-sdk packages are supporting dependencies.
Update frontend imports and the dynamic-plugin export path from `boost` to
`ai-catalog`, and configure the standalone OGX provider under
`ai-catalog.entityProviders.ogx`. The old package names and standalone Boost
configuration paths are not compatibility aliases. Deferred Boost backend
contracts such as `/api/boost`, `boost.providers.ogx`, and `BOOST_*` environment
variables remain unchanged.

Update configured frontend extension IDs from `page:boost/ai-catalog` to
`page:ai-catalog/ai-catalog`, and replace the `boost` namespace in
`ai-catalog-filter:boost/{category,owner,provider,tags}` and
`entity-card:boost/{ai-asset-details,agent-instructions,usage}` with `ai-catalog`.
The route remains `/ai-catalog`; existing catalog entities need no migration.
Import `aiCatalogTranslationRef`, `aiCatalogTranslations`, and
`aiCatalogTranslationsModule` instead of their `boost`-prefixed exports.
The `./translations` entry point still exports the translation module as its
default, and translation overrides now target `plugin.ai-catalog`.
Custom CSS overrides must use `--ai-catalog-*` instead of `--boost-*`.

For standalone OGX, move the endpoint, credentials, TLS, agents, and refresh
settings together to `ai-catalog.entityProviders.ogx`. A configured block requires
`baseUrl`; an absent block retains the localhost default. The old paths are
ignored, including when old and new values coexist.

## Compatibility

This workspace is aligned with **Backstage 1.54.6** (see [`backstage.json`](backstage.json)).

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

# Run Playwright e2e tests (starts the dev app unless PLAYWRIGHT_URL is set)
yarn test:e2e

# Run AI Catalog performance benchmarks (see performance/ai-catalog.md)
yarn test:e2e:performance

# Build all plugins
yarn build:all
```
