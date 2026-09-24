# @red-hat-developer-hub/backstage-plugin-app-defaults

## 1.9.0

### Minor Changes

- 376fb61: Sidebar items and groups can now be declared in `app-config.yaml` under `app.sidebar.items` and `app.sidebar.groups`. This is the primary way to add remote links and other simple entries without writing a plugin: they accept the same fields as `SidebarItemBlueprint` and `SidebarItemGroupBlueprint` (config items require a `to` link), are merged with the contributed extensions and ordered together by `priority`, and a configured group reusing the `id` of a contributed group (for example `admin`) overrides it.

  The same entries can also be split by plugin under `app.sidebar.plugins.<pluginName>`; all of them are flattened into one list. This form is primarily meant for the RHDH dynamic plugin configuration, where each plugin ships its own app-config fragment and arrays would otherwise overwrite each other, and it is used to ship sidebar defaults with some plugins such as the RBAC entry.

  For advanced use cases — action items with `onClick`, entries with their own React component, spacers and dividers, or entries a plugin ships together with its pages — use the sidebar blueprints from `@red-hat-developer-hub/backstage-plugin-app-react` instead.

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-app-react@1.9.0

## 1.8.1

### Patch Changes

- f5f0d02: Updated translations for RHDH 2.1 (s3297).
  - @red-hat-developer-hub/backstage-plugin-app-react@1.8.1

## 1.8.0

### Minor Changes

- 379ab12: Localize sidebar item titles via a new `pages` translation namespace (looked up by English label), relabel Create as Self-Service, and drop the dedicated Learning Paths sidebar item so it uses the shared pages i18n.
- d3313f9: When `appDefaultsFeatureLoader` (or the catalog / catalog-graph / api-docs plugin overrides) is enabled, NFS catalog entity pages match legacy RHDH: info cards on the left on Overview, Dependencies and System Diagram tabs, split relations graphs, and no API Definition card on Overview.

  Override or disable individual extensions in `app.extensions` as needed — see README **Catalog entity pages (NFS)**.

### Patch Changes

- Updated dependencies [379ab12]
  - @red-hat-developer-hub/backstage-plugin-app-react@1.8.0

## 1.7.0

### Minor Changes

- 5ff4557: Add dynamic sidebar extensions. `app-react` now exports `SidebarItemBlueprint` and `SidebarItemGroupBlueprint` so plugins can contribute sidebar entries and groups with a `priority`, plus `SidebarElementBlueprint` for entries that need their own React component, such as the search modal or the notifications item (an element's `to` hides items and pages with the same path), and `SidebarSpacerBlueprint` / `SidebarDividerBlueprint` for layout. `app-defaults` renders them through a new `nav-content:app/sidebar` extension (`appSidebarExtension`, also available as the `appSidebarModule` / `./app-sidebar-module` subpath) that orders entries by priority, nests grouped items below their group entry (or in a flyout submenu via `variant: 'flyout'`), and merges the nav items Backstage auto-discovers from page extensions. A sidebar item can set `requiresRoute` so it only renders when the app has a nav route matching its `to`, hiding entries that link to an optional plugin's page when that plugin is absent. The module ships a default layout with the company logo (`CompanyLogo`, driven by `app.branding.fullLogo` / `iconLogo` and the sidebar open state) and the search modal at the top, a spacer and dividers, the notifications item, an Administration group (`admin`) with a route-guarded RBAC item that stays hidden until the RBAC plugin (or another admin item) is present, and a Settings group (`settings`) at the bottom, each of which can be disabled or moved from app-config.

### Patch Changes

- Updated dependencies [5ff4557]
  - @red-hat-developer-hub/backstage-plugin-app-react@1.7.0

## 1.6.0

### Minor Changes

- c2c2ac7: Add a localized catalog entity header layout.

  `app-defaults` now ships `catalogModule`, a catalog plugin module that replaces the entity page header layout with `LocalizedEntityHeaderLayout`, translating the catalog tab and group titles. Titles are looked up dynamically by their English label under the `catalog.entityTabs.*` and `catalog.entityTabGroups.*` keys, so localizing a new title only requires a translation entry.

  `app-react` now provides:

  - `appReactTranslationRef` / `appReactTranslations` — the translation ref and resource for the catalog entity tab and group titles (de, es, fr, it, ja).
  - `EntityHeaderBui` and `EntityContextMenu` (with the `EntityContextMenuItemDataWithNode` type), exported from the new `@red-hat-developer-hub/backstage-plugin-app-react/alpha` entry point.

  **BREAKING**: the `app-defaults` translation ref export was renamed from `translationRef` to `appDefaultsTranslationRef`.

### Patch Changes

- Updated dependencies [c2c2ac7]
  - @red-hat-developer-hub/backstage-plugin-app-react@1.6.0

## 1.5.0

### Minor Changes

- c77ca30: Add AutoLogout support to the NFS app via `autoLogoutElement` (`AppRootElementBlueprint`).

  The AutoLogout mechanism is disabled by default (`enabled: false`) and reads its
  configuration from `auth.autologout.*` in `app-config.yaml`, matching the behaviour
  of the legacy OFS implementation (RHIDP-9394). Operators opt in by setting
  `auth.autologout.enabled: true`.

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-app-react@1.5.0

## 1.4.0

### Minor Changes

- 947374a: Add the Learning Paths NFS module (`learningPathsModule`) with a `/learning-paths` page, Developer Hub proxy-backed data, static JSON fallback, and localized page and nav titles. Also exports `translationRef` and documents the `developerHub.proxyPath` config key.

  Updated Backstage version to 1.54.6

### Patch Changes

- Updated dependencies [947374a]
  - @red-hat-developer-hub/backstage-plugin-app-react@1.4.0

## 1.3.0

### Minor Changes

- 3625dd9: Backstage version bump to v1.54.6

### Patch Changes

- Updated dependencies [3625dd9]
  - @red-hat-developer-hub/backstage-plugin-app-react@1.3.0

## 1.2.1

### Patch Changes

- d58308f: Move the empty-state action button into `EmptyCatalogGate`. Custom pages now pass an `importButtonTitle` string instead of an `action` element, and the gate renders a single "import" button. The button is only shown when the `page:catalog-import` extension is installed (its route is also used to resolve the button's href) and the user has permission to create catalog entities (`catalog.entity.create`).
  - @red-hat-developer-hub/backstage-plugin-app-react@1.2.1

## 1.2.0

### Minor Changes

- 365fcd8: Moved `appDrawerExtension` and `appDrawerModule` from `app-react` into `app-defaults`. The drawer module is now available as both a named export from the main entry point and a default export via the `/app-drawer-module` subpath of `@red-hat-developer-hub/backstage-plugin-app-defaults`. `ApplicationDrawer` is now exported from the main entry point of `app-react`.

### Patch Changes

- 6c5ba66: Clarify the empty-state descriptions to make clear that there may be no catalog entities yet or that the user may lack permission to view any, and change the catalog and catalog graph titles from "No catalog items found" to "No catalog items available". Updated all translations (de, es, fr, it, ja).
- Updated dependencies [365fcd8]
  - @red-hat-developer-hub/backstage-plugin-app-react@1.2.0

## 1.1.0

### Minor Changes

- a05b689: Add empty-state page overrides for the catalog, catalog graph, scaffolder, API docs, and TechDocs plugins.

  Each override checks whether matching catalog entities exist before rendering the original page. When none are found, a translatable empty state with an illustration, an action link, and a support button is shown instead. All overrides plus the existing app defaults module are registered together through a `createFrontendFeatureLoader` default export, so a single package import loads everything. Translations are provided for English (default), German, Spanish, French, Italian, and Japanese.

- f338ef4: Expose the catalog, catalog graph, scaffolder, API docs, and TechDocs empty-state plugin overrides as individual package subpath exports (for example `@red-hat-developer-hub/backstage-plugin-app-defaults/catalog-plugin-override`), matching the `./app-defaults-translations-module` convention. Each subpath default-exports its override so it can be loaded individually; the feature loader default export continues to bundle all of them.

### Patch Changes

- b3f837f: Updated dependency `react-router-dom` to `^6.30.6`.
  - @red-hat-developer-hub/backstage-plugin-app-react@1.1.0

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

### Minor Changes

- a99d839: Register the RHDH common icon catalog on `appDefaultsModule` via `IconBundleBlueprint`, so NFS apps get the same named icons as the legacy shell without wiring them in `packages/app-next`.

### Patch Changes

- Updated dependencies [5e5436b]
- Updated dependencies [277f374]
  - @red-hat-developer-hub/backstage-plugin-app-react@1.0.0

## 0.1.0

### Minor Changes

- 74e0af0: Added extensible TemplateCard with NFS extension points for customizing the scaffolder template card action button and contributing badges.

### Patch Changes

- Updated dependencies [74e0af0]
  - @red-hat-developer-hub/backstage-plugin-app-react@0.2.0

## 0.0.3

### Patch Changes

- 7f30033: Pin `electron-to-chromium` to `1.5.349` via Yarn resolutions so hermetic Konflux/Hermeto builds do not float to freshly published versions that 404 on the cluster npm proxy.
- Updated dependencies [7f30033]
  - @red-hat-developer-hub/backstage-plugin-app-react@0.1.2

## 0.0.2

### Patch Changes

- 200a34e: Include the app drawer extension in the app-defaults dynamic plugin module so it is available on cluster deployments.
- Updated dependencies [200a34e]
  - @red-hat-developer-hub/backstage-plugin-app-react@0.1.1

## 0.0.1

### Patch Changes

- 6388cc1: Initial release of the app-defaults frontend plugin
