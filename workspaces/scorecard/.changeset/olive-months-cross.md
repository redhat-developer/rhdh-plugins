---
'@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-github': minor
'@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-jira': minor
'@red-hat-developer-hub/backstage-plugin-scorecard-backend': minor
'@red-hat-developer-hub/backstage-plugin-scorecard-node': minor
'@red-hat-developer-hub/backstage-plugin-scorecard': minor
---

Adds database persistence and scheduled metric collection

- **BREAKING**: The supportsEntity function renamed to getCatalogFilter. The getCatalogFilter function not have parameters are not passed
- Implement scheduler to load metrics by provider
- Implement scheduler to cleanup saved metrics
