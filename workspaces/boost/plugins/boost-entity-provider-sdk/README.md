# @red-hat-developer-hub/backstage-plugin-boost-entity-provider-sdk

SDK for AI asset entity providers in the Backstage catalog.

Exports annotation constants, validation utilities, interface contracts, delta sync framework, and adapter types for the AI catalog entity model.

## Installation

```bash
yarn add @red-hat-developer-hub/backstage-plugin-boost-entity-provider-sdk
```

## Annotation constants

Every entity emitted by an AI asset provider must carry three required annotations:

| Constant                       | Value                       | Description                               |
| ------------------------------ | --------------------------- | ----------------------------------------- |
| `AI_ASSET_CATEGORY_ANNOTATION` | `rhdh.io/ai-asset-category` | Asset category (see allowed values below) |
| `AI_ASSET_VERSION_ANNOTATION`  | `rhdh.io/ai-asset-version`  | Semver-normalized version string          |
| `AI_ASSET_SOURCE_ANNOTATION`   | `rhdh.io/ai-asset-source`   | Provider/registry provenance identifier   |

Allowed category values: `agent`, `skill`, `rule`, `skill-bundle`, `mcp-server`, `ai-model`, `model-server`.

```ts
import {
  AI_ASSET_CATEGORY_ANNOTATION,
  AI_ASSET_VERSION_ANNOTATION,
  AI_ASSET_SOURCE_ANNOTATION,
} from '@red-hat-developer-hub/backstage-plugin-boost-entity-provider-sdk';
```

## Implementing an entity provider

```ts
import type { AIAssetEntityProvider } from '@red-hat-developer-hub/backstage-plugin-boost-entity-provider-sdk';

class MyProvider implements AIAssetEntityProvider {
  async connect() {
    /* set up HTTP client */
  }
  async *entities() {
    yield {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'my-agent',
        annotations: {
          'rhdh.io/ai-asset-category': 'agent',
          'rhdh.io/ai-asset-source': 'my-registry',
          'rhdh.io/ai-asset-version': '1.0.0',
        },
      },
      spec: { type: 'agent', lifecycle: 'production', owner: 'team-a' },
    };
  }
  getProviderName() {
    return 'my-provider';
  }
  getProviderId() {
    return 'default';
  }
}
```

### Incremental (delta) sync

Providers can opt into incremental sync by implementing the optional `delta()` method:

```ts
class MyDeltaProvider implements AIAssetEntityProvider {
  // ... connect(), entities(), getProviderName(), getProviderId()

  async delta(cursor?: string): Promise<DeltaResult> {
    const changes = await this.fetchChanges(cursor);
    return {
      added: changes.newEntities,
      removed: changes.deletedRefs.map(ref => ({ entityRef: ref })),
      nextCursor: changes.nextPageToken,
    };
  }
}
```

## Validation

```ts
import { validateAIAssetEntity } from '@red-hat-developer-hub/backstage-plugin-boost-entity-provider-sdk';

validateAIAssetEntity(entity); // throws on missing/invalid annotations
```

Throws:

- `Error: Invalid or missing rhdh.io/ai-asset-category annotation` — when annotation is absent
- `Error: Invalid rhdh.io/ai-asset-category value 'bad'. Allowed: agent, skill, ...` — when value is not in the allowed set
- `Error: Invalid or missing rhdh.io/ai-asset-version annotation` — when version is absent
- `Error: Invalid or missing rhdh.io/ai-asset-source annotation` — when source is absent

## Version normalization

The `normalizeAIAssetVersion` utility normalizes version strings from external registries into a semver-compatible format:

| Input          | Output           | Rule                |
| -------------- | ---------------- | ------------------- |
| `1.2.3`        | `1.2.3`          | Semver pass-through |
| `2.0.0-beta.1` | `2.0.0-beta.1`   | Semver pass-through |
| `20260708`     | `0.0.0-20260708` | Date (compact)      |
| `2026-07-08`   | `0.0.0-20260708` | Date (dashed)       |
| `a1b2c3d`      | `0.0.0-a1b2c3d`  | Commit hash         |
| `latest`       | `0.0.0-unknown`  | Fallback + warning  |

```ts
import { normalizeAIAssetVersion } from '@red-hat-developer-hub/backstage-plugin-boost-entity-provider-sdk';

normalizeAIAssetVersion('1.2.3'); // '1.2.3'
normalizeAIAssetVersion('20260708'); // '0.0.0-20260708'
normalizeAIAssetVersion('a1b2c3d'); // '0.0.0-a1b2c3d'
normalizeAIAssetVersion('unknown-fmt', {
  entityRef: 'component:default/my-agent',
  warn: msg => logger.warn(msg),
}); // '0.0.0-unknown'
```

## Delta sync framework

The `DeltaSyncManager` wraps Backstage's `applyMutation({ type: 'delta' })` API, translating connector-reported additions, updates, and deletions into catalog delta mutations with automatic cursor persistence.

### Usage

```ts
import {
  DeltaSyncManager,
  InMemoryCursorStore,
} from '@red-hat-developer-hub/backstage-plugin-boost-entity-provider-sdk';

// Create a cursor store (use InMemoryCursorStore for dev/test,
// implement CursorStore interface for production with database backing)
const cursorStore = new InMemoryCursorStore();

const manager = new DeltaSyncManager({
  connection, // EntityProviderConnection from Backstage
  cursorStore,
  locationKey: 'my-provider',
});

// Check for existing cursor
const cursor = await manager.getCursor();

if (!cursor) {
  // First run or cursor cleared — full refresh
  await connection.applyMutation({
    type: 'full',
    entities: allEntities.map(e => ({ entity: e, locationKey: 'my-provider' })),
  });
} else {
  // Incremental sync
  const delta = await connector.fetchDelta(cursor);
  await manager.applyDelta({
    added: delta.added,
    updated: delta.updated,
    removed: delta.removed.map(ref => ({ entityRef: ref })),
    nextCursor: delta.nextCursor,
  });
}
```

### Fallback to full refresh

When a connector rejects the cursor (e.g. HTTP 412), clear it to force full refresh on the next cycle:

```ts
try {
  const delta = await connector.fetchDelta(cursor);
  await manager.applyDelta({ ...delta });
} catch (err) {
  if (isCursorInvalid(err)) {
    await manager.clearCursor();
    // Next poll cycle will see no cursor and do a full refresh
  }
}
```

### Custom cursor store

For production, implement the `CursorStore` interface backed by a database:

```ts
import type {
  CursorStore,
  CursorState,
} from '@red-hat-developer-hub/backstage-plugin-boost-entity-provider-sdk';

class DatabaseCursorStore implements CursorStore {
  constructor(private readonly db: Knex) {}

  async get(providerId: string): Promise<CursorState | undefined> {
    const row = await this.db('sync_cursors')
      .where({ provider_id: providerId })
      .first();
    return row
      ? { cursor: row.cursor, lastSyncTimestamp: row.last_sync }
      : undefined;
  }

  async set(providerId: string, state: CursorState): Promise<void> {
    await this.db('sync_cursors')
      .insert({
        provider_id: providerId,
        cursor: state.cursor,
        last_sync: state.lastSyncTimestamp,
      })
      .onConflict('provider_id')
      .merge();
  }

  async delete(providerId: string): Promise<void> {
    await this.db('sync_cursors').where({ provider_id: providerId }).del();
  }
}
```
