---
'@red-hat-developer-hub/backstage-plugin-extensions-common': minor
---

Normalize support-level terminology from `generally-available` to `production` in extensions schemas, shared support-level types, and related examples/docs.

**BREAKING**: Plugin metadata using `spec.support.level: generally-available` is no longer treated as GA by the extensions UI badge/filter logic. Migrate custom plugin metadata to `spec.support.level: production` to keep the same behavior.
