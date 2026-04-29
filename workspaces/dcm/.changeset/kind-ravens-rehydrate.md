---
'@red-hat-developer-hub/backstage-plugin-dcm': minor
'@red-hat-developer-hub/backstage-plugin-dcm-common': minor
---

DCM UI and catalog client updates for the example app and published plugins.

**Example app (`packages/app`) — RBAC navigation**

- Removed the **RBAC** sidebar entry under Administration and the `/rbac` route.
- Dropped the `@backstage-community/plugin-rbac` frontend dependency. The RBAC backend plugin may remain for permissions; only the menu and page were removed.

**`@red-hat-developer-hub/backstage-plugin-dcm` — Resources tab**

- Removed the **Resources** tab from the Data Center page and all **Placement / `resources`** proxy usage from the plugin.
- Removed `placementApiRef`, `resources` route ref, and the `PlacementClient` integration from the plugin surface.

**`@red-hat-developer-hub/backstage-plugin-dcm-common` — placement API removed; catalog rehydrate**

- Removed the Placement API client, types, and tests tied to the internal `resources` API.
- Added **`rehydrateCatalogItemInstance`** on `CatalogApi` / `CatalogClient`: `POST .../catalog-item-instances/{id}:rehydrate`.

**Catalog item instances UI**

- Added a **Rehydrate** action (outlined button with refresh icon) on each instance row, success and error snackbars, and a unit test for the new client method.
