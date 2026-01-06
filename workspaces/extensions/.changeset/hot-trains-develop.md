---
'@red-hat-developer-hub/backstage-plugin-catalog-backend-module-extensions': minor
'@red-hat-developer-hub/backstage-plugin-extensions-backend': minor
'@red-hat-developer-hub/backstage-plugin-extensions-common': minor
'@red-hat-developer-hub/backstage-plugin-extensions': minor
'@red-hat-developer-hub/extensions-cli': minor
---

Renamed plugins from marketplace to extensions

- Renamed all packages from `backstage-plugin-marketplace-*` to `backstage-plugin-extensions-*`
- Updated all internal references, exports, and API endpoints
- Reduced frontend bundle size by lazy-loading Monaco editor
