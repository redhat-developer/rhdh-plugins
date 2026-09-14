---
'@red-hat-developer-hub/backstage-plugin-app-defaults': minor
---

Add empty-state page overrides for the catalog, catalog graph, scaffolder, API docs, and TechDocs plugins.

Each override checks whether matching catalog entities exist before rendering the original page. When none are found, a translatable empty state with an illustration, an action link, and a support button is shown instead. All overrides plus the existing app defaults module are registered together through a `createFrontendFeatureLoader` default export, so a single package import loads everything. Translations are provided for English (default), German, Spanish, French, Italian, and Japanese.
