---
'@red-hat-developer-hub/backstage-plugin-orchestrator': patch
---

Fix intermittent page load failures in dynamic plugin mode by loading translation resources from the PluginRoot Scalprum module instead of Alpha, avoiding a module initialization race on the Alpha default export.
