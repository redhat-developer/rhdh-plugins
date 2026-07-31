---
'@red-hat-developer-hub/backstage-plugin-global-header': minor
---

**BREAKING**: Import building blocks (`GlobalHeaderIconButton`, `GlobalHeaderMenuItem`, `GlobalHeaderDropdown`) only from `@red-hat-developer-hub/backstage-plugin-global-header/components` — they are no longer re-exported from the root entry or deprecated `/alpha`. Prefer dynamic `import()` inside blueprint loaders.

Building-block UI lives solely on the `/components` Module Federation expose (`src/componentsExport.ts`) so MUI stays off the root NFS sync chunk. MUI `ClassNameGenerator` setup is also moved off the root sync path: it runs from `configureMuiClassName.ts` when the lazy AppBar / `/components` / `/legacy` UI loads, not from the root entry.

`HeaderIcon` resolves icons via `app.getSystemIcon`, then inline SVG / image URL, then Material Icons outlined ligatures. It self-imports `material-icons/iconfont/outlined.css` on that lazy UI path so ligatures work in hosts that do not load the font (e.g. RHDH), without dynamic `@mui/icons-material/*` imports or a curated icon map.
