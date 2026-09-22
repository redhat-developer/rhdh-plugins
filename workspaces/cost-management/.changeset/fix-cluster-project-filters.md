---
'@red-hat-developer-hub/plugin-cost-management-backend': patch
---

Fix cluster and project UI filters on the Optimizations page. The backend proxy was stripping client-supplied `cluster`/`project` query params because it used the same keys for RBAC injection. Changed RBAC injection to use `filter[exact:cluster]`/`filter[exact:project]` keys so UI search params pass through while RBAC security is still enforced.
