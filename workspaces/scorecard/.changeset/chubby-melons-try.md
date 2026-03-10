---
'@red-hat-developer-hub/backstage-plugin-scorecard-backend': patch
---

A couple of bug fixes for the scorecard backend plugin

- Remove null entries from the returned rows at the database level. This will ensure that accurate, non-error encountered entities are properly returned while calling the drill down endpoint.

- Normalize entity owners to their full canonical reference when syncing. Catalog entities are able to define a short name or the full entity reference for group ownership. This can lead to inconsistent filtering as we utilize the full entity reference for users and groups
