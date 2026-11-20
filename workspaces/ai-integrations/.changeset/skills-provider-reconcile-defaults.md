---
'@red-hat-developer-hub/backstage-plugin-catalog-backend-module-skills-catalog-provider': patch
---

Reconcile changed `defaultOwner` and `defaultLifecycle` values for existing skill entities. An accepted `ready` or `partial` snapshot now updates entities whose effective `spec.owner` or `spec.lifecycle` changed, even when the skill digest and connector observation are unchanged, while valid source hints continue to take precedence per field.
