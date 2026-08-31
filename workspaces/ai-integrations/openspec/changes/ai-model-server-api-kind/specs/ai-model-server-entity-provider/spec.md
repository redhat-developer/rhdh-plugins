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

Model names from the `ModelCatalog.models` array MUST be collected into `spec.models.available` as a string array. When models are present, `spec.models.default` MUST be set according to override precedence: if `modelServer.annotations` contains the `rhdh.io/default` annotation, its sanitized value is used; otherwise, the first model's sanitized name is used.

#### Scenario: Multiple models listed (no override)

- **WHEN** a `ModelCatalog` contains models `['ibm-granite-20b', 'mistral-7b']` and no `rhdh.io/default` annotation
- **THEN** the entity has `spec.models.available: ['ibm-granite-20b', 'mistral-7b']` and `spec.models.default: 'ibm-granite-20b'`

#### Scenario: Default model overridden by annotation

- **WHEN** a `ModelCatalog` contains models `['model-a', 'model-b']` and `modelServer.annotations` has `rhdh.io/default: 'preferred-model'`
- **THEN** the entity has `spec.models.available: ['model-a', 'model-b']` and `spec.models.default: 'preferred-model'`

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

### Requirement: Annotation-driven field overrides

Five `rhdh.io/` annotations on `modelServer.annotations` act as control annotations that drive spec-level fields on the generated `AiModelServerAPI` entity. These annotations MUST NOT appear in the entity's `metadata.annotations` — they are consumed during generation and deleted before the entity is emitted.

| Annotation           | Target field          | Behavior when present                           | Behavior when absent                                  |
| -------------------- | --------------------- | ----------------------------------------------- | ----------------------------------------------------- |
| `rhdh.io/system`     | `spec.system`         | Set to the annotation value                     | `spec.system` is omitted                              |
| `rhdh.io/serverType` | `spec.serverType`     | Overrides the API type                          | Falls back to `modelServer.API.type` (or `'unknown'`) |
| `rhdh.io/default`    | `spec.models.default` | Overrides with the annotation's sanitized value | Falls back to the first model's sanitized name        |
| `rhdh.io/owner`      | `spec.owner`          | Overrides with the annotation's sanitized value | Falls back to `modelServer.owner`                     |
| `rhdh.io/lifecycle`  | `spec.lifecycle`      | Set to the annotation value                     | Falls back to `modelServer.lifecycle`                 |

#### Scenario: System set by annotation

- **WHEN** `modelServer.annotations` contains `rhdh.io/system: 'my-ai-system'`
- **THEN** the entity has `spec.system: 'my-ai-system'`

#### Scenario: System absent when annotation missing

- **WHEN** `modelServer.annotations` does not contain `rhdh.io/system`
- **THEN** the entity has no `spec.system` field

#### Scenario: ServerType overridden by annotation

- **WHEN** `modelServer.annotations` contains `rhdh.io/serverType: 'anthropic'` and `modelServer.API.type` is `'openapi'`
- **THEN** the entity has `spec.serverType: 'anthropic'` (the annotation value takes precedence)

#### Scenario: ServerType falls back to API type when annotation absent

- **WHEN** `modelServer.annotations` does not contain `rhdh.io/serverType` and `modelServer.API.type` is `'grpc'`
- **THEN** the entity has `spec.serverType: 'grpc'`

#### Scenario: Default model overridden by annotation

- **WHEN** `modelServer.annotations` contains `rhdh.io/default: 'preferred-model'` and models are `['model-a', 'model-b']`
- **THEN** the entity has `spec.models.default: 'preferred-model'` (sanitized)

#### Scenario: Default model falls back to first model when annotation absent

- **WHEN** `modelServer.annotations` does not contain `rhdh.io/default` and models are `['ibm-granite-20b', 'mistral-7b']`
- **THEN** the entity has `spec.models.default: 'ibm-granite-20b'`

#### Scenario: Owner overridden by annotation

- **WHEN** `modelServer.annotations` contains `rhdh.io/owner: 'team-ai'` and `modelServer.owner` is `'default-owner'`
- **THEN** the entity has `spec.owner: 'team-ai'` (the annotation value takes precedence, sanitized)

#### Scenario: Owner falls back to modelServer when annotation absent

- **WHEN** `modelServer.annotations` does not contain `rhdh.io/owner` and `modelServer.owner` is `'default-owner'`
- **THEN** the entity has `spec.owner: 'default-owner'`

#### Scenario: Lifecycle overridden by annotation

- **WHEN** `modelServer.annotations` contains `rhdh.io/lifecycle: 'experimental'` and `modelServer.lifecycle` is `'production'`
- **THEN** the entity has `spec.lifecycle: 'experimental'` (the annotation value takes precedence)

#### Scenario: Lifecycle falls back to modelServer when annotation absent

- **WHEN** `modelServer.annotations` does not contain `rhdh.io/lifecycle` and `modelServer.lifecycle` is `'production'`
- **THEN** the entity has `spec.lifecycle: 'production'`

#### Scenario: All five overrides applied together

- **WHEN** `modelServer.annotations` contains `rhdh.io/system: 'ai-platform'`, `rhdh.io/serverType: 'openai-v1'`, `rhdh.io/default: 'gpt-4'`, `rhdh.io/owner: 'team-ai'`, and `rhdh.io/lifecycle: 'experimental'`
- **THEN** the entity has `spec.system: 'ai-platform'`, `spec.serverType: 'openai-v1'`, `spec.models.default: 'gpt-4'`, `spec.owner: 'team-ai'`, and `spec.lifecycle: 'experimental'`
- **AND** none of the five annotations appear in `metadata.annotations`

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
