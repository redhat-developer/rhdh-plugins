# Design: Remove KubeFlow Model Registry (KFMR) Client Code

## Canonical Touchpoints

- Parent design: `openspec/changes/transition-oai-connector-to-kserve-plugin/design.md` — Decision 4
- Jira: [RHIDP-15200](https://redhat.atlassian.net/browse/RHIDP-15200)

## Context

The `kserve-kubeflow-connector-backend` plugin was ported from a golang model-catalog-bridge that supported two data paths:

1. **KServe path** — K8s Informer watches `InferenceService` CRs, `KServe.ts` converts them to `ModelCatalog` JSON
2. **KFMR path** — REST client calls KubeFlow Model Registry APIs to fetch `RegisteredModel`, `ModelVersion`, `ModelArtifact`, and `KFMRInferenceService` data, `Kfmr.ts` converts them to `ModelCatalog` JSON
3. **Model Catalog path** — REST client calls KubeFlow Model Catalog APIs (`/api/model_catalog/v1alpha1`) to fetch `CatalogModel`/model card data; currently embedded in `Kfmr.ts` and invoked from `processKFMR`

RHDHPLAN-404 scopes in KServe + KubeFlow Model Catalog. Only the **KFMR (Model Registry) path** must be removed. The **Model Catalog path** must be preserved — it will be enhanced in later Jiras to support inference-service-driven catalog lookup and full catalog polling.

The complication is that `Kfmr.ts` contains three categories of code that must be handled differently:

1. **KFMR-only code** (delete) — registry route setup, `listRegisteredModels`, `listInferenceServices`, `listModelVersions`, `listModelArtifacts`, `getServingEnvironment`, `getModelVersion`, `loopOverKFMR`, KFMR-specific `callBackstagePrinters`/`generateModelCatalog`
2. **Model Catalog code** (preserve/relocate) — catalog route discovery (`kfmrCatalogRoute`), `rootCatalogURL` construction, `getModelCard()`, `KFMR_CATALOG_BASE_URI`, `GET_CATALOG_MODEL_URI`, `CatalogModel` type
3. **Shared utilities** (relocate or delete) — `PropertyKeys`, `NormalizerFormat`, `getTagsFromCustomProps`, `getStringPropVal`, `sanitizeName`, `sanitizeModelVersion`, re-exported model types. `NormalizerFormat` was **retained** in `types.ts` (defines data formats still used by KServe). `NormalizerType` enum was **deleted** (only KServe normalizer remains)

### Current dependency graph

```
InformerService.ts
  ├── imports from Kfmr.ts: setupKFMR, loopOverKFMR, callBackstagePrinters,
  │    getKubeFlowInferenceServicesForModelVersion, sanitizeName (as kfmrSanitizeName),
  │    KFMRClient, KFMRInferenceService
  ├── imports from KServe.ts: callBackstagePrinters (as callKServeBackstagePrinters)
  └── imports from types.ts: ReconcilerConfig, InferenceService, etc.

KServe.ts
  └── imports from Kfmr.ts: PropertyKeys

Kfmr.ts
  └── imports from types.ts: ReconcilerConfig, Route, RegisteredModel, etc.
  └── re-exports: ModelCatalog, Model, ModelServer, API, APIType (from types.ts)
```

### Target dependency graph (after removal)

```
plugin.ts
  └── reads catalog.providers.modelCatalog config → ConnectorConfig
  └── passes ConnectorConfig to setupInformer()

InformerService.ts
  ├── imports from KServe.ts: callBackstagePrinters
  ├── imports from types.ts: ReconcilerConfig, InferenceService, PropertyKeys,
  │    sanitizeName, CatalogModel, etc.
  ├── imports from Catalog.ts: setupCatalogRoute, createCatalogClient,
  │    CATALOG_SOURCE_ANNOTATION, CATALOG_MODEL_ANNOTATION
  └── exports ConnectorConfig interface

KServe.ts
  └── imports from types.ts: PropertyKeys, getStringPropVal, getTagsFromCustomProps, etc.

Catalog.ts (new)
  └── catalog route discovery, createCatalogClient(), fetchModelCard(),
      CATALOG_BASE_URI, GET_CATALOG_MODEL_URI,
      CATALOG_SOURCE_ANNOTATION, CATALOG_MODEL_ANNOTATION

(Kfmr.ts — deleted)
```

## Goals / Non-Goals

**Goals:**

- Delete `Kfmr.ts` after relocating catalog and shared code
- Remove all KFMR-specific (Model Registry) types from `types.ts`
- Remove KFMR-only logic from `InformerService.ts` (registry imports, KFMR label constants, `KubeflowNormalizer`, registry reconciliation in `processKFMR`)
- Delete `NormalizerType` enum and `normalizerType` field entirely — only KServe normalizer remains, so the enum is unnecessary
- Relocate shared utilities so `KServe.ts` and `InformerService.ts` continue to compile
- Relocate Model Catalog code (catalog route discovery, `getModelCard()`, `CatalogModel`) so it remains functional
- Remove KFMR-only fields from `ReconcilerConfig` (`kfmrClients`, `kfmrRoutes`); rename `kfmrCatalogRoute` to `catalogRoute`; add `catalogUrl` for config-based catalog URL
- Wire up annotation-based model card lookup (`CATALOG_SOURCE_ANNOTATION`, `CATALOG_MODEL_ANNOTATION`) on InferenceService CRs
- Add Backstage config fields (`kubeflow-model-catalog-url`, `default-owner`, `default-lifecycle`) with `ConnectorConfig` interface
- Maintain all KServe + KubeFlow Model Catalog functionality unchanged
- `yarn build:all`, `yarn tsc`, and existing tests pass after removal

**Non-Goals:**

- Refactoring InformerService beyond KFMR removal (console.log migration, concurrency patterns — separate tasks)
- Adding new unit tests (separate Jira)
- Changing the connector's REST API routes
- Removing KubeFlow Model Catalog API support (that stays)

## Decisions

### D1 — Relocate shared utilities to `types.ts`; delete `NormalizerType`

**Choice:** Move `PropertyKeys`, `getTagsFromCustomProps`, `getStringPropVal`, `sanitizeName`, `sanitizeModelVersion`, and the model type re-exports (`ModelCatalog`, `Model`, `ModelServer`, `API`, `APIType`) from `Kfmr.ts` into `types.ts`. **Retain** `NormalizerFormat` in `types.ts` (defines data formats still used by KServe). **Delete** `NormalizerType` entirely — with only the KServe normalizer remaining, the enum that distinguished normalizer types adds no value.

**Rationale:** `types.ts` already serves as the shared type/constant module for the connector. With Kfmr.ts gone, it becomes the natural home. `NormalizerFormat` stays because it defines the output format (JSON array vs catalog-info YAML). `NormalizerType` (which distinguished KServe vs KFMR normalizers) is deleted because only one normalizer exists — the `normalizerType` field is removed from `ModelCatalogMetadata` and from `processModelCatalog`'s parameters.

**Alternative considered:** Create a new `shared.ts` or `constants.ts`. Rejected because `types.ts` already plays this role and the additional file adds no benefit for this amount of code.

### D2 — Remove KFMR-only reconciliation from `processKFMR`; preserve and enhance model card fetching

**Choice:** Remove the KFMR-specific parts of `processKFMR`: registered model listing, model version matching, KFMR inference service correlation, and KFMR-specific `callBackstagePrinters` calls. Remove KFMR label constants (`INF_SVC_RM_ID_LABEL`, `INF_SVC_MV_ID_LABEL`), the `KubeflowNormalizer` enum value, the `NormalizerType` enum, and the `ProcessKFMRResult` interface. **Preserve** the model card fetching logic and **enhance** it with annotation-based lookup: InferenceService CRs carrying `rhdh.io/catalog-source` and `rhdh.io/catalog-model` annotations trigger model card retrieval from the Model Catalog API during KServe reconciliation via `fetchModelCardViaAnnotations()`.

**Rationale:** Without the KFMR client, the registry-specific logic (registered model listing, label matching, KFMR inference service correlation) has nothing to call. However, the model card fetching via `getModelCard()` calls the separate Model Catalog API (`/api/model_catalog/v1alpha1`) and is valuable for enriching KServe InferenceService entities with catalog metadata. The annotation-based lookup implements the first phase of "inference-service-driven catalog lookup" (formerly in Future Work) — InferenceService CRs annotated with catalog source/model identifiers automatically get their model card fetched and populated on the resulting entity.

### D3 — Simplify `ReconcilerConfig`; keep catalog route; add `catalogUrl`

**Choice:** Remove `kfmrClients` and `kfmrRoutes` fields from the `ReconcilerConfig` interface. **Rename** `kfmrCatalogRoute` to `catalogRoute` — this field stores the discovered OpenShift route for the Model Catalog service. **Add** `catalogUrl?: string` — a direct catalog URL from Backstage config that takes precedence over route-based discovery. Remove `KFMRClient` interface; extract a smaller `CatalogClient` interface that retains only `rootCatalogURL` and `getModelCard()`. `createCatalogClient()` accepts both a `Route` and an optional `catalogUrl`, preferring the URL when set.

**Rationale:** `kfmrClients` and `kfmrRoutes` are only populated by `setupKFMR` for registry routes and consumed by `processKFMR` for registry operations — both being deleted. However, `kfmrCatalogRoute` stores the catalog service route discovered during setup; this is needed for the Model Catalog API and is renamed to remove the misleading "kfmr" prefix. The `catalogUrl` field enables environments where the catalog is accessed via a known URL (e.g., from Backstage config) rather than through OpenShift route discovery, which requires the route API and may not be available in all clusters.

### D4 — Remove the `tlsSkipAgent` and KFMR-specific `undici` import

**Choice:** Remove the TLS-skipping `Agent` from `Kfmr.ts`. If `undici` is not used elsewhere in the connector, remove it from `package.json` dependencies.

**Rationale:** The TLS skip agent was only used by the KFMR REST client's `getFromModelRegistry` function. With that function deleted, the agent and import are unused. This also resolves the recurring fullsend review finding about disabled TLS verification.

### D5 — Remove `@ts-ignore` suppressed unused constants

**Choice:** The URI constants (`GET_REG_MODEL_URI`, `LIST_VERSIONS_OFF_REG_MODELS_URI`, etc.) that were annotated with `@ts-ignore` because they were defined but unused are deleted with `Kfmr.ts`. No need to move them.

**Rationale:** These were ported from golang but never wired into the TypeScript client. Their deletion resolves another recurring fullsend review finding.

### D6 — Preserve and relocate Model Catalog code from `Kfmr.ts`

**Choice:** Extract the Model Catalog client code from `Kfmr.ts` into a dedicated module (e.g., `Catalog.ts`) or inline it into `types.ts`. This includes:

- `KFMR_CATALOG_BASE_URI` (renamed to `CATALOG_BASE_URI`)
- `GET_CATALOG_MODEL_URI`
- Catalog route discovery logic (the `route.metadata.name.includes('catalog')` branch in `setupKFMR`)
- `rootCatalogURL` construction from catalog route ingress
- `getModelCard()` function
- `CatalogModel` interface (already in `types.ts`)

**Rationale:** The Model Catalog API (`/api/model_catalog/v1alpha1`) is a separate KubeFlow service from the Model Registry. The current code in `Kfmr.ts` that discovers the catalog route and calls `getModelCard()` is catalog integration, not registry integration. Deleting it with the registry code would remove Model Catalog support, which is explicitly in-scope for RHDHPLAN-404. Relocating it allows future Jiras to enhance catalog integration (inference-service-driven lookup, full catalog polling) without reimplementing route discovery and model card fetching from scratch.

**Alternative considered:** Delete all catalog code now and reimplement later. Rejected because the catalog route discovery and model card fetching are already working and tested; deleting and reimplementing would be unnecessary churn.

### D7 — Add Backstage config fields for connector settings

**Choice:** Add three config fields under `catalog.providers.modelCatalog.<id>` in `app-config.yaml`: `kubeflow-model-catalog-url` (string, optional), `default-owner` (string, optional, fallback to env `OWNER` then `"default-owner"`), `default-lifecycle` (string, optional, fallback to env `LIFECYCLE` then `"production"`). Introduce a `ConnectorConfig` interface in `InformerService.ts` and update `setupInformer()` to accept it. Read config in `plugin.ts` via `coreServices.rootConfig`, pattern after the entity provider's config reading.

**Rationale:** The connector previously relied entirely on environment variables (`OWNER`, `LIFECYCLE`, `KUBEFLOW_MODEL_CATALOG_URL`) for configuration. Moving these to Backstage config aligns with Backstage conventions, makes configuration discoverable via `app-config.yaml`, and allows per-provider config when multiple connectors are deployed. Config values take precedence over env vars; env vars remain as fallback for backward compatibility.

### D8 — Annotation-based model card lookup from InferenceService CRs

**Choice:** Add `CATALOG_SOURCE_ANNOTATION = 'rhdh.io/catalog-source'` and `CATALOG_MODEL_ANNOTATION = 'rhdh.io/catalog-model'` to `Catalog.ts`. Add `fetchModelCardViaAnnotations()` in `InformerService.ts` that reads these annotations from an InferenceService CR and calls `createCatalogClient().getModelCard()` to retrieve the model card. Wire this into `reconcileInferenceService` so annotated InferenceServices automatically get their model card populated.

**Rationale:** This implements the first phase of "inference-service-driven catalog lookup" — previously listed as Future Work. With KFMR removed, the model card fetching must be driven by metadata on the InferenceService CR itself rather than by KFMR's cross-referencing. Annotations are the standard Kubernetes mechanism for attaching external metadata, and the `rhdh.io/` prefix establishes a clear namespace for RHDH-specific annotations.

## Risks / Trade-offs

| Risk                                                                   | Mitigation                                                                                                                                                    |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared utilities relocated incorrectly, breaking KServe path           | Run `yarn tsc` and `yarn build:all` after relocation, before any KFMR deletion                                                                                |
| Catalog code accidentally deleted with registry code                   | Catalog code (route discovery, `getModelCard()`, `CatalogModel`) is explicitly tracked and relocated first; verify catalog API calls compile after relocation |
| Model card fetching broken after `processKFMR` removal                 | Model card fetching logic is extracted and re-wired to be callable from the KServe reconciliation path; verify `getModelCard()` remains functional            |
| `InformerService.ts` reconcile callbacks have subtle KFMR dependencies | Trace every `processKFMR` call site and verify the KServe-only path produces the same entity output for KServe-only InferenceServices                         |
| `undici` removal breaks catalog client                                 | Check if `getModelCard()` / catalog fetch uses `undici` — if so, `undici` must stay until catalog client is refactored to use a different HTTP client         |

## Verification

After all changes:

1. `yarn tsc` passes with no errors
2. `yarn build:all` succeeds
3. `yarn test:all` passes (existing tests in the workspace)
4. No remaining imports or references to `Kfmr` in any `.ts` file under `plugins/kserve-kubeflow-connector-backend/src/`
5. No remaining references to `KFMRClient`, `kfmrClients`, `kfmrRoutes`, `setupKFMR`, `loopOverKFMR`, `processKFMR`, `KubeflowNormalizer`, or `NormalizerType`
6. `PropertyKeys` is importable from `types.ts` and `KServe.ts` compiles using the new import
7. `getModelCard()` is callable from the relocated catalog module and the `CatalogModel` type is available from `types.ts`
8. `catalogRoute` (renamed from `kfmrCatalogRoute`) and `catalogUrl` are present on `ReconcilerConfig`
9. `ConnectorConfig` is exported from `InformerService.ts` and accepted by `setupInformer()`
10. Config fields `kubeflow-model-catalog-url`, `default-owner`, `default-lifecycle` are read from `catalog.providers.modelCatalog` in `plugin.ts`
11. Annotation-based model card lookup works: an InferenceService CR with `rhdh.io/catalog-source` and `rhdh.io/catalog-model` annotations triggers model card fetching

## Future Work (Deferred to Later Jiras)

The Model Catalog integration preserved and enhanced in this change is a foundation for further work under RHDHPLAN-404:

1. **Inference-service-driven catalog lookup** _(partially implemented)_: The annotation-based lookup via `rhdh.io/catalog-source` and `rhdh.io/catalog-model` (D8) implements the first phase — model cards are fetched for annotated InferenceService CRs. Future work may extend this to additional catalog metadata beyond model cards, or add label-based lookup as an alternative to annotations.

2. **Full catalog polling via REST API**: Poll all Model Catalog `CatalogSource` entries via the REST API and match them to discovered KServe InferenceServices. This enables bidirectional discovery — models known to the catalog can be correlated with running inference services even when the InferenceService doesn't carry catalog metadata. This will require additional catalog API methods (e.g., `listCatalogSources`).

Both approaches build on the catalog route discovery (`catalogRoute` on `ReconcilerConfig`), the config-based `catalogUrl` alternative, and the `createCatalogClient()`/`getModelCard()` infrastructure preserved in this change.
