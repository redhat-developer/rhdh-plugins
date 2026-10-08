# Proposal: AiModelServerAPI Kind

## Why

Platform engineers need to represent AI model servers in the Software Catalog with validated, discoverable metadata for server endpoints, authentication, and available models. Upstream [backstage/backstage#34476](https://github.com/backstage/backstage/pull/34476) adds this as a `specType` on the existing `API` kind, but that PR is pending approval. Registering the same `kind` + `specType` in rhdh-plugins would collide with upstream when it merges, so a dedicated `AiModelServerAPI` kind provides the functionality now while keeping migration trivial (change the kind field only).

Additionally, the model catalog entity provider currently emits three entity types per model server (Component + Resource + API), but the upstream design consolidates these into a single entity. Aligning the provider output now avoids a second breaking migration later.

## What Changes

- Add a dedicated `AiModelServerAPI` catalog kind with JSON schema, TypeScript types, KindValidator, type guard, and CatalogModelLayer registration using `addKind`.
- Add a backend module that registers the kind via `catalogModelExtensionPoint` using a bare `CatalogModelSource` (avoiding annotation collisions from `CatalogModelSources.static()` re-including the default entity model).
- **BREAKING**: Rewrite `ModelCatalogGenerator` to emit a single `AiModelServerAPI` entity per model server instead of separate Component, Resource, and API entities. Model names collected into `spec.models.available`.
- Fix the existing `catalog-backend-module-ai-resource-agent` module to also use a bare `CatalogModelSource` (prevents the same annotation collision when multiple custom kind modules are loaded).

## Capabilities

### New Capabilities

- `ai-model-server-api-schema`: Typed schema, TypeScript types, KindValidator, type guard, CatalogModelLayer registration, and backend module for the `AiModelServerAPI` kind with `spec.type: 'ai-model-server'`.
- `ai-model-server-entity-provider`: Entity provider consolidation — `ModelCatalogGenerator` emits a single `AiModelServerAPI` entity per model server with models, tags, links, annotations, and techdocs merged from the `ModelCatalog` data.

### Modified Capabilities

_(none — no existing specs in `openspec/specs/` are modified by this change)_

## Non-goals

- Upstream RFC or PR contribution (backstage/backstage#34476 is tracked separately)
- Migration processor to convert `AiModelServerAPI` → `API` when upstream merges
- Updating the ai-experience plugin consumer (tracked in follow-up issue #4254)
- Frontend entity page for `AiModelServerAPI`
- Changes to the `model-catalog-types` interface between entity provider and kserve connector

## Impact

- **Schema / types**: New TypeScript types and JSON schema in `catalog-model-ai-model-server` package
- **Backend module**: New `catalog-backend-module-ai-model-server` package registers the kind
- **Entity provider**: `catalog-backend-module-model-catalog` output changes from Component + Resource + API to single `AiModelServerAPI` (major version bump)
- **Side-effect fix**: `catalog-backend-module-ai-resource-agent` module updated to bare `CatalogModelSource` (patch version bump)
- **Dev backend**: `packages/backend/src/index.ts` wires the new module
- **Config**: `app-config.yaml` adds `AiModelServerAPI` to allowed kinds and catalog locations
