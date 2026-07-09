# Proposal: Remove KubeFlow Model Registry (KFMR) Client Code

## Why

The `kserve-kubeflow-connector-backend` plugin contains ~837 lines of KubeFlow Model Registry (KFMR) REST client code (`Kfmr.ts`) plus ~300 lines of KFMR-specific types and cross-references in `types.ts` and `InformerService.ts`. This code was included because the prototype was a direct golang conversion of the model-catalog-bridge, which supported both KServe and KFMR integration paths.

RHDHPLAN-404 explicitly scopes out Model Registry integration. The KFMR code increases the connector's surface area, introduces unused dependencies on KFMR REST APIs, and confuses automated reviewers and human reviewers alike — the recently merged PR #3705 received repeated fullsend review findings about KFMR code quality issues that were all deferred because the code is being removed.

Removing KFMR code now reduces the connector to its intended scope: KServe API (K8s Informer on `InferenceService` CRs) and KubeFlow Model Catalog API (REST client for `CatalogSource`, `CatalogModel`/`ModelCard`). This is Design Decision 4 from the parent `transition-oai-connector-to-kserve-plugin` openspec.

## Starting Point

The connector plugin was merged in PR #3705 on branch `kserve-kubeflow-connector` with the full KFMR code intact. The current state of the affected files:

- `Kfmr.ts` (837 lines) — full KFMR REST client, route setup, model registry data fetching, `callBackstagePrinters` for KFMR normalizer, `loopOverKFMR`, `getKubeFlowInferenceServicesForModelVersion`. Also contains shared utilities (`PropertyKeys`, `NormalizerFormat`, `getStringPropVal`, `getTagsFromCustomProps`, `sanitizeName`) that are used by `KServe.ts`
- `types.ts` (425 lines) — contains KFMR-specific interfaces (`KFMRClient`, `KFMRInferenceService`, `InferenceServiceList`, `LoopOverKFMRResult`) and KFMR fields on `ReconcilerConfig` (`kfmrClients`, `kfmrRoutes`, `kfmrCatalogRoute`)
- `InformerService.ts` (1406 lines) — imports and calls KFMR functions (`setupKFMR`, `loopOverKFMR`, `callBackstagePrinters`, `getKubeFlowInferenceServicesForModelVersion`), contains `processKFMR` function (~180 lines), KFMR label constants, `KubeflowNormalizer` enum value
- `KServe.ts` (311 lines) — imports `PropertyKeys` from `Kfmr.ts` (must be relocated)

## What Changes

- **Delete `Kfmr.ts`**: Remove the entire KFMR REST client module
- **Relocate shared utilities**: Move `PropertyKeys`, `NormalizerFormat`, `getTagsFromCustomProps`, `sanitizeName`, `sanitizeModelVersion`, and re-exported model types (`ModelCatalog`, `Model`, `ModelServer`, `API`, `APIType`) from `Kfmr.ts` to `types.ts` or a new shared constants module
- **Clean `types.ts`**: Remove `KFMRClient`, `KFMRInferenceService`, `InferenceServiceList`, `LoopOverKFMRResult`, and KFMR fields from `ReconcilerConfig`
- **Clean `InformerService.ts`**: Remove `processKFMR` function, KFMR imports, KFMR label constants (`INF_SVC_RM_ID_LABEL`, `INF_SVC_MV_ID_LABEL`), `KubeflowNormalizer` enum value, and all KFMR cross-reference logic in the reconcile callbacks
- **Update `KServe.ts` import**: Change `import { PropertyKeys } from './Kfmr'` to import from the new location

## Capabilities

### Removed Capabilities

- `kfmr-rest-client`: KFMR REST client for Model Registry APIs (route setup, registered model listing, model version/artifact fetching, inference service listing, serving environment lookup, catalog model/model card retrieval)
- `kfmr-reconciliation`: KFMR-specific reconciliation logic in InformerService that maps KServe InferenceServices to KFMR registered models via label matching

### Modified Capabilities

- `kserve-reconciliation`: InformerService reconciliation simplified — KServe-only path remains, KFMR cross-referencing removed
- `shared-utilities`: `PropertyKeys`, `NormalizerFormat`, model types relocated from `Kfmr.ts` to shared module

## Non-goals

- Removing KubeFlow Model Catalog API support (this is in-scope for RHDHPLAN-404 and stays)
- Refactoring InformerService beyond KFMR removal (e.g., console.log → LoggerService migration is a separate task)
- Adding unit tests for InformerService (separate Jira)
- Changing the connector's REST API surface (routes remain the same)

## Canonical Touchpoints

- **Parent openspec**: `openspec/changes/transition-oai-connector-to-kserve-plugin/` — Design Decision 4
- **Jira**: [RHIDP-15200](https://redhat.atlassian.net/browse/RHIDP-15200)
- **Plan**: RHDHPLAN-404

**Change type**: refactor

## Impact

- `plugins/kserve-kubeflow-connector-backend/src/services/Kfmr.ts` — deleted
- `plugins/kserve-kubeflow-connector-backend/src/services/types.ts` — KFMR types removed, shared utilities added
- `plugins/kserve-kubeflow-connector-backend/src/services/InformerService.ts` — ~200+ lines of KFMR logic removed
- `plugins/kserve-kubeflow-connector-backend/src/services/KServe.ts` — import path updated
- Net reduction: ~1000+ lines removed
