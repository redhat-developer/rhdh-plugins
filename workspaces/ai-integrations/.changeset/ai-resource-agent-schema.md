---
'@red-hat-developer-hub/backstage-plugin-catalog-model-ai-resource-agent': minor
'@red-hat-developer-hub/backstage-plugin-catalog-backend-module-ai-resource-agent': minor
---

Add AiResource agent typed schema (`spec.type: agent`) in a dedicated
catalog-model package with types, JSON schema, KindValidator, type guard,
and CatalogModelLayer registration. The backend module registers the agent
specType with the catalog via `catalogModelExtensionPoint`.
