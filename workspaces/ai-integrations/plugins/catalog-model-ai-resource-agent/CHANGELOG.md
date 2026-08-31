# @red-hat-developer-hub/backstage-plugin-catalog-model-ai-resource-agent

## 0.3.1

### Patch Changes

- dbce029: Bump ai-integrations workspace to Backstage v1.54.0

## 0.3.0

### Minor Changes

- 6ddfd98: Make `spec.instructions` optional on agent AiResource entities so agents
  with a baked-in default prompt can be registered without a catalog-side
  system prompt.

## 0.2.0

### Minor Changes

- 51a6bc2: Add AiResource agent typed schema (`spec.type: agent`) in a dedicated
  catalog-model package with types, JSON schema, KindValidator, type guard,
  and CatalogModelLayer registration. The backend module registers the agent
  specType with the catalog via `catalogModelExtensionPoint`.
