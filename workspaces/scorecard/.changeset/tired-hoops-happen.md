---
'@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-dependabot': patch
'@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-filecheck': patch
'@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-sonarqube': patch
'@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-openssf': patch
'@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-github': patch
'@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-jira': patch
'@red-hat-developer-hub/backstage-plugin-scorecard-backend': patch
---

Custom thresholds for filecheck, openssf, and dependabot are now
configurable. Custom threshold handling has been centralized in
`scorecard-backend`, you can define custom thresholds under
`scorecard.plugins.<providerId>.thresholds`. Provider IDs typically
follow the format `<datasource>.<metric>`.
