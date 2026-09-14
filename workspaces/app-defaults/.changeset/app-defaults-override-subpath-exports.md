---
'@red-hat-developer-hub/backstage-plugin-app-defaults': minor
---

Expose the catalog, catalog graph, scaffolder, API docs, and TechDocs empty-state plugin overrides as individual package subpath exports (for example `@red-hat-developer-hub/backstage-plugin-app-defaults/catalog-plugin-override`), matching the `./app-defaults-translations-module` convention. Each subpath default-exports its override so it can be loaded individually; the feature loader default export continues to bundle all of them.
