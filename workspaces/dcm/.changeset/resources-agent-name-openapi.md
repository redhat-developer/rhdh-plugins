---
'@red-hat-developer-hub/backstage-plugin-dcm-common': minor
'@red-hat-developer-hub/backstage-plugin-dcm': patch
---

Align Resources types with the latest service-type-instances OpenAPI spec:
replace `provider_name` with `agent_name`, replace `deleted`/`delete_time`
with `deletion_status`, and update list query params (`service_type`,
`agent_name` replace `provider`).
