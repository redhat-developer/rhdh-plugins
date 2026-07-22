---
'@red-hat-developer-hub/backstage-plugin-boost-common': minor
'@red-hat-developer-hub/backstage-plugin-boost': patch
---

Add RBAC permission gating to the Usage tab. New `boostAiCatalogUsageDocsPermission` in boost-common gates access to usage documentation; denied users see a "contact owner" fallback. The permission is resource-scoped (`ResourcePermission<'ai-catalog-asset'>`) so future RBAC policies can apply conditional rules (e.g. by category, connector, or tenant).
