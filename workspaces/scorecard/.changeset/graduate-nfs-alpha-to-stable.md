---
'@red-hat-developer-hub/backstage-plugin-scorecard': major
---

**BREAKING**: Graduated the New Frontend System (NFS) scorecard plugin to the stable entry point and simplified NFS feature registration.

- NFS APIs move from `./alpha` to `.`; OFS APIs move to `./legacy` only (not re-exported from the main entry); translations remain at `./alpha`.
- `scorecardCatalogModule` and `scorecardHomeModule` are removed. Entity tab, layout, and homepage widgets are now provided by the default `scorecardPlugin`. Keep only `scorecardTranslationsModule` as a separate app module.
- Extension IDs move from the `catalog` / `home` namespaces to `scorecard` (for example `entity-content:catalog/entity-content-scorecard` → `entity-content:scorecard/entity-content-scorecard`). Update any `app.extensions` config accordingly. See the plugin README migration notes.
