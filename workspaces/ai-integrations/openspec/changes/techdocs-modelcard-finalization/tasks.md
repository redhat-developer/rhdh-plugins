# Tasks: TechDocs / Model Card Integration Finalization

## 1. Add Connector Self-Discovery via coreServices.discovery

- [x] 1.1 Add `discovery: coreServices.discovery` to the `deps` object in `plugins/kserve-kubeflow-connector-backend/src/plugin.ts`
- [x] 1.2 Add `discovery` to the destructured `init` params
- [x] 1.3 Call `const connectorBaseUrl = await discovery.getBaseUrl('kserve-kubeflow-connector')` before creating `connectorConfig`
- [x] 1.4 Add `connectorBaseUrl?: string` to the `ConnectorConfig` interface in `InformerService.ts`
- [x] 1.5 Add `connectorBaseUrl?: string` to the `ReconcilerConfig` interface in `types.ts`
- [x] 1.6 Include `connectorBaseUrl` in the `connectorConfig` object created in `plugin.ts`
- [x] 1.7 Thread `connectorConfig.connectorBaseUrl` into `ReconcilerConfig` in `setupInformer`
- [x] 1.8 Verify `yarn tsc` passes

## 2. Navigate Cluster-Nested Config in Connector plugin.ts

- [x] 2.1 Update config reading in `plugin.ts` to navigate `catalog.providers.modelCatalog.kserve-kubeflow-connector` then iterate cluster sub-keys
- [x] 2.2 Read `kubeflow-model-catalog-url`, `default-owner`, `default-lifecycle` from the cluster sub-config (not the connector-level config)
- [x] 2.3 Add TODO comment at the cluster key iteration point noting where multi-cluster looping would occur
- [x] 2.4 Verify `yarn tsc` passes

## 3. Auto-Set TechDocsKey in KServe.ts

- [x] 3.1 Import `CATALOG_SOURCE_ANNOTATION` and `CATALOG_MODEL_ANNOTATION` from `./Catalog` in `KServe.ts`
- [x] 3.2 Add `connectorBaseUrl?: string` parameter to `callBackstagePrinters` function signature
- [x] 3.3 Add `connectorBaseUrl?: string` parameter to `generateModelCatalog` function signature
- [x] 3.4 Pass `connectorBaseUrl` from `callBackstagePrinters` through to `generateModelCatalog`
- [x] 3.5 In `generateModelCatalog`, after reading `techdocsUrl` from annotations: when `techdocsUrl` is undefined AND `connectorBaseUrl` is defined AND catalog annotations (`CATALOG_SOURCE_ANNOTATION`, `CATALOG_MODEL_ANNOTATION`) are both present on the InferenceService, set `techdocsUrl = `/modelcard/${sourceId}/${modelName}`\` — path only, no `url:` prefix and no `connectorBaseUrl` prefix (ModelCatalogGenerator.ts handles both)
- [x] 3.6 In `InformerService.ts`, pass `config.connectorBaseUrl` to `callKServeBackstagePrinters` as the new parameter
- [x] 3.7 Verify `yarn tsc` passes

## 4. Wildcard Model Card Route

- [x] 4.1 Change Express route in `router.ts` from `/modelcard/:sourceId/:modelName` to `/modelcard/:sourceId/*`
- [x] 4.2 Change `req.params.modelName` to `(req.params as Record<string, string>)[0]` — TypeScript's Express types don't allow numeric indexing when named params are also present
- [x] 4.3 Verify `yarn tsc` passes
- [x] 4.4 Verify via `curl` that URLs with multi-segment model names (e.g., `/modelcard/redhat_ai_validated_models/RedHatAI/Meta-Llama-3.1-8B-Instruct-quantized.w4a16`) return 200

## 5. Add mkdocs.yml Generation to URL Reader

- [x] 5.1 In `catalog-techdoc-url-reader-backend/src/plugin.ts`, update the `dir()` method of `ModelCatalogBridgeUrlReaderServiceReadTreeResponse`
- [x] 5.2 Before creating the `docs/` subdirectory, write a minimal `mkdocs.yml` at the root of `dir`: `site_name: Model Card\nnav:\n  - Home: index.md\n`
- [x] 5.3 Verify `yarn tsc` passes
- [x] 5.4 Verify TechDocs page renders in browser (requires `mkdocs` and `mkdocs-techdocs-core` pip packages installed)

## 6. Align URL Reader BridgeConfig with Cluster-Nested Config

- [x] 6.1 Update `BridgeConfig` type: replace `baseUrl: string` with `name: string`, `kubeflowModelCatalogUrl: string`, `defaultOwner: string`, `defaultLifecycle: string`
- [x] 6.2 Update `readBridgeConfigs` to iterate two levels: connector keys then cluster sub-keys, filtering via `getOptionalConfig` — do NOT gate on `has('kubeflow-model-catalog-url')` (see design.md D7)
- [x] 6.3 Update `readBridgeConfig` to read `name`, `kubeflow-model-catalog-url`, `default-owner`, `default-lifecycle` from the cluster sub-config using `safeGetOptionalString` (see design.md D8)
- [x] 6.4 Update test fixtures in `plugin.test.ts` to use cluster-nested config structure and new `BridgeConfig` fields
- [x] 6.5 Verify url-reader tests pass (`yarn test -- --watchAll=false`)
- [x] 6.6 Verify `yarn tsc` passes

## 7. Extend config.d.ts Schema

- [x] 7.1 Add `[clusterKey: string]` index signature to the connector key object in `catalog-backend-module-model-catalog/config.d.ts`
- [x] 7.2 Declare `name?`, `kubeflow-model-catalog-url?`, `default-owner?`, `default-lifecycle?` fields in the cluster sub-key type
- [x] 7.3 Use union type to accommodate both cluster sub-key objects and existing scalar/schedule fields
- [x] 7.4 Verify `yarn tsc` passes
- [x] 7.5 Verify Backstage config validation no longer strips the new fields (connector's `providerConfigs.keys()` returns non-empty array)

## 8. Update app-config.yaml

- [x] 8.1 Add `cluster-1:` nesting level under `kserve-kubeflow-connector:` in `app-config.yaml`
- [x] 8.2 Indent `name`, `kubeflow-model-catalog-url`, `default-owner`, `default-lifecycle` under `cluster-1:`
- [x] 8.3 Add `name: my-k8s-cluster` field

## 9. Fix URL Reader Auth and Config Robustness (discovered during integration testing)

- [x] 9.1 Fix `targetPluginId` in `getPluginRequestToken` — was incorrect, corrected to `'kserve-kubeflow-connector'`
- [x] 9.2 Add `safeGetOptionalString` wrapper around `config.getOptionalString()` to handle Backstage ConfigReader TypeError on empty env var substitution (see design.md D8)
- [x] 9.3 Remove `has('kubeflow-model-catalog-url')` gate in `readBridgeConfigs` — `ConfigReader.has()` returns false for env var substitution defaults, causing zero bridge configs (see design.md D7)
- [x] 9.4 Remove `RHDH_TOKEN` env var fallback in url-reader `readUrl` — service-to-service token via `getPluginRequestToken` works correctly after targetPluginId fix (see design.md D9)

## 10. Verification

- [x] 10.1 `yarn tsc` passes with no errors
- [x] 10.2 `yarn build:all` succeeds
- [x] 10.3 Unit tests pass (`yarn test -- --watchAll=false` in url-reader plugin)
- [x] 10.4 Prettier checks pass (`yarn prettier`)
- [x] 10.5 Lint checks pass (`yarn lint:all`)
- [x] 10.6 `curl http://localhost:7007/api/kserve-kubeflow-connector/modelcard/<sourceId>/<multi/segment/modelName>` returns 200 with model card markdown (assumes RHDH running locally via `yarn dev` from the `ai-integrations` workspace)
- [x] 10.7 TechDocs page renders in RHDH UI for entities with auto-set `backstage.io/techdocs-ref`
- [ ] 10.8 Integration tested against upstream KServe/Kubeflow
- [x] 10.9 Integration tested against RHOAI on OCP
- [x] 10.10 `connectorBaseUrl` is populated at connector startup (verify in logs or debugger)
- [x] 10.11 TechDocsKey annotation is auto-set as path only (no `url:` prefix, no `connectorBaseUrl` prefix) — verify the resulting `backstage.io/techdocs-ref` is `url:<svcUrl>/modelcard/<sourceId>/<modelName>`
- [x] 10.12 Service-to-service token auth works without `RHDH_TOKEN` fallback — url-reader logs `Using service-to-service token for <url>`
