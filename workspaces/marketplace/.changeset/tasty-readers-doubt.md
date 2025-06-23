---
'@red-hat-developer-hub/backstage-plugin-catalog-backend-module-marketplace': minor
'@red-hat-developer-hub/backstage-plugin-marketplace-backend': minor
'@red-hat-developer-hub/backstage-plugin-marketplace-common': minor
---

Introduces GET endpoints for fetching installation status: `/plugin/:namespace/:name/configuration/status` and `/package/:namespace/:name/configuration/status`. Changes `catalog-backend-module-marketplace` to directly use `DynamicPluginProvider` from `backend-dynamic-feature-service`.
