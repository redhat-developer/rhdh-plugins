---
'@red-hat-developer-hub/backstage-plugin-catalog-model-ai-model-server': minor
'@red-hat-developer-hub/backstage-plugin-catalog-backend-module-ai-model-server': minor
'@red-hat-developer-hub/backstage-plugin-catalog-backend-module-model-catalog': major
---

Add AiModelServerAPI kind (`spec.type: ai-model-server`) in a dedicated
catalog-model package with types, JSON schema, KindValidator, type guard,
and CatalogModelLayer registration. Uses a dedicated kind to avoid
colliding with the upstream API kind; the schema mirrors
backstage/backstage#34476 exactly. The backend module registers the
AiModelServerAPI kind with the catalog via `catalogModelExtensionPoint`.

The model catalog entity provider now emits a single AiModelServerAPI
entity per model server instead of separate Component, Resource, and API
entities. Model names are collected into `spec.models.available`.
