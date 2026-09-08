# @red-hat-developer-hub/backstage-plugin-boost-entity-provider-sdk

## 0.3.0

### Minor Changes

- 2b94dc0: Add DeltaSyncManager class to the entity-provider SDK for cursor-based incremental sync via Backstage's `applyMutation({ type: 'delta' })` API. Update OGX agent and model entity providers to emit the three required AI asset annotations (`rhdh.io/ai-asset-category`, `rhdh.io/ai-asset-version`, `rhdh.io/ai-asset-source`).

## 0.2.0

### Minor Changes

- 238427a: Add entity-provider SDK package with shared types, annotation constants, validation utilities, and adapter interfaces for AI asset entity providers.
- 238427a: Entity-Provider SDK — Types, Interfaces, Annotation Validation
