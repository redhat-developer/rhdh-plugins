---
'@red-hat-developer-hub/backstage-plugin-global-header': major
---

**BREAKING**: Import building blocks (`GlobalHeaderIconButton`, `GlobalHeaderMenuItem`, `GlobalHeaderDropdown`) only from `@red-hat-developer-hub/backstage-plugin-global-header/components` — they are no longer re-exported from the root entry or deprecated `/alpha` (which now exports translations only). Prefer dynamic `import()` inside blueprint loaders.

**BREAKING**: `HeaderIcon` no longer falls back to Material Icons ligatures for unknown ids — unregistered ids render nothing. Register icons via host `app.getSystemIcon`, `globalHeaderModule`'s `IconBundleBlueprint`, or use inline SVG / image URLs. Update `globalHeader.menuItems[].icon` and `globalHeader.components[].icon` values that relied on ligatures (e.g. `menu_book`, `waving_hand`, `hub`) to registered system-icon ids (see docs/components/button-and-icons.md) or SVG/URL.

Building-block UI lives on the `/components` Module Federation expose (`src/componentsExport.ts`) so the AppBar and heavy MUI UI stay off the root NFS sync chunk. The root entry still registers outlined system icons via `IconBundleBlueprint` (twelve `@mui/icons-material` modules — much smaller than the full AppBar bundle).

`globalHeaderModule` registers system icon ids (`article`, `bugReport`, `quiz`, `forum`, `dashboard`, etc.) as outlined MUI SVGs for config and default extensions.
