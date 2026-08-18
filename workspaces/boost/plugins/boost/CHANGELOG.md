# @red-hat-developer-hub/backstage-plugin-boost

## 0.5.1

### Patch Changes

- b6fc0d9: Add AI Catalog permissions (`ai-catalog.asset.access`, `ai-catalog.asset.access.usage-docs`, `ai-catalog.admin`), graduated visibility field/entity-level filtering, and conditional permission rules (`isAiAssetCategory`, `isFromConnector`, `isInTenant`). Adds a `CatalogService`-backed `AiCatalogAssetLoader` and wires `createAiCatalogRoutes` and a `getResources` callback into the boost backend plugin so conditional AI catalog authorization is backed by the real Backstage catalog instead of a stub. Updates a frontend TODO comment reference to the renamed `ai-catalog.asset.access.usage-docs` permission.

  **Type-only note for `boost-backend`:** the `zod` dependency range widened from `^3.23.8` to `^3.25.76 || ^4.0.0` (required for the `zod/v3` subpath import used by the new conditional permission rules to stay type-compatible with `@backstage/plugin-permission-node`). This changes the exported TypeScript shape of `boostConfigFields`'s `schema` properties — `ZodEnum` generics move from array form (`['a', 'b']`) to record form (`{a: 'a', b: 'b'}`), and a few `ZodEffects<ZodString, ...>` wrappers simplify to plain `ZodString`. Runtime validation behavior is unchanged; only TypeScript consumers referencing these exact nested generic types at the type level are affected.

  Two fixes from review: `CatalogAssetLoader`'s `isAiAsset()` guard now lowercases `spec.type` before matching against `AI_ASSET_SPEC_TYPES`, matching the frontend's equivalent check (previously a mixed-case `spec.type` would be accepted by the frontend but rejected by `findById()`). The list endpoint's Tier 1 (`ai-catalog.asset.access`) `CONDITIONAL` result now fails closed (returns no assets) instead of being treated as `ALLOW`, until entity-level condition filtering via `createConditionTransformer()` is implemented — this matches the conservative default already used for Tier 2 `CONDITIONAL`.

  Four more fixes from a second review pass:
  - **Fixed a router-shadowing bug in `boost-backend`'s plugin init:** the `ai-catalog-asset` resource type, its conditional rules, and `getResources` were registered on a manually-created `createPermissionIntegrationRouter(...)` mounted on the plugin's own router — but `coreServices.permissionsRegistry` already auto-mounts its own such router onto the same `httpRouter` before `init()` runs, so the manual one was unreachable dead code (the RBAC UI never saw the rules, and `/apply-conditions` for `ai-catalog-asset` would have failed). Registration now goes through `permissionsRegistry.addResourceType(...)`, the mechanism the framework actually serves requests from. Also corrected the `permissions` list passed at that call site from the full `aiCatalogPermissions` aggregate (which includes the non-resource-scoped `ai-catalog.admin`) to the resource-scoped `aiCatalogResourcePermissions`.
  - **Consolidated the AI asset kind/`spec.type` taxonomy** (`AI_ASSET_SPEC_TYPES`, `isAiAsset`, `buildAiAssetCatalogFilter`) into `boost-common` as new `@public` exports, removing the duplicated copy that previously lived in the `boost` frontend plugin (`utils/isAiAsset.ts`, now deleted) and the one in `boost-backend`'s `CatalogAssetLoader.ts`. `boost-common` now depends on `@backstage/catalog-model`.
  - **Changed the asset detail route** from `GET /ai-catalog/assets/:id` to `GET /ai-catalog/assets/:kind/:namespace/:name`. Asset ids are Backstage entity refs (`kind:namespace/name`), which contain both `:` and `/`; a single `:id` path segment required callers to percent-encode the whole ref, which was easy to miss. Splitting on the ref's own natural boundaries avoids that entirely.
  - Added `@red-hat-developer-hub/backstage-plugin-boost-common` as a new runtime dependency of the `boost` frontend plugin, needed to consume the consolidated taxonomy above.

  Three more fixes from a GA readiness audit:
  - **Implemented entity-level `CONDITIONAL` filtering on the list endpoint** (previously a documented "fail closed" TODO). When `ai-catalog.asset.access` returns `CONDITIONAL`, the list endpoint now evaluates the decision's condition tree against each catalog entity in memory via `createConditionAuthorizer(permissionsRegistry.getPermissionRuleset(...))` from `@backstage/plugin-permission-node`, reusing each rule's own `apply()` rather than translating conditions into catalog query syntax. `AiCatalogAssetLoader.list()` now accepts an optional `isAuthorized` predicate, and `AiCatalogRoutesOptions` gained `isResourceAuthorized`. `AiCatalogAssetResource` (from `rules.ts`) is now `@public` since it crosses this new interface boundary.
  - **Removed a second instance of the router-shadowing bug** fixed above for `ai-catalog-asset`, found this time in the general `boostPermissions` registration: `plugin.ts` built a second `createPermissionIntegrationRouter({ permissions: [...boostPermissions] })` mounted on the plugin's own router, which was unreachable dead code for the same reason (already shadowed by `coreServices.permissionsRegistry`'s auto-mounted router). This one predates this PR (confirmed present on `main` before this branch's changes) — removed as a correctness cleanup since we were already in this exact file for the same bug class.
  - Added test coverage asserting the _exact_ permission and `resourceRef` arguments passed to `authorize()`/`authorizeConditional()` (previously only mock return values were asserted, so a swapped permission constant wouldn't have been caught).

  Known follow-up (not addressed in this PR, tracked separately): the AI Catalog browse page (`useAiAssets`/`AiCatalogPage`) still calls `catalogApiRef.getEntities()` directly and does not yet enforce `ai-catalog.asset.access`/`.usage-docs` — this predates this PR (introduced in #3706) and is tracked as [RHIDP-15273](https://issues.redhat.com/browse/RHIDP-15273).

- Updated dependencies [b6fc0d9]
  - @red-hat-developer-hub/backstage-plugin-boost-common@0.4.0

## 0.5.0

### Minor Changes

- 238427a: Entity-Provider SDK — Types, Interfaces, Annotation Validation

## 0.4.0

### Minor Changes

- 9cfc354: Add type-appropriate adoption actions for all AI asset types in the AdoptionCard entity extension.
- 766e4aa: Add extensible browse filters via NFS AiCatalogFilterBlueprint. Deployers can disable built-in filters and third-party plugins can add new filters to the AI Catalog sidebar via app-config.

  **Breaking:** The page extension ID changed from `page:boost` to `page:boost/ai-catalog`. Update any `app.extensions` references in `app-config.yaml` accordingly.

### Patch Changes

- 69b063b: Revert icon imports from @mui/icons-material back to @remixicon/react to align with BUI's internal icon library. Remove unused @mui/icons-material and @mui/material dependencies.

## 0.3.0

### Minor Changes

- 606f57b: Implement AI Catalog browse page with card grid, table view, search, filters, and entity page extensions.

## 0.2.0

### Minor Changes

- 5551345: Scaffold AI Catalog frontend plugin, dev app, and dev backend. Adds NFS-only frontend plugin with PageBlueprint, EntityCardBlueprint/EntityContentBlueprint stubs, isAiAsset filter, useAiAssets hook, i18n scaffold, and sample catalog fixtures. Adds boost frontend package to pluginPackages in all boost-family packages.
