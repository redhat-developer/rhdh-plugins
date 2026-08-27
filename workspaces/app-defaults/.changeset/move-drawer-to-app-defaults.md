---
'@red-hat-developer-hub/backstage-plugin-app-defaults': minor
'@red-hat-developer-hub/backstage-plugin-app-react': major
---

Move `appDrawerExtension` and `appDrawerModule` from `app-react` to
`app-defaults`.

- `@red-hat-developer-hub/backstage-plugin-app-defaults` now exports
  `appDrawerExtension` and `appDrawerModule` from its main entry point,
  and adds a `./app-drawer-module` subpath that default-exports
  `appDrawerModule` for Scalprum / module-federation dynamic loading.

- **BREAKING**: `@red-hat-developer-hub/backstage-plugin-app-react` no
  longer exports `appDrawerExtension` or `appDrawerModule`. The
  `./app-drawer-module` subpath has been removed. Update imports:

  ```diff
  -import { appDrawerModule } from '@red-hat-developer-hub/backstage-plugin-app-react';
  +import { appDrawerModule } from '@red-hat-developer-hub/backstage-plugin-app-defaults';
  ```

  `AppDrawerContentBlueprint`, `appDrawerContentDataRef`, `useAppDrawer`,
  and all drawer types remain in `app-react`.
