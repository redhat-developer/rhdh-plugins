---
'@red-hat-developer-hub/backstage-plugin-catalog-backend-module-skills-catalog-provider': minor
---

Add source-scoped reconciliation planner for skill entity deltas

Introduces `calculateReconciliationPlan`, a pure function that computes
deterministic upsert/removal deltas from a source's committed ownership
state and a validated connector snapshot. Implements design D6's status
table: ready snapshots authorize removals of absent source-owned keys,
partial snapshots retain absent entities, and loading/failed snapshots
produce no mutations. Stale observations are ignored and repeated
observations are idempotent. Cross-source identity collisions are
diagnosed without overwriting another tuple's entity.
