---
'@red-hat-developer-hub/backstage-plugin-catalog-backend-module-skills-catalog-provider': minor
---

Add durable database-backed persistence for skills catalog reconciliation

Introduces `DatabaseReconciliationStore` with crash-safe pending delta
writes before catalog mutations and atomic commit-and-clear after success.
Switches the provider from `type: 'full'` mutations to source-scoped
`type: 'delta'` mutations integrated with `calculateReconciliationPlan`.
Pending deltas are replayed on startup to recover interrupted work.
Implements design D6 tasks 4.3 (durable persistence) and 4.4 (runtime
integration).

Keep unresolved pending work intact when replay or ownership commit fails,
blocking newer snapshots only for the affected source. Verify database restart,
transaction rollback, interrupted additions, and OCI tag identity with file-backed
SQLite lifecycle tests. Keep the database store implementation internal.
