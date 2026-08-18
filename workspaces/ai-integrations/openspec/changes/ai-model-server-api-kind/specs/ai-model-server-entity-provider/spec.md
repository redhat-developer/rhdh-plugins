## ADDED Requirements

### Requirement: Single AiModelServerAPI entity per model server

`GenerateCatalogEntities` MUST emit exactly one `AiModelServerAPI` entity per `ModelCatalog` when a `modelServer` with a valid `API.url` is present. The function MUST NOT emit Component, Resource, or API entities.

#### Scenario: Full model server produces one entity

- **WHEN** a `ModelCatalog` contains a `modelServer` with `API.url`, `name`, `owner`, `lifecycle`, and two models
- **THEN** `GenerateCatalogEntities` returns an array with exactly one entity of `kind: 'AiModelServerAPI'`

#### Scenario: No Component or Resource entities emitted

- **WHEN** `GenerateCatalogEntities` processes any valid `ModelCatalog`
- **THEN** the returned array contains no entities with `kind: 'Component'` or `kind: 'Resource'`

---

### Requirement: Models collected into spec.models.available

Model names from the `ModelCatalog.models` array MUST be collected into `spec.models.available` as a string array. When models are present, `spec.models.default` MUST be set to the first model's name.

#### Scenario: Multiple models listed

- **WHEN** a `ModelCatalog` contains models `['ibm-granite-20b', 'mistral-7b']`
- **THEN** the entity has `spec.models.available: ['ibm-granite-20b', 'mistral-7b']` and `spec.models.default: 'ibm-granite-20b'`

#### Scenario: Empty models array

- **WHEN** a `ModelCatalog` has `models: []`
- **THEN** the entity has `spec.models.available: []` and no `spec.models.default` field

---

### Requirement: Guard on missing modelServer

`GenerateCatalogEntities` MUST return an empty array when `modelCatalog.modelServer` is undefined.

#### Scenario: No modelServer returns empty

- **WHEN** a `ModelCatalog` has no `modelServer` field
- **THEN** `GenerateCatalogEntities` returns `[]`

---

### Requirement: Guard on missing API URL

`GenerateCatalogEntities` MUST return an empty array when `modelServer.API?.url` is falsy. This prevents generating entities with empty `serverUrl` that would fail the schema's `minLength: 1` constraint.

#### Scenario: ModelServer without API returns empty

- **WHEN** a `ModelCatalog` has a `modelServer` but no `API` object
- **THEN** `GenerateCatalogEntities` returns `[]`

---

### Requirement: Authentication tag

The entity MUST include an `auth-required` tag when `modelServer.authentication` is `true`, or an `auth-not-required` tag otherwise (including when `authentication` is undefined).

#### Scenario: Auth required tag

- **WHEN** `modelServer.authentication` is `true`
- **THEN** the entity's `metadata.tags` includes `auth-required` and `spec.requiresApiKey` is `true`

#### Scenario: Auth not required tag

- **WHEN** `modelServer.authentication` is `false` or undefined
- **THEN** the entity's `metadata.tags` includes `auth-not-required` and `spec.requiresApiKey` is `false`

---

### Requirement: Annotations merged from API and modelServer

API annotations MUST be copied to the entity metadata. ModelServer annotations MUST also be copied, overriding API annotations on key conflict.

#### Scenario: Both API and server annotations merged

- **WHEN** `modelServer.API.annotations` has `{'api.io/key': 'from-api'}` and `modelServer.annotations` has `{'server.io/key': 'from-server'}`
- **THEN** the entity's `metadata.annotations` includes both

#### Scenario: No annotations present

- **WHEN** neither `modelServer.API` nor `modelServer` has annotations, and no model has techdocs
- **THEN** the entity's `metadata.annotations` is undefined

---

### Requirement: Techdocs from first model

The entity MUST use the `techdocs` annotation from the first model that has one. Relative paths (starting with `/`) MUST be prepended with `svcUrl` when provided. The value MUST be stored as `backstage.io/techdocs-ref: url:<techdocsUrl>`.

#### Scenario: Absolute techdocs URL

- **WHEN** the first model has `annotations.techdocs: 'https://github.com/org/repo/tree/main'`
- **THEN** the entity has `metadata.annotations['backstage.io/techdocs-ref']: 'url:https://github.com/org/repo/tree/main'`

#### Scenario: Relative techdocs path with svcUrl

- **WHEN** a model has `annotations.techdocs: '/modelcard/source/model'` and `svcUrl` is `'http://localhost:7007/api/kserve-kubeflow-connector'`
- **THEN** the entity has `metadata.annotations['backstage.io/techdocs-ref']: 'url:http://localhost:7007/api/kserve-kubeflow-connector/modelcard/source/model'`

#### Scenario: Only first model's techdocs used

- **WHEN** multiple models have `techdocs` annotations
- **THEN** only the first model's value is used

---

### Requirement: Links from API, homepage, and model artifacts

The entity MUST include links for the API URL (title `'API'`), homepage URL (title `'Homepage'`, when present), and per-model artifact URLs (title `'<modelName> artifact'`).

#### Scenario: All link types present

- **WHEN** `modelServer.API.url`, `modelServer.homepageURL`, and model `artifactLocationURL` values are present
- **THEN** the entity's `metadata.links` includes API, Homepage, and per-model artifact entries

---

### Requirement: model-catalog-types interface unchanged

The `ModelCatalog`, `ModelServer`, `Model`, and `API` interfaces from `@redhat-ai-dev/model-catalog-types` MUST remain unchanged. The entity provider MUST consume these types as-is.

#### Scenario: Connector output compatible

- **WHEN** `kserve-kubeflow-connector-backend` produces a `ModelCatalog` object
- **THEN** `GenerateCatalogEntities` consumes it without type errors or interface changes
