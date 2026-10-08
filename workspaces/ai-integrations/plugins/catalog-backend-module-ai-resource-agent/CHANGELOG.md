# @red-hat-developer-hub/backstage-plugin-catalog-backend-module-ai-resource-agent

## 0.4.1

### Patch Changes

- dbce029: Bump ai-integrations workspace to Backstage v1.54.0
- Updated dependencies [dbce029]
  - @red-hat-developer-hub/backstage-plugin-catalog-model-ai-resource-agent@0.3.1

## 0.4.0

### Minor Changes

- 0c396f8: switch ai-model-server and ai-resource-agent from catalog model layer's addModelSource to addProcessor

## 0.3.0

### Minor Changes

- 6ddfd98: Add `AiResourceAgentProcessor` to validate agent-specific fields on
  `kind: AiResource` entities with `spec.type: agent` at catalog ingestion.
  Register the processor alongside the existing agent catalog model source.
- 6ddfd98: Make `spec.instructions` optional on agent AiResource entities so agents
  with a baked-in default prompt can be registered without a catalog-side
  system prompt.

### Patch Changes

- Updated dependencies [6ddfd98]
  - @red-hat-developer-hub/backstage-plugin-catalog-model-ai-resource-agent@0.3.0

## 0.2.1

### Patch Changes

- 8bf7bc3: Add AiModelServerAPI kind (`spec.type: ai-model-server`) in a dedicated
  catalog-model package with types, JSON schema, KindValidator, type guard,
  and CatalogModelLayer registration. Uses a dedicated kind to avoid
  colliding with the upstream API kind; the schema mirrors
  backstage/backstage#34476 exactly. The backend module registers the
  AiModelServerAPI kind with the catalog via `catalogModelExtensionPoint`.

  The model catalog entity provider now emits a single AiModelServerAPI
  entity per model server instead of separate Component, Resource, and API
  entities. Model names are collected into `spec.models.available`.

## 0.2.0

### Minor Changes

- 51a6bc2: Add AiResource agent typed schema (`spec.type: agent`) in a dedicated
  catalog-model package with types, JSON schema, KindValidator, type guard,
  and CatalogModelLayer registration. The backend module registers the agent
  specType with the catalog via `catalogModelExtensionPoint`.

### Patch Changes

- Updated dependencies [51a6bc2]
  - @red-hat-developer-hub/backstage-plugin-catalog-model-ai-resource-agent@0.2.0
