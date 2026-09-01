# @red-hat-developer-hub/backstage-plugin-app-defaults

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
