---
'@red-hat-developer-hub/backstage-plugin-catalog-backend-module-skills-catalog-provider': minor
---

Add durable database-backed persistence for skills catalog reconciliation

Introduces `DatabaseReconciliationStore` with crash-safe pending delta
writes before catalog mutations and atomic commit-and-clear after success.
Switches the provider from `type: 'full'` mutations to source-scoped
`type: 'delta'` mutations integrated with `calculateReconciliationPlan`.
Pending deltas are replayed on startup to recover interrupted work.
Completes design D6 tasks 4.3 (durable persistence), 4.4 (runtime
integration and replay), and 4.5 (provider verification).

Keep unresolved pending work intact when replay or ownership commit fails,
blocking newer snapshots only for the affected source. Verify database restart,
transaction rollback, interrupted additions, and OCI tag identity with file-backed
SQLite lifecycle tests. Keep the database store implementation internal.

Preserve the original full catalog entity reference in pending removals so
namespace configuration changes cannot orphan old entities. Reconcile namespace
changes even when content and connector observations repeat, retain old identities
during partial snapshots, and recover legacy pending removal targets from saved
ownership. Use module-scoped Knex migrations with safe adoption of existing
compatible development tables and isolated migration tracking in the Catalog DB.
