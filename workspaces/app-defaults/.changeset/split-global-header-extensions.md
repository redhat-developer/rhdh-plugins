---
'@red-hat-developer-hub/backstage-plugin-app-react': minor
'@red-hat-developer-hub/backstage-plugin-app-defaults': minor
---

Split global-header extension APIs into app-react and the default implementation into app-defaults.

`app-react` now exports `GlobalHeaderComponentBlueprint`, `GlobalHeaderMenuItemBlueprint`, related data refs, types, and context hooks so plugins can contribute header items without depending on the default implementation.

`app-defaults` now hosts the default global-header module, plugin, translations, and configuration, and loads them through the app-defaults feature loader.

Building-block UI (`GlobalHeaderMenuItem`, `GlobalHeaderIconButton`,
`GlobalHeaderDropdown`, `GlobalHeaderCompanyLogo`) is exported from
`@red-hat-developer-hub/backstage-plugin-app-defaults/global-header-components`.
The header logo export is named `GlobalHeaderCompanyLogo` so it does not
collide with the sidebar `CompanyLogo` on the package root.

Hosts that enable the app-defaults feature loader but do not want the masthead
can disable `app-root-wrapper:app/global-header`. Custom header/dropdown UI
must read extension data through the `app-react` hooks
(`useGlobalHeaderComponents` / `useGlobalHeaderMenuItems`).
