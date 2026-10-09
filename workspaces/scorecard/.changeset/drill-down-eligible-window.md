---
'@red-hat-developer-hub/backstage-plugin-scorecard-backend': patch
---

Fetch successive database windows when building drill-down results so catalog authorization and disabled-metric filtering can reach the eligible-result cap instead of stopping after the first 10,000 database rows.
