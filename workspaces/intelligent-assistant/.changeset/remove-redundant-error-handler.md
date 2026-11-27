---
'@red-hat-developer-hub/backstage-plugin-intelligent-assistant-backend': patch
---

Remove the redundant `MiddlewareFactory` error handler from the plugin router, since the host `httpRouter` service already adds one after every plugin's routes. Move `@backstage/backend-defaults` to `devDependencies` so it is no longer bundled into the dynamic plugin.
