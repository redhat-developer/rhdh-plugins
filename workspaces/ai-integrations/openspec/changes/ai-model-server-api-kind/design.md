# Design: AiModelServerAPI Kind

## Context

Upstream [backstage/backstage#34476](https://github.com/backstage/backstage/pull/34476) adds `ai-model-server` as a `specType` on the existing `API` kind in `@backstage/catalog-model`. That PR is pending approval. The `model-catalog` entity provider in rhdh-plugins currently emits Component + Resource + API entities per model server, which diverges from the upstream single-entity design.

Registering the same `kind: API` + `specType: ai-model-server` combination in rhdh-plugins would collide with upstream when it merges — `compileCatalogModel` rejects duplicate annotation declarations. A dedicated kind avoids this while keeping the schema identical for easy migration.

**Stakeholders**: RHDH AI team; platform engineers consuming model server entities; kserve-kubeflow-connector (upstream data source).

## Goals / Non-Goals

**Goals:**

- Define a dedicated `AiModelServerAPI` kind with schema identical to upstream #34476
- Register the kind without colliding with existing or future upstream registrations
- Consolidate entity provider output from 3 entity types to 1 AiModelServerAPI entity
- Preserve the `model-catalog-types` interface between entity provider and kserve connector
- Document migration path for when upstream merges

**Non-Goals:**

- Upstream contribution (tracked separately in backstage/backstage#34476)
- Migration processor (`AiModelServerAPI` → `API` conversion)
- AI Experience plugin consumer updates (tracked in issue #4254)
- Frontend entity page for AiModelServerAPI
- Changes to kserve-kubeflow-connector-backend

## Decisions

### D1 — Dedicated kind instead of extending API kind

**Choice**: Register a new `AiModelServerAPI` kind via `addKind`, rather than adding `specType: ai-model-server` to the existing `API` kind via `addKindVersion`.

**Alternatives considered**: Using `addKindVersion` on the `API` kind (original plan per issue #4209). Rejected because two modules declaring the same `kind` + `specType` would crash the catalog plugin on startup when upstream #34476 merges.

**Rationale**: Avoids registration collision. Schema is identical to upstream — only the `kind` field differs — so migration is a single field change per entity.

### D2 — `addKind` not `addKindVersion`

**Choice**: Use `model.addKind()` in the `CatalogModelLayer` builder.

**Alternatives considered**: `model.addKindVersion()` as used by the sibling `AiResource` agent layer. Rejected because `addKindVersion` requires the kind to already be declared in the catalog model, which is true for `AiResource` (declared upstream) but not for `AiModelServerAPI` (brand new).

**Rationale**: `addKind` declares the kind with its group, names, description, and versions in a single call.

### D3 — Bare `CatalogModelSource` instead of `CatalogModelSources.static()`

**Choice**: Implement `CatalogModelSource` directly with an async generator that yields only the custom layer.

**Alternatives considered**: `CatalogModelSources.static([layer])` as documented in the Backstage API. Rejected because `static()` auto-includes the `default-entity-model` layer. When multiple modules each call `static()`, annotations like `backstage.io/managed-by-location` get declared multiple times, crashing the catalog plugin.

**Rationale**: Lets the catalog plugin provide the default model once. Applied to both `ai-model-server` and `ai-resource-agent` modules.

### D4 — Register under `backstage.io` group

**Choice**: Use `group: 'backstage.io'` so entities have `apiVersion: backstage.io/v1alpha1`.

**Alternatives considered**: A vendor-specific group like `redhat.com`. Rejected because migration to the upstream `API` kind (which uses `backstage.io`) would require changing both `kind` and `apiVersion` instead of just `kind`.

**Rationale**: Minimizes migration surface. Temporary namespace squatting is acceptable given the documented migration plan.

### D5 — Upstream naming conventions over workspace conventions

**Choice**: Use upstream naming (`AiModelServerApiEntity`, `aiModelServerApiEntityValidator`, no version suffix) instead of the workspace pattern (`AgentAiResourceEntityV1alpha1`, `agentAiResourceEntityV1alpha1Validator`).

**Alternatives considered**: Workspace naming pattern. Rejected because the kind is temporary — when upstream merges, consumers should need minimal renaming.

**Rationale**: Parity with upstream for easier migration. The type guard also omits the `apiVersion` check (unlike the sibling `isAgentAiResourceEntity`) because `AiModelServerAPI` is a dedicated kind where `kind` alone is unambiguous.

### D6 — Guard on missing API URL

**Choice**: Return `[]` from `GenerateCatalogEntities` when `modelServer.API?.url` is falsy.

**Alternatives considered**: Default to a placeholder URL. Rejected because the schema declares `serverUrl` with `minLength: 1`, so an empty string would fail validation.

**Rationale**: Better to skip entity generation than emit an invalid entity.

### D7 — Single entity per model server

**Choice**: Emit one `AiModelServerAPI` entity per `ModelCatalog` instead of Component + Resource + API.

**Alternatives considered**: Keep the existing 3-entity output. Rejected because the upstream design uses a single entity, and maintaining a divergent shape would require a second breaking migration later.

**Rationale**: Aligns with upstream. Models are listed in `spec.models.available`. Tags, links, annotations, and techdocs from the model server, API, and first model are merged into the single entity.

**Data flow**: The kserve connector reads InferenceService resources and produces a `ModelCatalog` containing a `ModelServer` and an array of `Model` objects. `ModelCatalogGenerator` transforms each `ModelCatalog` into a single `AiModelServerAPI` entity. Two annotation-driven mechanisms extend this flow:

1. **Field overrides** — When `rhdh.io/system`, `rhdh.io/serverType`, `rhdh.io/default` `rhdh.io/owner`, or `rhdh.io/lifecycle1 annotations are present on the InferenceService, the kserve connector propagates them to `modelServer.annotations`. `ModelCatalogGenerator` reads these control annotations and maps them to spec-level fields (`spec.system`, `spec.serverType`, `spec.models.default`, `spec.owner`, `spec.lifecycle`respectively), then deletes them from the annotation set so they do not appear in the emitted entity's`metadata.annotations`.

2. **Model generation from annotations** — When one or more `rhdh.io/model-*` annotations are present on the InferenceService, the kserve connector creates a `Model` object for each annotation value instead of deriving a single model from the InferenceService name. The resulting models flow through `ModelCatalogGenerator` into `spec.models.available` in the same way as the default single-model path.

## Risks / Trade-offs

| Risk                                                                  | Mitigation                                                                                            |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Upstream kind shape diverges from our schema                          | Schema mirrors #34476 exactly; only `kind` differs. Monitor upstream PR.                              |
| `backstage.io` group conflicts with upstream at registration time     | Dedicated kind name prevents `kind` + `specType` collision. When upstream merges, retire this module. |
| Entity provider breaking change impacts consumers                     | Major changeset bump signals the break. Only known in-repo consumer (ai-experience) tracked in #4254. |
| `CatalogModelSources.static()` pattern restored by future contributor | Bare `CatalogModelSource` pattern is documented in code comments and this design.                     |
| Multiple models' techdocs silently dropped                            | First model's techdocs used as representative. Entity represents the server, not individual models.   |

## Migration Plan

When upstream backstage/backstage#34476 merges:

1. Write a catalog processor that reads `AiModelServerAPI` entities and emits `API` entities with `spec.type: 'ai-model-server'` (change kind field only)
2. Switch entity provider to emit `kind: 'API'` instead of `kind: 'AiModelServerAPI'`
3. Retire `catalog-model-ai-model-server` and `catalog-backend-module-ai-model-server` packages
4. Revert `catalog-backend-module-ai-resource-agent` to `CatalogModelSources.static()` if upstream fixes the duplicate default-model issue

Rollback: Remove the new packages and revert `ModelCatalogGenerator` to the Component + Resource + API output. The kserve connector interface is unchanged.

## Open Questions

1. Whether the `backstage.io` group will cause issues in RHDH product builds that also load the upstream `@backstage/plugin-catalog-backend-module-ai-model` (which registers `ai-model-server` on the `API` kind). The dedicated `AiModelServerAPI` kind name should prevent collision, but needs verification in the product build context.
