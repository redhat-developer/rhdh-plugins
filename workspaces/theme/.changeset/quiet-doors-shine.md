---
'@red-hat-developer-hub/backstage-plugin-theme': patch
---

Inline ThemeConfig types in config.d.ts to avoid importing from the package entry point, which pulls in @mui/material types that crash ts-json-schema-generator on `typeof window.matchMedia`.
