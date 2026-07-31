# Tasks: TechDocs / Model Card Integration Finalization

## 1. Add Connector Self-Discovery via coreServices.discovery

- [ ] 1.1 Add `discovery: coreServices.discovery` to the `deps` object in `plugins/kserve-kubeflow-connector-backend/src/plugin.ts`
- [ ] 1.2 Add `discovery` to the destructured `init` params
- [ ] 1.3 Call `const connectorBaseUrl = await discovery.getBaseUrl('kserve-kubeflow-connector')` before creating `connectorConfig`
- [ ] 1.4 Add `connectorBaseUrl?: string` to the `ConnectorConfig` interface in `InformerService.ts`
- [ ] 1.5 Add `connectorBaseUrl?: string` to the `ReconcilerConfig` interface in `types.ts`
- [ ] 1.6 Include `connectorBaseUrl` in the `connectorConfig` object created in `plugin.ts`
- [ ] 1.7 Thread `connectorConfig.connectorBaseUrl` into `ReconcilerConfig` in `setupInformer`
- [ ] 1.8 Verify `yarn tsc` passes

## 2. Navigate Cluster-Nested Config in Connector plugin.ts

- [ ] 2.1 Update config reading in `plugin.ts` to navigate `catalog.providers.modelCatalog.kserve-kubeflow-connector` then iterate cluster sub-keys
- [ ] 2.2 Read `kubeflow-model-catalog-url`, `default-owner`, `default-lifecycle` from the cluster sub-config (not the connector-level config)
- [ ] 2.3 Add TODO comment at the cluster key iteration point noting where multi-cluster looping would occur
- [ ] 2.4 Verify `yarn tsc` passes

## 3. Auto-Set TechDocsKey in KServe.ts

- [ ] 3.1 Import `CATALOG_SOURCE_ANNOTATION` and `CATALOG_MODEL_ANNOTATION` from `./Catalog` in `KServe.ts`
- [ ] 3.2 Add `connectorBaseUrl?: string` parameter to `callBackstagePrinters` function signature
- [ ] 3.3 Add `connectorBaseUrl?: string` parameter to `generateModelCatalog` function signature
- [ ] 3.4 Pass `connectorBaseUrl` from `callBackstagePrinters` through to `generateModelCatalog`
- [ ] 3.5 In `generateModelCatalog`, after reading `techdocsUrl` from annotations: when `techdocsUrl` is undefined AND `connectorBaseUrl` is defined AND catalog annotations (`CATALOG_SOURCE_ANNOTATION`, `CATALOG_MODEL_ANNOTATION`) are both present on the InferenceService, set `techdocsUrl = `/modelcard/${sourceId}/${modelName}`\` — path only, no `url:` prefix and no `connectorBaseUrl` prefix (ModelCatalogGenerator.ts handles both)
- [ ] 3.6 In `InformerService.ts`, pass `config.connectorBaseUrl` to `callKServeBackstagePrinters` as the new parameter
- [ ] 3.7 Verify `yarn tsc` passes

## 4. Wildcard Model Card Route

- [ ] 4.1 Change Express route in `router.ts` from `/modelcard/:sourceId/:modelName` to `/modelcard/:sourceId/*`
- [ ] 4.2 Change `req.params.modelName` to `(req.params as Record<string, string>)[0]` — TypeScript's Express types don't allow numeric indexing when named params are also present
- [ ] 4.3 Verify `yarn tsc` passes
- [ ] 4.4 Verify via `curl` that URLs with multi-segment model names (e.g., `/modelcard/redhat_ai_validated_models/RedHatAI/Meta-Llama-3.1-8B-Instruct-quantized.w4a16`) return 200

## 5. Add mkdocs.yml Generation to URL Reader

- [ ] 5.1 In `catalog-techdoc-url-reader-backend/src/plugin.ts`, update the `dir()` method of `ModelCatalogBridgeUrlReaderServiceReadTreeResponse`
- [ ] 5.2 Before creating the `docs/` subdirectory, write a minimal `mkdocs.yml` at the root of `dir`: `site_name: Model Card\nnav:\n  - Home: index.md\n`
- [ ] 5.3 Verify `yarn tsc` passes
- [ ] 5.4 Verify TechDocs page renders in browser (requires `mkdocs` and `mkdocs-techdocs-core` pip packages installed)

## 6. Align URL Reader BridgeConfig with Cluster-Nested Config

- [ ] 6.1 Update `BridgeConfig` type: replace `baseUrl: string` with `name: string`, `kubeflowModelCatalogUrl: string`, `defaultOwner: string`, `defaultLifecycle: string`
- [ ] 6.2 Update `readBridgeConfigs` to iterate two levels: connector keys then cluster sub-keys, filtering out connector-level non-cluster objects (e.g., `schedule`) via `getOptionalConfig` and field presence checks (e.g., `has('kubeflow-model-catalog-url')`)
- [ ] 6.3 Update `readBridgeConfig` to read `name`, `kubeflow-model-catalog-url`, `default-owner`, `default-lifecycle` from the cluster sub-config
- [ ] 6.4 Update test fixtures in `plugin.test.ts` to use cluster-nested config structure and new `BridgeConfig` fields
- [ ] 6.5 Verify url-reader tests pass (`yarn test -- --watchAll=false`)
- [ ] 6.6 Verify `yarn tsc` passes

## 7. Extend config.d.ts Schema

- [ ] 7.1 Add `[clusterKey: string]` index signature to the connector key object in `catalog-backend-module-model-catalog/config.d.ts`
- [ ] 7.2 Declare `name?`, `kubeflow-model-catalog-url?`, `default-owner?`, `default-lifecycle?` fields in the cluster sub-key type
- [ ] 7.3 Use union type to accommodate both cluster sub-key objects and existing scalar/schedule fields
- [ ] 7.4 Verify `yarn tsc` passes
- [ ] 7.5 Verify Backstage config validation no longer strips the new fields (connector's `providerConfigs.keys()` returns non-empty array)

## 8. Update app-config.yaml

- [ ] 8.1 Add `cluster-1:` nesting level under `kserve-kubeflow-connector:` in `app-config.yaml`
- [ ] 8.2 Indent `name`, `kubeflow-model-catalog-url`, `default-owner`, `default-lifecycle` under `cluster-1:`
- [ ] 8.3 Add `name: my-k8s-cluster` field

## 9. Verification

- [ ] 9.1 `yarn tsc` passes with no errors
- [ ] 9.2 `yarn build:all` succeeds
- [ ] 9.3 Unit tests pass (`yarn test -- --watchAll=false` in url-reader plugin)
- [ ] 9.4 Prettier checks pass (`yarn prettier`)
- [ ] 9.5 Lint checks pass (`yarn lint:all`)
- [ ] 9.6 `curl http://localhost:7007/api/kserve-kubeflow-connector/modelcard/<sourceId>/<multi/segment/modelName>` returns 200 with model card markdown (assumes RHDH running locally via `yarn dev` from the `ai-integrations` workspace)
- [ ] 9.7 TechDocs page renders in RHDH UI for entities with auto-set `backstage.io/techdocs-ref`
- [ ] 9.8 Integration tested against upstream KServe/Kubeflow
- [ ] 9.9 Integration tested against RHOAI on OCP
- [ ] 9.10 `connectorBaseUrl` is populated at connector startup (verify in logs or debugger)
- [ ] 9.11 TechDocsKey annotation is auto-set as path only (no `url:` prefix, no `connectorBaseUrl` prefix) — verify the resulting `backstage.io/techdocs-ref` is `url:<svcUrl>/modelcard/<sourceId>/<modelName>`
