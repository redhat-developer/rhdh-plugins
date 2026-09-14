---
'@red-hat-developer-hub/backstage-plugin-app-defaults': minor
'@red-hat-developer-hub/backstage-plugin-app-react': minor
---

Moved `appDrawerExtension` and `appDrawerModule` from `app-react` into `app-defaults`. The drawer module is now available as both a named export from the main entry point and a default export via the `/app-drawer-module` subpath of `@red-hat-developer-hub/backstage-plugin-app-defaults`. `ApplicationDrawer` is now exported from the main entry point of `app-react`.
