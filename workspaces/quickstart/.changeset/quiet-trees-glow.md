---
'@red-hat-developer-hub/backstage-plugin-quickstart': patch
---

Removed unused `StylesProvider` and `createGenerateClassName` JSS wrapper from QuickstartDrawerProvider. Dropped `@mui/styles` dependency since JSS class-name isolation is no longer needed after the MUI5 migration.
