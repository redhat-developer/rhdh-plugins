---
'@red-hat-developer-hub/backstage-plugin-scorecard-backend': minor
'@red-hat-developer-hub/backstage-plugin-scorecard-common': minor
'@red-hat-developer-hub/backstage-plugin-scorecard': minor
---

This update introduces new scalar aggregation KPIs in the scorecard configuration, including:

- **`sum`**: Single numeric total of latest metric values across owned entities
- **`average`**: Mean of latest metric values across owned entities
- **`max`**: Maximum latest metric value across owned entities
- **`min`**: Minimum latest metric value across owned entities
- **`count`**: Number of entities with a non-null latest stored value
