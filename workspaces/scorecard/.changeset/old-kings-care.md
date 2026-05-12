---
'@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-sonarqube': patch
'@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-jira': patch
'@red-hat-developer-hub/backstage-plugin-scorecard-backend': patch
'@red-hat-developer-hub/backstage-plugin-scorecard-node': patch
'@red-hat-developer-hub/backstage-plugin-scorecard': patch
---

### Threshold validation

Implemented threshold interval validation for Scorecard: joint coverage on the real line, gap detection and error messages, and overlap handling versus rule order (including aggregation KPI `options.thresholds` for `average`).

### Aggregation

For **`type: average`** aggregations, **`result.averageScore`** returned by **`GET /aggregations/:aggregationId`** (and the same shape wherever it appears) is a **portfolio percentage in \[0, 100\]** with **one decimal place** — the same scale used for **`options.thresholds`** evaluation and the homepage donut.

Previously **`averageScore`** was a **normalized ratio in \[0, 1\]** (rounded to **three** decimal places). Any consumer that treated the old value as a fraction and multiplied by **100** for display, or compared it to thresholds on a 0–100 scale without converting, must **stop scaling**: use **`averageScore`** directly as the percentage. If you stored historical API payloads, recompute or re-fetch rather than assuming the old fractional scale.
