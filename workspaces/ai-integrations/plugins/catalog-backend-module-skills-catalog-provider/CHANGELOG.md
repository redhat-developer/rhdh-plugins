# @red-hat-developer-hub/backstage-plugin-catalog-backend-module-skills-catalog-provider

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
