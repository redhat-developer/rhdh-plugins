---
'@red-hat-developer-hub/backstage-plugin-catalog-backend-module-catalog-backend-module-ai-resource-extensions': minor
---

Consolidate OCI location validation into `AIResourceExtensionsProcessor`.
The standalone `AIResourceOciProcessor` class and its public export have been
removed; OCI format checks now run via the internal `collectOciErrors` helper
called by `AIResourceExtensionsProcessor`.
