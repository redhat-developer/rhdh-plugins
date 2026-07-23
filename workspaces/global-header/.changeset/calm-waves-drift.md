---
'@red-hat-developer-hub/backstage-plugin-global-header': patch
---

Removed unused `StylesProvider` and `createGenerateClassName` JSS wrapper from GlobalHeaderComponent and GlobalHeader. Dropped `@mui/styles` dependency since JSS class-name isolation is no longer needed after the MUI5 migration.
