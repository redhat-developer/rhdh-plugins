---
'@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-jira': patch
---

Add optional `jira.authType` (`Basic` or `Bearer`) for direct connections so Jira Cloud can use personal API tokens (default Basic) or service account tokens (set `authType: Bearer`). When omitted, auth defaults to Basic for `cloud` and Bearer for `datacenter`. `jira.token` remains a bare credential.
