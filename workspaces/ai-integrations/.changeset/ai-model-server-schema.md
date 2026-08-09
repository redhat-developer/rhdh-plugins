---
'@red-hat-developer-hub/backstage-plugin-catalog-model-ai-model-server': minor
'@red-hat-developer-hub/backstage-plugin-catalog-backend-module-ai-model-server': minor
---

Add API ai-model-server typed schema (`spec.type: ai-model-server`) in a
dedicated catalog-model package with types, JSON schema, KindValidator,
type guard, and CatalogModelLayer registration. The backend module
registers the ai-model-server specType with the catalog via
`catalogModelExtensionPoint`.
