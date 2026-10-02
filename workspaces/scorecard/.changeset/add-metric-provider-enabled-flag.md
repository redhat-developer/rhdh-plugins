---
'@red-hat-developer-hub/backstage-plugin-scorecard-common': minor
'@red-hat-developer-hub/backstage-plugin-scorecard-node': minor
'@red-hat-developer-hub/backstage-plugin-scorecard-backend': minor
---

Add optional `enabled` flag for metrics and `isEnabled()` method for metric providers, allowing them to be disabled by default. Administrators can override these defaults via app-config. Disabled metrics are excluded from scheduling, API responses, and scaffolder actions.
