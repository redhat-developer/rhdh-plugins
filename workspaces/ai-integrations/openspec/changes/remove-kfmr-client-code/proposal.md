# Proposal: Remove KubeFlow Model Registry (KFMR) Client Code

## Why

The `kserve-kubeflow-connector-backend` plugin contains ~837 lines of KubeFlow Model Registry (KFMR) REST client code (`Kfmr.ts`) plus ~300 lines of KFMR-specific types and cross-references in `types.ts` and `InformerService.ts`. This code was included because the prototype was a direct golang conversion of the model-catalog-bridge, which supported both KServe and KFMR integration paths.

RHDHPLAN-404 explicitly scopes out Model Registry integration. The KFMR code increases the connector's surface area, introduces unused dependencies on KFMR REST APIs, and confuses automated reviewers and human reviewers alike — the recently merged PR #3705 received repeated fullsend review findings about KFMR code quality issues that were all deferred because the code is being removed.

Removing KFMR code now reduces the connector to its intended scope: KServe API (K8s Informer on `InferenceService` CRs) and KubeFlow Model Catalog API (REST client for `CatalogSource`, `CatalogModel`/`ModelCard`). This is Design Decision 4 from the parent `transition-oai-connector-to-kserve-plugin` openspec.

## Starting Point

The connector plugin was merged in PR #3705 on branch `kserve-kubeflow-connector` with the full KFMR code intact. The current state of the affected files:

- `Kfmr.ts` (837 lines) — full KFMR REST client, route setup, model registry data fetching, `callBackstagePrinters` for KFMR normalizer, `loopOverKFMR`, `getKubeFlowInferenceServicesForModelVersion`. Also contains shared utilities (`PropertyKeys`, `NormalizerFormat`, `getStringPropVal`, `getTagsFromCustomProps`, `sanitizeName`) that are used by `KServe.ts`
- `types.ts` (425 lines) — contains KFMR-specific interfaces (`KFMRClient`, `KFMRInferenceService`, `InferenceServiceList`, `LoopOverKFMRResult`) and KFMR fields on `ReconcilerConfig` (`kfmrClients`, `kfmrRoutes`, `kfmrCatalogRoute`)
- `InformerService.ts` (1406 lines) — imports and calls KFMR functions (`setupKFMR`, `loopOverKFMR`, `callBackstagePrinters`, `getKubeFlowInferenceServicesForModelVersion`), contains `processKFMR` function (~340 lines, lines 287-625), KFMR label constants, `KubeflowNormalizer` enum value
- `KServe.ts` (311 lines) — imports `PropertyKeys` from `Kfmr.ts` (must be relocated)

## What Changes

- **Delete KFMR-only code from `Kfmr.ts`**: Remove the Model Registry REST client (`setupKFMR` registry route handling, `listRegisteredModels`, `listInferenceServices`, `listModelVersions`, `listModelArtifacts`, `getServingEnvironment`, `getModelVersion`), the `loopOverKFMR` function, and the KFMR-specific `callBackstagePrinters`/`generateModelCatalog` functions
- **Preserve and relocate Model Catalog code**: The catalog route discovery (`kfmrCatalogRoute`), `rootCatalogURL` construction, `getModelCard()` method, `KFMR_CATALOG_BASE_URI`, and `GET_CATALOG_MODEL_URI` currently live in `Kfmr.ts` but belong to the **Model Catalog API**, not the Model Registry. These must be relocated (to `types.ts` or a new `Catalog.ts` module), not deleted
- **Relocate shared utilities**: Move `PropertyKeys`, `getTagsFromCustomProps`, `sanitizeName`, `sanitizeModelVersion`, and re-exported model types (`ModelCatalog`, `Model`, `ModelServer`, `API`, `APIType`) from `Kfmr.ts` to `types.ts`. **Delete** `NormalizerType` enum entirely (only KServe normalizer remains). `NormalizerFormat` stays in `types.ts` as it defines data formats still used by KServe
- **Clean `types.ts`**: Remove KFMR-only types (`KFMRInferenceService`, `InferenceServiceList`, `LoopOverKFMRResult`) and KFMR-only fields from `ReconcilerConfig` (`kfmrClients`, `kfmrRoutes`). **Keep** `CatalogModel`, `kfmrCatalogRoute` (rename to `catalogRoute`), and the `getModelCard`/`rootCatalogURL` signature (relocate to a catalog-focused interface). **Add** `catalogUrl?: string` to `ReconcilerConfig` for config-based catalog URL
- **Clean `InformerService.ts`**: Remove KFMR-specific reconciliation (`processKFMR` registry matching logic, KFMR label constants, `KubeflowNormalizer` enum value, `NormalizerType` enum). **Preserve** the model card fetching logic by relocating it to a catalog utility. **Add** annotation-based model card lookup (`rhdh.io/catalog-source`, `rhdh.io/catalog-model` annotations on InferenceService CRs) and `ConnectorConfig` interface for Backstage config integration
- **Update `plugin.ts`**: Add `coreServices.rootConfig` dependency, read `catalog.providers.modelCatalog` config to create `ConnectorConfig`, pass to `setupInformer()`
- **Update `app-config.yaml`**: Add `kubeflow-model-catalog-url`, `default-owner`, `default-lifecycle` config fields under `catalog.providers.modelCatalog.<id>`
- **Delete `Kfmr.ts`**: After all catalog and shared code has been relocated, the remainder of `Kfmr.ts` (now purely registry code) can be deleted
- **Update `KServe.ts` import**: Change `import { PropertyKeys } from './Kfmr'` to import from the new location

## Capabilities

### Removed Capabilities

- `kfmr-rest-client`: KFMR REST client for Model Registry APIs (route setup, registered model listing, model version/artifact fetching, inference service listing, serving environment lookup)
- `kfmr-reconciliation`: KFMR-specific reconciliation logic in InformerService that maps KServe InferenceServices to KFMR registered models via label matching
- `kfmr-normalizer`: The `KubeflowNormalizer` enum value and KFMR-specific `callBackstagePrinters`/`generateModelCatalog` functions

### Preserved Capabilities

- `model-catalog-client`: KubeFlow Model Catalog API support — catalog route discovery, `createCatalogClient()`, `fetchModelCard()` for fetching model cards from the Catalog API (`/api/model_catalog/v1alpha1`), `CatalogModel` type, catalog-related `PropertyKeys` entries, annotation constants (`CATALOG_SOURCE_ANNOTATION`, `CATALOG_MODEL_ANNOTATION`). This code is relocated from `Kfmr.ts` to `Catalog.ts`
- `catalog-route-config`: `catalogRoute` on `ReconcilerConfig` (renamed from `kfmrCatalogRoute`) — stores the discovered OpenShift route for the Model Catalog service. `catalogUrl` added as config-based alternative
- `annotation-catalog-lookup`: InferenceService CRs annotated with `rhdh.io/catalog-source` and `rhdh.io/catalog-model` trigger model card fetching from the Model Catalog API via `fetchModelCardViaAnnotations()`
- `connector-config`: `ConnectorConfig` interface and Backstage config reading in `plugin.ts` — `kubeflow-model-catalog-url`, `default-owner`, `default-lifecycle` fields under `catalog.providers.modelCatalog`

### Modified Capabilities

- `kserve-reconciliation`: InformerService reconciliation simplified — KServe-only path remains, KFMR cross-referencing removed. Model card fetching via Model Catalog API is preserved and can be called from the KServe path
- `shared-utilities`: `PropertyKeys`, model types relocated from `Kfmr.ts` to `types.ts`. `NormalizerType` deleted entirely (only KServe normalizer remains). `NormalizerFormat` retained in `types.ts`

## Non-goals

- Removing KubeFlow Model Catalog API support — Model Catalog integration is in-scope for RHDHPLAN-404 and stays. Catalog route discovery, `getModelCard()`, `CatalogModel`, and catalog-related `PropertyKeys` are preserved
- Refactoring InformerService beyond KFMR removal (e.g., console.log → LoggerService migration is a separate task)
- Adding unit tests for InformerService (separate Jira)
- Changing the connector's REST API surface (routes remain the same)
- Enhancing Model Catalog integration (deferred to later Jiras — see Future Work)

## Future Work

In later RHDHPLAN-404 Jiras, the Model Catalog integration will be enhanced beyond its current form:

1. **Inference-service-driven catalog lookup** _(partially implemented)_: Annotation-based lookup via `rhdh.io/catalog-source` and `rhdh.io/catalog-model` is now implemented. Future work may extend this to additional catalog metadata beyond model cards, or add label-based lookup as an alternative to annotations
2. **Full catalog polling**: Use the Model Catalog REST API to poll all `CatalogSource` entries and match them to KServe InferenceServices, enabling discovery of catalog metadata even when InferenceServices don't carry catalog references

These enhancements build on the catalog route discovery, config-based `catalogUrl`, and `createCatalogClient()`/`getModelCard()` infrastructure preserved in this change.

## Canonical Touchpoints

- **Parent openspec**: `openspec/changes/transition-oai-connector-to-kserve-plugin/` — Design Decision 4
- **Jira**: [RHIDP-15200](https://redhat.atlassian.net/browse/RHIDP-15200)
- **Plan**: RHDHPLAN-404

**Change type**: refactor

## Impact

- `plugins/kserve-kubeflow-connector-backend/src/services/Kfmr.ts` — deleted (after catalog code relocated)
- `plugins/kserve-kubeflow-connector-backend/src/services/types.ts` — KFMR-only types removed, shared utilities added, `kfmrCatalogRoute` renamed to `catalogRoute`, `catalogUrl` added, `NormalizerType` deleted
- `plugins/kserve-kubeflow-connector-backend/src/services/InformerService.ts` — ~150+ lines of KFMR-only logic removed, model card fetching logic preserved, annotation-based lookup added (`fetchModelCardViaAnnotations`), `ConnectorConfig` interface added, `setupInformer` updated to accept config
- `plugins/kserve-kubeflow-connector-backend/src/services/KServe.ts` — import path updated
- `plugins/kserve-kubeflow-connector-backend/src/plugin.ts` — `coreServices.rootConfig` added, config reading for `ConnectorConfig`
- `app-config.yaml` — new config fields: `kubeflow-model-catalog-url`, `default-owner`, `default-lifecycle`
- New: `Catalog.ts` module containing `createCatalogClient()`, `fetchModelCard()`, `setupCatalogRoute()`, annotation constants, catalog route setup
- Net reduction: ~700+ lines removed (less than original estimate because catalog code is preserved and new features added)
