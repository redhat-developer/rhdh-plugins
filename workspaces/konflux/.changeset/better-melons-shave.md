---
'@red-hat-developer-hub/backstage-plugin-konflux-backend': patch
---

- Fix: replace unfiltered catalog scan in getRelatedEntities with targeted lookup using hasPart relations and getEntitiesByRefs.
- Perf: cache K8s API clients per cluster and catalog lookups (30s TTL) to avoid redundant work across parallel requests.
- Perf: strip metadata.managedFields from K8s and Kubearchive responses to reduce payload size.
