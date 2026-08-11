# @red-hat-developer-hub/backstage-plugin-catalog-model-ai-resource-agent

## 0.2.0

### Minor Changes

- 51a6bc2: Add AiResource agent typed schema (`spec.type: agent`) in a dedicated
  catalog-model package with types, JSON schema, KindValidator, type guard,
  and CatalogModelLayer registration. The backend module registers the agent
  specType with the catalog via `catalogModelExtensionPoint`.
