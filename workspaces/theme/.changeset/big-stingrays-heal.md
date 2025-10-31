---
'@red-hat-developer-hub/backstage-plugin-theme': patch
---

Scope TechDocs subheader toolbar to use `background.paper`, fixing the gray strip under the page header. Adds a `MuiCssBaseline` rule targeting `[class*="BackstageHeader-header-"] + [class*="MuiToolbar-root"]` so other toolbars remain unaffected.
