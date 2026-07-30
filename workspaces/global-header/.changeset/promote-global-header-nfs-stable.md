---
'@red-hat-developer-hub/backstage-plugin-global-header': major
---

Promote global-header NFS plugin from `/alpha` to stable. NFS APIs are now exported from the main package entry point. OFS APIs move to `/legacy` (deprecated). Translations remain at `/alpha`.

Restructures the source layout: NFS code moves from `src/alpha/` up to `src/` (extensions, defaults, components, utils, plugin, types), OFS-only code moves into `src/legacy/`, and shared components remain in place.
