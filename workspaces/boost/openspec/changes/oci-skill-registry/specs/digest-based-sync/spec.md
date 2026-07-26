# Incremental Sync via Digest-Based Change Detection

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.
>
> **Cross-connector dependencies:** RHIDP-15298 is blocked by RHIDP-15265 (configurable endpoint URLs — sync makes registry API calls) and RHIDP-15329 (custom CA bundles — sync connects to internal registries over TLS).

The OCI Skill Registry connector maintains a cursor of tag-to-digest mappings to detect changes between sync cycles. After the first full ingest, subsequent syncs only process skills whose OCI digest changed, dramatically reducing sync time for large namespaces.

## ADDED Requirements

### Requirement: Persist Tag-to-Digest Cursor

The connector stores a cursor mapping tags to digests after each successful sync cycle.

#### Scenario: Store cursor after first sync

- **WHEN** the connector completes the first sync for registry `quay-internal` namespace `myorg/skills`
- **AND** discovers tags: `v1.0.0` → `sha256:abc123...`, `v1.1.0` → `sha256:def456...`, `latest` → `sha256:def456...`
- **THEN** it persists cursor:
  ```json
  {
    "registryId": "quay-internal",
    "namespace": "myorg/skills",
    "tagDigestMap": {
      "v1.0.0": "sha256:abc123...",
      "v1.1.0": "sha256:def456...",
      "latest": "sha256:def456..."
    },
    "lastSync": "2026-07-08T10:00:00Z"
  }
  ```

#### Scenario: Load cursor on subsequent sync

- **WHEN** the connector starts a sync cycle
- **THEN** it loads the cursor from storage (database or plugin state file)
- **AND** if cursor exists, enters incremental sync mode
- **AND** if cursor doesn't exist, enters full sync mode

#### Scenario: Cursor storage location

- **WHEN** the connector is deployed in a Kubernetes environment
- **THEN** the cursor is stored in a Kubernetes ConfigMap (e.g., `oci-skill-registry-cursors`)
- **AND** the ConfigMap is namespaced to the RHDH backend namespace
- **AND** each registry instance has a separate key in the ConfigMap: `<registryId>-<namespace-hash>`

### Requirement: Detect New Tags

The connector emits new entities when tags appear in the registry that aren't in the cursor.

#### Scenario: New tag added to registry

- **WHEN** the cursor contains `{ "v1.0.0": "sha256:abc123..." }`
- **AND** the current tag list from registry is `["v1.0.0", "v2.0.0"]`
- **THEN** the connector detects `v2.0.0` as a new tag (not in cursor)
- **AND** fetches manifest for `v2.0.0`
- **AND** downloads `skillcard.yaml` from layers
- **AND** emits a new entity for `v2.0.0`
- **AND** updates cursor: `{ "v1.0.0": "sha256:abc123...", "v2.0.0": "sha256:xyz789..." }`

#### Scenario: Skip unchanged tags

- **WHEN** the cursor contains `{ "v1.0.0": "sha256:abc123..." }`
- **AND** the current tag list from registry is `["v1.0.0"]`
- **AND** the manifest for `v1.0.0` has digest `sha256:abc123...` (unchanged)
- **THEN** the connector skips fetching `skillcard.yaml` for `v1.0.0`
- **AND** does not re-emit the entity
- **AND** logs debug: `Tag v1.0.0 unchanged (digest sha256:abc123...), skipping`

### Requirement: Detect Changed Digests (Tag Updates)

The connector updates entities when a tag's digest changes (tag re-pushed with new content).

#### Scenario: Tag re-pushed with new image

- **WHEN** the cursor contains `{ "v1.0.0": "sha256:abc123..." }`
- **AND** the current manifest for `v1.0.0` has digest `sha256:new456...` (different)
- **THEN** the connector detects digest change for `v1.0.0`
- **AND** fetches manifest for `v1.0.0` with new digest
- **AND** downloads `skillcard.yaml` from layers
- **AND** validates `skillcard.yaml`
- **AND** emits an updated entity (replaces previous entity)
- **AND** updates cursor: `{ "v1.0.0": "sha256:new456..." }`

#### Scenario: Detect skillcard.yaml content change

- **WHEN** the tag `v1.0.0` is re-pushed with a `skillcard.yaml` that has `version: 1.0.1` (was `version: 1.0.0`)
- **THEN** the emitted entity has updated `metadata.annotations.rhdh.io/ai-asset-version: 1.0.1`
- **AND** the entity's `metadata.annotations.rhdh.io/oci-digest` reflects the new digest

### Requirement: Detect Removed Tags (Tag Deletions)

The connector deletes or tombstones entities when tags are removed from the registry.

#### Scenario: Tag removed from registry

- **WHEN** the cursor contains `{ "v1.0.0": "sha256:abc123...", "v2.0.0": "sha256:def456..." }`
- **AND** the current tag list from registry is `["v2.0.0"]` (v1.0.0 removed)
- **THEN** the connector detects `v1.0.0` as removed (in cursor, not in current tags)
- **AND** emits a deletion mutation for the entity corresponding to `v1.0.0`
- **AND** updates cursor to remove `v1.0.0`: `{ "v2.0.0": "sha256:def456..." }`

#### Scenario: Tombstone entity on deletion

- **WHEN** a tag is removed
- **THEN** the connector calls `applyMutation({ type: 'delta', removed: [entityRef] })`
- **AND** the catalog marks the entity as deleted (tombstoned)
- **AND** the entity no longer appears in catalog queries

### Requirement: Fallback to Full Refresh

The connector falls back to full sync when the cursor is invalid or expired.

#### Scenario: Cursor schema version mismatch

- **WHEN** the cursor has `schemaVersion: 1`
- **AND** the current connector code expects `schemaVersion: 2` (after SDK upgrade)
- **THEN** the connector logs warning: `Cursor schema mismatch (found v1, expected v2), performing full refresh`
- **AND** discards the cursor
- **AND** runs a full sync (fetches all tags, validates all skillcards)
- **AND** writes a new cursor with `schemaVersion: 2`

#### Scenario: Cursor exceeds max age

- **WHEN** the cursor has `lastSync: 2026-06-01T10:00:00Z`
- **AND** the current time is `2026-07-08T10:00:00Z` (37 days later)
- **AND** the configured `cursorMaxAge: 30d`
- **THEN** the connector logs warning: `Cursor expired (age 37d > max 30d), performing full refresh`
- **AND** discards the cursor
- **AND** runs a full sync

#### Scenario: Cursor storage unavailable

- **WHEN** the connector attempts to load the cursor from ConfigMap
- **AND** the ConfigMap read fails (e.g., RBAC permissions denied)
- **THEN** the connector logs error: `Failed to load cursor, performing full refresh`
- **AND** runs a full sync without cursor
- **AND** attempts to write the new cursor (may fail again, logged as warning)

### Requirement: Performance Optimization for Large Namespaces

The connector processes incremental syncs efficiently for large namespaces with minimal changes.

#### Scenario: Incremental sync of large namespace

- **WHEN** the namespace has 1,945 tags in the cursor
- **AND** the current sync detects:
  - 1,940 tags unchanged (same digest)
  - 3 tags with changed digest
  - 2 new tags
  - 0 removed tags
- **THEN** the connector:
  - Skips manifest fetch for 1,940 unchanged tags
  - Fetches manifest and `skillcard.yaml` for 3 changed + 2 new = 5 tags
  - Completes sync in fraction of full refresh time (5 fetches vs 1,945)

#### Scenario: Parallel manifest fetching for changed tags

- **WHEN** incremental sync detects 10 changed/new tags
- **THEN** the connector fetches manifests for these tags in parallel (concurrency limit: 5)
- **AND** reduces total sync time compared to sequential fetching

#### Scenario: Full refresh performance baseline

- **WHEN** the connector runs a full sync for a namespace with 1,945 tags
- **THEN** it fetches 1,945 manifests (parallel, concurrency limit: 10)
- **AND** downloads `skillcard.yaml` for all valid images
- **AND** completes within timeout (configurable, default: 30 minutes)

### Requirement: Manifest-Digest Caching with TTL

> _Added from RHIDP-15294 updated ACs (2026-07-08 consolidation)_

The connector MUST cache manifest digests to avoid redundant registry API calls during incremental sync.

#### Scenario: In-memory digest cache with 5-minute TTL

- **WHEN** the connector fetches a manifest digest for tag `v1.0.0` from registry
- **THEN** it caches the digest in memory with a 5-minute TTL
- **AND** subsequent digest lookups for the same tag within 5 minutes return the cached value without a registry API call
- **AND** after 5 minutes, the cache entry expires and the next lookup fetches from the registry

#### Scenario: Disk-based backup cache for cold starts

- **WHEN** the connector restarts (pod restart, deployment rollout)
- **THEN** it loads the last-known digest map from disk-based backup cache (same storage as sync cursor)
- **AND** uses the backup cache for the first incremental sync cycle (avoids full refresh on every restart)
- **AND** after the first successful sync, the in-memory cache is populated from the fresh registry data

#### Scenario: Cache invalidation on cursor reset

- **WHEN** the sync cursor is invalidated (schema mismatch, expiration, manual reset)
- **THEN** the in-memory digest cache is cleared
- **AND** the disk-based backup cache is cleared
- **AND** the next sync runs as a full refresh (no cached digests to compare against)

### Requirement: Cursor Update Atomicity

The connector ensures cursor updates are atomic to avoid partial state on failure.

#### Scenario: Successful sync updates cursor

- **WHEN** the connector completes a sync cycle successfully
- **THEN** it updates the cursor with all tag-to-digest mappings in a single write operation
- **AND** updates `lastSync` timestamp to current time

#### Scenario: Failed sync does not update cursor

- **WHEN** the connector encounters a fatal error during sync (e.g., registry API 500 error)
- **THEN** it does not update the cursor
- **AND** the next sync cycle uses the previous cursor (retries from last known good state)

#### Scenario: Partial failure updates cursor for successful tags

- **WHEN** the connector processes 100 tags
- **AND** 95 tags succeed, 5 tags fail validation (invalid `skillcard.yaml`)
- **THEN** the connector updates the cursor with the 95 successful tags
- **AND** does not include the 5 failed tags in the cursor
- **AND** logs error for each failed tag with tag name and reason
