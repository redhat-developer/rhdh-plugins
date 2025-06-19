---
'@red-hat-developer-hub/backstage-plugin-marketplace-backend': minor
'@red-hat-developer-hub/backstage-plugin-marketplace-common': minor
---

Introduces PUT endpoint for enabling or disabling dynamic plugins: `/plugin/:namespace/:name/configuration/disable` and POST endpoint for enabling or disabling dynamic packages `/package/:namespace/:name/configuration/disable` not already existing in `EXTENSIONS_PLUGIN_CONFIG`.
