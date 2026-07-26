---
'@red-hat-developer-hub/backstage-plugin-orchestrator': patch
---

Removed unused `StylesProvider` and `createGenerateClassName` JSS wrapper from plugin Router. Dropped `@mui/styles` dependency since JSS class-name isolation is no longer needed after the MUI5 migration.
