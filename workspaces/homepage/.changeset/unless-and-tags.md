---
'@red-hat-developer-hub/backstage-plugin-homepage': patch
'@red-hat-developer-hub/backstage-plugin-homepage-backend': minor
'@red-hat-developer-hub/backstage-plugin-homepage-common': minor
---

Add `unless` exclusion block and `tags` for RBAC conditional policy filtering to homepage default widgets.

`unless` is the denylist counterpart to `if` — it uses the same shape (`users`, `groups`, `permissions`) and hides a widget when any condition matches. Deny wins over `if`, and on group nodes it prunes the entire subtree.

`tags` is an optional string array on leaf nodes (e.g. `['admin', 'developer']`) used with the new `HAS_TAG` permission rule for RBAC conditional filtering. Widgets without tags bypass tag-based filtering.
