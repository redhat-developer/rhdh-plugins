---
'@red-hat-developer-hub/backstage-plugin-catalog-model-ai-model-server': minor
'@red-hat-developer-hub/backstage-plugin-catalog-backend-module-ai-model-server': minor
---

Add AiModelServerAPI kind (`spec.type: ai-model-server`) in a dedicated
catalog-model package with types, JSON schema, KindValidator, type guard,
and CatalogModelLayer registration. Uses a dedicated kind to avoid
colliding with the upstream API kind; the schema mirrors
backstage/backstage#34476 exactly. The backend module registers the
AiModelServerAPI kind with the catalog via `catalogModelExtensionPoint`.
