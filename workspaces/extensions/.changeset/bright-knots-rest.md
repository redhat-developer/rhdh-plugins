---
'@red-hat-developer-hub/backstage-plugin-extensions': patch
---

Removed unused `StylesProvider` and `createGenerateClassName` JSS wrapper from plugin router. Dropped `@mui/styles` dependency since JSS class-name isolation is no longer needed after the MUI5 migration.
