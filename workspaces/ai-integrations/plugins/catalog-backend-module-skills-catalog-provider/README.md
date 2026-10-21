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

| Option                        | Required | Default               | Description                                                                                                                                      |
| ----------------------------- | -------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `sources`                     | Yes      | —                     | Array of connector sources to poll. Each source is polled independently; a failure in one does not affect others.                                |
| `sources[].connectorPluginId` | Yes      | —                     | Backstage plugin ID of the connector (e.g., `skill-image-connector`). Resolved through Backstage discovery to obtain the connector's base URL.   |
| `sources[].sourceId`          | Yes      | —                     | Source identifier passed to `GET /skills/:sourceId`. Must be unique within this provider instance for the same `(sourceType, sourceId)` tuple.   |
| `sources[].sourceType`        | Yes      | —                     | Expected source type: `oci` or `npx`. The provider rejects snapshots whose `source.type` does not match.                                         |
| `namespace`                   | No       | `default`             | Catalog namespace for all entities produced by this provider instance.                                                                           |
| `defaultOwner`                | Yes      | —                     | Default catalog owner applied when the skill record lacks an `owner` hint or the hint is not a valid Backstage entity reference.                 |
| `defaultLifecycle`            | Yes      | —                     | Default catalog lifecycle applied when the skill record lacks a `lifecycle` hint or the hint is not a valid catalog string.                      |
| `schedule`                    | No       | 10m frequency/timeout | `SchedulerServiceTaskScheduleDefinition` controlling sync cadence. Defaults to ten-minute frequency, zero initial delay, and ten-minute timeout. |

## Entity kind and type

Each ingested skill produces an `AiResource` entity with `spec.type: skill`.

## Annotations

Each entity carries:

- `backstage.io/source-location` — connector source URI
- `backstage.io/managed-by-location` — connector source URI
- `backstage.io/managed-by-origin-location` — connector source URI
- `rhdh.io/ai-asset-category` — always `skill`
- `rhdh.io/ai-asset-version` — resolved skill version
- `rhdh.io/ai-asset-source` — `<sourceType>/<sourceId>`
- `rhdh.io/oci-skill-ref` — OCI image reference (OCI sources only)
- `rhdh.io/npx-skill-ref` — npx package reference with digest (npx sources only)

## Behavior

### Source isolation

Each configured source has its own location key for catalog mutations. A failure in one source does not affect others, and does not remove entities from sources that did not participate in the current sync.

### Full mutation

When a source returns a ready snapshot, the provider applies a `type: 'full'` mutation scoped to that source's location key. Entities absent from the next successful sync are pruned. Sources that return loading or failed status, or that encounter errors during polling, are skipped — their previously-emitted entities remain in the catalog.

### Error handling

- **Per-source failures**: HTTP, authentication, or validation failures for one source are logged and do not stop other sources.
- **Non-ready snapshots**: Sources returning `loading` or `failed` status are skipped; their previous entities are preserved.
- **Partial snapshots**: Sources returning `partial` status are currently handled identically to `ready` snapshots — a `type: 'full'` mutation replaces all entities for that source. Comprehensive partial-result retention is deferred to task 4.4.
- **Source identity mismatch**: Snapshots whose `source.id` or `source.type` do not match configuration are rejected.
- **Source-reference validation**: All records' OCI URIs and npx references are validated before mapping. A single malformed OCI URI, URI/digest mismatch, or invalid npx reference rejects the entire snapshot without additions, updates, or removals, preserving the source's previous catalog state.
