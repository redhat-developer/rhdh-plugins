---
'@red-hat-developer-hub/backstage-plugin-global-header': major
---

**BREAKING**: Import building blocks (`GlobalHeaderIconButton`, `GlobalHeaderMenuItem`, `GlobalHeaderDropdown`) only from `@red-hat-developer-hub/backstage-plugin-global-header/components` — they are no longer re-exported from the root entry or deprecated `/alpha` (which now exports translations only). Prefer dynamic `import()` inside blueprint loaders.

**BREAKING**: `HeaderIcon` no longer falls back to Material Icons ligatures for unknown ids — unregistered ids render a Material Symbols Outlined `shapes` fallback. Register icons via host `app.getSystemIcon`, `globalHeaderModule`'s `IconBundleBlueprint`, or use inline SVG / image URLs. Update `globalHeader.menuItems[].icon` and `globalHeader.components[].icon` values that relied on ligatures (e.g. `menu_book`, `waving_hand`, `hub`) to registered system-icon ids (see docs/components/button-and-icons.md) or SVG/URL.

Building-block UI lives on the `/components` package subpath (`src/componentsExport.ts`) so the AppBar and heavy MUI UI stay off the root NFS sync chunk. Other plugins import it at compile/export time into their own async chunks (via a blueprint `loader`); it is not a host-loaded Module Federation feature. The root entry still registers outlined system icons via `IconBundleBlueprint` (twelve `@mui/icons-material` modules — much smaller than the full AppBar bundle).

`globalHeaderModule` registers system icon ids (`article`, `bugReport`, `quiz`, `forum`, `dashboard`, etc.) as outlined MUI SVGs for config and default extensions.

On-mount header widgets (AppBar, logo, search input, spacers, icon buttons, dropdown _triggers_) share a single async chunk via `src/components/onMountHeaderBundle.ts`. Dropdown menus, starred lists, and search-result rows stay on separate `import()` split points so they are not required for first paint.
