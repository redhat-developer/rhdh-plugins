---
'@red-hat-developer-hub/backstage-plugin-scorecard': major
'@red-hat-developer-hub/backstage-plugin-scorecard-backend': major
'@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-github': major
'@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-jira': major
'@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-sonarqube': major
'@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-dependabot': major
'@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-openssf': major
---

**BREAKING**: Standardize all metric and provider IDs from `snake_case` to `lowerCamelCase`.

This aligns metric IDs with the naming convention used in `app-config.yaml` and the planned Scorecard design. For example, `github.open_prs` is now `github.openPrs`, `sonarqube.quality_gate` is now `sonarqube.qualityGate`, and `dependabot.alerts_critical` is now `dependabot.alertsCritical`.

If you reference metric IDs in your `app-config.yaml` (e.g., in `metricId` fields or plugin schedule config keys), update them to use `lowerCamelCase`.
