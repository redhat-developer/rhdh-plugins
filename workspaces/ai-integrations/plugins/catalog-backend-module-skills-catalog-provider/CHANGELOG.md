# @red-hat-developer-hub/backstage-plugin-catalog-backend-module-skills-catalog-provider

## 1.0.0

### Major Changes

- f8b1032: Add OCI skill TechDocs URL annotation and reconciliation acknowledgment

  Extends the common skills catalog provider to set `backstage.io/techdocs-ref`
  on OCI skill entities using discovery-based, digest-addressed URLs derived from
  trusted connector/source configuration. npx skill entities do not receive the
  annotation. Captures the `X-Skilldocs-Revision` response header from connector
  snapshots and implements the D8 reconciliation acknowledgment lifecycle:
  atomically persists acknowledgments with ready-state ownership commits, verifies
  catalog processing visibility before delivery, retries pending acknowledgments
  before polling, handles superseded revisions and transport failures, and rejects
  duplicate retention-owner assignments at startup.

  ### Breaking changes

  - Four new required methods on `ReconciliationStore`: `commitStateAndSaveAcknowledgment`, `getPendingAcknowledgment`, `getAllPendingAcknowledgments`, and `clearPendingAcknowledgment`.
  - The `store` constructor parameter on `SkillsCatalogProvider` is now required (previously optional).
  - Direct callers can no longer rely on an implicit in-memory fallback; they must supply and initialize a durable `ReconciliationStore` implementation.
  - The `catalogApi` constructor parameter is now required and must implement `CatalogApi.getEntitiesByRefs`; visibility verification cannot be bypassed.

  Pending deltas persist the complete acknowledgment context before catalog mutation
  and recover it before polling newer snapshots. Deferred visibility checks block
  newer polls for that source. Existing entities receive missing or changed TechDocs
  annotations even without a digest change. Provider HTTP operations reject redirects
  and use bounded deadlines. An additive migration preserves existing rows; legacy
  revision-only pending deltas fail closed for operator investigation.

## 0.4.0

### Minor Changes

- bab221f: Add durable database-backed persistence for skills catalog reconciliation

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

## 0.3.0

### Minor Changes

- 76f6264: Add source-scoped reconciliation planner for skill entity deltas

  Introduces `calculateReconciliationPlan`, a pure function that computes
  deterministic upsert/removal deltas from a source's committed ownership
  state and a validated connector snapshot. Implements design D6's status
  table: ready snapshots authorize removals of absent source-owned keys,
  partial snapshots retain absent entities, and loading/failed snapshots
  produce no mutations. Stale observations are ignored and repeated
  observations are idempotent. Cross-source identity collisions are
  diagnosed without overwriting another tuple's entity.

## 0.2.1

### Patch Changes

- 7f590a7: Validate source references before entity mapping and fall back to
  configured defaults for invalid owner/lifecycle hints.

  Source-reference validation now rejects an entire snapshot when any
  record has a malformed OCI URI, a digest mismatch, or an invalid npx
  reference — preventing partial entity updates from a corrupt source.

  Owner and lifecycle hints are validated as usable Backstage entity
  references; nonblank but invalid values (e.g., strings with spaces
  or special characters) now fall back to the configured defaults
  instead of being used verbatim.

## 0.2.0

### Minor Changes

- 20b4a8a: Add common skills catalog entity provider (OpenSpec tasks 4.1 and 4.2).

  One provider consumes normalized v1 snapshots from OCI and npx connectors
  using the same implementation. Each source has independent configuration,
  location keys, and polling schedule. The provider resolves connector URLs
  through Backstage discovery and obtains service tokens targeted to the
  receiving plugin ID.
