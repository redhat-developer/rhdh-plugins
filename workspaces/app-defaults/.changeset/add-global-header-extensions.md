---
'@red-hat-developer-hub/backstage-plugin-app-react': minor
'@red-hat-developer-hub/backstage-plugin-app-defaults': minor
---

Moved the global header into app-defaults and split extension APIs into app-react.

`app-react` exports `GlobalHeaderComponentBlueprint`, `GlobalHeaderMenuItemBlueprint`,
related data refs, types, and context hooks
(`useGlobalHeaderComponents` / `useGlobalHeaderMenuItems`) so plugins can contribute
header items without depending on the default implementation.

`app-defaults` hosts the default module, plugin, translations, and configuration, and
loads them through the feature loader. Default toolbar/menu items are also available
from `./global-header` (`globalHeaderPlugin`). Building-block UI
(`GlobalHeaderMenuItem`, `GlobalHeaderIconButton`, `GlobalHeaderDropdown`,
`GlobalHeaderCompanyLogo`) is exported from `/global-header-components`. The header
logo export is named `GlobalHeaderCompanyLogo` so it does not collide with the sidebar
`CompanyLogo` on the package root.

`HeaderIcon` resolves icons via `iconsApi` and falls back to `useApp().getSystemIcon`
so legacy host icon catalogs keep working. The common icon bundle adds Material Icons
ligature aliases (`waving_hand` → same glyph as `quickstart`, plus snake_case variants
of camelCase ids such as `manage_accounts`) so remotes that still pass ligature ids
render on hosts that do not load the Material Icons font.

**BREAKING:** `@red-hat-developer-hub/backstage-plugin-global-header` is discontinued
(the standalone `workspaces/global-header` workspace is removed). Migrate imports to
`@red-hat-developer-hub/backstage-plugin-app-defaults` and
`@red-hat-developer-hub/backstage-plugin-app-react`. Building-block UI that used
`/components` now lives at `/global-header-components`.

**BREAKING:** The app-defaults feature loader now registers the global header masthead
by default. Disable `app-root-wrapper:app/global-header` if you do not want it.
