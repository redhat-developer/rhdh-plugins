# @red-hat-developer-hub/backstage-plugin-app-defaults

## 0.0.2

### Patch Changes

- 0ed09e3: Added `appDrawerModule` to the default package export. The module was moved from `@red-hat-developer-hub/backstage-plugin-app-react` into this plugin where default module registrations belong.

  **Migration:** Import `appDrawerModule` from the default entry point:

  ```ts
  import { appDrawerModule } from '@red-hat-developer-hub/backstage-plugin-app-defaults';
  ```

## 0.0.1

### Patch Changes

- 6388cc1: Initial release of the app-defaults frontend plugin
