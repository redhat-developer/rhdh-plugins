---
'@red-hat-developer-hub/backstage-plugin-bulk-import': major
---

Simplified bulk-import routing structure:

- The plugin now uses a single `/bulk-import` path instead of multiple paths
- Removed `/bulk-import/repositories`, `/bulk-import/repositories/repositories`, and `/bulk-import/repositories/add` routes
- Any undefined paths under `/bulk-import/*` will redirect to `/bulk-import`
- **BREAKING**: Removed `addRepositoriesRouteRef` from plugin exports
