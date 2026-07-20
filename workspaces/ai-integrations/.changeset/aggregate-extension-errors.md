---
'@red-hat-developer-hub/backstage-plugin-catalog-backend-module-catalog-backend-module-ai-resource-extensions': minor
---

Aggregate multiple AIResource extension errors into a single response.
Extract OCI validation into a shared `collectOciErrors` function called by
`AIResourceExtensionsProcessor` so that scope and OCI constraint violations
are reported together instead of stopping at the first failure.
