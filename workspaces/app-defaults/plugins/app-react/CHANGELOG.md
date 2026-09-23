# @red-hat-developer-hub/backstage-plugin-app-react

## 1.8.1

## 1.8.0

### Minor Changes

- 379ab12: Localize sidebar item titles via a new `pages` translation namespace (looked up by English label), relabel Create as Self-Service, and drop the dedicated Learning Paths sidebar item so it uses the shared pages i18n.

## 1.7.0

### Minor Changes

- 5ff4557: Add dynamic sidebar extensions. `app-react` now exports `SidebarItemBlueprint` and `SidebarItemGroupBlueprint` so plugins can contribute sidebar entries and groups with a `priority`, plus `SidebarElementBlueprint` for entries that need their own React component, such as the search modal or the notifications item (an element's `to` hides items and pages with the same path), and `SidebarSpacerBlueprint` / `SidebarDividerBlueprint` for layout. `app-defaults` renders them through a new `nav-content:app/sidebar` extension (`appSidebarExtension`, also available as the `appSidebarModule` / `./app-sidebar-module` subpath) that orders entries by priority, nests grouped items below their group entry (or in a flyout submenu via `variant: 'flyout'`), and merges the nav items Backstage auto-discovers from page extensions. A sidebar item can set `requiresRoute` so it only renders when the app has a nav route matching its `to`, hiding entries that link to an optional plugin's page when that plugin is absent. The module ships a default layout with the company logo (`CompanyLogo`, driven by `app.branding.fullLogo` / `iconLogo` and the sidebar open state) and the search modal at the top, a spacer and dividers, the notifications item, an Administration group (`admin`) with a route-guarded RBAC item that stays hidden until the RBAC plugin (or another admin item) is present, and a Settings group (`settings`) at the bottom, each of which can be disabled or moved from app-config.

## 1.6.0

### Minor Changes

- c2c2ac7: Add a localized catalog entity header layout.

  `app-defaults` now ships `catalogModule`, a catalog plugin module that replaces the entity page header layout with `LocalizedEntityHeaderLayout`, translating the catalog tab and group titles. Titles are looked up dynamically by their English label under the `catalog.entityTabs.*` and `catalog.entityTabGroups.*` keys, so localizing a new title only requires a translation entry.

  `app-react` now provides:

  - `appReactTranslationRef` / `appReactTranslations` — the translation ref and resource for the catalog entity tab and group titles (de, es, fr, it, ja).
  - `EntityHeaderBui` and `EntityContextMenu` (with the `EntityContextMenuItemDataWithNode` type), exported from the new `@red-hat-developer-hub/backstage-plugin-app-react/alpha` entry point.

  **BREAKING**: the `app-defaults` translation ref export was renamed from `translationRef` to `appDefaultsTranslationRef`.

## 1.5.0

## 1.4.0

### Patch Changes

- 947374a: Add the Learning Paths NFS module (`learningPathsModule`) with a `/learning-paths` page, Developer Hub proxy-backed data, static JSON fallback, and localized page and nav titles. Also exports `translationRef` and documents the `developerHub.proxyPath` config key.

  Updated Backstage version to 1.54.6

## 1.3.0

### Minor Changes

- 3625dd9: Backstage version bump to v1.54.6

## 1.2.1

## 1.2.0

### Minor Changes

- 365fcd8: Moved `appDrawerExtension` and `appDrawerModule` from `app-react` into `app-defaults`. The drawer module is now available as both a named export from the main entry point and a default export via the `/app-drawer-module` subpath of `@red-hat-developer-hub/backstage-plugin-app-defaults`. `ApplicationDrawer` is now exported from the main entry point of `app-react`.

## 1.1.0

## 1.0.0

### Major Changes

- 277f374: **BREAKING**: Graduate NFS exports from `/alpha` to the main entry point.

  - All public APIs previously available from `./alpha` are now exported from the
    package root (`.`). Update imports:

    ```diff
    -import { appAuthModule } from '@red-hat-developer-hub/backstage-plugin-app-auth/alpha';
    +import { appAuthModule } from '@red-hat-developer-hub/backstage-plugin-app-auth';

    -import { appIntegrationsModule } from '@red-hat-developer-hub/backstage-plugin-app-integrations/alpha';
    +import { appIntegrationsModule } from '@red-hat-developer-hub/backstage-plugin-app-integrations';

    -import { appDrawerModule, AppDrawerContentBlueprint } from '@red-hat-developer-hub/backstage-plugin-app-react/alpha';
    +import { appDrawerModule, AppDrawerContentBlueprint } from '@red-hat-developer-hub/backstage-plugin-app-react';

    -import { appDefaultsModule } from '@red-hat-developer-hub/backstage-plugin-app-defaults/alpha';
    +import { appDefaultsModule } from '@red-hat-developer-hub/backstage-plugin-app-defaults';
    ```

  - The `./alpha` subpath has been removed from `app-defaults` and `app-react`.
    `app-auth` retains `./alpha` for translation exports (`signInTranslationRef`).
    `app-integrations` retains `./alpha` with reduced exports (only
    `mergeScmAuthFromDeps` and `ScmAuthFactoryDeps`; `appIntegrationsModule`
    moved to the root entry).

  - **`@red-hat-developer-hub/backstage-plugin-app-react`**: `ApplicationDrawer`
    and `DrawerPanel` value exports have been removed from the main entry point.
    They are now only available from the new `./legacy` subpath. If you import
    these components directly, update your imports:

    ```diff
    -import { ApplicationDrawer, DrawerPanel } from '@red-hat-developer-hub/backstage-plugin-app-react';
    +import { ApplicationDrawer, DrawerPanel } from '@red-hat-developer-hub/backstage-plugin-app-react/legacy';
    ```

    The `./legacy` subpath also re-exports `useAppDrawer` and associated types
    for backward compatibility with OFS consumers.

  - `@red-hat-developer-hub/backstage-plugin-app-react` adds a new
    `./app-drawer-module` subpath that default-exports `appDrawerModule`
    (`pluginId: 'app'`) for Scalprum / module-federation dynamic loading.

  - All `pluginId: 'app'` modules are now re-exported as the default export from
    their respective packages.

### Patch Changes

- 5e5436b: Migrate `AppDrawerContentBlueprint` to `configSchema` for Backstage `frontend-plugin-api@0.18.0` compatibility.

## 0.2.0

### Minor Changes

- 74e0af0: Added extensible TemplateCard with NFS extension points for customizing the scaffolder template card action button and contributing badges.

## 0.1.2

### Patch Changes

- 7f30033: Pin `electron-to-chromium` to `1.5.349` via Yarn resolutions so hermetic Konflux/Hermeto builds do not float to freshly published versions that 404 on the cluster npm proxy.

## 0.1.1

### Patch Changes

- 200a34e: Include the app drawer extension in the app-defaults dynamic plugin module so it is available on cluster deployments.

## 0.1.0

### Minor Changes

- bf36f65: Backstage version bump to v1.52.1

## 0.0.5

### Patch Changes

- 5148408: Migrated to Jest 30 as required by @backstage/cli 0.36.0.

## 0.0.4

### Patch Changes

- 351d260: Removed the header specific style overrides for drawer

## 0.0.3

### Patch Changes

- 5e9716e: Replace context based state with global store.

## 0.0.2

### Patch Changes

- a86326d: Backstage version bump to v1.49.3

## 0.0.1

### Patch Changes

- 61d0d2e: Add the first version of Application Drawer and its Blueprint.
