---
'@red-hat-developer-hub/backstage-plugin-boost-backend': minor
'@red-hat-developer-hub/backstage-plugin-boost-common': minor
'@red-hat-developer-hub/backstage-plugin-boost': patch
---

Add AI Catalog permissions (`ai-catalog.asset.access`, `ai-catalog.asset.access.usage-docs`, `ai-catalog.admin`), graduated visibility field/entity-level filtering, and conditional permission rules (`isAiAssetCategory`, `isFromConnector`, `isInTenant`). Adds a `CatalogService`-backed `AiCatalogAssetLoader` and wires `createAiCatalogRoutes` and a `getResources` callback into the boost backend plugin so conditional AI catalog authorization is backed by the real Backstage catalog instead of a stub. Updates a frontend TODO comment reference to the renamed `ai-catalog.asset.access.usage-docs` permission.

**Type-only note for `boost-backend`:** the `zod` dependency range widened from `^3.23.8` to `^3.25.76 || ^4.0.0` (required for the `zod/v3` subpath import used by the new conditional permission rules to stay type-compatible with `@backstage/plugin-permission-node`). This changes the exported TypeScript shape of `boostConfigFields`'s `schema` properties — `ZodEnum` generics move from array form (`['a', 'b']`) to record form (`{a: 'a', b: 'b'}`), and a few `ZodEffects<ZodString, ...>` wrappers simplify to plain `ZodString`. Runtime validation behavior is unchanged; only TypeScript consumers referencing these exact nested generic types at the type level are affected.

Two fixes from review: `CatalogAssetLoader`'s `isAiAsset()` guard now lowercases `spec.type` before matching against `AI_ASSET_SPEC_TYPES`, matching the frontend's equivalent check (previously a mixed-case `spec.type` would be accepted by the frontend but rejected by `findById()`). The list endpoint's Tier 1 (`ai-catalog.asset.access`) `CONDITIONAL` result now fails closed (returns no assets) instead of being treated as `ALLOW`, until entity-level condition filtering via `createConditionTransformer()` is implemented — this matches the conservative default already used for Tier 2 `CONDITIONAL`.
