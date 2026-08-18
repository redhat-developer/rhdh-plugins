## REMOVED Capabilities

### Requirement: No KFMR client code remains in the connector

After removal, the connector plugin SHALL contain zero references to KubeFlow Model Registry client code, types, or configuration.

#### Scenario: No KFMR source file exists

- **WHEN** the connector plugin source directory is inspected
- **THEN** no file named `Kfmr.ts` or containing KFMR client logic exists under `plugins/kserve-kubeflow-connector-backend/src/`

#### Scenario: No KFMR imports remain

- **WHEN** all TypeScript files under `plugins/kserve-kubeflow-connector-backend/src/` are searched for import statements
- **THEN** no import references `./Kfmr` or any KFMR-specific symbol (`KFMRClient`, `setupKFMR`, `loopOverKFMR`, `processKFMR`, `getKubeFlowInferenceServicesForModelVersion`)

#### Scenario: No KFMR-only types remain in types.ts

- **WHEN** `types.ts` is inspected
- **THEN** the interfaces `KFMRClient`, `KFMRInferenceService`, `InferenceServiceList`, and `LoopOverKFMRResult` do not exist
- **AND** `ReconcilerConfig` does not contain fields `kfmrClients` or `kfmrRoutes`
- **AND** `ReconcilerConfig` contains `catalogRoute` (renamed from `kfmrCatalogRoute`) for Model Catalog route storage
- **AND** `ReconcilerConfig` contains `catalogUrl` for config-based catalog URL
- **AND** `NormalizerType` enum does not exist (deleted — only KServe normalizer remains)
- **AND** `CatalogModel` interface is preserved (it is a Model Catalog type, not a registry type)

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

### Requirement: Model Catalog integration preserved

The KubeFlow Model Catalog API support SHALL remain functional after KFMR removal. Catalog route discovery, model card fetching, and catalog types are relocated, not deleted.

#### Scenario: Catalog route discovery is functional

- **WHEN** the connector starts and discovers OpenShift routes managed by `model-registry-operator`
- **AND** no `catalogUrl` is configured
- **THEN** routes with `catalog` in the name are stored on `ReconcilerConfig.catalogRoute`
- **AND** the catalog route's ingress host is used to construct the catalog base URL

#### Scenario: Config-based catalog URL takes precedence

- **WHEN** `kubeflow-model-catalog-url` is set in `catalog.providers.modelCatalog.<id>` config
- **THEN** the configured URL is stored on `ReconcilerConfig.catalogUrl`
- **AND** `setupCatalogRoute()` skips route discovery
- **AND** `createCatalogClient()` uses the configured URL instead of route ingress

#### Scenario: getModelCard is callable

- **WHEN** a `sourceId` and `modelName` are provided to `createCatalogClient().getModelCard()`
- **AND** a catalog URL is available (via config or route discovery)
- **THEN** a GET request is made to the Model Catalog API at `/api/model_catalog/v1alpha1/sources/{sourceId}/models/{modelName}`
- **AND** the `readme` field of the returned `CatalogModel` is returned

#### Scenario: CatalogModel type is available

- **WHEN** code imports `CatalogModel` from `types.ts`
- **THEN** the import resolves and the type includes `id`, `name`, `description`, `readme`, `sourceId`, and `repositoryName` fields

#### Scenario: Catalog PropertyKeys are preserved

- **WHEN** `PropertyKeys` is inspected
- **THEN** catalog-related keys (`RHOAIModelCatalogSourceModelVersion`, `RHOAIModelCatalogSourceModelKey`, `RHOAIModelCatalogRegisteredFromKey`, `RHOAIModelCatalogProviderKey`) are present

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

---

### Requirement: Annotation-based model card lookup is functional

InferenceService CRs annotated with `rhdh.io/catalog-source` and `rhdh.io/catalog-model` SHALL trigger model card retrieval from the Model Catalog API.

#### Scenario: Annotated InferenceService gets model card

- **WHEN** a KServe `InferenceService` CR has annotations `rhdh.io/catalog-source` and `rhdh.io/catalog-model`
- **AND** a catalog URL is available (via config or route discovery)
- **THEN** `fetchModelCardViaAnnotations()` calls `createCatalogClient().getModelCard()` with the annotation values
- **AND** the retrieved model card (readme) is populated on the resulting entity

#### Scenario: Non-annotated InferenceService skips model card lookup

- **WHEN** a KServe `InferenceService` CR does not have `rhdh.io/catalog-source` or `rhdh.io/catalog-model` annotations
- **THEN** no model card lookup is attempted for that InferenceService

---

### Requirement: Backstage config fields are functional

The connector SHALL read `kubeflow-model-catalog-url`, `default-owner`, and `default-lifecycle` from Backstage config under `catalog.providers.modelCatalog.<id>`.

#### Scenario: Config fields populate ConnectorConfig

- **WHEN** `catalog.providers.modelCatalog.<id>` contains `kubeflow-model-catalog-url`, `default-owner`, and `default-lifecycle`
- **THEN** `plugin.ts` creates a `ConnectorConfig` with the corresponding values
- **AND** `setupInformer()` receives the `ConnectorConfig`
- **AND** config values take precedence over environment variables (`KUBEFLOW_MODEL_CATALOG_URL`, `OWNER`, `LIFECYCLE`)

#### Scenario: Environment variable fallback

- **WHEN** config fields are not set
- **THEN** `setupInformer()` falls back to environment variables `OWNER` and `LIFECYCLE`
- **AND** if environment variables are also unset, defaults to `"default-owner"` and `"production"`

---

### Requirement: NormalizerType enum is fully removed

The `NormalizerType` enum and `normalizerType` field SHALL be completely removed since only the KServe normalizer exists.

#### Scenario: No NormalizerType references remain

- **WHEN** all TypeScript files under `plugins/kserve-kubeflow-connector-backend/src/` are searched
- **THEN** no references to `NormalizerType`, `KServeNormalizer`, `KubeflowNormalizer`, or `normalizerType` exist
- **AND** `processModelCatalog` does not accept a `normalizerType` parameter
- **AND** `ModelCatalogMetadata` does not contain a `normalizerType` field
