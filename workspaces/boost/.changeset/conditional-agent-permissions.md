---
'@red-hat-developer-hub/backstage-plugin-boost-backend': patch
'@red-hat-developer-hub/backstage-plugin-boost-common': patch
---

Upgrade `boost.agent.list` from `BasicPermission` to `ResourcePermission` for conditional RBAC filtering via `authorizeConditional()`. Add `BoostAuthorizedRequest` type for attaching permission conditions to list-endpoint requests.
