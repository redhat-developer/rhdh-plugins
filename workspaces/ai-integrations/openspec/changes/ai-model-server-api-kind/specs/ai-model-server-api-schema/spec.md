## ADDED Requirements

### Requirement: AiModelServerAPI kind declaration

The catalog model MUST declare a new `AiModelServerAPI` kind under the `backstage.io` group using `addKind` (not `addKindVersion`). The kind MUST support versions `v1alpha1` and `v1beta1` with `specType: 'ai-model-server'`. Relation fields MUST include `ownedBy` (spec.owner → Group/User) and `partOf` (spec.system → System).

#### Scenario: Kind registered without collision

- **WHEN** the `catalog-backend-module-ai-model-server` backend module initializes alongside other custom kind modules (e.g. `ai-resource-agent`)
- **THEN** the catalog plugin starts without annotation collision errors and logs `Loaded catalog model layer: redhat.com/kind-ai-model-server-api`

#### Scenario: Kind accepts v1alpha1 and v1beta1

- **WHEN** an `AiModelServerAPI` entity declares `apiVersion: backstage.io/v1alpha1` or `apiVersion: backstage.io/v1beta1`
- **THEN** the entity passes kind validation

---

### Requirement: Bare CatalogModelSource registration

The backend module MUST register the `AiModelServerAPI` kind via `catalogModelExtensionPoint.addModelSource()` using a bare `CatalogModelSource` implementation. The module MUST NOT use `CatalogModelSources.static()`, which auto-includes the default entity model layer and causes duplicate annotation declarations when multiple custom kind modules are loaded.

#### Scenario: No duplicate default-entity-model

- **WHEN** the catalog plugin loads model sources from `ai-model-server`, `ai-resource-agent`, and the built-in catalog
- **THEN** the `catalog.backstage.io/default-entity-model` layer appears exactly once in the loaded layers

#### Scenario: Multiple custom kind modules coexist

- **WHEN** both `catalog-backend-module-ai-model-server` and `catalog-backend-module-ai-resource-agent` register their layers using bare `CatalogModelSource` implementations
- **THEN** the catalog plugin starts without `Annotation declared more than once` errors

---

### Requirement: Required spec fields

An `AiModelServerAPI` entity MUST include `spec.type` with value `ai-model-server`, `spec.lifecycle` (non-empty string), `spec.owner` (non-empty string), `spec.serverType` (non-empty string), and `spec.serverUrl` (non-empty string, `minLength: 1`).

#### Scenario: Valid entity with required fields accepted

- **WHEN** an `AiModelServerAPI` entity declares all required spec fields with valid values
- **THEN** the schema validator accepts the entity

#### Scenario: Missing serverType rejected

- **WHEN** an `AiModelServerAPI` entity omits `spec.serverType`
- **THEN** the schema validator rejects the entity

#### Scenario: Missing serverUrl rejected

- **WHEN** an `AiModelServerAPI` entity omits `spec.serverUrl`
- **THEN** the schema validator rejects the entity

#### Scenario: Empty serverUrl rejected

- **WHEN** an `AiModelServerAPI` entity sets `spec.serverUrl` to an empty string
- **THEN** the schema validator rejects the entity (violates `minLength: 1`)

#### Scenario: Wrong spec.type rejected

- **WHEN** an entity declares `kind: AiModelServerAPI` but `spec.type: openapi`
- **THEN** the schema validator rejects the entity

---

### Requirement: Optional spec fields

The schema MUST allow optional fields: `spec.system` (string), `spec.requiresApiKey` (boolean), `spec.apiEntityRef` (string), and `spec.models` (object with optional `discoverable` boolean, `available` string array, and `default` string).

#### Scenario: Full entity with all optional fields accepted

- **WHEN** an `AiModelServerAPI` entity includes all optional fields with correctly typed values
- **THEN** the schema validator accepts the entity

#### Scenario: Minimal entity without optional fields accepted

- **WHEN** an `AiModelServerAPI` entity includes only required fields
- **THEN** the schema validator accepts the entity

---

### Requirement: Type guard

The `isAiModelServerApiEntity` type guard MUST check `entity.kind === 'AiModelServerAPI'` and `entity.spec?.type === 'ai-model-server'`. The guard MUST NOT check `apiVersion` (the kind is unambiguous without it).

#### Scenario: AiModelServerAPI entity recognized

- **WHEN** `isAiModelServerApiEntity` is called with an entity having `kind: 'AiModelServerAPI'` and `spec.type: 'ai-model-server'`
- **THEN** it returns `true`

#### Scenario: API entity not recognized

- **WHEN** `isAiModelServerApiEntity` is called with an entity having `kind: 'API'` and `spec.type: 'openapi'`
- **THEN** it returns `false`

#### Scenario: Wrong kind not recognized

- **WHEN** `isAiModelServerApiEntity` is called with an entity having `kind: 'Component'`
- **THEN** it returns `false`

---

### Requirement: Example and dev catalog wiring

The workspace MUST provide an example `AiModelServerAPI` entity YAML under `examples/`. The `app-config.yaml` MUST include `AiModelServerAPI` in `catalog.rules[].allow` and wire the example as a catalog location with `allow: [AiModelServerAPI]`.

#### Scenario: Example entity loads in dev catalog

- **WHEN** the dev environment starts with `yarn dev`
- **THEN** the example `AiModelServerAPI` entity is available in the catalog

---

### Requirement: Schema mirrors upstream

The JSON schema MUST be identical to upstream backstage/backstage#34476 except for the `kind` enum value (`AiModelServerAPI` instead of `API`) and the `$id` (which encodes the kind name). Required fields, optional fields, and field types MUST match upstream.

#### Scenario: Schema field parity with upstream

- **WHEN** the local schema is compared to the upstream PR's `API.v1alpha1.ai-model-server.schema.json`
- **THEN** all fields, types, and constraints match except `kind` and `$id`
