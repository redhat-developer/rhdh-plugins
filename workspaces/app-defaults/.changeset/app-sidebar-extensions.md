---
'@red-hat-developer-hub/backstage-plugin-app-react': minor
'@red-hat-developer-hub/backstage-plugin-app-defaults': minor
---

Add dynamic sidebar extensions. `app-react` now exports `SidebarItemBlueprint` and `SidebarItemGroupBlueprint` so plugins can contribute sidebar entries and groups with a `priority`, plus `SidebarElementBlueprint` for entries that need their own React component, such as the search modal or the notifications item (an element's `to` hides items and pages with the same path), and `SidebarSpacerBlueprint` / `SidebarDividerBlueprint` for layout. `app-defaults` renders them through a new `nav-content:app/sidebar` extension (`appSidebarExtension`, also available as the `appSidebarModule` / `./app-sidebar-module` subpath) that orders entries by priority, nests grouped items below their group entry (or in a flyout submenu via `submenu: 'flyout'`), and merges the nav items Backstage auto-discovers from page extensions. The module ships a default layout with the search modal at the top, a spacer and dividers, and the notifications item, each of which can be disabled or moved from app-config.
