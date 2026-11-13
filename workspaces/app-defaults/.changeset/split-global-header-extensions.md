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

Default toolbar/menu items are also available from the dedicated
`./global-header` entry (`globalHeaderPlugin`).

Hosts that enable the app-defaults feature loader but do not want the masthead
can disable `app-root-wrapper:app/global-header`. Custom header/dropdown UI
must read extension data through the `app-react` hooks
(`useGlobalHeaderComponents` / `useGlobalHeaderMenuItems`).

`HeaderIcon` resolves icons via `iconsApi` and falls back to
`useApp().getSystemIcon` so legacy host icon catalogs keep working.

The common icon bundle adds Material Icons ligature aliases
(`waving_hand` → same glyph as `quickstart`, plus snake_case variants of
camelCase ids such as `manage_accounts`) so remotes that still pass
ligature ids render on hosts that do not load the Material Icons font.
