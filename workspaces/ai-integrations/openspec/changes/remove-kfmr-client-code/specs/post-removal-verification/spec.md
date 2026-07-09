## REMOVED Capabilities

### Requirement: No KFMR client code remains in the connector

After removal, the connector plugin SHALL contain zero references to KubeFlow Model Registry client code, types, or configuration.

#### Scenario: No KFMR source file exists

- **WHEN** the connector plugin source directory is inspected
- **THEN** no file named `Kfmr.ts` or containing KFMR client logic exists under `kserve-kubeflow-connector-backend/src/`

#### Scenario: No KFMR imports remain

- **WHEN** all TypeScript files under `kserve-kubeflow-connector-backend/src/` are searched for import statements
- **THEN** no import references `./Kfmr` or any KFMR-specific symbol (`KFMRClient`, `setupKFMR`, `loopOverKFMR`, `processKFMR`, `getKubeFlowInferenceServicesForModelVersion`)

#### Scenario: No KFMR types remain in types.ts

- **WHEN** `types.ts` is inspected
- **THEN** the interfaces `KFMRClient`, `KFMRInferenceService`, `InferenceServiceList`, and `LoopOverKFMRResult` do not exist
- **AND** `ReconcilerConfig` does not contain fields `kfmrClients`, `kfmrRoutes`, or `kfmrCatalogRoute`

#### Scenario: No KFMR label constants remain

- **WHEN** `InformerService.ts` is inspected
- **THEN** the constants `INF_SVC_RM_ID_LABEL` and `INF_SVC_MV_ID_LABEL` do not exist
- **AND** no code references `modelregistry.opendatahub.io/registered-model-id` or `modelregistry.opendatahub.io/model-version-id`

---

## PRESERVED Capabilities

### Requirement: Shared utilities remain functional after relocation

Shared utilities previously exported from `Kfmr.ts` SHALL be available from `types.ts` with identical behavior.

#### Scenario: PropertyKeys importable from types.ts

- **WHEN** `KServe.ts` imports `PropertyKeys` from `./types`
- **THEN** the import resolves and all property key references compile without errors

#### Scenario: Model types importable from types.ts

- **WHEN** any module imports `ModelCatalog`, `Model`, `ModelServer`, `API`, or `APIType`
- **THEN** the import resolves from `./types` and the types match their original definitions

---

### Requirement: KServe reconciliation path unchanged

The KServe-only reconciliation path SHALL continue to produce identical entity output after KFMR removal.

#### Scenario: KServe InferenceService produces ModelCatalog entity

- **WHEN** a KServe `InferenceService` CR is observed by the Informer
- **THEN** the reconcile callback calls the KServe `callBackstagePrinters` function
- **AND** the resulting `ModelCatalog` JSON is served via the connector's REST API

#### Scenario: KServe path does not reference KFMR

- **WHEN** a KServe `InferenceService` CR is reconciled
- **THEN** no KFMR client calls, label checks, or registered model lookups occur

---

### Requirement: Build and type-check pass

The connector plugin SHALL compile and type-check cleanly after all changes.

#### Scenario: TypeScript compilation succeeds

- **WHEN** `yarn tsc` is run from the workspace root
- **THEN** it completes with zero errors

#### Scenario: Full build succeeds

- **WHEN** `yarn build:all` is run from the workspace root
- **THEN** it completes with zero errors

#### Scenario: Existing tests pass

- **WHEN** `yarn test:all` is run from the workspace root
- **THEN** all existing tests pass
