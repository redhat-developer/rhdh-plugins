# Tasks: AiModelServerAPI Kind

## 1. Catalog model package

- [x] 1.1 Scaffold `plugins/catalog-model-ai-model-server/` with package.json, tsconfig, eslintrc mirroring the `catalog-model-ai-resource-agent` sibling
- [x] 1.2 Copy JSON schema from upstream backstage/backstage#34476, change `kind` enum from `["API"]` to `["AiModelServerAPI"]` and update `$id`
- [x] 1.3 Define `AiModelServerApiEntity` TypeScript interface extending `Entity` with `kind: 'AiModelServerAPI'` and required/optional spec fields per design D5
- [x] 1.4 Implement `aiModelServerApiEntityValidator` using `entityKindSchemaValidator` with the JSON schema
- [x] 1.5 Implement `isAiModelServerApiEntity` type guard checking `kind` and `spec.type` (no `apiVersion` check per design D5)
- [x] 1.6 Implement `aiModelServerApiEntityModel` CatalogModelLayer using `createCatalogModelLayer` with `addKind` (not `addKindVersion`) per design D2, group `backstage.io`, versions `v1alpha1`/`v1beta1`
- [x] 1.7 Export public API: types, validator, type guard, and model layer from package entrypoint
- [x] 1.8 Generate API report with `yarn build:api-reports:only`

## 2. Backend module package

- [x] 2.1 Scaffold `plugins/catalog-backend-module-ai-model-server/` with package.json, tsconfig, eslintrc mirroring `catalog-backend-module-ai-resource-agent`
- [x] 2.2 Implement `catalogModuleAiModelServer` using `createBackendModule` with `pluginId: 'catalog'`, registering via bare `CatalogModelSource` (not `CatalogModelSources.static()`) per design D3
- [x] 2.3 Add module test verifying export is defined (matching sibling pattern)
- [x] 2.4 Wire into `packages/backend/src/index.ts` and `packages/backend/package.json`

## 3. Bare CatalogModelSource fix for ai-resource-agent

- [x] 3.1 Update `catalog-backend-module-ai-resource-agent/src/module.ts` to use bare `CatalogModelSource` instead of `CatalogModelSources.static()` per design D3
- [x] 3.2 Add patch changeset entry for `catalog-backend-module-ai-resource-agent`
- [x] 3.3 Verify module test still passes

## 4. Entity provider consolidation

- [x] 4.1 Add `catalog-model-ai-model-server` workspace dependency to `catalog-backend-module-model-catalog/package.json`
- [x] 4.2 Rewrite `ModelCatalogGenerator.ts` to produce single `AiModelServerAPI` entity per `ModelCatalog`: merge tags, links, annotations, techdocs from server/API/model data into one entity; collect model names into `spec.models.available`
- [x] 4.3 Add guard returning `[]` when `modelServer` is absent
- [x] 4.4 Add guard returning `[]` when `modelServer.API?.url` is falsy (prevents schema `minLength: 1` violation)
- [x] 4.5 Update entity provider log message from "ResourceEntities" to "AiModelServerAPI entities"
- [x] 4.6 Rewrite `ModelCatalogGenerator.test.ts` with tests covering: full server with models, no modelServer, no API url, auth tags, annotation merge, techdocs (absolute, relative with svcUrl, whitespace), empty models, no annotations
- [x] 4.7 Update entity provider test `fakeCatalog` to include `modelServer` and update snapshot

## 5. Example and config

- [x] 5.1 Create `examples/ai-model-server-api.yaml` with a representative `AiModelServerAPI` entity
- [x] 5.2 Add `AiModelServerAPI` to `app-config.yaml` `catalog.rules[].allow`
- [x] 5.3 Add example YAML as a catalog location with `allow: [AiModelServerAPI]`

## 6. Schema validation tests

- [x] 6.1 Add accept tests: minimal valid entity, v1beta1, full entity with all optional fields, models with only discoverable, requiresApiKey false
- [x] 6.2 Add reject tests: wrong spec.type, missing serverType, missing serverUrl, empty serverType, empty serverUrl, wrong kind, wrong serverUrl type
- [x] 6.3 Add type guard tests: true for AiModelServerAPI, false for API/openapi, false for API/mcp-server, false for Component

## 7. Changeset and verification

- [x] 7.1 Add changeset with minor for catalog-model and backend-module, major for model-catalog, patch for ai-resource-agent
- [x] 7.2 Verify `yarn tsc` passes clean
- [x] 7.3 Verify all tests pass (catalog-model: 16, model-catalog: 18, backend-module: 1)
- [x] 7.4 Verify `yarn build:all` succeeds
- [x] 7.5 Verify `yarn dev` starts without catalog plugin errors
