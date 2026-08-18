# Tasks: Remove KubeFlow Model Registry (KFMR) Client Code

## 1. Relocate Shared Utilities from Kfmr.ts

- [ ] 1.1 Move `PropertyKeys` constant object from `Kfmr.ts` to `types.ts`
- [x] 1.2 ~~Move `NormalizerFormat` enum from `Kfmr.ts` to `types.ts`~~ — `NormalizerFormat` retained in `types.ts`; `NormalizerType` enum deleted entirely (only KServe normalizer remains, making the enum unnecessary)
- [ ] 1.3 Move `getTagsFromCustomProps` function from `Kfmr.ts` to `types.ts`
- [ ] 1.4 Move `getStringPropVal` function from `Kfmr.ts` to `types.ts`
- [ ] 1.5 Move `sanitizeName` and `sanitizeModelVersion` functions from `Kfmr.ts` to `types.ts`
- [ ] 1.6 Ensure `ModelCatalog`, `Model`, `ModelServer`, `API`, `APIType` are exported from `types.ts` (they are currently re-exported via `Kfmr.ts`)
- [ ] 1.7 Update `KServe.ts` to import `PropertyKeys` from `./types` instead of `./Kfmr`
- [ ] 1.8 Verify `yarn tsc` passes after relocation (before any deletions)

## 2. Relocate Model Catalog Code from Kfmr.ts

- [ ] 2.1 Extract catalog route discovery logic (the `route.metadata.name.includes('catalog')` branch from `setupKFMR`) into a standalone `setupCatalogRoute` function or similar
- [ ] 2.2 Extract `KFMR_CATALOG_BASE_URI` (rename to `CATALOG_BASE_URI`) and `GET_CATALOG_MODEL_URI` constants
- [ ] 2.3 Extract `rootCatalogURL` construction from catalog route ingress
- [ ] 2.4 Extract `getModelCard()` function
- [ ] 2.5 Place the above in a new `Catalog.ts` module or inline into `types.ts`
- [ ] 2.6 Verify `getModelCard()` compiles and is callable after relocation

## 3. Remove KFMR-Only Types from types.ts

- [ ] 3.1 Remove `KFMRClient` interface (replace with a smaller `CatalogClient` interface if needed, retaining only `rootCatalogURL` and `getModelCard`)
- [ ] 3.2 Remove `KFMRInferenceService` interface and `InferenceServiceList` interface
- [ ] 3.3 Remove `LoopOverKFMRResult` interface
- [ ] 3.4 Remove `kfmrClients` and `kfmrRoutes` fields from `ReconcilerConfig` interface
- [ ] 3.5 Rename `kfmrCatalogRoute` to `catalogRoute` on `ReconcilerConfig` (this is Model Catalog, not Model Registry)
- [ ] 3.6 Remove KFMR-specific enums (`RegisteredModelState`, `ModelVersionState`, `InferenceServiceState`) if they are not used by KServe or Catalog path — verify before deleting
- [ ] 3.7 Remove KFMR-specific model interfaces (`RegisteredModel`, `RegisteredModelList`, `ModelVersion`, `ModelVersionList`, `ModelArtifact`, `ModelArtifactList`, `ServingEnvironment`) if not used by KServe or Catalog path — verify before deleting. **Keep** `CatalogModel` (it is a Model Catalog type, not a registry type)
- [ ] 3.8 Clean up the `types.ts` header comment (currently references "avoid circular dependencies between InformerService.ts and Kfmr.ts")

## 4. Remove KFMR-Only Logic from InformerService.ts

- [ ] 4.1 Remove KFMR-only imports from `./Kfmr` (`setupKFMR`, `loopOverKFMR`, `callBackstagePrinters`, `getKubeFlowInferenceServicesForModelVersion`, `sanitizeName as kfmrSanitizeName`)
- [ ] 4.2 Remove KFMR type imports (`KFMRClient`, `KFMRInferenceService`)
- [ ] 4.3 Remove KFMR label constants (`INF_SVC_RM_ID_LABEL`, `INF_SVC_MV_ID_LABEL`, commented `INF_SVC_INF_SVC_ID_LABEL`)
- [x] 4.4 ~~Remove `KubeflowNormalizer` value from `NormalizerType` enum (keep `KServeNormalizer` only)~~ — entire `NormalizerType` enum deleted; `normalizerType` field removed from `ModelCatalogMetadata` and `processModelCatalog` parameter
- [ ] 4.5 Remove `ProcessKFMRResult` interface
- [ ] 4.6 Remove KFMR-only logic from `processKFMR`: registered model listing, model version matching, KFMR inference service correlation, and KFMR-specific `callBackstagePrinters` calls. **Preserve** the model card fetching logic (lines 421-444) — relocate it to a utility that can be called from the KServe reconciliation path
- [ ] 4.7 Remove the helper function that checks if a KServe InferenceService maps to a KFMR model (the function using `INF_SVC_RM_ID_LABEL`/`INF_SVC_MV_ID_LABEL`, ~lines 249-283)
- [ ] 4.8 Remove `setupKFMR(config)` call from `innerStart` function. Replace with a catalog-only setup call that discovers the catalog route (preserving the `route.metadata.name.includes('catalog')` logic)
- [ ] 4.9 Remove `processKFMR` call sites from reconcile callbacks — simplify to call only the KServe path
- [ ] 4.10 Remove any KFMR-related `console.log` statements that reference KFMR processing
- [ ] 4.11 Update remaining imports to source shared utilities from `./types` (and catalog utilities from the new location) instead of `./Kfmr`

## 5. Delete Kfmr.ts

- [ ] 5.1 Verify all catalog code and shared utilities have been relocated (tasks 1.x and 2.x complete)
- [ ] 5.2 Delete `plugins/kserve-kubeflow-connector-backend/src/services/Kfmr.ts`
- [ ] 5.3 Verify no remaining imports reference `./Kfmr` in any file under `plugins/kserve-kubeflow-connector-backend/src/`

## 6. Add Backstage Config Fields and ConnectorConfig

- [x] 6.1 Add `kubeflow-model-catalog-url`, `default-owner`, `default-lifecycle` fields to `app-config.yaml` under `catalog.providers.modelCatalog.<id>`
- [x] 6.2 Add `ConnectorConfig` interface to `InformerService.ts` with `catalogUrl?`, `defaultOwner?`, `defaultLifecycle?`
- [x] 6.3 Update `setupInformer()` to accept optional `ConnectorConfig` parameter; config values take precedence over env vars
- [x] 6.4 Add `coreServices.rootConfig` to `plugin.ts` deps; read config from `catalog.providers.modelCatalog` and create `ConnectorConfig`
- [x] 6.5 Add `catalogUrl?: string` to `ReconcilerConfig` in `types.ts`
- [x] 6.6 Update `createCatalogClient()` in `Catalog.ts` to accept optional `catalogUrl` parameter; URL takes precedence over route ingress
- [x] 6.7 Add early return in `setupCatalogRoute()` when `catalogUrl` is configured (skip route discovery)

## 7. Annotation-Based Model Card Lookup

- [x] 7.1 Add `CATALOG_SOURCE_ANNOTATION = 'rhdh.io/catalog-source'` and `CATALOG_MODEL_ANNOTATION = 'rhdh.io/catalog-model'` to `Catalog.ts`
- [x] 7.2 Add `fetchModelCardViaAnnotations()` function to `InformerService.ts` — reads annotations from InferenceService CR, calls `createCatalogClient().getModelCard()`
- [x] 7.3 Wire `fetchModelCardViaAnnotations()` into `reconcileInferenceService` for annotated InferenceService CRs

## 8. Clean Up Dependencies

- [ ] 8.1 Check if `undici` is imported anywhere other than `Kfmr.ts` — if not, check whether the relocated catalog client (`getModelCard`) uses `undici` (via `getFromModelRegistry`). If catalog code still needs it, keep `undici`; otherwise remove from `package.json`
- [ ] 8.2 Check if `MODEL_REGISTRY_ROUTE_ENV_VAR` or `MODEL_REGISTRY_TOKEN_ENV_VAR` are referenced outside `Kfmr.ts` — if not, confirm they are gone with the file deletion
- [ ] 8.3 Remove any KFMR-related environment variable documentation or comments in `plugin.ts`, `router.ts`, or config files

## 9. Verification

- [ ] 9.1 `yarn tsc` passes with no errors
- [ ] 9.2 `yarn build:all` succeeds
- [ ] 9.3 `yarn test:all` passes (existing workspace tests)
- [ ] 9.4 `grep -rn 'loopOverKFMR\|setupKFMR\|KFMRClient\|KFMRInferenceService\|processKFMR\|KubeflowNormalizer\|kfmrClients\|kfmrRoutes\|NormalizerType' --include='*.ts' plugins/kserve-kubeflow-connector-backend/src/` returns zero results (note: `kfmrCatalogRoute` renamed to `catalogRoute`, so "kfmr" should not appear except in comments explaining the rename)
- [ ] 9.5 `PropertyKeys` is importable from `./types` and `KServe.ts` compiles correctly
- [ ] 9.6 `getModelCard()` is importable from the relocated catalog module and compiles correctly
- [ ] 9.7 `CatalogModel` type is available from `types.ts`
- [ ] 9.8 `catalogRoute` (formerly `kfmrCatalogRoute`) and `catalogUrl` are present on `ReconcilerConfig`
- [ ] 9.9 `ConnectorConfig` is exported from `InformerService.ts` and `setupInformer()` accepts it
- [ ] 9.10 Config fields `kubeflow-model-catalog-url`, `default-owner`, `default-lifecycle` are readable from `catalog.providers.modelCatalog` in `plugin.ts`
- [ ] 9.11 Annotation-based model card lookup works: InferenceService CR with `rhdh.io/catalog-source` and `rhdh.io/catalog-model` annotations triggers model card fetching
- [ ] 9.12 Connector plugin starts without errors in dev environment (KServe path exercised, no KFMR errors, catalog route/URL discovery functional)
