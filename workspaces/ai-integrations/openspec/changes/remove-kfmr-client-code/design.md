# Design: Remove KubeFlow Model Registry (KFMR) Client Code

## Canonical Touchpoints

- Parent design: `openspec/changes/transition-oai-connector-to-kserve-plugin/design.md` — Decision 4
- Jira: [RHIDP-15200](https://redhat.atlassian.net/browse/RHIDP-15200)

## Context

The `kserve-kubeflow-connector-backend` plugin was ported from a golang model-catalog-bridge that supported two data paths:

1. **KServe path** — K8s Informer watches `InferenceService` CRs, `KServe.ts` converts them to `ModelCatalog` JSON
2. **KFMR path** — REST client calls KubeFlow Model Registry APIs to fetch `RegisteredModel`, `ModelVersion`, `ModelArtifact`, and `KFMRInferenceService` data, `Kfmr.ts` converts them to `ModelCatalog` JSON

RHDHPLAN-404 scopes in only KServe + KubeFlow Model Catalog. The KFMR path must be removed.

The complication is that `Kfmr.ts` is not purely KFMR client code — it also contains shared utilities (`PropertyKeys`, `NormalizerFormat`, `getTagsFromCustomProps`, `getStringPropVal`, `sanitizeName`, `sanitizeModelVersion`) and re-exports model types (`ModelCatalog`, `Model`, `ModelServer`, `API`, `APIType`) that are consumed by `KServe.ts` and `InformerService.ts`. These must be relocated before deletion.

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
  └── imports from types.ts: ReconcilerConfig, InferenceService, PropertyKeys,
       NormalizerFormat, sanitizeName, etc.

KServe.ts
  └── imports from types.ts: PropertyKeys, getStringPropVal, getTagsFromCustomProps, etc.

(Kfmr.ts — deleted)
```

## Goals / Non-Goals

**Goals:**

- Delete `Kfmr.ts` entirely
- Remove all KFMR-specific types from `types.ts`
- Remove all KFMR logic from `InformerService.ts` (imports, `processKFMR`, label constants, `KubeflowNormalizer`)
- Relocate shared utilities so `KServe.ts` and `InformerService.ts` continue to compile
- Remove KFMR fields from `ReconcilerConfig`
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

### D2 — Remove `processKFMR` and KFMR reconciliation entirely

**Choice:** Delete the `processKFMR` function (~180 lines), all KFMR label constants (`INF_SVC_RM_ID_LABEL`, `INF_SVC_MV_ID_LABEL`), the `KubeflowNormalizer` enum value, and the `ProcessKFMRResult` interface from `InformerService.ts`. Remove the KFMR branch from the reconcile callbacks (the code that checks whether a KServe InferenceService maps to a KFMR registered model via labels).

**Rationale:** Without the KFMR client, there is nothing to call. The label-based mapping between KServe InferenceServices and KFMR registered models serves no purpose. The reconcile callbacks should only call the KServe path (`callKServeBackstagePrinters`).

### D3 — Simplify `ReconcilerConfig`

**Choice:** Remove `kfmrClients`, `kfmrRoutes`, and `kfmrCatalogRoute` fields from the `ReconcilerConfig` interface. Remove `KFMRClient` and related KFMR types that were only used by the KFMR client.

**Rationale:** These fields are only populated by `setupKFMR` and consumed by `processKFMR`, both of which are being deleted.

### D4 — Remove the `tlsSkipAgent` and KFMR-specific `undici` import

**Choice:** Remove the TLS-skipping `Agent` from `Kfmr.ts`. If `undici` is not used elsewhere in the connector, remove it from `package.json` dependencies.

**Rationale:** The TLS skip agent was only used by the KFMR REST client's `getFromModelRegistry` function. With that function deleted, the agent and import are unused. This also resolves the recurring fullsend review finding about disabled TLS verification.

### D5 — Remove `@ts-ignore` suppressed unused constants

**Choice:** The URI constants (`GET_REG_MODEL_URI`, `LIST_VERSIONS_OFF_REG_MODELS_URI`, etc.) that were annotated with `@ts-ignore` because they were defined but unused are deleted with `Kfmr.ts`. No need to move them.

**Rationale:** These were ported from golang but never wired into the TypeScript client. Their deletion resolves another recurring fullsend review finding.

## Risks / Trade-offs

| Risk                                                                   | Mitigation                                                                                                                                      |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared utilities relocated incorrectly, breaking KServe path           | Run `yarn tsc` and `yarn build:all` after relocation, before any KFMR deletion                                                                  |
| Removing KFMR code breaks model card resolution on RHOAI               | Model card resolution via KubeFlow Model Catalog API is separate from KFMR — verify the catalog REST path in `InformerService.ts` is unaffected |
| `InformerService.ts` reconcile callbacks have subtle KFMR dependencies | Trace every `processKFMR` call site and verify the KServe-only path produces the same entity output for KServe-only InferenceServices           |
| `undici` removal breaks other code                                     | Grep for `undici` imports across the plugin before removing from `package.json`                                                                 |

## Verification

After all changes:

1. `yarn tsc` passes with no errors
2. `yarn build:all` succeeds
3. `yarn test:all` passes (existing tests in the workspace)
4. No remaining imports or references to `Kfmr` in any `.ts` file under `kserve-kubeflow-connector-backend/src/`
5. No remaining references to `KFMRClient`, `kfmrClients`, `kfmrRoutes`, `setupKFMR`, `loopOverKFMR`, `processKFMR`, or `KubeflowNormalizer`
6. `PropertyKeys` is importable from `types.ts` and `KServe.ts` compiles using the new import
