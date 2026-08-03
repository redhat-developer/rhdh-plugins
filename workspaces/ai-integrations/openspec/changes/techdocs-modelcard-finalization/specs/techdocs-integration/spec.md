## Auto TechDocsKey Annotation

### Requirement: TechDocsKey is auto-set when catalog annotations are present

When an InferenceService CR has `rhdh.io/catalog-source` and `rhdh.io/catalog-model` annotations but no explicit `rhdh.io/techdocs` annotation, the connector SHALL automatically set TechDocsKey as a path to the model card endpoint. The entity provider's `ModelCatalogGenerator.ts` discovers the connector's base URL via `discovery.getBaseUrl()` and prepends it when constructing the final `backstage.io/techdocs-ref` annotation.

#### Scenario: Auto-set TechDocsKey for annotated InferenceService

- **WHEN** an InferenceService has `rhdh.io/catalog-source` = `<sourceId>` and `rhdh.io/catalog-model` = `<modelName>`
- **AND** no `rhdh.io/techdocs` annotation is set
- **THEN** `techdocsUrl` is set to `/modelcard/<sourceId>/<modelName>`
- **AND** the value is a path only — no `url:` prefix, no base URL prefix
- **AND** the `TechDocs` key in the model annotations contains this path

#### Scenario: Explicit TechDocsKey takes precedence

- **WHEN** an InferenceService has a `rhdh.io/techdocs` annotation set to a full URL (e.g., `https://github.com/redhat-ai-dev/granite-docs/tree/main`)
- **THEN** the explicit value is used as `techdocsUrl`
- **AND** the auto-set logic is skipped
- **AND** the entity provider does NOT prepend `svcUrl` (only relative paths starting with `/` get the prefix)

#### Scenario: No catalog annotations skips auto-set

- **WHEN** an InferenceService does NOT have both `rhdh.io/catalog-source` and `rhdh.io/catalog-model` annotations
- **THEN** no TechDocsKey is auto-set
- **AND** `techdocsUrl` remains undefined (unless explicitly annotated)

---

## TechDocsKey → backstage.io/techdocs-ref Pipeline

### Requirement: TechDocsKey path is correctly transformed into a full techdocs-ref annotation

The entity provider's `ModelCatalogGenerator.ts` SHALL resolve the connector's base URL via `discovery.getBaseUrl()`, prepend it as `svcUrl` only when the TechDocsKey value is a relative path (starts with `/`), and add the `url:` prefix to produce the final `backstage.io/techdocs-ref` annotation. Full URLs (explicit `rhdh.io/techdocs` annotations) are used as-is.

#### Scenario: Full URL construction

- **GIVEN** TechDocsKey is `/modelcard/redhat_ai_validated_models/RedHatAI/Meta-Llama-3.1-8B-Instruct-quantized.w4a16`
- **AND** svcUrl is `http://localhost:7007/api/kserve-kubeflow-connector` (when running via `yarn dev` from the `ai-integrations` workspace)
- **WHEN** `ModelCatalogGenerator.ts` processes the TechDocs annotation
- **THEN** `backstage.io/techdocs-ref` is set to `url:http://localhost:7007/api/kserve-kubeflow-connector/modelcard/redhat_ai_validated_models/RedHatAI/Meta-Llama-3.1-8B-Instruct-quantized.w4a16`

---

## Model Card Endpoint

### Requirement: Model card endpoint handles multi-segment model names

The connector's `/modelcard` route SHALL match URLs where the model name contains slashes.

#### Scenario: Two-segment model name

- **WHEN** a GET request is made to `/modelcard/sourceA/modelB`
- **THEN** the route matches with `sourceId` = `sourceA` and model name = `modelB`
- **AND** `getModelCard("sourceA/modelB")` is called

#### Scenario: Three-segment model name (slash in model name)

- **WHEN** a GET request is made to `/modelcard/redhat_ai_validated_models/RedHatAI/Meta-Llama-3.1-8B-Instruct-quantized.w4a16`
- **THEN** the route matches with `sourceId` = `redhat_ai_validated_models` and model name = `RedHatAI/Meta-Llama-3.1-8B-Instruct-quantized.w4a16`
- **AND** `getModelCard("redhat_ai_validated_models/RedHatAI/Meta-Llama-3.1-8B-Instruct-quantized.w4a16")` is called

#### Scenario: Model card found

- **WHEN** the model card key matches an entry in the model cards map
- **THEN** the response is 200 with `Content-Type: text/markdown` and the model card content

#### Scenario: Model card not found

- **WHEN** the model card key does NOT match any entry
- **THEN** the response is 404

---

## mkdocs.yml Generation

### Requirement: URL reader generates mkdocs.yml for TechDocs builder

The url-reader's `dir()` method SHALL write a `mkdocs.yml` file alongside the `docs/` directory so that the TechDocs builder (`mkdocs build`) can process the model card markdown.

#### Scenario: mkdocs.yml is created

- **WHEN** `dir()` is called on a `ModelCatalogBridgeUrlReaderServiceReadTreeResponse`
- **THEN** a file `mkdocs.yml` is written at the root of the output directory
- **AND** the file contains at minimum `site_name` and `nav` fields
- **AND** the `docs/index.md` file is written alongside it

#### Scenario: TechDocs builder succeeds

- **WHEN** the TechDocs builder runs `mkdocs build` on the output directory
- **THEN** the build succeeds without "Could not read MkDocs YAML config file" errors
- **AND** the `techdocs-core` plugin is auto-injected by Backstage's patcher

---

## URL Reader Config Alignment

### Requirement: BridgeConfig matches cluster-nested config structure

The url-reader's `BridgeConfig` type and config reading SHALL match the cluster-nested config structure used by the connector and entity provider.

#### Scenario: Two-level config iteration

- **GIVEN** config has `catalog.providers.modelCatalog.kserve-kubeflow-connector.cluster-1` and `.cluster-2`
- **WHEN** `readBridgeConfigs` is called
- **THEN** it returns two `BridgeConfig` entries, both with `id` = `kserve-kubeflow-connector`
- **AND** each entry has `name`, `kubeflowModelCatalogUrl`, `defaultOwner`, `defaultLifecycle` from its respective cluster sub-config

#### Scenario: Missing optional fields default to empty string

- **GIVEN** a cluster sub-config with no optional fields set
- **WHEN** `readBridgeConfig` is called
- **THEN** `name`, `kubeflowModelCatalogUrl`, `defaultOwner`, `defaultLifecycle` all default to `''`

#### Scenario: No provider config returns empty array

- **GIVEN** config has no `catalog.providers.modelCatalog` section
- **WHEN** `readBridgeConfigs` is called
- **THEN** it returns `[]`

---

## Config Schema Declaration

### Requirement: config.d.ts declares cluster sub-key fields

The config schema in `catalog-backend-module-model-catalog/config.d.ts` SHALL declare the new fields so Backstage config validation does not strip them.

#### Scenario: Config fields pass validation

- **WHEN** `app-config.yaml` contains `name`, `kubeflow-model-catalog-url`, `default-owner`, `default-lifecycle` under a cluster sub-key
- **THEN** Backstage config validation preserves these fields
- **AND** `providerConfigs.keys()` returns a non-empty array

#### Scenario: Existing connector-level fields still work

- **WHEN** `app-config.yaml` contains `system`, `owner`, `schedule` at the connector level
- **THEN** these fields continue to pass validation and are accessible via the config API

---

## Service-to-Service Token Auth

### Requirement: URL reader authenticates to the connector using Backstage service-to-service tokens

The url-reader SHALL use `getPluginRequestToken` with `targetPluginId: 'kserve-kubeflow-connector'` to obtain a service-to-service token for authenticating requests to the connector's `/modelcard` endpoint.

#### Scenario: Service-to-service token is used

- **WHEN** the url-reader's `readUrl` method fetches a model card URL
- **THEN** it calls `auth.getPluginRequestToken` with `targetPluginId: 'kserve-kubeflow-connector'`
- **AND** the resulting token is sent in the `Authorization: Bearer <token>` header
- **AND** no static admin token (`RHDH_TOKEN`) fallback is used

#### Scenario: Correct targetPluginId

- **WHEN** `getPluginRequestToken` is called
- **THEN** `targetPluginId` is `'kserve-kubeflow-connector'` (matching the connector's `pluginId`)
- **AND** the connector's auth middleware accepts the token

---

## Config Robustness

### Requirement: Config reading handles empty env var substitution

The url-reader's config reading SHALL handle edge cases in Backstage's `ConfigReader` when config values come from env var substitution with empty defaults (e.g., `${VAR:-}`).

#### Scenario: safeGetOptionalString handles TypeError

- **GIVEN** a config key whose value is an empty string from env var substitution (e.g., `${KUBEFLOW_MODEL_CATALOG_URL:-}`)
- **WHEN** `readBridgeConfig` reads that key
- **THEN** `safeGetOptionalString` catches the Backstage ConfigReader TypeError
- **AND** returns `''` instead of throwing

#### Scenario: readBridgeConfigs does not gate on kubeflow-model-catalog-url

- **GIVEN** a cluster sub-config exists under the connector key
- **AND** `kubeflow-model-catalog-url` is not present or has an empty env var default
- **WHEN** `readBridgeConfigs` iterates cluster sub-keys
- **THEN** the cluster config is still accepted (not skipped)
- **AND** a `BridgeConfig` entry is created with `kubeflowModelCatalogUrl: ''`

---

## Build and Quality

### Requirement: All quality gates pass

#### Scenario: TypeScript compilation

- **WHEN** `yarn tsc` is run from the workspace root
- **THEN** it completes with zero errors

#### Scenario: Full build

- **WHEN** `yarn build:all` is run
- **THEN** it completes with zero errors

#### Scenario: Unit tests

- **WHEN** `yarn test -- --watchAll=false` is run in the url-reader plugin
- **THEN** all tests pass

#### Scenario: Code formatting

- **WHEN** `yarn prettier` is run
- **THEN** no formatting changes are needed

#### Scenario: Lint

- **WHEN** `yarn lint:all` is run
- **THEN** no lint errors are reported

---

## Integration

### Requirement: End-to-end model card rendering

#### Scenario: Model card renders as TechDocs

- **WHEN** an InferenceService with catalog annotations is discovered by the connector
- **AND** the entity provider creates a Backstage entity with `backstage.io/techdocs-ref`
- **AND** a user navigates to the entity's TechDocs page in the RHDH UI
- **THEN** the model card markdown is rendered as a documentation page

#### Scenario: Works on upstream KServe/Kubeflow

- **WHEN** the connector is pointed at an upstream KServe/Kubeflow installation
- **THEN** model cards render as TechDocs for annotated InferenceServices

#### Scenario: Works on RHOAI on OCP

- **WHEN** the connector is pointed at an RHOAI installation on OpenShift
- **THEN** model cards render as TechDocs for annotated InferenceServices
