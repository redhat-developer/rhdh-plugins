# @red-hat-developer-hub/backstage-plugin-llamastack-entity-provider

## 0.3.0

### Minor Changes

- 118559b: add test for entityHelpers.ts; rename entity annotations from boost.redhat.com to ai-catalog.rhdh.com

  pivot ogx entity provider to employ our entity kind extensions AiModelServerAPI and AiResource ; this change was in a previously merged commit https://github.com/redhat-developer/rhdh-plugins/commit/887e675df7939b79648353ce9001dc9cc7ed09d3

## 0.2.0

### Minor Changes

- 54345de: Rename all Llama Stack references to OGX across the boost workspace. The upstream project has been renamed from llamastack to ogx. This changes npm package names, module IDs, cache key prefixes, config paths, provider identifiers, and entity name prefixes. Consumers must update imports from `@red-hat-developer-hub/backstage-plugin-boost-backend-module-llamastack` to `@red-hat-developer-hub/backstage-plugin-boost-backend-module-ogx` and from `@red-hat-developer-hub/backstage-plugin-llamastack-entity-provider` to `@red-hat-developer-hub/backstage-plugin-ogx-entity-provider`.

## 0.1.1

### Patch Changes

- 2bf1ba5: bump workspace to Backstage 1.52.0
