---
'@red-hat-developer-hub/backstage-plugin-boost-backend': minor
'@red-hat-developer-hub/backstage-plugin-boost-common': minor
---

Add AI Catalog permissions (`ai-catalog.asset.access`, `ai-catalog.asset.access.usage-docs`, `ai-catalog.admin`), graduated visibility field/entity-level filtering, and conditional permission rules (`isAiAssetCategory`, `isFromConnector`, `isInTenant`). Adds a `CatalogService`-backed `AiCatalogAssetLoader` and wires `createAiCatalogRoutes` and a `getResources` callback into the boost backend plugin so conditional AI catalog authorization is backed by the real Backstage catalog instead of a stub.
