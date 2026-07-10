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
3. **Shared utilities** (relocate) — `PropertyKeys`, `NormalizerFormat`, `getTagsFromCustomProps`, `getStringPropVal`, `sanitizeName`, `sanitizeModelVersion`, re-exported model types

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
InformerService.ts
  ├── imports from KServe.ts: callBackstagePrinters
  ├── imports from types.ts: ReconcilerConfig, InferenceService, PropertyKeys,
  │    NormalizerFormat, sanitizeName, CatalogModel, etc.
  └── imports from Catalog.ts (or types.ts): getModelCard, setupCatalogRoute

KServe.ts
  └── imports from types.ts: PropertyKeys, getStringPropVal, getTagsFromCustomProps, etc.

Catalog.ts (new, or inlined into types.ts)
  └── catalog route discovery, getModelCard(), CATALOG_BASE_URI, GET_CATALOG_MODEL_URI

(Kfmr.ts — deleted)
```

## Goals / Non-Goals

**Goals:**

- Delete `Kfmr.ts` after relocating catalog and shared code
- Remove all KFMR-specific (Model Registry) types from `types.ts`
- Remove KFMR-only logic from `InformerService.ts` (registry imports, KFMR label constants, `KubeflowNormalizer`, registry reconciliation in `processKFMR`)
- Relocate shared utilities so `KServe.ts` and `InformerService.ts` continue to compile
- Relocate Model Catalog code (catalog route discovery, `getModelCard()`, `CatalogModel`) so it remains functional
- Remove KFMR-only fields from `ReconcilerConfig` (`kfmrClients`, `kfmrRoutes`); rename `kfmrCatalogRoute` to `catalogRoute`
- Maintain all KServe + KubeFlow Model Catalog functionality unchanged
- `yarn build:all`, `yarn tsc`, and existing tests pass after removal

**Non-Goals:**

- Refactoring InformerService beyond KFMR removal (console.log migration, concurrency patterns — separate tasks)
- Adding new unit tests (separate Jira)
- Changing the connector's REST API routes
- Removing KubeFlow Model Catalog API support (that stays)

## Decisions

### D1 — Relocate shared utilities to `types.ts`

**Choice:** Move `PropertyKeys`, `NormalizerFormat`, `getTagsFromCustomProps`, `getStringPropVal`, `sanitizeName`, `sanitizeModelVersion`, and the model type re-exports (`ModelCatalog`, `Model`, `ModelServer`, `API`, `APIType`) from `Kfmr.ts` into `types.ts`.

**Rationale:** `types.ts` already serves as the shared type/constant module for the connector (its header comment says "Shared types and constants to avoid circular dependencies between InformerService.ts and Kfmr.ts"). With Kfmr.ts gone, it becomes the natural home. Creating a new `constants.ts` would add a file for content that fits in the existing module.

**Alternative considered:** Create a new `shared.ts` or `constants.ts`. Rejected because `types.ts` already plays this role and the additional file adds no benefit for this amount of code.

### D2 — Remove KFMR-only reconciliation from `processKFMR`; preserve model card fetching

**Choice:** Remove the KFMR-specific parts of `processKFMR`: registered model listing, model version matching, KFMR inference service correlation, and KFMR-specific `callBackstagePrinters` calls. Remove KFMR label constants (`INF_SVC_RM_ID_LABEL`, `INF_SVC_MV_ID_LABEL`), the `KubeflowNormalizer` enum value, and the `ProcessKFMRResult` interface. **Preserve** the model card fetching logic (lines 421-444) which calls `kfmr.getModelCard()` — this uses the **Model Catalog API**, not the Model Registry, and must be relocated so it can be called from the KServe reconciliation path.

**Rationale:** Without the KFMR client, the registry-specific logic (registered model listing, label matching, KFMR inference service correlation) has nothing to call. However, the model card fetching via `getModelCard()` calls the separate Model Catalog API (`/api/model_catalog/v1alpha1`) and is valuable for enriching KServe InferenceService entities with catalog metadata. This catalog interaction must be preserved for future enhancement.

### D3 — Simplify `ReconcilerConfig`; keep catalog route

**Choice:** Remove `kfmrClients` and `kfmrRoutes` fields from the `ReconcilerConfig` interface. **Rename** `kfmrCatalogRoute` to `catalogRoute` — this field stores the discovered OpenShift route for the Model Catalog service and is needed for catalog API calls. Remove `KFMRClient` interface; extract a smaller `CatalogClient` interface (or standalone function) that retains only `rootCatalogURL` and `getModelCard()`.

**Rationale:** `kfmrClients` and `kfmrRoutes` are only populated by `setupKFMR` for registry routes and consumed by `processKFMR` for registry operations — both being deleted. However, `kfmrCatalogRoute` stores the catalog service route discovered during setup; this is needed for the Model Catalog API and is renamed to remove the misleading "kfmr" prefix.

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
4. No remaining imports or references to `Kfmr` in any `.ts` file under `kserve-kubeflow-connector-backend/src/`
5. No remaining references to `KFMRClient`, `kfmrClients`, `kfmrRoutes`, `setupKFMR`, `loopOverKFMR`, `processKFMR`, or `KubeflowNormalizer`
6. `PropertyKeys` is importable from `types.ts` and `KServe.ts` compiles using the new import
7. `getModelCard()` is callable from the relocated catalog module and the `CatalogModel` type is available from `types.ts`
8. `catalogRoute` (renamed from `kfmrCatalogRoute`) is present on `ReconcilerConfig`

## Future Work (Deferred to Later Jiras)

The Model Catalog integration preserved in this change is a foundation for two planned enhancements under RHDHPLAN-404:

1. **Inference-service-driven catalog lookup**: Call the Model Catalog API using metadata stored in KServe InferenceService CRs (labels/annotations containing catalog source and model references) to retrieve model cards and catalog metadata. This enriches KServe-discovered models with catalog descriptions, readmes, and provenance data.

2. **Full catalog polling via REST API**: Poll all Model Catalog `CatalogSource` entries via the REST API and match them to discovered KServe InferenceServices. This enables bidirectional discovery — models known to the catalog can be correlated with running inference services even when the InferenceService doesn't carry catalog metadata.

Both approaches build on the catalog route discovery (`catalogRoute` on `ReconcilerConfig`) and `getModelCard()` infrastructure preserved in this change. The current `getModelCard()` signature (`sourceId`, `modelName`) supports approach 1 directly; approach 2 will require additional catalog API methods (e.g., `listCatalogSources`).
