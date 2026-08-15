# @red-hat-developer-hub/backstage-plugin-catalog-backend-module-ai-model-server

## 0.3.0

### Minor Changes

- 0c396f8: switch ai-model-server and ai-resource-agent from catalog model layer's addModelSource to addProcessor

## 0.2.0

### Minor Changes

- 8bf7bc3: Add AiModelServerAPI kind (`spec.type: ai-model-server`) in a dedicated
  catalog-model package with types, JSON schema, KindValidator, type guard,
  and CatalogModelLayer registration. Uses a dedicated kind to avoid
  colliding with the upstream API kind; the schema mirrors
  backstage/backstage#34476 exactly. The backend module registers the
  AiModelServerAPI kind with the catalog via `catalogModelExtensionPoint`.

  The model catalog entity provider now emits a single AiModelServerAPI
  entity per model server instead of separate Component, Resource, and API
  entities. Model names are collected into `spec.models.available`.

### Patch Changes

- Updated dependencies [8bf7bc3]
  - @red-hat-developer-hub/backstage-plugin-catalog-model-ai-model-server@0.2.0
