# Tasks: Remove KubeFlow Model Registry (KFMR) Client Code

## 1. Relocate Shared Utilities from Kfmr.ts

- [ ] 1.1 Move `PropertyKeys` constant object from `Kfmr.ts` to `types.ts`
- [ ] 1.2 Move `NormalizerFormat` enum from `Kfmr.ts` to `types.ts`
- [ ] 1.3 Move `getTagsFromCustomProps` function from `Kfmr.ts` to `types.ts`
- [ ] 1.4 Move `getStringPropVal` function from `Kfmr.ts` to `types.ts`
- [ ] 1.5 Move `sanitizeName` and `sanitizeModelVersion` functions from `Kfmr.ts` to `types.ts`
- [ ] 1.6 Ensure `ModelCatalog`, `Model`, `ModelServer`, `API`, `APIType` are exported from `types.ts` (they are currently re-exported via `Kfmr.ts`)
- [ ] 1.7 Update `KServe.ts` to import `PropertyKeys` from `./types` instead of `./Kfmr`
- [ ] 1.8 Verify `yarn tsc` passes after relocation (before any deletions)

## 2. Remove KFMR Types from types.ts

- [ ] 2.1 Remove `KFMRClient` interface
- [ ] 2.2 Remove `KFMRInferenceService` interface and `InferenceServiceList` interface
- [ ] 2.3 Remove `LoopOverKFMRResult` interface
- [ ] 2.4 Remove `kfmrClients`, `kfmrRoutes`, and `kfmrCatalogRoute` fields from `ReconcilerConfig` interface
- [ ] 2.5 Remove any KFMR-specific enums (`RegisteredModelState`, `ModelVersionState`, `InferenceServiceState`) if they are not used by KServe path — verify before deleting
- [ ] 2.6 Remove KFMR-specific model interfaces (`RegisteredModel`, `RegisteredModelList`, `ModelVersion`, `ModelVersionList`, `ModelArtifact`, `ModelArtifactList`, `ServingEnvironment`, `CatalogModel`) if not used by KServe path — verify before deleting
- [ ] 2.7 Clean up the `types.ts` header comment (currently references "avoid circular dependencies between InformerService.ts and Kfmr.ts")

## 3. Remove KFMR Logic from InformerService.ts

- [ ] 3.1 Remove all imports from `./Kfmr` (`setupKFMR`, `loopOverKFMR`, `callBackstagePrinters`, `getKubeFlowInferenceServicesForModelVersion`, `sanitizeName as kfmrSanitizeName`)
- [ ] 3.2 Remove KFMR type imports (`KFMRClient`, `KFMRInferenceService`)
- [ ] 3.3 Remove KFMR label constants (`INF_SVC_RM_ID_LABEL`, `INF_SVC_MV_ID_LABEL`, commented `INF_SVC_INF_SVC_ID_LABEL`)
- [ ] 3.4 Remove `KubeflowNormalizer` value from `NormalizerType` enum (keep `KServeNormalizer` only)
- [ ] 3.5 Remove `ProcessKFMRResult` interface
- [ ] 3.6 Delete the `processKFMR` function entirely (~lines 285-465)
- [ ] 3.7 Remove the helper function that checks if a KServe InferenceService maps to a KFMR model (the function using `INF_SVC_RM_ID_LABEL`/`INF_SVC_MV_ID_LABEL`, ~lines 249-283)
- [ ] 3.8 Remove `setupKFMR(config)` call from `innerStart` function
- [ ] 3.9 Remove `processKFMR` call sites from reconcile callbacks — simplify to call only the KServe path
- [ ] 3.10 Remove any KFMR-related `console.log` statements that reference KFMR processing
- [ ] 3.11 Update remaining imports to source shared utilities from `./types` instead of `./Kfmr`

## 4. Delete Kfmr.ts

- [ ] 4.1 Delete `plugins/kserve-kubeflow-connector-backend/src/services/Kfmr.ts`
- [ ] 4.2 Verify no remaining imports reference `./Kfmr` in any file under `kserve-kubeflow-connector-backend/src/`

## 5. Clean Up Dependencies

- [ ] 5.1 Check if `undici` is imported anywhere other than `Kfmr.ts` — if not, remove from `package.json` dependencies
- [ ] 5.2 Check if `MODEL_REGISTRY_ROUTE_ENV_VAR` or `MODEL_REGISTRY_TOKEN_ENV_VAR` are referenced outside `Kfmr.ts` — if not, confirm they are gone with the file deletion
- [ ] 5.3 Remove any KFMR-related environment variable documentation or comments in `plugin.ts`, `router.ts`, or config files

## 6. Verification

- [ ] 6.1 `yarn tsc` passes with no errors
- [ ] 6.2 `yarn build:all` succeeds
- [ ] 6.3 `yarn test:all` passes (existing workspace tests)
- [ ] 6.4 `grep -rn 'Kfmr\|kfmr\|KFMR\|loopOverKFMR\|setupKFMR\|KFMRClient\|KFMRInferenceService\|processKFMR\|KubeflowNormalizer' --include='*.ts' kserve-kubeflow-connector-backend/src/` returns zero results
- [ ] 6.5 `PropertyKeys` is importable from `./types` and `KServe.ts` compiles correctly
- [ ] 6.6 Connector plugin starts without errors in dev environment (KServe path exercised, no KFMR errors)
