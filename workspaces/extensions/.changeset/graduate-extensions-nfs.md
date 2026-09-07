---
'@red-hat-developer-hub/backstage-plugin-extensions': major
---

**BREAKING:** Graduate NFS plugin exports from `/alpha` to the primary package entry point. OFS exports move to `/legacy`. Translation resources remain at `/alpha`; the NFS translations module is available at `/translations`.

- NFS apps: import the plugin from `@red-hat-developer-hub/backstage-plugin-extensions` and translations from `@red-hat-developer-hub/backstage-plugin-extensions/translations`.
- Legacy OFS apps: import routers, icons, and `extensionsPlugin` from `@red-hat-developer-hub/backstage-plugin-extensions/legacy`.
- Dynamic plugin config: add `module: Legacy` for `dynamicRoutes` and `appIcons` that use OFS exports. Translation resources continue to use `module: Alpha`.
- The `./extensions-translations-module` subpath is renamed to `./translations`.
