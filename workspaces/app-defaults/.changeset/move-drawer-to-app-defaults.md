---
'@red-hat-developer-hub/backstage-plugin-app-defaults': patch
'@red-hat-developer-hub/backstage-plugin-app-react': minor
---

Moved `appDrawerModule` from `@red-hat-developer-hub/backstage-plugin-app-react` into `@red-hat-developer-hub/backstage-plugin-app-defaults` where default module registrations belong. The reusable building blocks (`ApplicationDrawer`, `appDrawerContentDataRef`, `AppDrawerContentBlueprint`, `useAppDrawer`, `DrawerPanel`) remain in app-react.

**Migration:** Update your imports:

```diff
-import { appDrawerModule } from '@red-hat-developer-hub/backstage-plugin-app-react/alpha';
+import { appDrawerModule } from '@red-hat-developer-hub/backstage-plugin-app-defaults';
```
