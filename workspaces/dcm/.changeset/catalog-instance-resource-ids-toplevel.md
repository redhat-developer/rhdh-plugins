---
'@red-hat-developer-hub/backstage-plugin-dcm-common': minor
'@red-hat-developer-hub/backstage-plugin-dcm': patch
---

Align Catalog Item Instance types with the catalog OpenAPI: move
`resource_ids` to the top level (alongside `run_id`) and remove it from
`spec`. Instances table reads `resource_ids` again so the column is no
longer blank.
