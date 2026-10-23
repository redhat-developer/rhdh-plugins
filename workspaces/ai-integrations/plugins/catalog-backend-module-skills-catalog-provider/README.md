# Skills Catalog Provider

A Backstage catalog backend module that polls OCI and npx skill connectors and produces `AiResource` entities with `spec.type: skill` in the RHDH catalog.

## Installation

From your Backstage root:

```bash
yarn --cwd packages/backend add \
  @red-hat-developer-hub/backstage-plugin-catalog-backend-module-skills-catalog-provider
```

### Register module

Add the module to your backend:

```ts
// packages/backend/src/index.ts
backend.add(
  import(
    '@red-hat-developer-hub/backstage-plugin-catalog-backend-module-skills-catalog-provider'
  ),
);
```

## Configuration

Configure the provider in your `app-config.yaml`:

```yaml
catalog:
  providers:
    skillsCatalogProvider:
      production:
        sources:
          - connectorPluginId: skill-image-connector
            sourceId: quay-public
            sourceType: oci
          # - connectorPluginId: npx-skill-connector
          #   sourceId: rhess-public
          #   sourceType: npx
        defaultOwner: team-skills
        defaultLifecycle: production
        # Optional: catalog namespace (default: default)
        # namespace: default
        # Optional: sync schedule (defaults shown below)
        # schedule:
        #   frequency: { seconds: 600 }
        #   timeout: { seconds: 600 }
        #   # Optional: defer the first sync
        #   # initialDelay: { seconds: 0 }
```

### Configuration options

| Option                        | Required | Default               | Description                                                                                                                                                                                            |
| ----------------------------- | -------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `sources`                     | Yes      | —                     | Array of connector sources to poll. Each source is polled independently; a failure in one does not affect others.                                                                                      |
| `sources[].connectorPluginId` | Yes      | —                     | Backstage plugin ID of the connector (e.g., `skill-image-connector`). Resolved through Backstage discovery to obtain the connector's base URL.                                                         |
| `sources[].sourceId`          | Yes      | —                     | Source identifier passed to `GET /skills/:sourceId`. The `(sourceType, sourceId)` tuple must be globally unique across all provider instances; duplicate assignments cause an `InputError` at startup. |
| `sources[].sourceType`        | Yes      | —                     | Expected source type: `oci` or `npx`. The provider rejects snapshots whose `source.type` does not match.                                                                                               |
| `namespace`                   | No       | `default`             | Catalog namespace for all entities produced by this provider instance.                                                                                                                                 |
| `defaultOwner`                | Yes      | —                     | Default catalog owner applied when the skill record lacks an `owner` hint or the hint is not a valid Backstage entity reference.                                                                       |
| `defaultLifecycle`            | Yes      | —                     | Default catalog lifecycle applied when the skill record lacks a `lifecycle` hint or the hint is not a valid catalog string.                                                                            |
| `schedule`                    | No       | 10m frequency/timeout | `SchedulerServiceTaskScheduleDefinition` controlling sync cadence. Defaults to ten-minute frequency, zero initial delay, and ten-minute timeout.                                                       |

## Entity kind and type

Each ingested skill produces an `AiResource` entity with `spec.type: skill`.

## Annotations

Each entity carries:

- `backstage.io/source-location` — connector source URI
- `backstage.io/managed-by-location` — connector source URI
- `backstage.io/managed-by-origin-location` — connector source URI
- `backstage.io/techdocs-ref` — TechDocs documentation URL for OCI skill entities, constructed from the connector's discovery-resolved base URL and the record's verified digest (`url:<connectorBaseUrl>/skilldocs/<sourceId>/<digest>`). Not set on npx entities. (OCI sources only)
- `rhdh.io/ai-asset-category` — always `skill`
- `rhdh.io/ai-asset-version` — resolved skill version
- `rhdh.io/ai-asset-source` — `<sourceType>/<sourceId>`
- `rhdh.io/oci-skill-ref` — OCI image reference (OCI sources only)
- `rhdh.io/npx-skill-ref` — npx package reference with digest (npx sources only)

## Behavior

### Source isolation

Each configured source has its own location key for catalog mutations. A failure in one source does not affect others, and does not remove entities from sources that did not participate in the current sync.

### Delta mutation

When a source returns a ready snapshot, the provider computes a reconciliation plan against committed ownership state and applies a `type: 'delta'` mutation scoped to that source's location key. Only changed entities are upserted and only entities absent from the new snapshot are removed. Sources that return loading or failed status, or that encounter errors during polling, are skipped — their previously-committed entities remain in the catalog.

### Error handling

- **Per-source failures**: HTTP, authentication, or validation failures for one source are logged and do not stop other sources.
- **Non-ready snapshots**: Sources returning `loading` or `failed` status are skipped; their previous entities are preserved.
- **Partial snapshots**: Sources returning `partial` status trigger a `type: 'delta'` mutation with upserts only — no removals are emitted, so previously committed entities absent from the partial snapshot are retained.
- **Source identity mismatch**: Snapshots whose `source.id` or `source.type` do not match configuration are rejected.
- **Source-reference validation**: All records' OCI URIs and npx references are validated before mapping. A single malformed OCI URI, URI/digest mismatch, or invalid npx reference rejects the entire snapshot without additions, updates, or removals, preserving the source's previous catalog state.

### Reconciliation planner

`calculateReconciliationPlan` is exported as a standalone pure function for computing deterministic upsert/removal deltas from a source's committed ownership state and a validated connector snapshot. It implements design D6's status table (ready, partial, loading, failed), stale/repeated observation detection, and cross-source identity collision diagnosis. Tasks 4.3 (durable persistence) and 4.4 (runtime integration) are now implemented; task 4.5 is marked implemented with passing automated lifecycle coverage and maintainer basic regression verification.

### Durable reconciliation state

The provider uses a `DatabaseReconciliationStore` backed by Backstage's database service to persist per-source committed ownership state, pending deltas, and pending acknowledgments. `ReconciliationStore` is the public interface; `PendingDelta` describes the pending delta record and `PendingAcknowledgment` describes the D8 reconciliation acknowledgment lifecycle. `DatabaseReconciliationStore` is the internal database-backed implementation scoped per provider config ID. The store provides four acknowledgment lifecycle methods: `commitStateAndSaveAcknowledgment`, `getPendingAcknowledgment`, `getAllPendingAcknowledgments`, and `clearPendingAcknowledgment`.

If replaying a pending delta or committing its recovered ownership fails, the
provider retains that pending delta and skips fetching new snapshots for the
affected source until recovery succeeds. Other sources continue independently.
A loading or empty response cannot clear unresolved pending work.

Catalog visibility verification is required, including for directly constructed
providers. Supply a catalog client implementing `getEntitiesByRefs`; the backend
module wires an authenticated `CatalogClient` automatically. There is no option
to bypass processed entity checks.

The database implementation is internal; consumers must implement the public
`ReconciliationStore` interface when constructing a provider directly. The owner
supplying the store must await `store.initialize()` before calling
`provider.connect(connection)`. The backend module already performs this step;
the provider does not initialize the supplied store.

```ts
await store.initialize();
const provider = new SkillsCatalogProvider(
  config,
  discovery,
  auth,
  logger,
  taskRunner,
  store,
  catalogApi, // implements CatalogApi.getEntitiesByRefs
);
await provider.connect(connection);
```

Before a ready OCI mutation, the pending delta stores the complete acknowledgment
context: revision, connector plugin ID, committed retained digests, expected
processed entity references and documentation URLs, and removal references.
Ownership and that acknowledgment are then committed atomically. Recovery replays
the exact persisted context before retrying acknowledgments and polling newer
snapshots. Delayed catalog processing, stale documentation URLs, incomplete catalog
responses, and delivery failures block newer polling for that source while other
sources continue. Partial or stale snapshots never authorize release. Existing
entities missing the TechDocs annotation are updated even when their digest and
observation timestamp are unchanged.

Snapshot acquisition gives discovery, authentication, and fetch/body consumption
separate 30-second deadlines. Catalog visibility verification instead has one
shared 30-second deadline covering authentication and its catalog queries.
Acknowledgment delivery has a separate shared 30-second deadline covering
discovery, authentication, and the POST. These shared phase budgets are intentional;
individual steps do not each receive another 30 seconds. Scheduler cancellation
also bounds these operations. Authenticated HTTP requests reject redirects rather
than forwarding service credentials.

Eligible ready OCI snapshots with revisions create acknowledgments even when
entities are unchanged or the observation repeats. After catalog visibility is
confirmed, the connector accepts repeated identical acknowledgments idempotently
with 204. This intentionally permits steady-state acknowledgment traffic; it does
not require another durable last-acknowledged-revision record. Recovery blocks,
stale observations, deferred visibility, and failures can prevent new delivery.
A successful catalog reconciliation summary describes the committed catalog work;
an acknowledgment may remain pending, with a separate deferral log and durable
retry state. Initial delivery and retry errors are logged by their respective
callers once, without suppressing error propagation or source blocking.

A nullable pending-delta acknowledgment column is added without deleting existing
rows. Pending deltas from pre-release builds that contain a revision but lack the
complete release/visibility context are preserved and block that source with a
diagnostic for operator investigation. The provider cannot safely infer whether
those observations were ready or partial; do not clear the database to bypass the
check. Older deltas without revisions still recover without authorizing release.

### Recovery verification

Run from this package directory:

```sh
yarn test --watchAll=false --runInBand
```

`reconciliation-store.test.ts` uses real file-backed SQLite to check connection
reopening, provider/source isolation, and transaction rollback. The durable
provider suite exercises restart during outage, failure after Catalog application,
recovery before a newer empty snapshot, failed replay and ownership commit,
idempotent retries, independent OCI/npx sources, partial retention, invalid
responses, same-digest tag aliases, and tag movement without identity changes.
The D8 acknowledgment lifecycle tests cover pending acknowledgment persistence
after ready OCI reconciliation, successful retry delivery and cleanup,
superseded revision (409) discard, acknowledgment retry failure with per-source
polling isolation, and error propagation from transport and auth failures.
Additional tests cover delayed processing while connector revisions advance,
ready and partial crash replay, stale URLs, incomplete catalog responses,
annotation upgrades, encoded source IDs, acknowledgment transaction rollback,
request deadlines, and scheduler cancellation.
Catalog mutation and connector HTTP boundaries use fixtures; SQLite persistence
and provider mapping/reconciliation execute their production implementations.

### Namespace changes and schema upgrades

Removal plans persist the original full catalog entity reference, including its
namespace. Changing the configured namespace therefore removes the old identity
and upserts the new identity after a complete ready snapshot, even when the
connector digest and observation timestamp have not changed. Partial snapshots
may add the new identity but retain the old one until a ready snapshot authorizes
cleanup. Loading, failed, and invalid responses retain previous ownership.

Pending removals written before full entity references were recorded recover their
original targets from committed ownership. If that identity cannot be recovered
unambiguously, recovery preserves the pending work and blocks newer snapshots for
that source instead of guessing the current namespace.

Database initialization uses packaged Knex migrations with the dedicated
`skills_catalog_provider_migrations` tracking table and its lock table; it does not
use the Catalog plugin's migration history. The initial migration adopts existing
compatible development tables without deleting committed or pending rows and
rejects tables missing required columns. Backstage's database migrations skip
setting is honored; externally managed deployments must apply this module's
migrations before starting the provider. Shared test helpers live in `src/testUtils.ts`.
