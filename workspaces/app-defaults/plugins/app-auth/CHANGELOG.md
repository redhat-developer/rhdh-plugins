# @red-hat-developer-hub/backstage-plugin-app-auth

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

## 0.2.0

### Minor Changes

- 04e09fb: **BREAKING**: `SignInPage` is no longer exported from `@red-hat-developer-hub/backstage-plugin-app-auth/alpha`. Use `appAuthModule` (or the package default export); the page loads through `SignInPageBlueprint` with a dynamic `import()`.

  Replaces `import appPlugin from '@backstage/plugin-app'` + extension override with `SignInPageBlueprint` from `@backstage/plugin-app-react` so the NFS alpha Module Federation sync chunk no longer pulls the full `@backstage/plugin-app` tree (AppRoot, `@backstage/ui`, framer-motion, markdown, MUI v4).

## 0.1.1

### Patch Changes

- 7f30033: Pin `electron-to-chromium` to `1.5.349` via Yarn resolutions so hermetic Konflux/Hermeto builds do not float to freshly published versions that 404 on the cluster npm proxy.

## 0.1.0

### Minor Changes

- bf36f65: Backstage version bump to v1.52.1

### Patch Changes

- d7f7899: Make signInPage config optional and derive signInPage cards from configs defined under auth.providers

## 0.0.3

### Patch Changes

- c446456: Supports the upstream Keycloak and PingFederate auth providers in the sign-in page.

## 0.0.2

### Patch Changes

- 5148408: Migrated to Jest 30 as required by @backstage/cli 0.36.0.

## 0.0.1

### Patch Changes

- 43c25e2: # New auth and integration plugins for the new frontend system

  Introduces app-auth (sign-in + auth APIs) and app-integrations (default ScmAuth), migrated from RHDH’s old frontend wiring. Better misconfiguration errors for sign-in, less noisy test logs, ESLint fixes for pre-commit, and README updates.
