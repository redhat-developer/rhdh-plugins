---
'@red-hat-developer-hub/backstage-plugin-app-defaults': major
'@red-hat-developer-hub/backstage-plugin-app-auth': major
'@red-hat-developer-hub/backstage-plugin-app-integrations': major
'@red-hat-developer-hub/backstage-plugin-app-react': major
---

**BREAKING**: Graduate NFS exports from `/alpha` to the main entry point.

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
