# @red-hat-developer-hub/backstage-plugin-app-react

## 0.2.0

### Minor Changes

- 0ed09e3: **BREAKING:** Removed `appDrawerModule` from this package. The module has been moved to `@red-hat-developer-hub/backstage-plugin-app-defaults` where default module registrations belong.

  **Migration:** Update your imports:

  ```diff
  -import { appDrawerModule } from '@red-hat-developer-hub/backstage-plugin-app-react/alpha';
  +import { appDrawerModule } from '@red-hat-developer-hub/backstage-plugin-app-defaults';
  ```

  The reusable building blocks (`ApplicationDrawer`, `appDrawerContentDataRef`, `AppDrawerContentBlueprint`, `useAppDrawer`, `DrawerPanel`) remain in this package.

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
