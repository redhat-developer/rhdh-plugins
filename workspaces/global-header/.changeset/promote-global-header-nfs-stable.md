---
'@red-hat-developer-hub/backstage-plugin-global-header': major
---

### Breaking: Promote NFS plugin to stable, deprecate OFS

The New Frontend System (NFS) plugin has been promoted from `/alpha` to the
main package entry point. The Old Frontend System (OFS) plugin has moved to
`/legacy` and is deprecated — it will be removed in a future release.

#### What changed

- **Main entry point (`/`)** now exports the NFS plugin (`createFrontendPlugin`),
  `globalHeaderModule` (AppRootWrapper), extension blueprints
  (`GlobalHeaderComponentBlueprint`, `GlobalHeaderMenuItemBlueprint`), data refs,
  context hooks, default toolbar/menu-item extensions, and building-block
  components.
- **`/legacy`** now exports the OFS plugin (`createPlugin`), component
  extensions (`GlobalHeader`, `CreateDropdown`, `ProfileDropdown`, etc.), and
  legacy mount-point defaults. This entry point is **deprecated**.
- **`/alpha`** now only re-exports translations. All other
  NFS exports that were previously here have moved to the main entry point.
  Importing the plugin, module, blueprints, or components from `/alpha` will
  no longer work — use the root import instead.
- Source layout restructured: NFS code moved from `src/alpha/` to `src/`;
  OFS-only code moved into `src/legacy/`; shared components remain in
  `src/components/`.

#### Migration steps

1. **NFS adopters** (using `@backstage/frontend-plugin-api`):
   Change imports from `@red-hat-developer-hub/backstage-plugin-global-header/alpha`
   to `@red-hat-developer-hub/backstage-plugin-global-header`.

2. **OFS adopters** (using `@backstage/core-plugin-api` with Scalprum/mount-points):
   Change imports from `@red-hat-developer-hub/backstage-plugin-global-header`
   to `@red-hat-developer-hub/backstage-plugin-global-header/legacy`.
   Plan migration to the NFS plugin before OFS support is removed.

3. **Dynamic plugin users**: The Scalprum `exposedModules` entry points are
   unchanged (`PluginRoot`, `Alpha`, `Legacy`, `GlobalHeaderModule`,
   `GlobalHeaderTranslationsModule`), so no `app-config.yaml` changes are
   needed.
