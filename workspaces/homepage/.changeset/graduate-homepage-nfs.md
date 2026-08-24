---
'@red-hat-developer-hub/backstage-plugin-homepage': major
---

**BREAKING:** Graduate NFS homepage exports from `/alpha` to the primary entry point, and move OFS exports to `./legacy`.
`/alpha` now only re-exports translations.

Note: Dynamic plugin config must use `module: Legacy` now.
