---
'@red-hat-developer-hub/backstage-plugin-orchestrator': patch
---

Fix intermittent page load failures in dynamic plugin mode by removing the explicit Alpha module from translationResources, letting RHDH default to PluginRoot and avoiding a module initialization race on the Alpha default export.
