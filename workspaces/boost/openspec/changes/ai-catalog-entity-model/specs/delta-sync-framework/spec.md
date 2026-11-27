# Delta Sync Framework

> **Status: Consolidated into RHIDP-15258 (Entity-Provider SDK)** — Delta sync is now part of the SDK epic (story RHIDP-15262). Implementation lives in the SDK package alongside the provider interface.

Cursor-based incremental sync framework built on Backstage's `applyMutation({ type: 'delta' })` API, enabling entity providers to report only changes since the last sync.

> **Scope (RHIDP-18761):** The baseline documents the existing mutation and
> cursor helper. Consuming providers own fetching, scheduling, first/full
> refresh, cursor rejection handling, and method selection. The helper does
> not perform refresh orchestration or detect optional provider methods.
> The SDK ships `InMemoryCursorStore` for development/testing and a pluggable
> `CursorStore` interface. Durable-store implementation and automated
> refresh/recovery orchestration remain deferred to
> [RHIDP-18840](https://redhat.atlassian.net/browse/RHIDP-18840), together with
> Backstage incremental-provider integration.

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

- **WHEN** the connector reports `removed: ['airesource:default/agent-foo']`
- **THEN** the entity ref `airesource:default/agent-foo` is included in the `removed` array passed to `applyMutation`
- **AND** the entity is deleted from the catalog

### Requirement: Sync Cursor Persistence

Sync cursors MUST be persisted across polling cycles so providers can resume incremental sync. Persistence is delegated to a pluggable `CursorStore` interface: the SDK ships an `InMemoryCursorStore` for development and testing, and a durable (e.g. database-backed) implementation is the responsibility of the consuming backend plugin, which supplies it via `DeltaSyncManagerOptions.cursorStore`.

#### Scenario: Cursor persisted after successful delta sync (RHIDP-15262)

- **WHEN** a delta sync completes successfully with `nextCursor: 'etag-abc123'`
- **THEN** the cursor is persisted via the configured `CursorStore`, keyed by the manager's construction-time `locationKey`, as a `CursorState`: `{ cursor: 'etag-abc123', lastSyncTimestamp: '2026-07-08T10:00:00Z' }` (e.g. for `locationKey: 'ogx/default'`)
- **AND** on the next polling cycle, the provider reads the cursor and passes it to the connector's delta API

#### Scenario: Cursor retrieved on next poll (RHIDP-15262)

- **WHEN** the provider starts a new polling cycle
- **THEN** it calls `deltaSyncManager.getCursor()` which returns the last persisted cursor for the manager's `locationKey`
- **AND** the provider passes the cursor to the connector (e.g., `If-None-Match: etag-abc123` header or `?cursor=etag-abc123` query param)

### Requirement: Cursor Reset for Consumer-Owned Refresh

The helper MUST expose cursor retrieval and reset operations. The consuming provider decides when a cursor is unusable and owns the full refresh. The helper does not fetch source data, invoke provider methods, or submit a full mutation itself.

#### Scenario: Consumer clears a rejected cursor (RHIDP-15262)

- **WHEN** consuming provider code calls `deltaSyncManager.clearCursor()` after its connector rejects a cursor
- **THEN** the helper deletes the stored cursor state for its construction-time `locationKey`
- **AND** the next `deltaSyncManager.getCursor()` returns `undefined`
- **AND** clearing the cursor does not submit a catalog mutation

#### Scenario: Missing cursor on first sync (RHIDP-15262)

- **WHEN** consuming provider code calls `deltaSyncManager.getCursor()` and no cursor is stored
- **THEN** the helper returns `undefined`
- **AND** retrieving the cursor does not submit a catalog mutation

The consumer treats a missing cursor as a signal to perform its own full refresh and establish a new baseline. Designing a shared fallback orchestrator is deferred; the scenarios above verify the existing helper boundary only.

### Requirement: Backward Compatibility with Full-Refresh Providers

Existing full-refresh providers MUST retain their own scheduling and mutation submission. Using the delta helper MUST NOT register a new provider mode with the Catalog engine or initiate a full refresh automatically.

#### Scenario: Full-refresh provider continues working (RHIDP-15262)

- **WHEN** consuming provider code submits a full mutation through its existing `EntityProviderConnection`
- **THEN** that mutation contains its full source entity set
- **AND** `DeltaSyncManager` does not submit an additional mutation unless the consumer calls `applyDelta()`

#### ~~Scenario: Catalog engine automatically detects delta support~~ DEFERRED

The earlier automatic method-detection claim is withdrawn. A consuming provider must explicitly call its source methods and submit mutations. RHIDP-18840 owns the future incremental-ingestion adapter and orchestration contract; no automatic mode switch is promised by this baseline.
