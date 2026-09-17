---
'@red-hat-developer-hub/backstage-plugin-homepage': minor
---

Narrow the main package entry point to the default plugin export and translations module. Move plugin implementation to `plugin.ts` and remove deprecated public API aliases. Serve the demo homepage at `/homepage` and redirect `/` there.
