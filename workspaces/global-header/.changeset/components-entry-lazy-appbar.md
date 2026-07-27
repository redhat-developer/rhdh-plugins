---
'@red-hat-developer-hub/backstage-plugin-global-header': minor
---

**BREAKING**: Import building blocks (`GlobalHeaderIconButton`, `GlobalHeaderMenuItem`, `GlobalHeaderDropdown`) from `@red-hat-developer-hub/backstage-plugin-global-header/components` (not `/alpha`). Prefer dynamic import inside blueprint loaders.

Move building-block components off `/alpha` to `/components`, and lazy-load the AppBar shell so MUI stays out of the NFS sync chunk. `/components` is intentional so the path stays stable after graduation from alpha.
