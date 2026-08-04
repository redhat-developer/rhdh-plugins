---
'@red-hat-developer-hub/backstage-plugin-boost-backend-module-ogx': minor
'@red-hat-developer-hub/backstage-plugin-ogx-entity-provider': minor
'@red-hat-developer-hub/backstage-plugin-boost-backend': patch
'@red-hat-developer-hub/backstage-plugin-boost-common': patch
---

Rename all Llama Stack references to OGX across the boost workspace. The upstream project has been renamed from llamastack to ogx. This changes npm package names, module IDs, cache key prefixes, config paths, provider identifiers, and entity name prefixes. Consumers must update imports from `@red-hat-developer-hub/backstage-plugin-boost-backend-module-llamastack` to `@red-hat-developer-hub/backstage-plugin-boost-backend-module-ogx` and from `@red-hat-developer-hub/backstage-plugin-llamastack-entity-provider` to `@red-hat-developer-hub/backstage-plugin-ogx-entity-provider`.
