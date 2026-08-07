---
'@red-hat-developer-hub/backstage-plugin-global-header': minor
---

**BREAKING**: Import building blocks (`GlobalHeaderIconButton`, `GlobalHeaderMenuItem`, `GlobalHeaderDropdown`) only from `@red-hat-developer-hub/backstage-plugin-global-header/components` — they are no longer re-exported from the root entry or deprecated `/alpha`. Prefer dynamic `import()` inside blueprint loaders.

Building-block UI lives solely on the `/components` Module Federation expose (`src/componentsExport.ts`) so MUI stays off the root NFS sync chunk. MUI `ClassNameGenerator` setup is also moved off the root sync path: it runs from `configureMuiClassName.ts` when the lazy AppBar / `/components` / `/legacy` UI loads, not from the root entry.
