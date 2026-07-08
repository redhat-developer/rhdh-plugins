# Delta Sync Framework

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

Cursor-based incremental sync framework built on Backstage's `applyMutation({ type: 'delta' })` API, enabling entity providers to report only changes since the last sync.

## ADDED Requirements

### Requirement: Cursor/ETag-Based Delta Sync

The SDK MUST provide a delta sync framework accepting connector-reported additions/updates/deletions relative to a sync cursor.

#### Scenario: Delta sync wrapper translates to applyMutation (RHIDP-15262)

- **WHEN** a provider calls `deltaSyncManager.applyDelta({ added: [...], updated: [...], removed: [...], nextCursor: '...' })`
- **THEN** the framework translates this into a catalog `applyMutation({ type: 'delta', added: [...], removed: [...] })` call
- **AND** the `nextCursor` is persisted for the next polling cycle

#### Scenario: Connector reports additions and updates (RHIDP-15262)

- **WHEN** the connector reports `added: [entity1, entity2]` and `updated: [entity3]`
- **THEN** both `entity1`, `entity2`, and `entity3` are included in the `added` array passed to `applyMutation` (Backstage's delta API treats updates as additions)
- **AND** all entities have valid AI asset annotations

#### Scenario: Connector reports deletions (RHIDP-15262)

- **WHEN** the connector reports `removed: ['component:default/agent-foo']`
- **THEN** the entity ref `component:default/agent-foo` is included in the `removed` array passed to `applyMutation`
- **AND** the entity is deleted from the catalog

### Requirement: Sync Cursor Persistence

Sync cursors MUST be persisted across polling cycles so providers can resume incremental sync.

#### Scenario: Cursor persisted after successful delta sync (RHIDP-15262)

- **WHEN** a delta sync completes successfully with `nextCursor: 'etag-abc123'`
- **THEN** the cursor is persisted in the catalog database as a provider-scoped key-value pair: `{ providerId: 'kagenti/default', cursor: 'etag-abc123', lastSyncTimestamp: '2026-07-08T10:00:00Z' }`
- **AND** on the next polling cycle, the provider reads the cursor and passes it to the connector's delta API

#### Scenario: Cursor retrieved on next poll (RHIDP-15262)

- **WHEN** the provider starts a new polling cycle
- **THEN** it calls `deltaSyncManager.getCursor(providerId)` which returns the last persisted cursor
- **AND** the provider passes the cursor to the connector (e.g., `If-None-Match: etag-abc123` header or `?cursor=etag-abc123` query param)

### Requirement: Fallback to Full Refresh

When a sync cursor is invalid or missing, the framework MUST fall back to full refresh.

#### Scenario: Invalid cursor triggers full refresh (RHIDP-15262)

- **WHEN** the connector rejects the cursor (e.g., 412 Precondition Failed or 404 Not Found)
- **THEN** the provider falls back to full refresh: calls `provider.entities()` instead of `provider.delta(cursor)`
- **AND** the next sync establishes a new cursor

#### Scenario: Missing cursor on first sync (RHIDP-15262)

- **WHEN** a provider runs for the first time and no cursor exists
- **THEN** it performs a full refresh
- **AND** the response includes `nextCursor` which is persisted for subsequent incremental syncs

### Requirement: Backward Compatibility with Full-Refresh Providers

Existing full-refresh providers MUST work without modification.

#### Scenario: Full-refresh provider continues working (RHIDP-15262)

- **WHEN** a provider implements only `entities()` (no `delta()` method)
- **THEN** the catalog engine calls `entities()` on every poll (full refresh)
- **AND** the provider does NOT receive delta sync calls
- **AND** the catalog behavior is unchanged from before delta sync support was added

#### Scenario: Provider can opt into delta sync later (RHIDP-15262)

- **WHEN** a full-refresh provider adds the optional `delta(cursor?: string)` method
- **THEN** the catalog engine detects the method and switches to delta sync mode
- **AND** the first call to `delta()` has `cursor = undefined` (full refresh to establish baseline)
