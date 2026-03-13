---
'@red-hat-developer-hub/backstage-plugin-scorecard-backend': patch
---

Normalize entity owners to their full canonical reference when syncing. Catalog entities are able to define a short name or the full entity reference for group ownership. This can lead to inconsistent filtering as we utilize the full entity reference for users and groups
