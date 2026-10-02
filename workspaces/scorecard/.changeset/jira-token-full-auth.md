---
'@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-jira': patch
---

**BREAKING**: `jira.token` for direct connections must be a full HTTP Authorization value (`Basic <base64>` or `Bearer <token>`). The module no longer infers Basic/Bearer from `jira.product`. Bare credentials without a scheme prefix are rejected at startup. When `proxyPath` is set, `jira.token` remains ignored and auth stays on the proxy `Authorization` header.
