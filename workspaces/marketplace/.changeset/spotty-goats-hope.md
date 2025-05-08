---
'@red-hat-developer-hub/backstage-plugin-marketplace-backend': minor
'@red-hat-developer-hub/backstage-plugin-marketplace-common': minor
'@red-hat-developer-hub/marketplace-cli': minor
---

Introduces GET endpoints for dynamic plugins configuration: `/package/:namespace/:name/configuration` and `/plugin/:namespace/:name/configuration`. Introduces optional config value `marketplace.dynamicPluginsConfig` which is used to load the configuration.
