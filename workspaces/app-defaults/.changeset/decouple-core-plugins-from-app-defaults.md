---
'@red-hat-developer-hub/backstage-plugin-app-defaults': patch
---

Decouple core plugin overrides from the default feature loader in app-defaults so that decoupled core plugins (catalog, scaffolder, api-docs, techdocs) can be disabled via dynamic-plugins configuration without app-defaults forcing them into the app, and omit catalog-dependent navigation items (such as catalog-graph) from the sidebar when catalog is disabled.
