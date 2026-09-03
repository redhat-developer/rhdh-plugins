# @red-hat-developer-hub/backstage-plugin-llamastack-entity-provider

## 0.4.0

### Minor Changes

- 2b94dc0: Add DeltaSyncManager class to the entity-provider SDK for cursor-based incremental sync via Backstage's `applyMutation({ type: 'delta' })` API. Update OGX agent and model entity providers to emit the three required AI asset annotations (`rhdh.io/ai-asset-category`, `rhdh.io/ai-asset-version`, `rhdh.io/ai-asset-source`).

### Patch Changes

- Updated dependencies [2b94dc0]
  - @red-hat-developer-hub/backstage-plugin-boost-entity-provider-sdk@0.3.0

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
