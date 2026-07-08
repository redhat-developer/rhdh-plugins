# Model Registry Source

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

The Model Registry source connects to Kubeflow Model Registry API, ingests RegisteredModel and ModelVersion resources, and emits RHDH catalog entities with normalized version annotations.

## EXISTING Requirements

None. This is a new EntityProvider implementation.

## ADDED Requirements

### Requirement: Kubeflow API Connection

The provider must connect to the Kubeflow Model Registry API and authenticate using K8s Secret credentials.

#### Scenario: Provider connects to Kubeflow API

- **WHEN** the `RhoaiModelRegistryProvider` starts
- **THEN** it reads endpoint URL from `catalog.providers.rhoai.modelRegistry.endpoint`
- **AND** it loads credentials from K8s Secret referenced in `catalog.providers.rhoai.modelRegistry.auth.secretRef`
- **AND** it loads custom CA bundle from `catalog.providers.rhoai.modelRegistry.tls.caBundle` (if configured)
- **AND** it validates connectivity by calling `GET /api/v1/registered_models?pageSize=1`
- **AND** on connection error, it logs a warning and returns empty entity array (does not throw)

#### Scenario: Provider handles authentication failure

- **WHEN** K8s Secret is missing or credentials are invalid
- **THEN** the provider logs an error with Secret name and namespace
- **AND** it returns empty entity array from `read()` without crashing the catalog backend
- **AND** on the next refresh cycle, it retries authentication (Secret may have been created)

### Requirement: RegisteredModel Entity Mapping

RegisteredModel resources from Kubeflow API must map to Resource entities with `spec.type: ai-model`.

#### Scenario: RegisteredModel is mapped to Resource entity

- **WHEN** the provider fetches RegisteredModels from `GET /api/v1/registered_models`
- **THEN** each RegisteredModel is converted to a Resource entity
- **AND** `metadata.name` is set to the RegisteredModel's `name` (slugified if needed)
- **AND** `metadata.title` is set to the RegisteredModel's `displayName` (fallback to `name`)
- **AND** `spec.type` is set to `ai-model`
- **AND** `metadata.annotations['rhdh.io/ai-model-family']` is set to the RegisteredModel's `name`
- **AND** `metadata.description` is set to the RegisteredModel's `description` (if present)
- **AND** `metadata.tags` includes any labels from the RegisteredModel metadata

#### Scenario: RegisteredModel with no displayName

- **WHEN** a RegisteredModel has no `displayName` field
- **THEN** `metadata.title` falls back to the RegisteredModel's `name`
- **AND** the entity is created successfully without errors

### Requirement: ModelVersion Entity Mapping

ModelVersion resources from Kubeflow API must map to Component entities with `spec.type: model-server`.

#### Scenario: ModelVersion is mapped to Component entity

- **WHEN** the provider fetches ModelVersions from `GET /api/v1/registered_models/{id}/versions`
- **THEN** each ModelVersion is converted to a Component entity
- **AND** `metadata.name` is set to `{RegisteredModel.name}-{ModelVersion.version}` (slugified)
- **AND** `metadata.title` is set to the ModelVersion's `displayName` (fallback to `version`)
- **AND** `spec.type` is set to `model-server`
- **AND** `metadata.annotations['rhdh.io/ai-asset-version']` is set to the normalized version (see Requirement: Version Normalization)
- **AND** `spec.owner` references the RegisteredModel's owner (if present)
- **AND** `metadata.annotations['rhdh.io/parent-ai-model']` references the RegisteredModel entity

#### Scenario: ModelVersion with container image reference

- **WHEN** a ModelVersion has a `containerImage` field
- **THEN** `metadata.annotations['rhdh.io/container-image']` is set to the container image URI
- **AND** if the image includes a digest, `metadata.annotations['rhdh.io/image-digest']` is set

### Requirement: Version Normalization

ModelVersion identifiers must normalize to the `rhdh.io/ai-asset-version` annotation format.

#### Scenario: Version normalization from Kubeflow API

- **WHEN** a ModelVersion has a `version` field
- **THEN** the provider normalizes it to semantic version format (e.g., `v1.0.0`, `1.0`, `latest`)
- **AND** the normalized version is stored in `metadata.annotations['rhdh.io/ai-asset-version']`
- **AND** the original version string is preserved in `metadata.annotations['rhdh.io/original-version']` (for audit)

#### Scenario: Version normalization edge cases

- **WHEN** a ModelVersion has version `latest` or `main` or `default`
- **THEN** `rhdh.io/ai-asset-version` is set to `latest` (lowercase)
- **AND** when a ModelVersion has version `v1.0.0-alpha.1` or `1.2.3-rc.2`
- **THEN** `rhdh.io/ai-asset-version` preserves the pre-release suffix
- **AND** when a ModelVersion has an invalid semantic version (e.g., `abc123`)
- **THEN** `rhdh.io/ai-asset-version` is set to the original value unchanged (no normalization)
- **AND** a warning is logged about the non-standard version format

### Requirement: Full Sync via applyMutation

The provider must use Backstage's `applyMutation` for full sync and incremental updates.

#### Scenario: Initial sync of all models and versions

- **WHEN** the provider connects for the first time
- **THEN** it fetches all RegisteredModels and all ModelVersions
- **AND** it calls `applyMutation({ type: 'full', entities: [...allEntities] })`
- **AND** previously existing entities not in the current fetch are marked for deletion by the catalog

#### Scenario: Incremental refresh with added/updated models

- **WHEN** the provider refreshes on a subsequent cycle
- **AND** new RegisteredModels or ModelVersions are detected
- **THEN** it includes the new entities in the next `applyMutation` call
- **AND** the catalog processes additions and updates without duplicate entity errors

### Requirement: API Error Handling

The provider must handle Kubeflow API errors gracefully without crashing the catalog backend.

#### Scenario: Kubeflow API returns 500 error

- **WHEN** the Kubeflow API returns a 500 Internal Server Error
- **THEN** the provider logs an error with the response status and body
- **AND** it returns the previously cached entity list (if available) or an empty array
- **AND** on the next refresh cycle, it retries the API call

#### Scenario: Kubeflow API pagination

- **WHEN** the Kubeflow API returns a `nextPageToken` in the response
- **THEN** the provider fetches subsequent pages using the token
- **AND** it accumulates all RegisteredModels/ModelVersions across pages before emitting entities
- **AND** it respects a maximum page limit (default 100 pages) to prevent infinite loops

### Requirement: Annotation Population

All emitted entities must include standard RHDH annotations for metadata richness.

#### Scenario: Entities include standard annotations

- **WHEN** the provider emits a RegisteredModel or ModelVersion entity
- **THEN** it includes `metadata.annotations['backstage.io/source-location']` pointing to the Kubeflow API URL
- **AND** it includes `metadata.annotations['backstage.io/managed-by-location']` set to the provider's location string
- **AND** it includes `metadata.annotations['rhdh.io/connector-type']` set to `rhoai-model-registry`
- **AND** it includes `metadata.annotations['rhdh.io/last-sync-time']` with the current timestamp
