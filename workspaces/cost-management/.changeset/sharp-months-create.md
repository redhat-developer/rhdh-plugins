---
'@red-hat-developer-hub/plugin-cost-management-backend': patch
'@red-hat-developer-hub/plugin-cost-management-common': patch
'@red-hat-developer-hub/plugin-cost-management': patch
---

Fix scoped RBAC catalog fetch by using direct HCC resource-type URLs when a
token is present, and chunk project permission authorize calls to avoid RBAC
413 Payload Too Large on large cluster×project products.
