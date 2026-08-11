# Tasks: TechDocs / Model Card Integration Finalization

## 1. Navigate Cluster-Nested Config in Connector plugin.ts

- [x] 2.1 Update config reading in `plugin.ts` to navigate `catalog.providers.modelCatalog.kserve-kubeflow-connector` then iterate cluster sub-keys
- [x] 2.2 Read `kubeflow-model-catalog-url`, `default-owner`, `default-lifecycle` from the cluster sub-config (not the connector-level config)
- [x] 2.3 Add TODO comment at the cluster key iteration point noting where multi-cluster looping would occur
- [x] 2.4 Verify `yarn tsc` passes

## 2. Auto-Set TechDocsKey in KServe.ts

- [x] 2.1 Import `CATALOG_SOURCE_ANNOTATION` and `CATALOG_MODEL_ANNOTATION` from `./Catalog` in `KServe.ts`
- [x] 2.2 In `generateModelCatalog`, after reading `techdocsUrl` from annotations: when `techdocsUrl` is undefined AND catalog annotations (`CATALOG_SOURCE_ANNOTATION`, `CATALOG_MODEL_ANNOTATION`) are both present on the InferenceService, set `techdocsUrl = `/modelcard/${sourceId}/${modelName}`\` — path only, no `url:` prefix (the entity provider's `ModelCatalogGenerator.ts` discovers the connector base URL via `discovery.getBaseUrl()` and prepends it)
- [x] 2.3 Verify `yarn tsc` passes

## 3. Wildcard Model Card Route

- [x] 3.1 Change Express route in `router.ts` from `/modelcard/:sourceId/:modelName` to `/modelcard/:sourceId/*`
- [x] 3.2 Change `req.params.modelName` to `(req.params as Record<string, string>)[0]` — TypeScript's Express types don't allow numeric indexing when named params are also present
- [x] 3.3 Verify `yarn tsc` passes
- [x] 3.4 Verify via `curl` that URLs with multi-segment model names (e.g., `/modelcard/redhat_ai_validated_models/RedHatAI/Meta-Llama-3.1-8B-Instruct-quantized.w4a16`) return 200

## 4. Add mkdocs.yml Generation to URL Reader

- [x] 4.1 In `catalog-techdoc-url-reader-backend/src/plugin.ts`, update the `dir()` method of `ModelCatalogBridgeUrlReaderServiceReadTreeResponse`
- [x] 4.2 Before creating the `docs/` subdirectory, write a minimal `mkdocs.yml` at the root of `dir`: `site_name: Model Card\nnav:\n  - Home: index.md\n`
- [x] 4.3 Verify `yarn tsc` passes
- [x] 4.4 Verify TechDocs page renders in browser (requires `mkdocs` and `mkdocs-techdocs-core` pip packages installed)

## 5. Align URL Reader BridgeConfig with Cluster-Nested Config

- [x] 5.1 Update `BridgeConfig` type: replace `baseUrl: string` with `name: string`, `kubeflowModelCatalogUrl: string`, `defaultOwner: string`, `defaultLifecycle: string`
- [x] 5.2 Update `readBridgeConfigs` to iterate two levels: connector keys then cluster sub-keys, filtering via `getOptionalConfig` — do NOT gate on `has('kubeflow-model-catalog-url')` (see design.md D6)
- [x] 5.3 Update `readBridgeConfig` to read `name`, `kubeflow-model-catalog-url`, `default-owner`, `default-lifecycle` from the cluster sub-config using `safeGetOptionalString` (see design.md D7)
- [x] 5.4 Update test fixtures in `plugin.test.ts` to use cluster-nested config structure and new `BridgeConfig` fields
- [x] 5.5 Verify url-reader tests pass (`yarn test -- --watchAll=false`)
- [x] 5.6 Verify `yarn tsc` passes

## 6. Extend config.d.ts Schema

- [x] 6.1 Add `[clusterKey: string]` index signature to the connector key object in `catalog-backend-module-model-catalog/config.d.ts`
- [x] 6.2 Declare `name?`, `kubeflow-model-catalog-url?`, `default-owner?`, `default-lifecycle?` fields in the cluster sub-key type
- [x] 6.3 Use union type to accommodate both cluster sub-key objects and existing scalar/schedule fields
- [x] 6.4 Verify `yarn tsc` passes
- [x] 6.5 Verify Backstage config validation no longer strips the new fields (connector's `providerConfigs.keys()` returns non-empty array)

## 7. Update app-config.yaml

- [x] 7.1 Add `cluster-1:` nesting level under `kserve-kubeflow-connector:` in `app-config.yaml`
- [x] 7.2 Indent `name`, `kubeflow-model-catalog-url`, `default-owner`, `default-lifecycle` under `cluster-1:`
- [x] 7.3 Add `name: my-k8s-cluster` field

## 8. Fix URL Reader Auth and Config Robustness (discovered during integration testing)

- [x] 8.1 Fix `targetPluginId` in `getPluginRequestToken` — was incorrect, corrected to `'kserve-kubeflow-connector'`
- [x] 8.2 Add `safeGetOptionalString` wrapper around `config.getOptionalString()` to handle Backstage ConfigReader TypeError on empty env var substitution (see design.md D7)
- [x] 8.3 Remove `has('kubeflow-model-catalog-url')` gate in `readBridgeConfigs` — `ConfigReader.has()` returns false for env var substitution defaults, causing zero bridge configs (see design.md D6)
- [x] 8.4 Remove `RHDH_TOKEN` env var fallback in url-reader `readUrl` — service-to-service token via `getPluginRequestToken` works correctly after targetPluginId fix (see design.md D8)

## 9. Verification

- [x] 9.1 `yarn tsc` passes with no errors
- [x] 9.2 `yarn build:all` succeeds
- [x] 9.3 Unit tests pass (`yarn test -- --watchAll=false` in url-reader plugin)
- [x] 9.4 Prettier checks pass (`yarn prettier`)
- [x] 9.5 Lint checks pass (`yarn lint:all`)
- [x] 9.6 `curl http://localhost:7007/api/kserve-kubeflow-connector/modelcard/<sourceId>/<multi/segment/modelName>` returns 200 with model card markdown (assumes RHDH running locally via `yarn dev` from the `ai-integrations` workspace)
- [x] 9.7 TechDocs page renders in RHDH UI for entities with auto-set `backstage.io/techdocs-ref`
- [ ] 9.8 Integration tested against upstream KServe/Kubeflow
- [x] 9.9 Integration tested against RHOAI on OCP
- [x] 9.10 TechDocsKey annotation is auto-set as path only (no `url:` prefix) — entity provider prepends `svcUrl` via `discovery.getBaseUrl()` and wraps in `url:` prefix
- [x] 9.11 Service-to-service token auth works without `RHDH_TOKEN` fallback — url-reader logs `Using service-to-service token for <url>`
